/**
 * AI Utils
 * Utility functions and helpers for AI assistant functionality
 */

class AIUtils {
    constructor() {
        this.dateFormats = {
            short: { month: 'short', day: 'numeric' },
            long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
            time: { hour: '2-digit', minute: '2-digit' },
            datetime: { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        };
        
        this.timePatterns = {
            fullTime: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            timeWithAmPm: /^(1[0-2]|0?[1-9]):([0-5][0-9])\s*(AM|PM|am|pm)$/,
            hourOnly: /^(1[0-2]|0?[1-9])\s*(AM|PM|am|pm)$/
        };
        
        this.priorityLevels = {
            high: { value: 3, color: '#ff4757', label: 'High Priority' },
            medium: { value: 2, color: '#ffa502', label: 'Medium Priority' },
            low: { value: 1, color: '#2ed573', label: 'Low Priority' }
        };
        
        this.categories = {
            work: { icon: '💼', color: '#3742fa' },
            personal: { icon: '👤', color: '#2ed573' },
            health: { icon: '🏥', color: '#ff4757' },
            shopping: { icon: '🛒', color: '#ffa502' },
            home: { icon: '🏠', color: '#5f27cd' },
            education: { icon: '📚', color: '#00d2d3' },
            finance: { icon: '💰', color: '#ff9ff3' }
        };
    }

    // Date and Time Utilities
    
    // Format date for display
    formatDate(dateString, format = 'short') {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Check for relative dates
        const dateStr = date.toDateString();
        const todayStr = today.toDateString();
        const tomorrowStr = tomorrow.toDateString();
        const yesterdayStr = yesterday.toDateString();
        
        if (dateStr === todayStr) return 'Today';
        if (dateStr === tomorrowStr) return 'Tomorrow';
        if (dateStr === yesterdayStr) return 'Yesterday';
        
        // Use specified format
        return date.toLocaleDateString('en-US', this.dateFormats[format] || this.dateFormats.short);
    }

    // Format time for display
    formatTime(timeString) {
        if (!timeString) return '';
        
        if (this.timePatterns.fullTime.test(timeString)) {
            const [hour, minute] = timeString.split(':').map(Number);
            const date = new Date();
            date.setHours(hour, minute);
            return date.toLocaleTimeString('en-US', this.dateFormats.time);
        }
        
        return timeString; // Return as-is if not in expected format
    }

    // Get relative date string
    getRelativeDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';
        if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
        if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
        
        return this.formatDate(dateString);
    }

    // Check if date is overdue
    isOverdue(dateString) {
        if (!dateString) return false;
        
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        
        return date < today;
    }

    // Check if date is today
    isToday(dateString) {
        if (!dateString) return false;
        
        const date = new Date(dateString);
        const today = new Date();
        
        return date.toDateString() === today.toDateString();
    }

    // Check if date is this week
    isThisWeek(dateString) {
        if (!dateString) return false;
        
        const date = new Date(dateString);
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        return date >= weekStart && date <= weekEnd;
    }

    // Task Utilities
    
    // Get priority info
    getPriorityInfo(priority) {
        return this.priorityLevels[priority] || this.priorityLevels.medium;
    }

    // Get category info
    getCategoryInfo(category) {
        return this.categories[category] || { icon: '📋', color: '#747d8c' };
    }

    // Calculate task urgency score
    calculateUrgency(task) {
        let score = 0;
        
        // Priority weight
        const priorityWeight = this.getPriorityInfo(task.priority).value;
        score += priorityWeight * 10;
        
        // Due date weight
        if (task.dueDate) {
            const date = new Date(task.dueDate);
            const now = new Date();
            const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) score += 50; // Overdue
            else if (diffDays === 0) score += 30; // Due today
            else if (diffDays === 1) score += 20; // Due tomorrow
            else if (diffDays <= 3) score += 10; // Due this week
        }
        
        // Time weight (tasks with specific times are more urgent)
        if (task.dueTime) score += 5;
        
