/**
 * Tasks Module
 * Handles task management, filtering, and display
 */

class TasksModule {
    constructor() {
        this.initialized = false;
        this.tasks = [];
        this.currentFilter = 'all';
        this.eventListeners = [];
    }

    /**
     * Initialize tasks module
     */
    initialize() {
        if (this.initialized) return;
        
        try {
            console.log('Initializing Tasks Module...');
            
            this.loadTasks();
            this.setupEventListeners();
            this.renderTasks();
            
            this.initialized = true;
            console.log('Tasks Module initialized successfully');
            
        } catch (error) {
            utils.logError('Tasks Module Initialization', error);
        }
    }

    /**
     * Load tasks from storage
     */
    loadTasks() {
        this.tasks = utils.loadFromStorage('tasks', []);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Filter buttons
        const filterBtns = utils.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            const clickListener = utils.addEventListener(btn, 'click', (e) => {
                const filter = e.target.dataset.filter;
                this.setFilter(filter);
            });
            this.eventListeners.push(clickListener);
        });

        // Add task button
        const addTaskBtn = utils.getElementById('addTaskBtn');
        if (addTaskBtn) {
            const clickListener = utils.addEventListener(addTaskBtn, 'click', () => {
                this.showAddTaskModal();
            });
            this.eventListeners.push(clickListener);
        }
    }

    /**
     * Set current filter
     */
    setFilter(filter) {
        this.currentFilter = filter;
        this.updateFilterButtons();
        this.renderTasks();
    }

    /**
     * Update filter button states
     */
    updateFilterButtons() {
        const filterBtns = utils.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            if (btn.dataset.filter === this.currentFilter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * Render tasks based on current filter
     */
    renderTasks() {
        const tasksList = utils.getElementById('allTasksList');
        if (!tasksList) return;

        let filteredTasks = this.tasks;

        // Apply filter
        switch (this.currentFilter) {
            case 'pending':
                filteredTasks = this.tasks.filter(task => !task.completed);
                break;
            case 'completed':
                filteredTasks = this.tasks.filter(task => task.completed);
                break;
            case 'overdue':
                const today = new Date().toISOString().split('T')[0];
                filteredTasks = this.tasks.filter(task => 
                    !task.completed && task.dueDate && task.dueDate < today
                );
                break;
            default:
                filteredTasks = this.tasks;
        }

        if (filteredTasks.length === 0) {
            tasksList.innerHTML = this.getEmptyState();
            return;
        }

        tasksList.innerHTML = filteredTasks.map(task => this.renderTaskItem(task)).join('');
        this.setupTaskItemListeners();
    }

    /**
     * Render individual task item
     */
    renderTaskItem(task) {
        const isOverdue = task.dueDate && !task.completed && task.dueDate < new Date().toISOString().split('T')[0];
        
        return `
            <div class="task-item priority-${task.priority || 'medium'} ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" 
                 data-task-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                     onclick="tasksModule.toggleTask('${task.id}')"></div>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    <div class="task-meta">
                        ${task.dueDate ? `<span class="task-date">${utils.formatDate(task.dueDate)}</span>` : ''}
                        ${task.time ? `<span class="task-time">${utils.formatTime(task.time)}</span>` : ''}
                        ${task.category ? `<span class="task-category">${task.category}</span>` : ''}
                        <span class="task-priority priority-${task.priority || 'medium'}">${utils.capitalize(task.priority || 'medium')}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn" onclick="tasksModule.editTask('${task.id}')" title="Edit">
                        <span class="icon-edit">✏️</span>
                    </button>
                    <button class="task-action-btn" onclick="tasksModule.deleteTask('${task.id}')" title="Delete">
                        <span class="icon-delete">🗑️</span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Setup task item event listeners
     */
    setupTaskItemListeners() {
        // Additional event listeners for task items if needed
    }

    /**
     * Get empty state HTML
     */
    getEmptyState() {
        const messages = {
            all: 'No tasks found. Create your first task!',
            pending: 'No pending tasks. Great job!',
            completed: 'No completed tasks yet.',
            overdue: 'No overdue tasks. You\'re on track!'
        };

        return `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>No Tasks</h3>
                <p>${messages[this.currentFilter] || messages.all}</p>
                <button class="btn-primary" onclick="tasksModule.showAddTaskModal()">
                    + Add Your First Task
                </button>
            </div>
        `;
    }

    /**
     * Toggle task completion
     */
    toggleTask(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex].completed = !this.tasks[taskIndex].completed;
            this.tasks[taskIndex].completedAt = this.tasks[taskIndex].completed 
                ? new Date().toISOString() 
                : null;
            
            this.saveTasks();
            this.renderTasks();
            
            // Update dashboard stats if available
            if (window.dashboardModule) {
                window.dashboardModule.loadDashboardData();
                window.dashboardModule.updateStats();
            }
        }
    }

    /**
     * Edit task
     */
    editTask(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            this.showAddTaskModal(task);
        }
    }

    /**
     * Delete task
     */
    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.saveTasks();
            this.renderTasks();
            
            // Update dashboard stats if available
            if (window.dashboardModule) {
                window.dashboardModule.loadDashboardData();
                window.dashboardModule.updateStats();
            }
        }
    }

    /**
     * Show add/edit task modal
     */
    showAddTaskModal(editTask = null) {
        const isEdit = !!editTask;
        const task = editTask || {
            title: '',
            description: '',
            priority: 'medium',
            category: '',
            dueDate: '',
            time: ''
        };

        const modalHTML = `
            <div class="modal active" id="taskModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${isEdit ? 'Edit Task' : 'Add New Task'}</h3>
                        <button class="modal-close" onclick="tasksModule.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="taskForm">
                            <div class="form-group">
                                <label for="taskTitle">Title *</label>
                                <input type="text" id="taskTitle" value="${task.title}" required>
                            </div>
                            <div class="form-group">
                                <label for="taskDescription">Description</label>
                                <textarea id="taskDescription" rows="3">${task.description}</textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="taskPriority">Priority</label>
                                    <select id="taskPriority">
                                        <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                                        <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                                        <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="taskCategory">Category</label>
                                    <input type="text" id="taskCategory" value="${task.category}" placeholder="Work, Personal, etc.">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="taskDueDate">Due Date</label>
                                    <input type="date" id="taskDueDate" value="${task.dueDate}">
                                </div>
                                <div class="form-group">
                                    <label for="taskTime">Time</label>
                                    <input type="time" id="taskTime" value="${task.time}">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="tasksModule.closeModal()">Cancel</button>
                        <button class="btn-primary" onclick="tasksModule.saveTask(${isEdit ? `'${task.id}'` : 'null'})">
                            ${isEdit ? 'Update Task' : 'Add Task'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Save task (add or edit)
     */
    saveTask(editId = null) {
        const form = utils.getElementById('taskForm');
        if (!form) return;

        const taskData = {
            title: utils.getElementById('taskTitle').value.trim(),
            description: utils.getElementById('taskDescription').value.trim(),
            priority: utils.getElementById('taskPriority').value,
            category: utils.getElementById('taskCategory').value.trim(),
            dueDate: utils.getElementById('taskDueDate').value,
            time: utils.getElementById('taskTime').value
        };

        if (!taskData.title) {
            alert('Please enter a task title');
            return;
        }

        if (editId) {
            // Edit existing task
            const taskIndex = this.tasks.findIndex(task => task.id === editId);
            if (taskIndex !== -1) {
                this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...taskData };
            }
        } else {
            // Add new task
            const newTask = {
                id: utils.generateId('task'),
                ...taskData,
                completed: false,
                createdAt: new Date().toISOString(),
                completedAt: null
            };
            this.tasks.push(newTask);
        }

        this.saveTasks();
        this.renderTasks();
        this.closeModal();

        // Update dashboard if available
        if (window.dashboardModule) {
            window.dashboardModule.loadDashboardData();
            window.dashboardModule.updateStats();
        }
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = utils.getElementById('taskModal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * Save tasks to storage
     */
    saveTasks() {
        utils.saveToStorage('tasks', this.tasks);
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
const tasksModule = new TasksModule();

// Make it globally accessible
window.tasksModule = tasksModule;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = tasksModule;
}