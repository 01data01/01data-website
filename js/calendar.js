/**
 * Calendar Module
 * Handles calendar view, events, and date navigation
 */

class CalendarModule {
    constructor() {
        this.initialized = false;
        this.currentDate = new Date();
        this.currentView = 'month';
        this.events = [];
        this.eventListeners = [];
    }

    /**
     * Initialize calendar module
     */
    initialize() {
        if (this.initialized) return;
        
        try {
            console.log('Initializing Calendar Module...');
            
            this.loadEvents();
            this.setupEventListeners();
            this.renderCalendar();
            this.updatePeriodDisplay();
            
            this.initialized = true;
            console.log('Calendar Module initialized successfully');
            
        } catch (error) {
            utils.logError('Calendar Module Initialization', error);
        }
    }

    /**
     * Load events from tasks
     */
    loadEvents() {
        const tasks = utils.loadFromStorage('tasks', []);
        this.events = tasks
            .filter(task => task.dueDate)
            .map(task => ({
                id: task.id,
                title: task.title,
                date: task.dueDate,
                time: task.time,
                priority: task.priority || 'medium',
                completed: task.completed,
                category: task.category
            }));
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // View switcher buttons
        const viewBtns = utils.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            const clickListener = utils.addEventListener(btn, 'click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
            this.eventListeners.push(clickListener);
        });

        // Navigation buttons
        const prevBtn = utils.getElementById('prevPeriod');
        if (prevBtn) {
            const clickListener = utils.addEventListener(prevBtn, 'click', () => {
                this.navigatePrevious();
            });
            this.eventListeners.push(clickListener);
        }

        const nextBtn = utils.getElementById('nextPeriod');
        if (nextBtn) {
            const clickListener = utils.addEventListener(nextBtn, 'click', () => {
                this.navigateNext();
            });
            this.eventListeners.push(clickListener);
        }

