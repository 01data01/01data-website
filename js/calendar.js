/**
 * Calendar functionality for Intelligent Management System
 */

class CalendarManager {
    constructor(assistant) {
        this.assistant = assistant;
        this.currentDate = new Date();
        this.viewMode = 'month'; // month, week, day
        this.selectedDate = null;
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

            const dayElement = this.createDayElement(currentDate, month, today);
            calendar.appendChild(dayElement);
        }

        this.updateCalendarHeader();
    }

    createDayElement(date, currentMonth, today) {
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
        const dayTasks = this.assistant.tasks.filter(task => task.dueDate === dateStr);
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

    selectDate(dateStr) {
        // Remove previous selection
        document.querySelectorAll('.calendar-day.selected').forEach(day => {
            day.classList.remove('selected');
        });

        // Add new selection
        this.selectedDate = dateStr;
        document.querySelectorAll('.calendar-day').forEach(day => {
            const dayNumber = day.querySelector('.day-number').textContent;
            const currentDateStr = this.getDateStringFromDayElement(day, dayNumber);
            if (currentDateStr === dateStr) {
                day.classList.add('selected');
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
        const dayTasks = this.assistant.tasks.filter(task => task.dueDate === dateStr);
        
        if (dayTasks.length === 0) {
            this.assistant.showNotification(`No tasks scheduled for ${this.formatDate(dateStr)}`, 'info');
            return;
        }

        // Create a modal or sidebar to show day details
        this.createDayModal(dateStr, dayTasks);
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
        const timeDisplay = task.dueTime ? `<span class="task-time">${this.assistant.formatTime(task.dueTime)}</span>` : '';
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

    updateCalendarHeader() {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const currentMonthElement = document.getElementById('currentMonth');
        if (currentMonthElement) {
            currentMonthElement.textContent = 
                `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        }
    }

    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.render();
    }

    goToToday() {
        this.currentDate = new Date();
        this.selectedDate = new Date().toISOString().split('T')[0];
        this.render();
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

    // Week view (simplified)
    renderWeekView() {
        // Implementation for week view would go here
        const calendar = document.getElementById('calendar');
        if (calendar) {
            calendar.innerHTML = '<div class="coming-soon">Week view coming soon!</div>';
        }
    }

    // Day view (simplified)
    renderDayView() {
        // Implementation for day view would go here
        const calendar = document.getElementById('calendar');
        if (calendar) {
            calendar.innerHTML = '<div class="coming-soon">Day view coming soon!</div>';
        }
    }
}

// Export for use in main application
window.CalendarManager = CalendarManager;