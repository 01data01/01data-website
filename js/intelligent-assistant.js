/**
 * Intelligent Assistant - Main Application Controller
 * Manages the core application state, navigation, and integrates AI modules
 */

class IntelligentAssistant {
    constructor() {
        this.user = null;
        this.tasks = [];
        this.projects = [];
        this.currentView = 'dashboard';
        this.storageKey = 'intelligent_assistant_data';
        
        // AI Components
        this.aiHandler = null;
        this.taskParser = null;
        this.chatManager = null;
        
        // Task Management
        this.taskManager = null;
        this.projectManager = null;
        
        // UI State
        this.isInitialized = false;
        this.domCache = {};
        this.eventListeners = [];
        
        console.log('Intelligent Assistant initialized');
    }

    // Static initialization method called from HTML
    static init(userData) {
        window.assistant = new IntelligentAssistant();
        window.assistant.setUser(userData);
        window.assistant.initializeComponents();
        window.assistant.initializeApp();
    }

    // Initialize AI and task management components
    initializeComponents() {
        try {
            // Initialize AI components
            this.aiHandler = new AIAssistantHandler();
            this.taskParser = new AITaskParser(this.aiHandler);
            this.chatManager = new AIChatManager(this.aiHandler);
            
            // Initialize task management
            if (window.TaskManager) {
                this.taskManager = new TaskManager(this);
            }
            
            if (window.ProjectManager) {
                this.projectManager = new ProjectManager(this);
            }
            
            // Initialize AI for user if available
            if (this.user?.email) {
                this.aiHandler.initialize(this.user.email);
            }
            
            console.log('All components initialized successfully');
        } catch (error) {
            console.error('Error initializing components:', error);
        }
    }

    // Set user data and load user-specific information
    setUser(userData) {
        this.user = userData;
        this.updateUserDisplay();
        this.loadUserData();
        
        // Initialize AI for this user
        if (this.aiHandler && userData.email) {
            this.aiHandler.initialize(userData.email);
        }
    }

    // Initialize the main application
    initializeApp() {
        this.setupEventListeners();
        this.loadData();
        
        // Show the app after a brief delay
        setTimeout(() => {
            this.hideLoadingScreen();
            this.showApp();
            this.updateDashboard();
            this.isInitialized = true;
        }, 1000);
    }

    // Setup all event listeners
    setupEventListeners() {
        // Navigation
        this.addEventListeners('.nav-btn', 'click', (e) => {
            const view = e.target.closest('.nav-btn').dataset.view;
            this.switchView(view);
        });

        // Quick add task
        const quickAddBtn = this.getElement('quickAddBtn');
        const quickTaskInput = this.getElement('quickTaskInput');
        
        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', () => this.handleQuickAdd());
        }