        return score;
    }

    // Sort tasks by urgency
    sortTasksByUrgency(tasks) {
        return [...tasks].sort((a, b) => {
            const urgencyA = this.calculateUrgency(a);
            const urgencyB = this.calculateUrgency(b);
            return urgencyB - urgencyA; // Higher urgency first
        });
    }

    // Filter tasks by criteria
    filterTasks(tasks, criteria) {
        return tasks.filter(task => {
            // Status filter
            if (criteria.status && task.status !== criteria.status) return false;
            
            // Priority filter
            if (criteria.priority && task.priority !== criteria.priority) return false;
            
            // Category filter
            if (criteria.category && task.category !== criteria.category) return false;
            
            // Date filters
            if (criteria.dateFilter) {
                switch (criteria.dateFilter) {
                    case 'today':
                        if (!this.isToday(task.dueDate)) return false;
                        break;
                    case 'tomorrow':
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        if (task.dueDate !== tomorrow.toISOString().split('T')[0]) return false;
                        break;
                    case 'thisWeek':
                        if (!this.isThisWeek(task.dueDate)) return false;
                        break;
                    case 'overdue':
                        if (!this.isOverdue(task.dueDate) || task.status === 'completed') return false;
                        break;
                    case 'noDate':
                        if (task.dueDate) return false;
                        break;
                }
            }
            
            // Search filter
            if (criteria.search) {
                const searchTerm = criteria.search.toLowerCase();
                const searchableText = `${task.title} ${task.description}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) return false;
            }
            
            return true;
        });
    }

    // Text Processing Utilities
    
    // Extract keywords from text
    extractKeywords(text, excludeCommon = true) {
        const commonWords = [
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
            'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
        ];
        
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .split(/\s+/)
            .filter(word => word.length > 2); // Remove very short words
        
        if (excludeCommon) {
            return words.filter(word => !commonWords.includes(word));
        }
        
        return words;
    }

    // Calculate text similarity (simple implementation)
    calculateSimilarity(text1, text2) {
        const words1 = new Set(this.extractKeywords(text1));
        const words2 = new Set(this.extractKeywords(text2));
        
        const intersection = new Set([...words1].filter(word => words2.has(word)));
        const union = new Set([...words1, ...words2]);
        
        return union.size > 0 ? intersection.size / union.size : 0;
    }

    // Generate suggestions based on task patterns
    generateTaskSuggestions(tasks) {
        const suggestions = [];
        
        // Analyze overdue tasks
        const overdueTasks = tasks.filter(task => 
            this.isOverdue(task.dueDate) && task.status === 'pending'
        );
        
        if (overdueTasks.length > 0) {
            suggestions.push({
                type: 'urgent',
                title: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
                description: 'These tasks need immediate attention',
                action: 'filter_overdue',
                priority: 'high'
            });
        }
        
        // Analyze unscheduled tasks
        const unscheduledTasks = tasks.filter(task => 
            !task.dueDate && task.status === 'pending'
        );
        
        if (unscheduledTasks.length > 3) {
            suggestions.push({
                type: 'organization',
                title: 'Schedule unscheduled tasks',
                description: `${unscheduledTasks.length} tasks could use due dates`,
                action: 'schedule_tasks',
                priority: 'medium'
            });
        }
        
        // Analyze productivity patterns
        const completedToday = tasks.filter(task => 
            task.status === 'completed' && 
            task.completedAt && 
            this.isToday(task.completedAt.split('T')[0])
        );
        
        if (completedToday.length > 0) {
            suggestions.push({
                type: 'encouragement',
                title: 'Great progress today!',
                description: `You've completed ${completedToday.length} task${completedToday.length > 1 ? 's' : ''}`,
                action: 'view_completed',
                priority: 'low'
            });
        }
        
        return suggestions.slice(0, 3); // Limit to 3 suggestions
    }

    // Validation Utilities
    
    // Validate task data
    validateTask(task) {
        const errors = [];
        
        if (!task.title || task.title.trim().length === 0) {
            errors.push('Task title is required');
        }
        
        if (task.title && task.title.length > 200) {
            errors.push('Task title is too long (max 200 characters)');
        }
        
        if (task.description && task.description.length > 1000) {
            errors.push('Task description is too long (max 1000 characters)');
        }
        
        if (task.dueDate && !this.isValidDate(task.dueDate)) {
            errors.push('Invalid due date format');
        }
        
        if (task.dueTime && !this.isValidTime(task.dueTime)) {
            errors.push('Invalid due time format');
        }
        
        if (task.priority && !['high', 'medium', 'low'].includes(task.priority)) {
            errors.push('Invalid priority level');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Validate date string
    isValidDate(dateString) {
        if (!dateString) return false;
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }

    // Validate time string
    isValidTime(timeString) {
        if (!timeString) return false;
        return this.timePatterns.fullTime.test(timeString);
    }

    // Storage Utilities
    
    // Safe JSON parse with fallback
    safeJSONParse(jsonString, fallback = null) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.warn('Failed to parse JSON:', error);
            return fallback;
        }
    }

    // Safe JSON stringify
    safeJSONStringify(obj, fallback = '{}') {
        try {
            return JSON.stringify(obj);
        } catch (error) {
            console.warn('Failed to stringify JSON:', error);
            return fallback;
        }
    }

    // Performance Utilities
    
    // Debounce function calls
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    }

    // Throttle function calls
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Batch process items
    batchProcess(items, processor, batchSize = 10) {
        const results = [];
        
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchResults = batch.map(processor);
            results.push(...batchResults);
        }
        
        return results;
    }

    // General Utilities
    
    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // Generate UUID
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Deep clone object
    deepClone(obj) {
        if (obj === null || typeof obj !== "object") return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        
        const clonedObj = {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = this.deepClone(obj[key]);
            }
        }
        return clonedObj;
    }

    // Check if object is empty
    isEmpty(obj) {
        if (obj === null || obj === undefined) return true;
        if (typeof obj === 'string' || Array.isArray(obj)) return obj.length === 0;
        if (typeof obj === 'object') return Object.keys(obj).length === 0;
        return false;
    }

    // Capitalize first letter
    capitalize(str) {
        if (!str || typeof str !== 'string') return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Truncate text
    truncate(text, maxLength = 100, suffix = '...') {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength - suffix.length) + suffix;
    }
}

// Create global instance
window.aiUtils = new AIUtils();

// Export for use in other modules
window.AIUtils = AIUtils;