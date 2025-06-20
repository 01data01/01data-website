/**
 * Dashboard Module
 * Handles dashboard functionality, stats, and quick actions
 */

class DashboardModule {
    constructor() {
        this.initialized = false;
        this.stats = {
            dueToday: 0,
            overdue: 0,
            completed: 0,
            total: 0
        };
        this.eventListeners = [];
        this.animationQueue = [];
    }

    /**
     * Initialize dashboard module
     */
    initialize() {
        if (this.initialized) return;
        
        try {
            console.log('Initializing Dashboard Module...');
            
            this.createStatsCards();
            this.setupEventListeners();
            this.loadDashboardData();
            this.updateStats();
            this.setupQuickAdd();
            this.animateStatsCards();
            
            this.initialized = true;
            console.log('Dashboard Module initialized successfully');
            
        } catch (error) {
            utils.logError('Dashboard Module Initialization', error);
        }
    }

    /**
     * Create stats cards HTML structure
     */
    createStatsCards() {
        const statsContainer = utils.getElementById('animated-stats-container');
        if (!statsContainer) return;

        const statsHTML = `
            <div class="stats-container">
                <div class="stat-card" data-stat="due-today">
                    <div class="stat-icon icon-today">
                        <div class="icon-clock">
                            <div class="clock-face">
                                <div class="clock-hand hour-hand"></div>
                                <div class="clock-hand minute-hand"></div>
                            </div>
                        </div>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">0</div>
                        <div class="stat-label">Due Today</div>
                    </div>
                </div>

                <div class="stat-card urgent" data-stat="overdue">
                    <div class="stat-icon icon-warning">
                        <div class="icon-triangle">
                            <div class="triangle-inner">!</div>
                        </div>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">0</div>
                        <div class="stat-label">Overdue</div>
                    </div>
                </div>

                <div class="stat-card success" data-stat="completed">
                    <div class="stat-icon icon-completed">
                        <div class="icon-checkmark">
                            <div class="checkmark-stem"></div>
                            <div class="checkmark-kick"></div>
                        </div>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">0</div>
                        <div class="stat-label">Completed</div>
                    </div>
                </div>

                <div class="stat-card info" data-stat="completion-rate">
                    <div class="stat-icon icon-chart">
                        <div class="icon-progress">
                            <div class="progress-ring">
                                <svg class="progress-ring-svg" viewBox="0 0 120 120">
                                    <circle class="progress-ring-bg" cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="8"/>
                                    <circle class="progress-ring-fill" cx="60" cy="60" r="54" fill="none" stroke="currentColor" stroke-width="8" 
                                            stroke-linecap="round" stroke-dasharray="339.292" stroke-dashoffset="339.292"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">0%</div>
                        <div class="stat-label">Completion Rate</div>
                    </div>
                </div>
            </div>
        `;

        statsContainer.innerHTML = statsHTML;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Quick add form
        const quickAddForm = utils.querySelector('.quick-add-form');
        if (quickAddForm) {
            const submitListener = utils.addEventListener(quickAddForm, 'submit', (e) => {
                e.preventDefault();
                this.handleQuickAdd();
            });
            this.eventListeners.push(submitListener);
        }

        // Quick add input
        const quickAddInput = utils.getElementById('quickTaskInput');
        if (quickAddInput) {
            const keyListener = utils.addEventListener(quickAddInput, 'keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleQuickAdd();
                }
            });
            this.eventListeners.push(keyListener);
        }

        // AI quick add button
        const aiAddBtn = utils.getElementById('quickAddBtn');
        if (aiAddBtn) {
            const clickListener = utils.addEventListener(aiAddBtn, 'click', () => {
                this.handleAIQuickAdd();
            });
            this.eventListeners.push(clickListener);
        }

        // Stats card clicks for navigation
        const statsCards = utils.querySelectorAll('.stat-card[data-filter]');
        statsCards.forEach(card => {
            const clickListener = utils.addEventListener(card, 'click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.navigateToTasks(filter);
            });
            this.eventListeners.push(clickListener);
        });

        // Refresh button
        const refreshBtn = utils.querySelector('.dashboard-refresh-btn');
        if (refreshBtn) {
            const clickListener = utils.addEventListener(refreshBtn, 'click', () => {
                this.refreshDashboard();
            });
            this.eventListeners.push(clickListener);
        }

        // Task quick actions
        this.setupTaskQuickActions();
    }

    /**
     * Setup task quick actions in dashboard
     */
    setupTaskQuickActions() {
        const taskItems = utils.querySelectorAll('.dashboard-task-item');
        taskItems.forEach(item => {
            const checkbox = item.querySelector('.task-checkbox');
            if (checkbox) {
                const checkListener = utils.addEventListener(checkbox, 'click', (e) => {
                    const taskId = item.dataset.taskId;
                    this.toggleTaskComplete(taskId, e.target.checked);
                });
                this.eventListeners.push(checkListener);
            }
        });
    }

    /**
     * Load dashboard data
     */
    loadDashboardData() {
        try {
            // Load tasks data
            let tasks = utils.loadFromStorage('tasks', []);
            
            // If no tasks exist, create some sample tasks for testing
            if (tasks.length === 0) {
                tasks = this.createSampleTasks();
                utils.saveToStorage('tasks', tasks);
            }
            
            this.calculateStats(tasks);
            this.updateTodaysTasks(tasks);
            this.updateUpcoming(tasks);
            
        } catch (error) {
            utils.logError('Dashboard Data Loading', error);
        }
    }

    /**
     * Create sample tasks for testing
     */
    createSampleTasks() {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        return [
            {
                id: utils.generateId('task'),
                title: 'Review project proposal',
                description: 'Review and approve the new project proposal',
                priority: 'high',
                category: 'Work',
                dueDate: today,
                time: '14:00',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: utils.generateId('task'),
                title: 'Team meeting',
                description: 'Weekly team sync meeting',
                priority: 'medium',
                category: 'Work',
                dueDate: today,
                time: '10:00',
                completed: true,
                createdAt: new Date().toISOString(),
                completedAt: new Date().toISOString()
            },
            {
                id: utils.generateId('task'),
                title: 'Send quarterly report',
                description: 'Finalize and send Q4 report to management',
                priority: 'high',
                category: 'Work',
                dueDate: yesterday.toISOString().split('T')[0],
                time: '17:00',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: utils.generateId('task'),
                title: 'Doctor appointment',
                description: 'Annual check-up',
                priority: 'medium',
                category: 'Personal',
                dueDate: tomorrow.toISOString().split('T')[0],
                time: '09:00',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: utils.generateId('task'),
                title: 'Buy groceries',
                description: 'Weekly grocery shopping',
                priority: 'low',
                category: 'Personal',
                dueDate: null,
                time: null,
                completed: true,
                createdAt: new Date().toISOString(),
                completedAt: new Date().toISOString()
            }
        ];
    }

    /**
     * Calculate dashboard statistics
     */
    calculateStats(tasks = []) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        this.stats = {
            dueToday: 0,
            overdue: 0,
            completed: 0,
            total: tasks.length,
            thisWeek: 0,
            highPriority: 0,
            completionRate: 0
        };

        tasks.forEach(task => {
            if (task.completed) {
                this.stats.completed++;
                return;
            }

            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                dueDate.setHours(0, 0, 0, 0);

                if (dueDate.getTime() === today.getTime()) {
                    this.stats.dueToday++;
                } else if (dueDate < today) {
                    this.stats.overdue++;
                }

                // This week calculation
                const weekFromNow = new Date(today);
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                if (dueDate >= today && dueDate <= weekFromNow) {
                    this.stats.thisWeek++;
                }
            }

            if (task.priority === 'high') {
                this.stats.highPriority++;
            }
        });

        // Calculate completion rate
        this.stats.completionRate = this.stats.total > 0 
            ? Math.round((this.stats.completed / this.stats.total) * 100) 
            : 0;
    }

    /**
     * Update stats display
     */
    updateStats() {
        const statsMapping = {
            'due-today': this.stats.dueToday,
            'overdue': this.stats.overdue,
            'completed': this.stats.completed,
            'completion-rate': `${this.stats.completionRate}%`
        };

        Object.entries(statsMapping).forEach(([key, value]) => {
            const statElement = utils.querySelector(`[data-stat="${key}"] .stat-number`);
            if (statElement) {
                const currentValue = key === 'completion-rate' 
                    ? parseInt(statElement.textContent.replace('%', '')) || 0
                    : parseInt(statElement.textContent) || 0;
                
                if (key === 'completion-rate') {
                    this.animateNumber(statElement, currentValue, this.stats.completionRate, 800, '%');
                    this.updateProgressRing(this.stats.completionRate);
                } else {
                    this.animateNumber(statElement, currentValue, value);
                }
            }
        });

        // Update urgency indicators
        this.updateUrgencyIndicators();
    }

    /**
     * Animate number changes
     */
    animateNumber(element, fromValue, toValue, duration = 800, suffix = '') {
        if (fromValue === toValue) return;

        const startTime = performance.now();
        const difference = toValue - fromValue;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.round(fromValue + (difference * easeOutQuart));
            
            element.textContent = currentValue + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Update progress ring for completion rate
     */
    updateProgressRing(percentage) {
        const progressRing = utils.querySelector('.progress-ring-fill');
        if (progressRing) {
            const circumference = 2 * Math.PI * 54; // radius = 54
            const offset = circumference - (percentage / 100) * circumference;
            
            progressRing.style.strokeDashoffset = offset;
        }
    }

    /**
     * Update urgency indicators
     */
    updateUrgencyIndicators() {
        // Overdue card urgency
        const overdueCard = utils.querySelector('[data-stat="overdue"]');
        if (overdueCard) {
            if (this.stats.overdue > 0) {
                overdueCard.classList.add('urgent');
            } else {
                overdueCard.classList.remove('urgent');
            }
        }

        // Due today urgency
        const dueTodayCard = utils.querySelector('[data-stat="due-today"]');
        if (dueTodayCard) {
            if (this.stats.dueToday > 3) {
                dueTodayCard.classList.add('warning');
            } else {
                dueTodayCard.classList.remove('warning');
            }
        }
    }

    /**
     * Update today's tasks section
     */
    updateTodaysTasks(tasks = []) {
        const todaysTasksContainer = utils.getElementById('todayTasksList');
        if (!todaysTasksContainer) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaysTasks = tasks.filter(task => {
            if (task.completed) return false;
            if (!task.dueDate) return false;
            
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() === today.getTime();
        }).slice(0, 5); // Show max 5 tasks

        if (todaysTasks.length === 0) {
            todaysTasksContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✅</div>
                    <p>No tasks due today!</p>
                    <p class="empty-subtitle">Great job staying on top of your schedule.</p>
                </div>
            `;
            return;
        }

        todaysTasksContainer.innerHTML = todaysTasks.map(task => `
            <div class="dashboard-task-item priority-${task.priority || 'medium'}" data-task-id="${task.id}">
                <div class="task-checkbox" ${task.completed ? 'checked' : ''}></div>
                <div class="task-content">
                    <div class="task-title">${utils.truncate(task.title, 40)}</div>
                    <div class="task-meta">
                        ${task.time ? `<span class="task-time">${utils.formatTime(task.time)}</span>` : ''}
                        ${task.category ? `<span class="task-category">${task.category}</span>` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn" data-action="edit" title="Edit">✏️</button>
                    <button class="task-action-btn" data-action="complete" title="Complete">✓</button>
                </div>
            </div>
        `).join('');

        // Re-setup quick actions for new tasks
        this.setupTaskQuickActions();
    }

    /**
     * Update upcoming section (AI Suggestions)
     */
    updateUpcoming(tasks = []) {
        const upcomingContainer = utils.getElementById('aiSuggestions');
        if (!upcomingContainer) return;

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const upcomingTasks = tasks.filter(task => {
            if (task.completed) return false;
            if (!task.dueDate) return false;
            
            const dueDate = new Date(task.dueDate);
            return dueDate > today;
        }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5);

        if (upcomingTasks.length === 0) {
            upcomingContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📅</div>
                    <p>No upcoming tasks</p>
                </div>
            `;
            return;
        }

        upcomingContainer.innerHTML = upcomingTasks.map(task => `
            <div class="upcoming-item priority-${task.priority || 'medium'}">
                <div class="upcoming-content">
                    <div class="upcoming-title">${utils.truncate(task.title, 35)}</div>
                    <div class="upcoming-date">${utils.getRelativeDate(task.dueDate)}</div>
                </div>
                <div class="upcoming-priority priority-${task.priority || 'medium'}"></div>
            </div>
        `).join('');
    }

    /**
     * Setup quick add functionality
     */
    setupQuickAdd() {
        const quickAddInput = utils.getElementById('quickTaskInput');
        if (quickAddInput) {
            // Auto-resize textarea
            const resizeListener = utils.addEventListener(quickAddInput, 'input', () => {
                this.autoResizeTextarea(quickAddInput);
            });
            this.eventListeners.push(resizeListener);

            // Smart suggestions
            const focusListener = utils.addEventListener(quickAddInput, 'focus', () => {
                this.showQuickAddSuggestions();
            });
            this.eventListeners.push(focusListener);
        }
    }

    /**
     * Auto-resize textarea
     */
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    /**
     * Show quick add suggestions
     */
    showQuickAddSuggestions() {
        const suggestions = [
            'Call client about project update',
            'Review quarterly reports',
            'Schedule team meeting',
            'Update website content',
            'Prepare presentation slides'
        ];

        // Implementation for showing suggestions
        // This would show a dropdown with common task templates
    }

    /**
     * Handle quick add form submission
     */
    handleQuickAdd() {
        const quickAddInput = utils.getElementById('quickTaskInput');
        if (!quickAddInput) return;

        const taskText = quickAddInput.value.trim();
        if (!taskText) return;

        try {
            // Parse task text for metadata
            const taskData = this.parseTaskText(taskText);
            
            // Create new task
            const newTask = {
                id: utils.generateId('task'),
                title: taskData.title,
                description: taskData.description || '',
                priority: taskData.priority || 'medium',
                category: taskData.category || 'General',
                dueDate: taskData.dueDate,
                time: taskData.time,
                completed: false,
                createdAt: new Date().toISOString()
            };

            // Save task
            const tasks = utils.loadFromStorage('tasks', []);
            tasks.push(newTask);
            utils.saveToStorage('tasks', tasks);

            // Clear input
            quickAddInput.value = '';
            quickAddInput.style.height = 'auto';

            // Update dashboard
            this.refreshDashboard();

            // Show success feedback
            this.showQuickAddSuccess(newTask);

        } catch (error) {
            utils.logError('Quick Add Task', error);
            window.mainApp?.showNotification('Failed to add task', 'error');
        }
    }

    /**
     * Handle AI quick add
     */
    async handleAIQuickAdd() {
        const quickAddInput = utils.getElementById('quickTaskInput');
        if (!quickAddInput) return;

        const taskText = quickAddInput.value.trim();
        if (!taskText) {
            window.mainApp?.showNotification('Please enter a task description', 'warning');
            return;
        }

        try {
            // Show loading state
            const aiBtn = utils.querySelector('.ai-add-btn');
            if (aiBtn) {
                aiBtn.classList.add('loading');
                aiBtn.disabled = true;
            }

            // Use AI to enhance task (placeholder for AI integration)
            const enhancedTask = await this.enhanceTaskWithAI(taskText);
            
            // Create task with AI enhancements
            const newTask = {
                id: utils.generateId('task'),
                ...enhancedTask,
                completed: false,
                createdAt: new Date().toISOString()
            };

            // Save task
            const tasks = utils.loadFromStorage('tasks', []);
            tasks.push(newTask);
            utils.saveToStorage('tasks', tasks);

            // Clear input
            quickAddInput.value = '';
            quickAddInput.style.height = 'auto';

            // Update dashboard
            this.refreshDashboard();

            // Show success with AI enhancement info
            this.showAIAddSuccess(newTask);

        } catch (error) {
            utils.logError('AI Quick Add', error);
            window.mainApp?.showNotification('AI enhancement failed, task added normally', 'warning');
            this.handleQuickAdd();
        } finally {
            // Remove loading state
            const aiBtn = utils.querySelector('.ai-add-btn');
            if (aiBtn) {
                aiBtn.classList.remove('loading');
                aiBtn.disabled = false;
            }
        }
    }

    /**
     * Parse task text for metadata
     */
    parseTaskText(text) {
        const result = {
            title: text,
            priority: 'medium',
            category: 'General'
        };

        // Extract priority
        const priorityMatch = text.match(/(!{1,3})/);
        if (priorityMatch) {
            const exclamations = priorityMatch[1].length;
            result.priority = exclamations >= 3 ? 'high' : exclamations >= 2 ? 'medium' : 'low';
            result.title = text.replace(/!+/, '').trim();
        }

        // Extract due date
        const dateMatch = text.match(/(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\/\d{1,2})/i);
        if (dateMatch) {
            result.dueDate = this.parseDateString(dateMatch[1]);
        }

        // Extract time
        const timeMatch = text.match(/(\d{1,2}):(\d{2})\s?(am|pm)?/i);
        if (timeMatch) {
            result.time = timeMatch[0];
        }

        // Extract category
        const categoryMatch = text.match(/#(\w+)/);
        if (categoryMatch) {
            result.category = utils.capitalize(categoryMatch[1]);
            result.title = result.title.replace(/#\w+/, '').trim();
        }

        return result;
    }

    /**
     * Parse date string to Date object
     */
    parseDateString(dateStr) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        switch (dateStr.toLowerCase()) {
            case 'today':
                return today.toISOString().split('T')[0];
            case 'tomorrow':
                return tomorrow.toISOString().split('T')[0];
            default:
                // Handle day names and date formats
                return today.toISOString().split('T')[0];
        }
    }

    /**
     * Enhance task with AI (placeholder)
     */
    async enhanceTaskWithAI(taskText) {
        // This would integrate with your AI service
        // For now, return enhanced version with smart defaults
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate AI processing
        
        const enhanced = this.parseTaskText(taskText);
        
        // AI could suggest better titles, categories, priorities, etc.
        return enhanced;
    }

    /**
     * Show quick add success feedback
     */
    showQuickAddSuccess(task) {
        const quickAddContainer = utils.querySelector('.quick-add-container');
        if (quickAddContainer) {
            utils.animate(quickAddContainer, 'success-pulse');
        }
        
        window.mainApp?.showNotification(`Task "${utils.truncate(task.title, 30)}" added successfully`, 'success');
    }

    /**
     * Show AI add success feedback
     */
    showAIAddSuccess(task) {
        window.mainApp?.showNotification(`Task enhanced with AI and added: "${utils.truncate(task.title, 30)}"`, 'success');
    }

    /**
     * Toggle task completion
     */
    toggleTaskComplete(taskId, completed) {
        try {
            const tasks = utils.loadFromStorage('tasks', []);
            const taskIndex = tasks.findIndex(task => task.id === taskId);
            
            if (taskIndex !== -1) {
                tasks[taskIndex].completed = completed;
                tasks[taskIndex].completedAt = completed ? new Date().toISOString() : null;
                
                utils.saveToStorage('tasks', tasks);
                this.refreshDashboard();
                
                const action = completed ? 'completed' : 'reopened';
                window.mainApp?.showNotification(`Task ${action}`, 'success');
            }
        } catch (error) {
            utils.logError('Toggle Task Complete', error);
        }
    }

    /**
     * Navigate to tasks with filter
     */
    navigateToTasks(filter) {
        if (window.mainApp) {
            window.mainApp.navigateTo('tasks');
            // Set filter after navigation
            setTimeout(() => {
                if (window.tasksModule) {
                    window.tasksModule.setFilter(filter);
                }
            }, 100);
        }
    }

    /**
     * Animate stats cards on load
     */
    animateStatsCards() {
        const statsCards = utils.querySelectorAll('.stat-card');
        statsCards.forEach((card, index) => {
            setTimeout(() => {
                utils.animate(card, 'fadeInUp');
            }, index * 100);
        });
    }

    /**
     * Refresh dashboard data
     */
    refreshDashboard() {
        this.loadDashboardData();
        this.updateStats();
        
        // Animate refresh
        const refreshBtn = utils.querySelector('.dashboard-refresh-btn');
        if (refreshBtn) {
            utils.animate(refreshBtn, 'spin', 500);
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
const dashboardModule = new DashboardModule();

// Make it globally accessible
window.dashboardModule = dashboardModule;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = dashboardModule;
}