        const todayBtn = utils.getElementById('todayBtn');
        if (todayBtn) {
            const clickListener = utils.addEventListener(todayBtn, 'click', () => {
                this.goToToday();
            });
            this.eventListeners.push(clickListener);
        }
    }

    /**
     * Switch calendar view
     */
    switchView(view) {
        if (['month', 'week', 'day'].includes(view)) {
            this.currentView = view;
            this.updateViewButtons();
            this.renderCalendar();
            this.updatePeriodDisplay();
        }
    }

    /**
     * Update view button states
     */
    updateViewButtons() {
        const viewBtns = utils.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            if (btn.dataset.view === this.currentView) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * Navigate to previous period
     */
    navigatePrevious() {
        switch (this.currentView) {
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() - 7);
                break;
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() - 1);
                break;
        }
        this.renderCalendar();
        this.updatePeriodDisplay();
    }

    /**
     * Navigate to next period
     */
    navigateNext() {
        switch (this.currentView) {
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() + 7);
                break;
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() + 1);
                break;
        }
        this.renderCalendar();
        this.updatePeriodDisplay();
    }

    /**
     * Go to today
     */
    goToToday() {
        this.currentDate = new Date();
        this.renderCalendar();
        this.updatePeriodDisplay();
    }

    /**
     * Update period display
     */
    updatePeriodDisplay() {
        const periodElement = utils.getElementById('currentPeriod');
        if (!periodElement) return;

        let periodText = '';
        switch (this.currentView) {
            case 'month':
                periodText = this.currentDate.toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                });
                break;
            case 'week':
                const weekStart = this.getWeekStart(this.currentDate);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                periodText = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                break;
            case 'day':
                periodText = this.currentDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                });
                break;
        }
        periodElement.textContent = periodText;
    }

    /**
     * Render calendar based on current view
     */
    renderCalendar() {
        const calendarContainer = utils.getElementById('calendar');
        if (!calendarContainer) return;

        switch (this.currentView) {
            case 'month':
                this.renderMonthView(calendarContainer);
                break;
            case 'week':
                this.renderWeekView(calendarContainer);
                break;
            case 'day':
                this.renderDayView(calendarContainer);
                break;
        }
    }

    /**
     * Render enhanced month view (backward compatible)
     */
    renderMonthView(container) {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDay = firstDay.getDay();

        let html = `
            <div class="calendar-grid month-view">
                <div class="calendar-header-row">
                    <div class="calendar-header-cell">Sun</div>
                    <div class="calendar-header-cell">Mon</div>
                    <div class="calendar-header-cell">Tue</div>
                    <div class="calendar-header-cell">Wed</div>
                    <div class="calendar-header-cell">Thu</div>
                    <div class="calendar-header-cell">Fri</div>
                    <div class="calendar-header-cell">Sat</div>
                </div>
        `;

        // Add empty cells for days before month starts
        for (let i = 0; i < startDay; i++) {
            html += '<div class="calendar-day other-month"></div>';
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const dayEvents = this.events.filter(event => event.date === dateStr);
            
            // Enhanced event categorization
            const eventsByPriority = {
                high: dayEvents.filter(e => e.priority === 'high' && !e.completed),
                medium: dayEvents.filter(e => e.priority === 'medium' && !e.completed),
                low: dayEvents.filter(e => e.priority === 'low' && !e.completed),
                completed: dayEvents.filter(e => e.completed)
            };
            
            const totalEvents = dayEvents.length;
            const activeEvents = dayEvents.filter(e => !e.completed).length;
            const completedEvents = dayEvents.filter(e => e.completed).length;
            
            let dayClass = 'calendar-day enhanced-day';
            if (isToday) dayClass += ' today';
            if (isWeekend) dayClass += ' weekend';
            if (totalEvents > 0) dayClass += ' has-events';

            html += `
                <div class="${dayClass}" data-date="${dateStr}" data-events="${totalEvents}">
                    <div class="day-header">
                        <span class="day-number">${day}</span>
                        ${activeEvents > 0 ? `<span class="day-event-count">${activeEvents}</span>` : ''}
                    </div>
                    <div class="day-events">
                        ${eventsByPriority.high.slice(0, 1).map(event => `
                            <div class="day-event priority-high enhanced-event" title="${event.title}${event.time ? ' at ' + event.time : ''}">
                                <span class="event-dot"></span>
                                <span class="event-text">${utils.truncate(event.title, 15)}</span>
                                ${event.time ? `<span class="event-time">${event.time.substring(0, 5)}</span>` : ''}
                            </div>
                        `).join('')}
                        ${eventsByPriority.medium.slice(0, 2).map(event => `
                            <div class="day-event priority-medium enhanced-event" title="${event.title}${event.time ? ' at ' + event.time : ''}">
                                <span class="event-dot"></span>
                                <span class="event-text">${utils.truncate(event.title, 15)}</span>
                                ${event.time ? `<span class="event-time">${event.time.substring(0, 5)}</span>` : ''}
                            </div>
                        `).join('')}
                        ${eventsByPriority.low.slice(0, 1).map(event => `
                            <div class="day-event priority-low enhanced-event" title="${event.title}${event.time ? ' at ' + event.time : ''}">
                                <span class="event-dot"></span>
                                <span class="event-text">${utils.truncate(event.title, 15)}</span>
                                ${event.time ? `<span class="event-time">${event.time.substring(0, 5)}</span>` : ''}
                            </div>
                        `).join('')}
                        ${activeEvents > 3 ? `<div class="day-event-more">+${activeEvents - 3} more</div>` : ''}
                        ${completedEvents > 0 && activeEvents <= 3 ? `
                            <div class="completed-summary">
                                <span class="completed-icon">✓</span> ${completedEvents} done
                            </div>
                        ` : ''}
                    </div>
                    ${totalEvents > 0 ? `
                        <div class="day-progress-mini">
                            <div class="progress-fill" style="width: ${(completedEvents / totalEvents) * 100}%"></div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        html += '</div>';
        container.innerHTML = html;
        
        // Setup enhanced day click handlers
        this.setupDayClickHandlers();
    }

    /**
     * Render week view
     */
    renderWeekView(container) {
        const weekStart = this.getWeekStart(this.currentDate);
        const today = new Date().toISOString().split('T')[0];

        let html = `
            <div class="calendar-grid week-view">
                <div class="time-column">
                    <div class="time-header"></div>
        `;

        // Add time slots
        for (let hour = 0; hour < 24; hour++) {
            const timeStr = `${hour.toString().padStart(2, '0')}:00`;
            html += `<div class="time-slot">${timeStr}</div>`;
        }
        html += '</div>';

        // Add day columns
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const isToday = dateStr === today;
            const dayEvents = this.events.filter(event => event.date === dateStr);

            html += `
                <div class="day-column ${isToday ? 'today' : ''}" data-date="${dateStr}">
                    <div class="day-header">
                        <div class="day-name">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div class="day-number">${date.getDate()}</div>
                    </div>
                    <div class="day-events-column">
                        ${dayEvents.map(event => `
                            <div class="week-event priority-${event.priority} ${event.completed ? 'completed' : ''}"
                                 style="top: ${this.getEventPosition(event.time)}px;">
                                <div class="event-time">${event.time || 'All day'}</div>
                                <div class="event-title">${event.title}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Render enhanced day view
     */
    renderDayView(container) {
        const dateStr = this.currentDate.toISOString().split('T')[0];
        const dayEvents = this.events.filter(event => event.date === dateStr);
        const today = new Date().toISOString().split('T')[0];
        const isToday = dateStr === today;
        const dayOfWeek = this.currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        // Categorize events
        const timedEvents = dayEvents.filter(e => e.time).sort((a, b) => a.time.localeCompare(b.time));
        const allDayEvents = dayEvents.filter(e => !e.time);
        const completedEvents = dayEvents.filter(e => e.completed);
        const activeEvents = dayEvents.filter(e => !e.completed);

        let html = `
            <div class="calendar-grid day-view enhanced">
                <div class="day-view-header ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}">
                    <div class="date-info">
                        <h2>${this.currentDate.toLocaleDateString('en-US', { weekday: 'long' })}</h2>
                        <div class="date-details">
                            <span class="month-day">${this.currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                            <span class="year">${this.currentDate.getFullYear()}</span>
                        </div>
                        ${isToday ? '<div class="today-badge">Today</div>' : ''}
                    </div>
                    <div class="day-stats">
                        <div class="stat-item">
                            <span class="stat-number">${activeEvents.length}</span>
                            <span class="stat-label">Active</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${completedEvents.length}</span>
                            <span class="stat-label">Done</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${Math.round((completedEvents.length / Math.max(dayEvents.length, 1)) * 100)}%</span>
                            <span class="stat-label">Complete</span>
                        </div>
                    </div>
                </div>

                <div class="day-content-wrapper">
        `;

        if (dayEvents.length === 0) {
            html += `
                <div class="empty-day-enhanced">
                    <div class="empty-animation">
                        <div class="floating-calendar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
                            </svg>
                        </div>
                    </div>
                    <h3>${isWeekend ? 'Weekend Relaxation' : 'Free Day Ahead'}</h3>
                    <p>No scheduled events. ${isToday ? 'Perfect for spontaneous activities!' : 'Great planning opportunity.'}</p>
                    <div class="empty-day-actions">
                        <button class="btn-primary" onclick="window.mainApp?.navigateTo('tasks')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Add Event
                        </button>
                        <button class="btn-secondary" onclick="window.calendarModule.goToToday()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12,6 12,12 16,14"/>
                            </svg>
                            Go to Today
                        </button>
                    </div>
                </div>
            `;
        } else {
            // All day events section
            if (allDayEvents.length > 0) {
                html += `
                    <div class="all-day-events-section">
                        <h4>All Day Events</h4>
                        <div class="all-day-events">
                            ${allDayEvents.map(event => `
                                <div class="all-day-event priority-${event.priority} ${event.completed ? 'completed' : ''}">
                                    <div class="event-content">
                                        <span class="event-title">${event.title}</span>
                                        ${event.category ? `<span class="event-category">${event.category}</span>` : ''}
                                    </div>
                                    <div class="event-actions">
                                        <button class="action-btn ${event.completed ? 'undo-btn' : 'complete-btn'}" 
                                                onclick="window.dashboardModule?.toggleTaskComplete('${event.id}', ${!event.completed})">
                                            ${event.completed ? '↶' : '✓'}
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            // Timeline for timed events
            if (timedEvents.length > 0) {
                html += `
                    <div class="timeline-section">
                        <h4>Timeline</h4>
                        <div class="day-timeline">
                            ${timedEvents.map((event, index) => {
                                const time = new Date(`2000-01-01T${event.time}:00`);
                                const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                                const nextEvent = timedEvents[index + 1];
                                const duration = nextEvent ? 
                                    this.calculateDuration(event.time, nextEvent.time) : null;
                                
                                return `
                                    <div class="timeline-event priority-${event.priority} ${event.completed ? 'completed' : ''}">
                                        <div class="timeline-time">
                                            <span class="time-display">${timeStr}</span>
                                            ${duration ? `<span class="duration">${duration}</span>` : ''}
                                        </div>
                                        <div class="timeline-content">
                                            <div class="timeline-marker priority-${event.priority}"></div>
                                            <div class="event-details">
                                                <h5 class="event-title">${event.title}</h5>
                                                ${event.category ? `<span class="event-category">${event.category}</span>` : ''}
                                                <div class="event-actions">
                                                    <button class="action-btn ${event.completed ? 'undo-btn' : 'complete-btn'}" 
                                                            onclick="window.dashboardModule?.toggleTaskComplete('${event.id}', ${!event.completed})">
                                                        ${event.completed ? 'Undo' : 'Complete'}
                                                    </button>
                                                    <button class="action-btn edit-btn" onclick="alert('Edit functionality to be implemented')">
                                                        Edit
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }

            // Summary section
            html += `
                <div class="day-summary-section">
                    <div class="summary-cards">
                        <div class="summary-card productivity">
                            <div class="card-icon">📊</div>
                            <div class="card-content">
                                <span class="card-value">${Math.round((completedEvents.length / Math.max(dayEvents.length, 1)) * 100)}%</span>
                                <span class="card-label">Productivity</span>
                            </div>
                        </div>
                        <div class="summary-card time-blocked">
                            <div class="card-icon">⏰</div>
                            <div class="card-content">
                                <span class="card-value">${timedEvents.length}</span>
                                <span class="card-label">Scheduled</span>
                            </div>
                        </div>
                        <div class="summary-card flexible">
                            <div class="card-icon">🎯</div>
                            <div class="card-content">
                                <span class="card-value">${allDayEvents.length}</span>
                                <span class="card-label">Flexible</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        html += '</div></div>';
        container.innerHTML = html;
    }

    /**
     * Get week start date (Sunday)
     */
    getWeekStart(date) {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    }

    /**
     * Get event position for week view
     */
    getEventPosition(time) {
        if (!time) return 0;
        const [hours, minutes] = time.split(':').map(Number);
        return (hours * 60 + minutes) * 0.5; // 0.5px per minute
    }

    /**
     * Setup day click handlers for month view
     */
    setupDayClickHandlers() {
        const dayElements = utils.querySelectorAll('.calendar-day');
        dayElements.forEach(dayEl => {
            const clickListener = utils.addEventListener(dayEl, 'click', (e) => {
                const date = e.currentTarget.dataset.date;
                if (date) {
                    this.selectDate(new Date(date));
                }
            });
            this.eventListeners.push(clickListener);
        });
    }

    /**
     * Select a specific date and switch to day view
     */
    selectDate(date) {
        this.currentDate = new Date(date);
        this.switchView('day');
    }

    /**
     * Calculate duration between two times
     */
    calculateDuration(startTime, endTime) {
        const start = new Date(`2000-01-01T${startTime}:00`);
        const end = new Date(`2000-01-01T${endTime}:00`);
        const diffMs = end - start;
        const diffMins = diffMs / (1000 * 60);
        
        if (diffMins < 60) {
            return `${diffMins}min`;
        } else {
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
    }

    /**
     * Enhanced refresh function
     */
    refresh() {
        this.loadEvents();
        this.renderCalendar();
        this.updatePeriodDisplay();
        
        // Animate refresh
        const calendarContainer = utils.querySelector('.calendar-container');
        if (calendarContainer) {
            utils.animate(calendarContainer, 'pulse', 600);
        }
    }

    /**
     * Cleanup module
     */
    cleanup() {
        this.eventListeners.forEach(listener => {
            if (listener && listener.remove) {
                listener.remove();
            }
        });
        this.eventListeners = [];
        this.initialized = false;
    }
}

// Create and export singleton instance
const calendarModule = new CalendarModule();

// Make it globally accessible
window.calendarModule = calendarModule;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = calendarModule;
}