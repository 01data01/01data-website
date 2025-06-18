/**
 * Advanced Task Management for Intelligent Management System
 */

class TaskManager {
    constructor(assistant) {
        this.assistant = assistant;
        this.currentFilter = 'all';
        this.sortBy = 'priority'; // priority, dueDate, created, alphabetical
        this.sortOrder = 'asc';
        
        // Performance optimizations
        this.domCache = new Map();
        this.eventListeners = [];
        this.dateCache = new Map();
        this.filterCache = new Map();
        this.lastRenderTime = 0;
        this.minRenderInterval = 50; // Minimum time between renders (ms)
        
        // Pre-compiled regex patterns for performance
        this.patterns = {
            todayDate: new RegExp(new Date().toISOString().split('T')[0]),
            timeFormat: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        };
    }

    // DOM caching utility for performance
    getElement(id) {
        if (!this.domCache.has(id)) {
            this.domCache.set(id, document.getElementById(id));
        }
        return this.domCache.get(id);
    }

    // Add event listener with cleanup tracking
    addEventListenerWithCleanup(element, event, handler, options) {
        element.addEventListener(event, handler, options);
        this.eventListeners.push({ element, event, handler, options });
    }

    // Cleanup all event listeners
    cleanup() {
        this.eventListeners.forEach(({ element, event, handler, options }) => {
            element.removeEventListener(event, handler, options);
        });
        this.eventListeners = [];
        this.domCache.clear();
        this.dateCache.clear();
        this.filterCache.clear();
    }

    renderTasksList() {
        // Throttle renders for performance
        const now = Date.now();
        if (now - this.lastRenderTime < this.minRenderInterval) {
            return;
        }
        this.lastRenderTime = now;

        const container = this.getElement('allTasksList');
        if (!container) return;

        // Clear previous event listeners for this container
        this.cleanup();

        container.innerHTML = '';

        const filteredTasks = this.getFilteredTasks();
        const sortedTasks = this.getSortedTasks(filteredTasks);

        if (sortedTasks.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            return;
        }

        // Group tasks by status or date with performance optimization
        const groupedTasks = this.groupTasksOptimized(sortedTasks);
        
        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        Object.entries(groupedTasks).forEach(([groupName, tasks]) => {
            if (tasks.length === 0) return;

            const groupElement = this.createTaskGroup(groupName, tasks);
            fragment.appendChild(groupElement);
        });

        container.appendChild(fragment);
    }

    getFilteredTasks() {
        // Use cache for better performance
        const cacheKey = `${this.currentFilter}-${this.assistant.tasks.length}-${this.assistant.tasks.map(t => t.id).join(',')}`;
        if (this.filterCache.has(cacheKey)) {
            return this.filterCache.get(cacheKey);
        }

        const filtered = this.assistant.tasks.filter(task => {
            switch (this.currentFilter) {
                case 'pending':
                    return task.status === 'pending';
                case 'completed':
                    return task.status === 'completed';
                case 'overdue':
                    return this.isOverdueOptimized(task);
                case 'today':
                    return this.isDueTodayOptimized(task);
                case 'this-week':
                    return this.isDueThisWeekOptimized(task);
                case 'no-date':
                    return !task.dueDate;
                case 'high-priority':
                    return task.priority === 'high';
                default:
                    return true;
            }
        });

        // Limit cache size to prevent memory issues
        if (this.filterCache.size > 10) {
            const firstKey = this.filterCache.keys().next().value;
            this.filterCache.delete(firstKey);
        }

        this.filterCache.set(cacheKey, filtered);
        return filtered;
    }

