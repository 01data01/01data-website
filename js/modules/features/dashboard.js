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
            this.initializeAnimatedIcons();
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
     * Create enhanced stats cards HTML structure with animated icons
     */
    createStatsCards() {
        const statsContainer = utils.getElementById('dashboardContent');
        if (!statsContainer) return;

        const statsHTML = `
            <div class="animated-stats-wrapper">
                <div class="animated-stat-card blue-theme clickable" data-stat="due-today" data-filter="due-today">
                    <div class="animated-card-content">
                        <div class="animated-icon-container">
                            <div class="animated-icon-circle blue">
                                <div class="animated-clock">
                                    <div class="animated-clock-face"></div>
                                    <div class="animated-clock-hand animated-hour-hand"></div>
                                    <div class="animated-clock-hand animated-minute-hand"></div>
                                    <div class="animated-clock-center"></div>
                                </div>
                            </div>
                            <div class="animated-glow-ring" style="--glow-color: rgba(44, 95, 93, 0.4);"></div>
                            <div class="animated-particles" data-color="blue"></div>
                        </div>
                        <div class="animated-metrics">
                            <div class="animated-metric-value" data-metric="due-today">0</div>
                            <div class="animated-metric-label blue">Due Today</div>
                        </div>
                    </div>
                </div>

                <div class="animated-stat-card red-theme clickable" data-stat="overdue" data-filter="overdue">
                    <div class="animated-card-content">
                        <div class="animated-icon-container">
                            <div class="animated-icon-circle red">
                                <div class="animated-warning"></div>
                            </div>
                            <div class="animated-glow-ring" style="--glow-color: rgba(239, 68, 68, 0.4);"></div>
                            <div class="animated-particles" data-color="red"></div>
                        </div>
                        <div class="animated-metrics">
                            <div class="animated-metric-value" data-metric="overdue">0</div>
                            <div class="animated-metric-label red">Overdue</div>
                        </div>
                    </div>
                </div>

                <div class="animated-stat-card green-theme clickable" data-stat="completed" data-filter="completed">
                    <div class="animated-card-content">
                        <div class="animated-icon-container">
                            <div class="animated-icon-circle green">
                                <svg class="animated-checkmark" viewBox="0 0 24 24" fill="none">
                                    <path class="animated-checkmark-path" d="M6 12l4 4L18 8"/>
                                </svg>
                            </div>
                            <div class="animated-glow-ring" style="--glow-color: rgba(16, 185, 129, 0.4);"></div>
                            <div class="animated-particles" data-color="green"></div>
                        </div>
                        <div class="animated-metrics">
                            <div class="animated-metric-value" data-metric="completed">0</div>
                            <div class="animated-metric-label green">Completed</div>
                        </div>
                    </div>
                </div>

                <div class="animated-stat-card purple-theme" data-stat="completion-rate">
                    <div class="animated-card-content">
                        <div class="animated-icon-container">
                            <div class="animated-icon-circle purple">
                                <div class="animated-chart">
                                    <div class="animated-bar"></div>
                                    <div class="animated-bar"></div>
                                    <div class="animated-bar"></div>
                                    <div class="animated-bar"></div>
                                </div>
                            </div>
                            <div class="animated-glow-ring" style="--glow-color: rgba(139, 92, 246, 0.4);"></div>
                            <div class="animated-particles" data-color="purple"></div>
                        </div>
                        <div class="animated-metrics">
                            <div class="animated-metric-value" data-metric="completion-rate">0%</div>
                            <div class="animated-metric-label purple">Completion Rate</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="dashboard-main-content">
                <div class="dashboard-section quick-add-container">
                    <div class="section-header">
                        <h3>🚀 Quick Task</h3>
                        <div class="section-subtitle">Add a task instantly with AI assistance</div>
                    </div>
                    <div class="quick-add-form">
                        <div class="quick-add-input-container">
                            <textarea id="quickTaskInput" placeholder="What needs to be done? Try: 'Meeting with John tomorrow at 2pm #work !!!'" rows="2"></textarea>
                            <div class="input-suggestions" id="inputSuggestions"></div>
                        </div>
                        <div class="quick-add-actions">
                            <button class="btn-primary" id="quickAddBtn">
                                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                AI Enhance
                            </button>
                            <button class="btn-secondary" id="simpleAddBtn">
                                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"/>
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                Add Task
                            </button>
                        </div>
                    </div>
                </div>

                <div class="dashboard-section today-tasks-container">
                    <div class="section-header">
                        <h3>📅 Today's Focus</h3>
                        <div class="section-actions">
                            <button class="btn-icon refresh-tasks" title="Refresh">🔄</button>
                            <button class="btn-icon view-all-tasks" title="View All">📋</button>
                        </div>
                    </div>
                    <div class="today-tasks-list" id="todayTasksList">
                        <!-- Today's tasks will be populated here -->
                    </div>
                </div>

                <div class="dashboard-section suggestions-container">
                    <div class="section-header">
                        <h3>🧠 AI Insights</h3>
                        <div class="section-subtitle">Smart suggestions for better productivity</div>
                    </div>
                    <div class="ai-suggestions-list" id="aiSuggestions">
                        <!-- AI suggestions will be populated here -->
                    </div>
                </div>
            </div>
        `;

        statsContainer.innerHTML = statsHTML;
    }

    /**
     * Initialize animated icons particles and effects
     */
    initializeAnimatedIcons() {
        setTimeout(() => {
            this.createParticles();
        }, 500);
    }

    /**
     * Create orbiting particles around animated icons
     */
    createParticles() {
        const particleContainers = utils.querySelectorAll('.animated-particles');
        const colors = {
            blue: '#4db6ac',
            red: '#ef4444', 
            green: '#10b981',
            purple: '#8b5cf6'
        };
        
        particleContainers.forEach((container, index) => {
            const color = container.dataset.color;
            const particleColor = colors[color];
            
            for (let i = 0; i < 3; i++) {
                const particle = document.createElement('div');
                particle.className = 'animated-particle';
                particle.style.setProperty('--particle-color', particleColor);
                particle.style.setProperty('--orbit-duration', `${8 + index}s`);
                particle.style.animationDelay = `${i * 2 + index * 0.5}s`;
                container.appendChild(particle);
            }
        });
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
        const statsCards = utils.querySelectorAll('.animated-stat-card[data-filter]');
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
            const statElement = utils.querySelector(`[data-metric="${key}"]`);
            if (statElement) {
                const currentValue = key === 'completion-rate' 
                    ? parseInt(statElement.textContent.replace('%', '')) || 0
                    : parseInt(statElement.textContent) || 0;
                
                if (key === 'completion-rate') {
                    this.animateNumber(statElement, currentValue, this.stats.completionRate, 800, '%');
                } else {
                    this.animateNumber(statElement, currentValue, value);
                }
            }
        });

        // Update urgency indicators
        this.updateUrgencyIndicators();
    }

    /**
     * Animate number changes with enhanced visual effects
     */
    animateNumber(element, fromValue, toValue, duration = 800, suffix = '') {
        if (fromValue === toValue) return;

        // Add visual update animation
        element.style.animation = 'animatedValueUpdate 0.6s ease';
        setTimeout(() => {
            element.style.animation = '';
        }, 600);

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
     * Update urgency indicators for animated cards
     */
    updateUrgencyIndicators() {
        // Overdue card urgency
        const overdueCard = utils.querySelector('.animated-stat-card[data-stat="overdue"]');
        if (overdueCard) {
            if (this.stats.overdue > 0) {
                overdueCard.classList.add('urgent');
                // Add pulsing effect to overdue icon
                const overdueIcon = overdueCard.querySelector('.animated-warning');
                if (overdueIcon) {
                    overdueIcon.style.animationDuration = '1.5s';
                }
            } else {
                overdueCard.classList.remove('urgent');
                const overdueIcon = overdueCard.querySelector('.animated-warning');
                if (overdueIcon) {
                    overdueIcon.style.animationDuration = '3s';
                }
            }
        }

        // Due today urgency
        const dueTodayCard = utils.querySelector('.animated-stat-card[data-stat="due-today"]');
        if (dueTodayCard) {
            if (this.stats.dueToday > 3) {
                dueTodayCard.classList.add('warning');
                // Speed up clock animation when many tasks due
                const clockHands = dueTodayCard.querySelectorAll('.animated-clock-hand');
                clockHands.forEach(hand => {
                    if (hand.classList.contains('animated-hour-hand')) {
                        hand.style.animationDuration = '12s';
                    } else {
                        hand.style.animationDuration = '2s';
                    }
                });
            } else {
                dueTodayCard.classList.remove('warning');
                const clockHands = dueTodayCard.querySelectorAll('.animated-clock-hand');
                clockHands.forEach(hand => {
                    if (hand.classList.contains('animated-hour-hand')) {
                        hand.style.animationDuration = '24s';
                    } else {
                        hand.style.animationDuration = '4s';
                    }
                });
            }
        }
    }

    /**
     * Update enhanced today's tasks section
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
        }).slice(0, 6); // Show max 6 tasks

        if (todaysTasks.length === 0) {
            todaysTasksContainer.innerHTML = `
                <div class="empty-state animated">
                    <div class="empty-animation">
                        <div class="checkmark-animation">
                            <svg viewBox="0 0 52 52">
                                <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                                <path class="checkmark-check" fill="none" d="m14.1 27.2l7.1 7.2 16.7-16.8"/>
                            </svg>
                        </div>
                    </div>
                    <h4>All clear for today! 🎉</h4>
                    <p>No pending tasks. Perfect time to plan ahead or relax.</p>
                    <button class="btn-primary" onclick="document.getElementById('quickTaskInput').focus()">
                        Add Tomorrow's Task
                    </button>
                </div>
            `;
            return;
        }

        // Sort tasks by priority and time
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        todaysTasks.sort((a, b) => {
            const priorityDiff = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
            if (priorityDiff !== 0) return priorityDiff;
            
            // If same priority, sort by time
            if (a.time && b.time) {
                return a.time.localeCompare(b.time);
            }
            return a.time ? -1 : 1;
        });

        todaysTasksContainer.innerHTML = `
            <div class="task-progress-bar">
                <div class="progress-info">
                    <span>${todaysTasks.length} tasks remaining</span>
                    <span class="progress-percentage">Ready to start!</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: ${Math.max(0, (5 - todaysTasks.length) / 5 * 100)}%"></div>
                </div>
            </div>
            <div class="tasks-timeline">
                ${todaysTasks.map((task, index) => `
                    <div class="timeline-task priority-${task.priority || 'medium'} ${task.time ? 'has-time' : 'no-time'}" 
                         data-task-id="${task.id}" style="animation-delay: ${index * 0.1}s">
                        <div class="task-time-marker">
                            ${task.time ? `<span class="time-display">${utils.formatTime(task.time)}</span>` : 
                                         `<span class="no-time-display">Anytime</span>`}
                            <div class="priority-indicator priority-${task.priority || 'medium'}" title="${task.priority || 'medium'} priority"></div>
                        </div>
                        <div class="task-main-content">
                            <div class="task-header">
                                <h5 class="task-title">${task.title}</h5>
                                <div class="task-actions">
                                    <button class="task-action-btn complete-btn" data-action="complete" title="Mark as complete">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="20,6 9,17 4,12"/>
                                        </svg>
                                    </button>
                                    <button class="task-action-btn edit-btn" data-action="edit" title="Edit task">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="m18 2 4 4-14 14H4v-4L18 2z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            ${task.description ? `<p class="task-description">${utils.truncate(task.description, 80)}</p>` : ''}
                            <div class="task-meta">
                                ${task.category ? `<span class="task-category">${task.category}</span>` : ''}
                                <span class="task-created">Created ${utils.getRelativeTime(task.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

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
        const statsCards = utils.querySelectorAll('.animated-stat-card');
        statsCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            setTimeout(() => {
                card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 150);
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