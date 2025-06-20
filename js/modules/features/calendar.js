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
     * Render month view
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
            const dayEvents = this.events.filter(event => event.date === dateStr);

            html += `
                <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
                    <div class="day-number">${day}</div>
                    <div class="day-events">
                        ${dayEvents.slice(0, 3).map(event => `
                            <div class="day-event priority-${event.priority} ${event.completed ? 'completed' : ''}" 
                                 title="${event.title}${event.time ? ' at ' + event.time : ''}">
                                ${utils.truncate(event.title, 15)}
                            </div>
                        `).join('')}
                        ${dayEvents.length > 3 ? `<div class="day-event-more">+${dayEvents.length - 3} more</div>` : ''}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        container.innerHTML = html;
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
     * Render day view
     */
    renderDayView(container) {
        const dateStr = this.currentDate.toISOString().split('T')[0];
        const dayEvents = this.events.filter(event => event.date === dateStr);
        const today = new Date().toISOString().split('T')[0];
        const isToday = dateStr === today;

        let html = `
            <div class="calendar-grid day-view">
                <div class="day-header ${isToday ? 'today' : ''}">
                    <h3>${this.currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                    <div class="day-summary">${dayEvents.length} event(s)</div>
                </div>
                <div class="day-content">
        `;

        if (dayEvents.length === 0) {
            html += `
                <div class="empty-day">
                    <div class="empty-icon">📅</div>
                    <p>No events scheduled for this day</p>
                    <button class="btn-primary" onclick="alert('Add event functionality to be implemented')">
                        + Add Event
                    </button>
                </div>
            `;
        } else {
            // Sort events by time
            const sortedEvents = dayEvents.sort((a, b) => {
                if (!a.time && !b.time) return 0;
                if (!a.time) return 1;
                if (!b.time) return -1;
                return a.time.localeCompare(b.time);
            });

            html += sortedEvents.map(event => `
                <div class="day-event-item priority-${event.priority} ${event.completed ? 'completed' : ''}">
                    <div class="event-time">${event.time || 'All day'}</div>
                    <div class="event-content">
                        <div class="event-title">${event.title}</div>
                        ${event.category ? `<div class="event-category">${event.category}</div>` : ''}
                    </div>
                    <div class="event-status">
                        ${event.completed ? '✅' : '⏳'}
                    </div>
                </div>
            `).join('');
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