    getSortedTasks(tasks) {
        return [...tasks].sort((a, b) => {
            let comparison = 0;

            switch (this.sortBy) {
                case 'priority':
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
                    break;
                case 'dueDate':
                    if (a.dueDate && b.dueDate) {
                        comparison = a.dueDate.localeCompare(b.dueDate);
                    } else if (a.dueDate) {
                        comparison = -1;
                    } else if (b.dueDate) {
                        comparison = 1;
                    }
                    break;
                case 'created':
                    comparison = new Date(a.createdAt) - new Date(b.createdAt);
                    break;
                case 'alphabetical':
                    comparison = a.title.localeCompare(b.title);
                    break;
            }

            return this.sortOrder === 'desc' ? -comparison : comparison;
        });
    }

    // Optimized grouping with better performance for large task lists
    groupTasksOptimized(tasks) {
        const groups = {
            'Overdue': [],
            'Today': [],
            'Tomorrow': [],
            'This Week': [],
            'Later': [],
            'No Date': [],
            'Completed': []
        };

        // Cache date calculations
        const today = this.getTodayString();
        const tomorrow = this.getTomorrowString();
        const weekEnd = this.getWeekEndDate();

        // Single pass through tasks for optimal performance
        tasks.forEach(task => {
            if (task.status === 'completed') {
                groups['Completed'].push(task);
            } else if (!task.dueDate) {
                groups['No Date'].push(task);
            } else if (task.dueDate < today) {
                groups['Overdue'].push(task);
            } else if (task.dueDate === today) {
                groups['Today'].push(task);
            } else if (task.dueDate === tomorrow) {
                groups['Tomorrow'].push(task);
            } else if (task.dueDate <= weekEnd) {
                groups['This Week'].push(task);
            } else {
                groups['Later'].push(task);
            }
        });

        return groups;
    }

    // Optimized date utility functions with caching
    getTodayString() {
        const cacheKey = 'today';
        if (this.dateCache.has(cacheKey)) {
            const cached = this.dateCache.get(cacheKey);
            // Check if cached date is still valid (same day)
            if (cached.date === new Date().toDateString()) {
                return cached.value;
            }
        }
        
        const today = new Date().toISOString().split('T')[0];
        this.dateCache.set(cacheKey, { 
            value: today, 
            date: new Date().toDateString() 
        });
        return today;
    }

    getTomorrowString() {
        const cacheKey = 'tomorrow';
        if (this.dateCache.has(cacheKey)) {
            const cached = this.dateCache.get(cacheKey);
            if (cached.date === new Date().toDateString()) {
                return cached.value;
            }
        }
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        this.dateCache.set(cacheKey, { 
            value: tomorrowStr, 
            date: new Date().toDateString() 
        });
        return tomorrowStr;
    }

