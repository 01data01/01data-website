/**
 * Intelligent Assistant - Core JavaScript Application
 * Client-side task management system with AI integration
 */

class IntelligentAssistant {
    constructor() {
        this.user = null;
        this.tasks = [];
        this.projects = [];
        this.conversations = [];
        this.currentView = 'dashboard';
        this.currentDate = new Date();
        this.storageKey = 'intelligent_assistant_data';
        
        this.initializeEventListeners();
        this.loadData();
    }

    static init(userData) {
        window.assistant = new IntelligentAssistant();
        window.assistant.setUser(userData);
        window.assistant.initializeApp();
    }

    setUser(userData) {
        this.user = userData;
        this.updateUserDisplay();
        this.loadUserData();
    }

    initializeApp() {
        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('app').style.display = 'flex';
            this.updateDashboard();
            this.initializeCalendar();
        }, 2000);
    }

    initializeEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.closest('.nav-btn').dataset.view;
                this.switchView(view);
            });
        });

        // Quick add task
        document.getElementById('quickAddBtn').addEventListener('click', () => {
            this.handleQuickAdd();
        });

        document.getElementById('quickTaskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleQuickAdd();
            }
        });

        // Add task button
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.showModal('addTaskModal');
        });

        // Add task form
        document.getElementById('addTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => {
            // Load current API key into the form
            const savedApiKey = localStorage.getItem('claude_api_key');
            if (savedApiKey) {
                document.getElementById('claudeApiKey').value = savedApiKey;
            }
            this.showModal('settingsModal');
        });

        // Chat
        document.getElementById('sendChatBtn').addEventListener('click', () => {
            this.sendChatMessage();
        });

        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal.id);
            });
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterTasks(filter);
                
                // Update active filter
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Calendar controls
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.updateCalendar();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.updateCalendar();
        });

        document.getElementById('todayBtn').addEventListener('click', () => {
            this.currentDate = new Date();
            this.updateCalendar();
        });
    }

    switchView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}-view`).classList.add('active');

        this.currentView = viewName;

        // Load view-specific data
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
                this.focusChat();
                break;
        }
    }

    async handleQuickAdd() {
        const input = document.getElementById('quickTaskInput');
        const text = input.value.trim();
        
        if (!text) return;

        const btn = document.getElementById('quickAddBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="btn-icon">⏳</span>Processing...';
        btn.disabled = true;

        try {
            // Use AI to parse the task
            const task = await this.parseTaskWithAI(text);
            
            if (task) {
                this.tasks.push(task);
                this.saveData();
                this.updateDashboard();
                this.updateTasksList();
                this.updateCalendar();
                
                input.value = '';
                this.showNotification('Task added successfully!', 'success');
            } else {
                // Fallback: create basic task
                const basicTask = this.createBasicTask(text);
                this.tasks.push(basicTask);
                this.saveData();
                this.updateDashboard();
                
                this.showNotification('Task added (basic mode)', 'info');
            }
        } catch (error) {
            console.error('Error processing task:', error);
            
            // Fallback: create basic task
            const basicTask = this.createBasicTask(text);
            this.tasks.push(basicTask);
            this.saveData();
            this.updateDashboard();
            
            this.showNotification('Task added (offline mode)', 'info');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    async parseTaskWithAI(text) {
        // This would integrate with Claude API
        // For now, we'll use a simple parser
        return this.parseTaskLocally(text);
    }

    parseTaskLocally(text) {
        const task = {
            id: this.generateId(),
            title: text,
            description: '',
            dueDate: null,
            dueTime: null,
            priority: 'medium',
            status: 'pending',
            project: null,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        // Simple date parsing
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const lowerText = text.toLowerCase();

        // Check for time indicators
        const timeMatch = text.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
        if (timeMatch) {
            let hour = parseInt(timeMatch[1]);
            const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
            const ampm = timeMatch[3];

            if (ampm && ampm.toLowerCase() === 'pm' && hour !== 12) {
                hour += 12;
            } else if (ampm && ampm.toLowerCase() === 'am' && hour === 12) {
                hour = 0;
            }

            task.dueTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        }

        // Check for date indicators
        if (lowerText.includes('today')) {
            task.dueDate = today.toISOString().split('T')[0];
        } else if (lowerText.includes('tomorrow')) {
            task.dueDate = tomorrow.toISOString().split('T')[0];
        } else if (lowerText.includes('next week')) {
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);
            task.dueDate = nextWeek.toISOString().split('T')[0];
        }

        // Check for priority indicators
        if (lowerText.includes('urgent') || lowerText.includes('important') || lowerText.includes('asap')) {
            task.priority = 'high';
        } else if (lowerText.includes('low priority') || lowerText.includes('when possible')) {
            task.priority = 'low';
        }

        // Extract clean title (remove time and date references)
        let cleanTitle = text
            .replace(/\b(today|tomorrow|next week)\b/gi, '')
            .replace(/\b\d{1,2}:?\d{2}?\s*(am|pm)?\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (cleanTitle) {
            task.title = cleanTitle;
        }

        return task;
    }

    createBasicTask(text) {
        return {
            id: this.generateId(),
            title: text,
            description: '',
            dueDate: null,
            dueTime: null,
            priority: 'medium',
            status: 'pending',
            project: null,
            createdAt: new Date().toISOString(),
            completedAt: null
        };
    }

    addTask() {
        const form = document.getElementById('addTaskForm');
        const formData = new FormData(form);
        
        const task = {
            id: this.generateId(),
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            dueDate: document.getElementById('taskDate').value || null,
            dueTime: document.getElementById('taskTime').value || null,
            priority: document.getElementById('taskPriority').value,
            status: 'pending',
            project: document.getElementById('taskProject').value || null,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.push(task);
        this.saveData();
        this.updateDashboard();
        this.updateTasksList();
        this.updateCalendar();
        
        this.closeModal('addTaskModal');
        form.reset();
        
        this.showNotification('Task added successfully!', 'success');
    }

    updateDashboard() {
        this.updateStats();
        this.updateTodayTasks();
        this.updateAISuggestions();
    }

    updateStats() {
        const today = new Date().toISOString().split('T')[0];
        
        const dueToday = this.tasks.filter(task => 
            task.dueDate === today && task.status === 'pending'
        ).length;
        
        const overdue = this.tasks.filter(task => 
            task.dueDate && task.dueDate < today && task.status === 'pending'
        ).length;
        
        const completed = this.tasks.filter(task => 
            task.status === 'completed'
        ).length;
        
        const total = this.tasks.length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('dueTodayCount').textContent = dueToday;
        document.getElementById('overdueCount').textContent = overdue;
        document.getElementById('completedCount').textContent = completed;
        document.getElementById('completionRate').textContent = completionRate + '%';
    }

    updateTodayTasks() {
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = this.tasks
            .filter(task => task.dueDate === today)
            .sort((a, b) => {
                if (a.dueTime && b.dueTime) {
                    return a.dueTime.localeCompare(b.dueTime);
                }
                return a.dueTime ? -1 : 1;
            });

        const container = document.getElementById('todayTasksList');
        container.innerHTML = '';

        if (todayTasks.length === 0) {
            container.innerHTML = '<div class="empty-state">No tasks scheduled for today</div>';
            return;
        }

        todayTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            container.appendChild(taskElement);
        });
    }

    updateAISuggestions() {
        const suggestions = this.generateSuggestions();
        const container = document.getElementById('aiSuggestions');
        container.innerHTML = '';

        suggestions.forEach(suggestion => {
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'suggestion-item';
            suggestionElement.innerHTML = `
                <div class="suggestion-icon">${suggestion.icon}</div>
                <div class="suggestion-content">
                    <div class="suggestion-title">${suggestion.title}</div>
                    <div class="suggestion-description">${suggestion.description}</div>
                </div>
            `;
            container.appendChild(suggestionElement);
        });
    }

    generateSuggestions() {
        const suggestions = [];
        const today = new Date().toISOString().split('T')[0];
        
        // Check for overdue tasks
        const overdueTasks = this.tasks.filter(task => 
            task.dueDate && task.dueDate < today && task.status === 'pending'
        );
        
        if (overdueTasks.length > 0) {
            suggestions.push({
                icon: '⚠️',
                title: 'You have overdue tasks',
                description: `${overdueTasks.length} task(s) need immediate attention`
            });
        }

        // Check for tasks without due dates
        const unscheduledTasks = this.tasks.filter(task => !task.dueDate && task.status === 'pending');
        if (unscheduledTasks.length > 0) {
            suggestions.push({
                icon: '📅',
                title: 'Schedule unscheduled tasks',
                description: `${unscheduledTasks.length} task(s) could use due dates`
            });
        }

        // Productivity tips
        const completedToday = this.tasks.filter(task => 
            task.completedAt && task.completedAt.startsWith(today)
        ).length;

        if (completedToday > 0) {
            suggestions.push({
                icon: '🎉',
                title: 'Great progress today!',
                description: `You've completed ${completedToday} task(s) today`
            });
        }

        // Default suggestions if none
        if (suggestions.length === 0) {
            suggestions.push({
                icon: '💡',
                title: 'Try using natural language',
                description: 'Type "Meeting with John tomorrow at 2pm" to quickly add tasks'
            });
        }

        return suggestions.slice(0, 3); // Limit to 3 suggestions
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
            this.updateDashboard();
            this.updateTasksList();
            this.updateCalendar();
        }
    }

    updateTasksList() {
        const container = document.getElementById('allTasksList');
        container.innerHTML = '';

        if (this.tasks.length === 0) {
            container.innerHTML = '<div class="empty-state">No tasks yet. Add your first task!</div>';
            return;
        }

        // Sort tasks by priority and due date
        const sortedTasks = [...this.tasks].sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            
            if (priorityDiff !== 0) return priorityDiff;
            
            if (a.dueDate && b.dueDate) {
                return a.dueDate.localeCompare(b.dueDate);
            }
            
            return a.dueDate ? -1 : 1;
        });

        sortedTasks.forEach(task => {
            const taskElement = this.createDetailedTaskElement(task);
            container.appendChild(taskElement);
        });
    }

    createDetailedTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.priority}-priority ${task.status === 'completed' ? 'completed' : ''}`;
        
        const dueDateDisplay = task.dueDate ? 
            `<span class="task-date">${this.formatDate(task.dueDate)}</span>` : '';
        
        const timeDisplay = task.dueTime ? 
            `<span class="task-time">${this.formatTime(task.dueTime)}</span>` : '';
        
        taskElement.innerHTML = `
            <div class="task-header">
                <div class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" 
                     onclick="assistant.toggleTask('${task.id}')">
                    ${task.status === 'completed' ? '✓' : ''}
                </div>
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                    ${dueDateDisplay}
                    ${timeDisplay}
                    <span class="task-priority-badge priority-${task.priority}">${task.priority}</span>
                </div>
            </div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
        `;
        
        return taskElement;
    }

    filterTasks(filter) {
        const allTasks = document.querySelectorAll('#allTasksList .task-item');
        
        allTasks.forEach(taskElement => {
            const task = this.tasks.find(t => 
                taskElement.querySelector('.task-title').textContent === t.title
            );
            
            if (!task) return;
            
            let show = true;
            
            switch (filter) {
                case 'pending':
                    show = task.status === 'pending';
                    break;
                case 'completed':
                    show = task.status === 'completed';
                    break;
                case 'all':
                default:
                    show = true;
                    break;
            }
            
            taskElement.style.display = show ? 'block' : 'none';
        });
    }

    initializeCalendar() {
        this.updateCalendar();
    }

    updateCalendar() {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        document.getElementById('currentMonth').textContent = 
            `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        
        const calendar = document.getElementById('calendar');
        calendar.innerHTML = '';
        
        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            dayHeader.style.fontWeight = '600';
            dayHeader.style.padding = '8px';
            dayHeader.style.textAlign = 'center';
            dayHeader.style.background = 'rgba(77, 182, 172, 0.1)';
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
            
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            const dateStr = currentDate.toISOString().split('T')[0];
            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = dateStr === today;
            
            if (!isCurrentMonth) {
                dayElement.classList.add('other-month');
            }
            
            if (isToday) {
                dayElement.classList.add('today');
            }
            
            const dayTasks = this.tasks.filter(task => task.dueDate === dateStr);
            
            dayElement.innerHTML = `
                <div class="day-number">${currentDate.getDate()}</div>
                <div class="day-tasks">${dayTasks.length > 0 ? `${dayTasks.length} task(s)` : ''}</div>
            `;
            
            calendar.appendChild(dayElement);
        }
    }

    updateProjectsList() {
        const container = document.getElementById('projectsList');
        container.innerHTML = '';
        
        if (this.projects.length === 0) {
            container.innerHTML = '<div class="empty-state">No projects yet. Create your first project!</div>';
            return;
        }
        
        // Implementation for projects would go here
        container.innerHTML = '<div class="empty-state">Projects feature coming soon!</div>';
    }

    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        this.addChatMessage(message, 'user');
        input.value = '';
        
        // Show typing indicator
        const typingIndicator = this.addTypingIndicator();
        
        try {
            // Process message with AI (placeholder)
            const response = await this.processWithAI(message);
            
            // Remove typing indicator
            typingIndicator.remove();
            
            // Add AI response
            this.addChatMessage(response, 'ai');
        } catch (error) {
            typingIndicator.remove();
            this.addChatMessage('I apologize, but I encountered an error processing your request. Please try again or check your AI settings.', 'ai');
        }
    }

    addChatMessage(content, type) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}-message`;
        
        const avatar = type === 'ai' ? '🤖' : (this.user?.name ? this.user.name[0].toUpperCase() : '👤');
        
        messageElement.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <p>${content}</p>
            </div>
        `;
        
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return messageElement;
    }

    addTypingIndicator() {
        const indicator = this.addChatMessage('Thinking...', 'ai');
        indicator.classList.add('typing-indicator');
        return indicator;
    }

    async processWithAI(message) {
        // This would integrate with Claude API
        // For now, return a simple response based on keywords
        
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('task') || lowerMessage.includes('todo')) {
            return "I can help you manage tasks! Try saying something like 'Add a task to call John tomorrow at 2pm' or 'What tasks do I have this week?'";
        }
        
        if (lowerMessage.includes('schedule') || lowerMessage.includes('calendar')) {
            return "I can help you with scheduling! You can add events by saying 'Schedule a meeting with the team on Friday at 10am' or ask 'What's on my calendar today?'";
        }
        
        if (lowerMessage.includes('project')) {
            return "Project management features are coming soon! For now, you can organize related tasks and set priorities.";
        }
        
        // Default response
        return "I'm here to help you manage your tasks and schedule. You can ask me to add tasks, check your calendar, or organize your projects. What would you like to do?";
    }

    focusChat() {
        document.getElementById('chatInput').focus();
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
        document.body.style.overflow = '';
    }

    updateUserDisplay() {
        if (this.user) {
            document.getElementById('userName').textContent = this.user.name || 'User';
            const avatar = document.getElementById('userAvatar');
            if (this.user.picture) {
                avatar.src = this.user.picture;
                avatar.style.display = 'block';
            } else {
                avatar.style.display = 'none';
            }
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    formatTime(timeString) {
        if (!timeString) return '';
        
        const [hour, minute] = timeString.split(':');
        const hourNum = parseInt(hour);
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
        
        return `${displayHour}:${minute} ${ampm}`;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dateStr = date.toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        if (dateStr === todayStr) return 'Today';
        if (dateStr === tomorrowStr) return 'Tomorrow';
        
        return date.toLocaleDateString();
    }

    saveData() {
        const data = {
            tasks: this.tasks,
            projects: this.projects,
            conversations: this.conversations,
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
                this.conversations = data.conversations || [];
            } catch (error) {
                console.error('Error loading data:', error);
            }
        }
    }

    loadUserData() {
        this.loadData();
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
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
}

// Global functions for HTML onclick handlers
function openModal(modalId) {
    if (window.assistant) {
        window.assistant.showModal(modalId);
    }
}

function closeModal(modalId) {
    if (window.assistant) {
        window.assistant.closeModal(modalId);
    }
}

function saveSettings() {
    const apiKey = document.getElementById('claudeApiKey').value;
    if (apiKey) {
        localStorage.setItem('claude_api_key', apiKey);
        
        // If the assistant has Claude API integration, set it up
        if (window.assistant && window.assistant.setupClaudeAPI) {
            window.assistant.setupClaudeAPI();
        } else if (window.assistant && window.assistant.claudeAPI) {
            window.assistant.claudeAPI.setApiKey(apiKey);
            window.assistant.testAIConnection();
        }
        
        window.assistant.showNotification('Settings saved successfully!', 'success');
        window.assistant.closeModal('settingsModal');
    } else {
        window.assistant.showNotification('Please enter a valid API key', 'warning');
    }
}

function testClaudeConnection() {
    if (!window.assistant) {
        alert('Assistant not initialized');
        return;
    }
    
    const apiKey = document.getElementById('claudeApiKey').value;
    if (!apiKey) {
        window.assistant.showNotification('Please enter an API key first', 'warning');
        return;
    }
    
    // Temporarily set the API key for testing
    if (window.assistant.claudeAPI) {
        window.assistant.claudeAPI.setApiKey(apiKey);
        window.assistant.testAIConnection();
    } else {
        window.assistant.showNotification('Claude API not available', 'error');
        console.error('Claude API integration not found on assistant object');
    }
}

// Export for use in other modules
window.IntelligentAssistant = IntelligentAssistant;