        if (quickTaskInput) {
            quickTaskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleQuickAdd();
            });
        }

        // Modal management
        this.addEventListeners('.modal-close', 'click', (e) => {
            const modal = e.target.closest('.modal');
            this.closeModal(modal.id);
        });

        // Task form
        const addTaskForm = this.getElement('addTaskForm');
        if (addTaskForm) {
            addTaskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTaskFormSubmit();
            });
        }

        // Settings
        const settingsBtn = this.getElement('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettings());
        }

        // Filter buttons
        this.addEventListeners('.filter-btn', 'click', (e) => {
            const filter = e.target.dataset.filter;
            this.applyTaskFilter(filter);
            this.updateActiveFilter(e.target);
        });

        // Calendar navigation
        this.setupCalendarEventListeners();
    }

    // Setup calendar-specific event listeners
    setupCalendarEventListeners() {
        const prevBtn = this.getElement('prevPeriod');
        const nextBtn = this.getElement('nextPeriod');
        const todayBtn = this.getElement('todayBtn');

        if (prevBtn) prevBtn.addEventListener('click', () => this.navigateCalendar(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.navigateCalendar(1));
        if (todayBtn) todayBtn.addEventListener('click', () => this.goToToday());
    }

    // Helper method to add event listeners to multiple elements
    addEventListeners(selector, event, handler) {
        document.querySelectorAll(selector).forEach(element => {
            element.addEventListener(event, handler);
            this.eventListeners.push({ element, event, handler });
        });
    }

    // Navigation and View Management
    switchView(viewName) {
        if (!viewName || this.currentView === viewName) return;

        // Update navigation UI
        this.updateNavigation(viewName);
        
        // Update content
        this.updateViewContent(viewName);
        
        this.currentView = viewName;
        
        // Load view-specific data
        this.loadViewData(viewName);
    }

    updateNavigation(viewName) {
        // Remove active state from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active state to selected nav button
        const activeBtn = document.querySelector(`[data-view="${viewName}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }

    updateViewContent(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show selected view
        const selectedView = document.getElementById(`${viewName}-view`);
        if (selectedView) selectedView.classList.add('active');
    }

    loadViewData(viewName) {
        switch (viewName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'tasks':
                this.updateTasksList();
                break;
            case 'calendar':
                this.updateCalendar();
                break;
            case 'projects':
                this.updateProjectsList();
                break;
            case 'ai-chat':
                if (this.chatManager) this.chatManager.focus();
                break;
        }
    }

    // Task Management
    async handleQuickAdd() {
        const input = this.getElement('quickTaskInput');
        const text = input.value.trim();
        
        if (!text) return;

        const btn = this.getElement('quickAddBtn');
        this.setButtonLoading(btn, true);

        try {
            let task;
            
            // Try AI parsing first
            if (this.taskParser) {
                task = await this.taskParser.parseTask(text);
            } else {
                // Fallback to basic task creation
                task = this.createBasicTask(text);
            }
            
            this.addTask(task);
            input.value = '';
            this.showNotification('Task added successfully!', 'success');
            
        } catch (error) {
            console.error('Error adding task:', error);
            // Fallback to basic task
            const basicTask = this.createBasicTask(text);
            this.addTask(basicTask);
            this.showNotification('Task added (basic mode)', 'info');
        } finally {
            this.setButtonLoading(btn, false);
        }
    }

    handleTaskFormSubmit() {
        const formData = this.getFormData('addTaskForm');
        const editingId = document.getElementById('addTaskForm').dataset.editingTaskId;
        
        if (editingId) {
            this.updateTask(editingId, formData);
        } else {
            const task = this.createTaskFromForm(formData);
            this.addTask(task);
        }
        
        this.closeModal('addTaskModal');
        this.resetTaskForm();
    }

    addTask(task) {
        this.tasks.push(task);
        this.saveData();
        this.refreshAllViews();
    }

    updateTask(taskId, updates) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates };
            this.saveData();
            this.refreshAllViews();
        }
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            if (task.status === 'completed') {
                task.status = 'pending';
                task.completedAt = null;
            } else {
                task.status = 'completed';
                task.completedAt = new Date().toISOString();
            }
            this.saveData();
            this.refreshAllViews();
        }
    }

    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            this.tasks.splice(taskIndex, 1);
            this.saveData();
            this.refreshAllViews();
        }
    }

    // Dashboard Management
    updateDashboard() {
        this.updateStats();
        this.updateTodayTasks();
        this.updateAISuggestions();
    }

    updateStats() {
        const today = new Date().toISOString().split('T')[0];
        const stats = this.calculateStats(today);
        
        // Update traditional elements (fallback)
        this.updateElement('dueTodayCount', stats.dueToday);
        this.updateElement('overdueCount', stats.overdue);
        this.updateElement('completedCount', stats.completed);
        this.updateElement('completionRate', `${stats.completionRate}%`);
        
        // Update animated dashboard if available
        if (window.animatedDashboard && window.animatedDashboard.isInitialized) {
            window.animatedDashboard.updateValues([
                stats.dueToday,
                stats.overdue,
                stats.completed,
                `${stats.completionRate}%`
            ]);
        }
    }

    calculateStats(today) {
        let dueToday = 0, overdue = 0, completed = 0;
        
        this.tasks.forEach(task => {
            if (task.status === 'completed') {
                completed++;
            } else if (task.status === 'pending') {
                if (task.dueDate === today) {
                    dueToday++;
                } else if (task.dueDate && task.dueDate < today) {
                    overdue++;
                }
            }
        });
        
        const total = this.tasks.length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return { dueToday, overdue, completed, completionRate };
    }

    updateTodayTasks() {
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = this.tasks
            .filter(task => task.dueDate === today)
            .sort((a, b) => {
                if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime);
                return a.dueTime ? -1 : 1;
            });

        this.renderTaskList('todayTasksList', todayTasks, 'No tasks scheduled for today');
    }

    async updateAISuggestions() {
        const container = this.getElement('aiSuggestions');
        if (!container) return;

        try {
            let suggestions = [];
            
            // Try AI suggestions first
            if (this.aiHandler) {
                suggestions = await this.aiHandler.generateSuggestions(this.tasks);
            }
            
            // Fallback to local suggestions
            if (!suggestions.length && window.aiUtils) {
                suggestions = window.aiUtils.generateTaskSuggestions(this.tasks);
            }
            
            this.renderSuggestions(container, suggestions);
        } catch (error) {
            console.error('Error generating suggestions:', error);
            container.innerHTML = '<div class="empty-state">Suggestions temporarily unavailable</div>';
        }
    }

    // Task List Management
    updateTasksList() {
        if (this.taskManager) {
            this.taskManager.renderTasksList();
        } else {
            // Fallback rendering
            this.renderTaskList('allTasksList', this.tasks, 'No tasks yet. Add your first task!');
        }
    }

    applyTaskFilter(filter) {
        if (this.taskManager) {
            this.taskManager.setFilter(filter);
        }
    }

    updateActiveFilter(activeButton) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');
    }

    // Calendar Management
    updateCalendar() {
        // Calendar functionality is handled by calendar.js
        if (window.calendarManager) {
            window.calendarManager.render();
        }
    }

    navigateCalendar(direction) {
        if (window.calendarManager) {
            window.calendarManager.navigate(direction);
        }
    }

    goToToday() {
        if (window.calendarManager) {
            window.calendarManager.goToToday();
        }
    }

    // Project Management
    updateProjectsList() {
        if (this.projectManager) {
            this.projectManager.updateProjectsList();
        }
    }

    // Settings Management
    openSettings() {
        // Load current settings
        const apiKeyInput = this.getElement('claudeApiKey');
        if (apiKeyInput) {
            const savedApiKey = localStorage.getItem('claude_api_key');
            if (savedApiKey) apiKeyInput.value = savedApiKey;
        }
        
        this.showModal('settingsModal');
    }

    // UI Utility Methods
    showModal(modalId) {
        const modal = this.getElement(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = this.getElement(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    hideLoadingScreen() {
        const loadingScreen = this.getElement('loadingScreen');
        if (loadingScreen) loadingScreen.style.display = 'none';
    }

    showApp() {
        const app = this.getElement('app');
        if (app) app.style.display = 'block';
    }

    updateUserDisplay() {
        if (!this.user) return;
        
        this.updateElement('userName', this.user.name || 'User');
        
        const userAvatar = this.getElement('userAvatar');
        if (userAvatar && this.user.image) {
            userAvatar.src = this.user.image;
            userAvatar.style.display = 'block';
        }
    }

    setButtonLoading(button, isLoading) {
        if (!button) return;
        
        if (isLoading) {
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<span class="btn-icon">⏳</span>Processing...';
            button.disabled = true;
        } else {
            button.innerHTML = button.dataset.originalText || button.innerHTML;
            button.disabled = false;
        }
    }

    showNotification(message, type = 'info') {
        const container = this.getElement('notifications');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'notificationSlideOut 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Data Management
    saveData() {
        const data = {
            tasks: this.tasks,
            projects: this.projects,
            lastUpdated: new Date().toISOString()
        };
        
        const userKey = this.user ? `${this.storageKey}_${this.user.email}` : this.storageKey;
        localStorage.setItem(userKey, JSON.stringify(data));
    }

    loadData() {
        if (!this.user) return;
        
        const userKey = `${this.storageKey}_${this.user.email}`;
        const stored = localStorage.getItem(userKey);
        
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.tasks = data.tasks || [];
                this.projects = data.projects || [];
            } catch (error) {
                console.error('Error loading data:', error);
                this.tasks = [];
                this.projects = [];
            }
        }
    }

    loadUserData() {
        this.loadData();
    }

    // Helper Methods
    getElement(id) {
        if (!this.domCache[id]) {
            this.domCache[id] = document.getElementById(id);
        }
        return this.domCache[id];
    }

    updateElement(id, content) {
        const element = this.getElement(id);
        if (element) element.textContent = content;
    }

    getFormData(formId) {
        const form = this.getElement(formId);
        if (!form) return {};
        
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    createTaskFromForm(formData) {
        return {
            id: this.generateId(),
            title: formData.taskTitle || 'Untitled Task',
            description: formData.taskDescription || '',
            dueDate: formData.taskDate || null,
            dueTime: formData.taskTime || null,
            priority: formData.taskPriority || 'medium',
            status: 'pending',
            project: formData.taskProject || null,
            category: null,
            tags: [],
            createdAt: new Date().toISOString(),
            completedAt: null
        };
    }

    createBasicTask(title) {
        return {
            id: this.generateId(),
            title: title,
            description: '',
            dueDate: null,
            dueTime: null,
            priority: 'medium',
            status: 'pending',
            project: null,
            category: null,
            tags: [],
            createdAt: new Date().toISOString(),
            completedAt: null
        };
    }

    resetTaskForm() {
        const form = this.getElement('addTaskForm');
        if (form) {
            form.reset();
            delete form.dataset.editingTaskId;
            
            // Reset modal title and button
            const modal = this.getElement('addTaskModal');
            if (modal) {
                const title = modal.querySelector('.modal-header h3');
                const button = modal.querySelector('button[type="submit"]');
                if (title) title.textContent = 'Add New Task';
                if (button) button.textContent = 'Add Task';
            }
        }
    }

    renderTaskList(containerId, tasks, emptyMessage) {
        const container = this.getElement(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        if (tasks.length === 0) {
            container.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
            return;
        }
        
        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            container.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.priority}-priority ${task.status === 'completed' ? 'completed' : ''}`;
        
        const timeDisplay = task.dueTime ? 
            `<span class="task-time">${this.formatTime(task.dueTime)}</span>` : '';
        
        taskElement.innerHTML = `
            <div class="task-header">
                <div class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" 
                     onclick="assistant.toggleTask('${task.id}')">
                    ${task.status === 'completed' ? '✓' : ''}
                </div>
                <div class="task-title">${task.title}</div>
                ${timeDisplay}
            </div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
        `;
        
        return taskElement;
    }

    renderSuggestions(container, suggestions) {
        container.innerHTML = '';
        
        if (suggestions.length === 0) {
            container.innerHTML = '<div class="empty-state">No suggestions at the moment</div>';
            return;
        }
        
        suggestions.forEach(suggestion => {
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'suggestion-item';
            suggestionElement.innerHTML = `
                <div class="suggestion-icon">${suggestion.icon || '💡'}</div>
                <div class="suggestion-content">
                    <div class="suggestion-title">${suggestion.title}</div>
                    <div class="suggestion-description">${suggestion.description}</div>
                </div>
            `;
            container.appendChild(suggestionElement);
        });
    }

    refreshAllViews() {
        this.updateDashboard();
        this.updateTasksList();
        this.updateCalendar();
        this.updateProjectsList();
    }

    formatTime(timeString) {
        if (!timeString) return '';
        
        const [hour, minute] = timeString.split(':');
        const hourNum = parseInt(hour);
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
        
        return `${displayHour}:${minute} ${ampm}`;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // Cleanup method
    cleanup() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];
        this.domCache = {};
    }
}