    getWeekEndDate() {
        const cacheKey = 'weekEnd';
        if (this.dateCache.has(cacheKey)) {
            const cached = this.dateCache.get(cacheKey);
            if (cached.date === new Date().toDateString()) {
                return cached.value;
            }
        }
        
        const today = new Date();
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() + 7);
        const weekEndStr = weekEnd.toISOString().split('T')[0];
        this.dateCache.set(cacheKey, { 
            value: weekEndStr, 
            date: new Date().toDateString() 
        });
        return weekEndStr;
    }

    createTaskGroup(groupName, tasks) {
        const groupElement = document.createElement('div');
        groupElement.className = 'task-group';

        const groupHeader = document.createElement('div');
        groupHeader.className = 'task-group-header';
        groupHeader.innerHTML = `
            <h4>${groupName} <span class="task-count">(${tasks.length})</span></h4>
            <button class="group-toggle" onclick="this.closest('.task-group').classList.toggle('collapsed')">
                <span class="expand-icon">−</span>
                <span class="collapse-icon">+</span>
            </button>
        `;

        const groupContent = document.createElement('div');
        groupContent.className = 'task-group-content';

        tasks.forEach(task => {
            const taskElement = this.createAdvancedTaskElement(task);
            groupContent.appendChild(taskElement);
        });

        groupElement.appendChild(groupHeader);
        groupElement.appendChild(groupContent);

        return groupElement;
    }

    createAdvancedTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item advanced ${task.priority}-priority ${task.status === 'completed' ? 'completed' : ''}`;
        taskElement.dataset.taskId = task.id;

        const dueDateDisplay = task.dueDate ? 
            `<span class="task-date ${this.getDateUrgencyClass(task.dueDate)}">${this.formatRelativeDate(task.dueDate)}</span>` : '';
        
        const timeDisplay = task.dueTime ? 
            `<span class="task-time">${this.assistant.formatTime(task.dueTime)}</span>` : '';

        const tagsDisplay = task.tags ? 
            task.tags.map(tag => `<span class="task-tag">${tag}</span>`).join('') : '';

        taskElement.innerHTML = `
            <div class="task-main">
                <div class="task-left">
                    <div class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" 
                         onclick="taskManager.toggleTask('${task.id}')">
                        ${task.status === 'completed' ? '✓' : ''}
                    </div>
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                        ${tagsDisplay ? `<div class="task-tags">${tagsDisplay}</div>` : ''}
                    </div>
                </div>
                <div class="task-right">
                    <div class="task-meta">
                        ${dueDateDisplay}
                        ${timeDisplay}
                        <span class="task-priority-badge priority-${task.priority}">${task.priority}</span>
                    </div>
                    <div class="task-actions">
                        <button class="task-action-btn edit" onclick="taskManager.editTask('${task.id}')" title="Edit task">
                            ✏️
                        </button>
                        <button class="task-action-btn delete" onclick="taskManager.deleteTask('${task.id}')" title="Delete task">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add drag and drop functionality
        taskElement.draggable = true;
        taskElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
            taskElement.classList.add('dragging');
        });

        taskElement.addEventListener('dragend', () => {
            taskElement.classList.remove('dragging');
        });

        return taskElement;
    }

    toggleTask(taskId) {
        this.assistant.toggleTask(taskId);
        this.renderTasksList();
    }

    editTask(taskId) {
        const task = this.assistant.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Populate the form with task data
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskDate').value = task.dueDate || '';
        document.getElementById('taskTime').value = task.dueTime || '';
        document.getElementById('taskPriority').value = task.priority;

        // Store the task ID for updating
        document.getElementById('addTaskForm').dataset.editingTaskId = taskId;
        
        // Change modal title and button text
        const modal = document.getElementById('addTaskModal');
        modal.querySelector('.modal-header h3').textContent = 'Edit Task';
        modal.querySelector('button[type="submit"]').textContent = 'Update Task';

        this.assistant.showModal('addTaskModal');
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            const taskIndex = this.assistant.tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                this.assistant.tasks.splice(taskIndex, 1);
                this.assistant.saveData();
                this.assistant.updateDashboard();
                this.renderTasksList();
                this.assistant.showNotification('Task deleted successfully', 'success');
            }
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.renderTasksList();
    }

    setSorting(sortBy, order = 'asc') {
        this.sortBy = sortBy;
        this.sortOrder = order;
        this.renderTasksList();
    }

    // Task creation helpers
    createQuickTask(title, dueDate = null, priority = 'medium') {
        const task = {
            id: this.assistant.generateId(),
            title: title,
            description: '',
            dueDate: dueDate,
            dueTime: null,
            priority: priority,
            status: 'pending',
            project: null,
            tags: [],
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.assistant.tasks.push(task);
        this.assistant.saveData();
        return task;
    }

    // Optimized batch operations for better performance
    markMultipleComplete(taskIds) {
        if (!Array.isArray(taskIds) || taskIds.length === 0) return;
        
        const completionTime = new Date().toISOString();
        let modifiedCount = 0;
        
        // Use a Set for O(1) lookup instead of array.includes()
        const taskIdSet = new Set(taskIds);
        
        // Single pass through tasks array
        this.assistant.tasks.forEach(task => {
            if (taskIdSet.has(task.id) && task.status !== 'completed') {
                task.status = 'completed';
                task.completedAt = completionTime;
                modifiedCount++;
            }
        });

        if (modifiedCount > 0) {
            this.assistant.saveData();
            this.assistant.updateDashboard();
            this.renderTasksList();
            this.assistant.showNotification(`${modifiedCount} task(s) marked as completed`, 'success');
        }
    }

    deleteMultipleTasks(taskIds) {
        if (!Array.isArray(taskIds) || taskIds.length === 0) return;
        
        if (confirm(`Are you sure you want to delete ${taskIds.length} task(s)?`)) {
            // Use Set for O(1) lookup performance
            const taskIdSet = new Set(taskIds);
            const originalLength = this.assistant.tasks.length;
            
            this.assistant.tasks = this.assistant.tasks.filter(task => !taskIdSet.has(task.id));
            
            const deletedCount = originalLength - this.assistant.tasks.length;
            
            if (deletedCount > 0) {
                this.assistant.saveData();
                this.assistant.updateDashboard();
                this.renderTasksList();
                this.assistant.showNotification(`${deletedCount} task(s) deleted`, 'success');
            }
        }
    }

    // Optimized date utility functions for better performance
    isOverdueOptimized(task) {
        if (!task.dueDate) return false;
        const today = this.getTodayString();
        return task.dueDate < today && task.status === 'pending';
    }

    isDueTodayOptimized(task) {
        if (!task.dueDate) return false;
        const today = this.getTodayString();
        return task.dueDate === today;
    }

    isDueThisWeekOptimized(task) {
        if (!task.dueDate) return false;
        const today = this.getTodayString();
        const weekEnd = this.getWeekEndDate();
        return task.dueDate >= today && task.dueDate <= weekEnd;
    }

    // Date utility functions
    isOverdue(task) {
        if (!task.dueDate) return false;
        const today = new Date().toISOString().split('T')[0];
        return task.dueDate < today && task.status === 'pending';
    }

    isDueToday(task) {
        if (!task.dueDate) return false;
        const today = new Date().toISOString().split('T')[0];
        return task.dueDate === today;
    }

    isDueThisWeek(task) {
        if (!task.dueDate) return false;
        
        const today = new Date();
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() + 7);
        
        const taskDate = new Date(task.dueDate);
        return taskDate >= today && taskDate <= weekEnd;
    }

    getDateUrgencyClass(dueDate) {
        const today = new Date().toISOString().split('T')[0];
        
        if (dueDate < today) return 'overdue';
        if (dueDate === today) return 'due-today';
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (dueDate === tomorrow.toISOString().split('T')[0]) return 'due-tomorrow';
        
        return 'due-later';
    }

    formatRelativeDate(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dateString = date.toISOString().split('T')[0];
        const todayString = today.toISOString().split('T')[0];
        const tomorrowString = tomorrow.toISOString().split('T')[0];

        if (dateString === todayString) return 'Today';
        if (dateString === tomorrowString) return 'Tomorrow';
        
        if (dateString < todayString) {
            const diffTime = today - date;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        }

        const diffTime = date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 7) {
            return date.toLocaleDateString('en-US', { weekday: 'long' });
        }
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    getEmptyStateHTML() {
        const filterMessages = {
            'all': 'No tasks yet. Add your first task!',
            'pending': 'No pending tasks. Great job!',
            'completed': 'No completed tasks yet.',
            'overdue': 'No overdue tasks. You\'re on track!',
            'today': 'No tasks due today.',
            'this-week': 'No tasks due this week.',
            'no-date': 'No unscheduled tasks.',
            'high-priority': 'No high-priority tasks.'
        };

        return `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <h3>${filterMessages[this.currentFilter] || 'No tasks found.'}</h3>
                <button class="btn-primary" onclick="assistant.showModal('addTaskModal')">
                    + Add Your First Task
                </button>
            </div>
        `;
    }
}

// Export for use in main application
window.TaskManager = TaskManager;