/**
 * Enhanced Calendar functionality for Intelligent Management System
 * Supports Daily, Weekly, and Monthly views with contemporary design
 */

class CalendarManager {
    constructor(assistant) {
        this.assistant = assistant;
        this.currentDate = new Date();
        this.viewMode = 'month'; // month, week, day
        this.selectedDate = null;
        this.weekStart = 0; // 0 = Sunday, 1 = Monday
        this.hoursStart = 6; // Start time for day/week view
        this.hoursEnd = 22; // End time for day/week view
        
        this.initializeEventHandlers();
    }

    initializeEventHandlers() {
        // View switcher buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Navigation buttons
        document.getElementById('prevPeriod')?.addEventListener('click', () => {
            this.navigatePeriod(-1);
        });

        document.getElementById('nextPeriod')?.addEventListener('click', () => {
            this.navigatePeriod(1);
        });

        document.getElementById('todayBtn')?.addEventListener('click', () => {
            this.goToToday();
        });
    }

    switchView(newView) {
        if (this.viewMode === newView) return;

        this.viewMode = newView;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === newView) {
                btn.classList.add('active');
            }
        });

        this.render();
    }

    render() {
        switch (this.viewMode) {
            case 'month':
                this.renderMonthView();
                break;
            case 'week':
                this.renderWeekView();
                break;
            case 'day':
                this.renderDayView();
                break;
        }
        this.updatePeriodHeader();
    }

    renderMonthView() {
        const calendar = document.getElementById('calendar');
        if (!calendar) return;

        calendar.innerHTML = '';
        calendar.className = 'calendar-grid month-view';

        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendar.appendChild(dayHeader);
        });

        // Calculate calendar days
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const today = new Date().toISOString().split('T')[0];

        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);

            const dayElement = this.createMonthDayElement(currentDate, month, today);
            calendar.appendChild(dayElement);
        }
    }

    createMonthDayElement(date, currentMonth, today) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';

        const dateStr = date.toISOString().split('T')[0];
        const isCurrentMonth = date.getMonth() === currentMonth;
        const isToday = dateStr === today;
        const isSelected = dateStr === this.selectedDate;

        if (!isCurrentMonth) {
            dayElement.classList.add('other-month');
        }

        if (isToday) {
            dayElement.classList.add('today');
        }

        if (isSelected) {
            dayElement.classList.add('selected');
        }

        // Get tasks for this day
        const dayTasks = this.getTasks(dateStr);
        const pendingTasks = dayTasks.filter(task => task.status === 'pending');
        const completedTasks = dayTasks.filter(task => task.status === 'completed');

        dayElement.innerHTML = `
            <div class="day-number">${date.getDate()}</div>
            <div class="day-tasks">
                ${pendingTasks.length > 0 ? `<span class="task-count pending">${pendingTasks.length}</span>` : ''}
                ${completedTasks.length > 0 ? `<span class="task-count completed">${completedTasks.length}</span>` : ''}
            </div>
        `;

        // Add task dots for visual representation
        if (dayTasks.length > 0) {
            const taskDots = document.createElement('div');
            taskDots.className = 'task-dots';

            dayTasks.slice(0, 3).forEach(task => {
                const dot = document.createElement('div');
                dot.className = `task-dot priority-${task.priority} ${task.status}`;
                dot.title = task.title;
                taskDots.appendChild(dot);
            });

            if (dayTasks.length > 3) {
                const moreDot = document.createElement('div');
                moreDot.className = 'task-dot more';
                moreDot.textContent = `+${dayTasks.length - 3}`;
                taskDots.appendChild(moreDot);
            }

            dayElement.appendChild(taskDots);
        }

        // Add click handler
        dayElement.addEventListener('click', () => {
            this.selectDate(dateStr);
            this.showDayDetails(dateStr);
        });

        return dayElement;
    }

    renderWeekView() {
        const calendar = document.getElementById('calendar');
        if (!calendar) return;

        calendar.innerHTML = '';
        calendar.className = 'calendar-grid week-view';

        // Get week start date
        const weekStart = this.getWeekStart(this.currentDate);
        const weekDays = [];
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            weekDays.push(day);
        }

        // Add empty time header
        const timeHeader = document.createElement('div');
        timeHeader.className = 'time-slot header';
        calendar.appendChild(timeHeader);

        // Add day headers
        weekDays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'week-day-header';
            
            const today = new Date().toISOString().split('T')[0];
            const dayStr = day.toISOString().split('T')[0];
            const isToday = dayStr === today;
            
            dayHeader.innerHTML = `
                <div class="week-day-name">${this.getDayName(day, true)}</div>
                <div class="week-day-number ${isToday ? 'today' : ''}">${day.getDate()}</div>
            `;
            calendar.appendChild(dayHeader);
        });

        // Add time slots and day columns
        for (let hour = this.hoursStart; hour <= this.hoursEnd; hour++) {
            // Time slot
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = this.formatHour(hour);
            calendar.appendChild(timeSlot);

            // Day columns for this hour
            weekDays.forEach(day => {
                const dayColumn = document.createElement('div');
                dayColumn.className = 'week-day';
                
                const today = new Date().toISOString().split('T')[0];
                const dayStr = day.toISOString().split('T')[0];
                const isToday = dayStr === today;
                
                if (isToday) {
                    dayColumn.classList.add('today');
                }

                // Add tasks for this hour
                const dayTasks = this.getTasks(dayStr);
                const hourTasks = dayTasks.filter(task => {
                    if (!task.dueTime) return false;
                    const taskHour = parseInt(task.dueTime.split(':')[0]);
                    return taskHour === hour;
                });

                hourTasks.forEach((task, index) => {
                    const taskElement = document.createElement('div');
                    taskElement.className = `week-task priority-${task.priority} ${task.status}`;
                    taskElement.style.top = `${index * 20}px`;
                    taskElement.textContent = task.title;
                    taskElement.title = `${task.title}\n${task.dueTime}`;
                    
                    taskElement.addEventListener('click', () => {
                        this.showTaskDetails(task);
                    });
                    
                    dayColumn.appendChild(taskElement);
                });

                // Add click handler for adding tasks
                dayColumn.addEventListener('dblclick', () => {
                    this.addTaskAtTime(dayStr, hour);
                });

                calendar.appendChild(dayColumn);
            });
        }

        // Add current time indicator if viewing current week
        this.addCurrentTimeIndicator();
    }

    renderDayView() {
        const calendar = document.getElementById('calendar');
        if (!calendar) return;

        calendar.innerHTML = '';
        calendar.className = 'calendar-grid day-view';

        const dayStr = this.currentDate.toISOString().split('T')[0];
        const dayTasks = this.getTasks(dayStr);

        // Day header
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-view-header';
        dayHeader.textContent = this.formatDayHeader(this.currentDate);
        calendar.appendChild(dayHeader);

        // Create time column
        const timeColumn = document.createElement('div');
        timeColumn.className = 'day-time-column';

        // Create events column
        const eventsColumn = document.createElement('div');
        eventsColumn.className = 'day-events-column';

        for (let hour = this.hoursStart; hour <= this.hoursEnd; hour++) {
            // Time slot
            const timeSlot = document.createElement('div');
            timeSlot.className = 'day-time-slot';
            timeSlot.textContent = this.formatHour(hour);
            timeColumn.appendChild(timeSlot);

            // Event slot
            const eventSlot = document.createElement('div');
            eventSlot.className = 'day-event-slot';
            eventSlot.dataset.hour = hour;

            // Add tasks for this hour
            const hourTasks = dayTasks.filter(task => {
                if (!task.dueTime) return false;
                const taskHour = parseInt(task.dueTime.split(':')[0]);
                return taskHour === hour;
            });

            hourTasks.forEach((task, index) => {
                const taskElement = document.createElement('div');
                taskElement.className = `day-task priority-${task.priority} ${task.status}`;
                taskElement.style.top = `${index * 25}px`;
                
                taskElement.innerHTML = `
                    <span class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" 
                          onclick="event.stopPropagation(); assistant.toggleTask('${task.id}');">
                        ${task.status === 'completed' ? '✓' : ''}
                    </span>
                    <span class="task-content">
                        <strong>${task.title}</strong>
                        ${task.description ? `<br><small>${task.description}</small>` : ''}
                    </span>
                    <span class="task-time">${task.dueTime}</span>
                `;
                
                taskElement.addEventListener('click', () => {
                    this.showTaskDetails(task);
                });
                
                eventSlot.appendChild(taskElement);
            });

            // Add click handler for adding tasks
            eventSlot.addEventListener('dblclick', () => {
                this.addTaskAtTime(dayStr, hour);
            });

            eventsColumn.appendChild(eventSlot);
        }

        calendar.appendChild(timeColumn);
        calendar.appendChild(eventsColumn);

        // Add current time indicator if viewing today
        this.addCurrentTimeIndicator();
    }

    // Helper methods
    getTasks(dateStr) {
        if (!this.assistant || !this.assistant.tasks) return [];
        return this.assistant.tasks.filter(task => task.dueDate === dateStr);
    }

    getWeekStart(date) {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        start.setDate(diff);
        return start;
    }

    getDayName(date, short = false) {
        const days = short 
            ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
    }

    formatHour(hour) {
        if (hour === 0) return '12 AM';
        if (hour === 12) return '12 PM';
        if (hour < 12) return `${hour} AM`;
        return `${hour - 12} PM`;
    }

    formatDayHeader(date) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const dateStr = date.toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (dateStr === todayStr) return 'Today - ' + date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        if (dateStr === tomorrowStr) return 'Tomorrow - ' + date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        if (dateStr === yesterdayStr) return 'Yesterday - ' + date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    addCurrentTimeIndicator() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();

        if (this.viewMode === 'day') {
            const todayStr = now.toISOString().split('T')[0];
            const viewingTodayStr = this.currentDate.toISOString().split('T')[0];
            
            if (todayStr === viewingTodayStr && currentHour >= this.hoursStart && currentHour <= this.hoursEnd) {
                const eventsColumn = document.querySelector('.day-events-column');
                if (eventsColumn) {
                    const indicator = document.createElement('div');
                    indicator.className = 'current-time-indicator';
                    
                    const hourIndex = currentHour - this.hoursStart;
                    const minuteOffset = (currentMinutes / 60) * 50; // 50px per hour
                    const topPosition = (hourIndex * 50) + minuteOffset;
                    
                    indicator.style.top = `${topPosition}px`;
                    eventsColumn.appendChild(indicator);
                }
            }
        } else if (this.viewMode === 'week') {
            // Similar logic for week view
            const weekStart = this.getWeekStart(this.currentDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            if (now >= weekStart && now <= weekEnd && currentHour >= this.hoursStart && currentHour <= this.hoursEnd) {
                const dayOfWeek = now.getDay();
                const weekDays = document.querySelectorAll('.week-day');
                const todayColumn = weekDays[dayOfWeek * (this.hoursEnd - this.hoursStart + 1) + (currentHour - this.hoursStart)];
                
                if (todayColumn) {
                    const indicator = document.createElement('div');
                    indicator.className = 'current-time-indicator';
                    indicator.style.top = `${(currentMinutes / 60) * 100}%`;
                    todayColumn.appendChild(indicator);
                }
            }
        }
    }

    updatePeriodHeader() {
        const periodElement = document.getElementById('currentPeriod');
        if (!periodElement) return;

        let periodText = '';
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        switch (this.viewMode) {
            case 'month':
                periodText = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
                break;
            case 'week':
                const weekStart = this.getWeekStart(this.currentDate);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                
                if (weekStart.getMonth() === weekEnd.getMonth()) {
                    periodText = `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}-${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
                } else {
                    periodText = `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
                }
                break;
            case 'day':
                periodText = this.formatDayHeader(this.currentDate);
                break;
        }

        periodElement.textContent = periodText;
    }

    navigatePeriod(direction) {
        switch (this.viewMode) {
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() + direction);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() + (direction * 7));
                break;
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() + direction);
                break;
        }
        this.render();
    }

    goToToday() {
        this.currentDate = new Date();
        this.selectedDate = new Date().toISOString().split('T')[0];
        this.render();
    }

    selectDate(dateStr) {
        // Remove previous selection
        document.querySelectorAll('.calendar-day.selected').forEach(day => {
            day.classList.remove('selected');
        });

        // Add new selection
        this.selectedDate = dateStr;
        document.querySelectorAll('.calendar-day').forEach(day => {
            const dayNumber = day.querySelector('.day-number')?.textContent;
            if (dayNumber) {
                const currentDateStr = this.getDateStringFromDayElement(day, dayNumber);
                if (currentDateStr === dateStr) {
                    day.classList.add('selected');
                }
            }
        });
    }

    getDateStringFromDayElement(dayElement, dayNumber) {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Handle previous/next month days
        const isOtherMonth = dayElement.classList.contains('other-month');
        let targetMonth = month;
        
        if (isOtherMonth) {
            const dayNum = parseInt(dayNumber);
            if (dayNum > 15) {
                // Previous month
                targetMonth = month - 1;
            } else {
                // Next month
                targetMonth = month + 1;
            }
        }

        const date = new Date(year, targetMonth, parseInt(dayNumber));
        return date.toISOString().split('T')[0];
    }

    showDayDetails(dateStr) {
        const dayTasks = this.getTasks(dateStr);
        
        if (dayTasks.length === 0) {
            this.assistant?.showNotification(`No tasks scheduled for ${this.formatDate(dateStr)}`, 'info');
            return;
        }

        this.createDayModal(dateStr, dayTasks);
    }

    showTaskDetails(task) {
        // Show task details modal
        if (this.assistant && this.assistant.showTaskDetails) {
            this.assistant.showTaskDetails(task);
        }
    }

    addTaskAtTime(dateStr, hour) {
        // Open add task modal with pre-filled date and time
        if (this.assistant && this.assistant.showModal) {
            this.assistant.showModal('addTaskModal');
            document.getElementById('taskDate').value = dateStr;
            document.getElementById('taskTime').value = `${hour.toString().padStart(2, '0')}:00`;
        }
    }

    createDayModal(dateStr, tasks) {
        // Remove existing modal if any
        const existingModal = document.getElementById('dayDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'dayDetailsModal';
        modal.className = 'modal show';

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Tasks for ${this.formatDate(dateStr)}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="day-tasks-list">
                        ${tasks.map(task => this.createTaskHTML(task)).join('')}
                    </div>
                    <div class="modal-actions">
                        <button class="btn-primary" onclick="assistant.showModal('addTaskModal'); document.getElementById('taskDate').value='${dateStr}'; document.getElementById('dayDetailsModal').remove();">
                            + Add Task for This Day
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    createTaskHTML(task) {
        const timeDisplay = task.dueTime ? `<span class="task-time">${this.formatTime(task.dueTime)}</span>` : '';
        const priorityClass = `priority-${task.priority}`;
        const statusClass = task.status === 'completed' ? 'completed' : '';

        return `
            <div class="task-item-modal ${priorityClass} ${statusClass}">
                <div class="task-header">
                    <div class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" 
                         onclick="assistant.toggleTask('${task.id}'); this.closest('.task-item-modal').classList.toggle('completed');">
                        ${task.status === 'completed' ? '✓' : ''}
                    </div>
                    <div class="task-title">${task.title}</div>
                    ${timeDisplay}
                </div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            </div>
        `;
    }

    formatTime(time) {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dateString = date.toISOString().split('T')[0];
        const todayString = today.toISOString().split('T')[0];
        const tomorrowString = tomorrow.toISOString().split('T')[0];

        if (dateString === todayString) return 'Today';
        if (dateString === tomorrowString) return 'Tomorrow';

        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
}

// Export for use in main application
window.CalendarManager = CalendarManager;