// Global functions for HTML onclick handlers
function openModal(modalId) {
    if (window.assistant) window.assistant.showModal(modalId);
}

function closeModal(modalId) {
    if (window.assistant) window.assistant.closeModal(modalId);
}

function saveSettings() {
    const apiKey = document.getElementById('claudeApiKey').value;
    
    if (apiKey) {
        localStorage.setItem('claude_api_key', apiKey);
        
        if (window.assistant?.aiHandler) {
            window.assistant.aiHandler.apiKey = apiKey;
        }
        
        window.assistant.showNotification('Settings saved successfully!', 'success');
        window.assistant.closeModal('settingsModal');
    } else {
        window.assistant.showNotification('Please enter a valid API key', 'warning');
    }
}

async function testClaudeConnection() {
    if (!window.assistant?.aiHandler) {
        alert('AI handler not initialized');
        return;
    }
    
    const apiKey = document.getElementById('claudeApiKey').value.trim();
    if (!apiKey) {
        window.assistant.showNotification('Please enter an API key first', 'warning');
        return;
    }
    
    window.assistant.aiHandler.apiKey = apiKey;
    const result = await window.assistant.aiHandler.testConnection();
    
    if (result.success) {
        window.assistant.showNotification('AI connection successful!', 'success');
    } else {
        window.assistant.showNotification(`AI connection failed: ${result.error}`, 'error');
    }
}

// Export for use in other modules
window.IntelligentAssistant = IntelligentAssistant;