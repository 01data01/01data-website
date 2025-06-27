/**
 * AI Task Parser
 * Advanced natural language processing for task creation and management
 */

class AITaskParser {
    constructor(aiHandler) {
        this.aiHandler = aiHandler;
        this.dateCache = new Map();
        this.patterns = {
            time: /(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)?/g,
            date: /(today|tomorrow|next\s+week|next\s+\w+|this\s+\w+|\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2})/gi,
            priority: /(urgent|important|asap|high\s*priority|low\s*priority|when\s*possible)/gi,
            category: /(work|personal|health|shopping|meeting|call|email|project)/gi,
            duration: /(\d+)\s*(hour|hr|minute|min)s?/gi
        };
        
        // Fallback patterns for offline parsing
        this.fallbackPatterns = {
            timeIndicators: ['at', 'by', 'before', 'after'],
            dateIndicators: ['on', 'due', 'scheduled', 'planned'],
            priorityKeywords: {
                high: ['urgent', 'important', 'asap', 'critical', 'emergency'],
                low: ['low priority', 'when possible', 'someday', 'maybe']
            },
            categories: {
                work: ['meeting', 'call', 'email', 'project', 'presentation', 'deadline'],
                personal: ['buy', 'shop', 'grocery', 'birthday', 'anniversary'],
                health: ['doctor', 'appointment', 'exercise', 'gym', 'medication'],
                home: ['clean', 'repair', 'maintenance', 'organize']
            }
        };
        
        console.log('AI Task Parser initialized');
    }

    // Main parsing method - tries AI first, fallback to local parsing
    async parseTask(userInput, currentDate = new Date()) {
        try {
            // Try AI parsing first
            if (this.aiHandler && this.aiHandler.isInitialized) {
                console.log('Using AI parsing for:', userInput);
                return await this.aiHandler.parseTask(userInput, currentDate);
            } else {
                console.log('AI not available, using local parsing for:', userInput);
                return this.parseLocally(userInput, currentDate);
            }
        } catch (error) {
            console.warn('AI parsing failed, falling back to local parsing:', error);
            return this.parseLocally(userInput, currentDate);
        }
    }

    // Enhanced local parsing with improved pattern recognition
    parseLocally(userInput, currentDate = new Date()) {
        const task = {
            id: this.generateId(),
            title: userInput.trim(),
            description: '',
            dueDate: null,
            dueTime: null,
            priority: 'medium',
            status: 'pending',
            category: null,
            project: null,
            tags: [],
            duration: null,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        const lowerInput = userInput.toLowerCase();
        
        // Extract time information
        const timeInfo = this.extractTime(userInput);
        if (timeInfo.time) {
            task.dueTime = timeInfo.time;
        }
        if (timeInfo.duration) {
            task.duration = timeInfo.duration;
        }

        // Extract date information
        const dateInfo = this.extractDate(userInput, currentDate);
        if (dateInfo) {
            task.dueDate = dateInfo;
        }

        // Extract priority
        task.priority = this.extractPriority(lowerInput);

        // Extract category
        task.category = this.extractCategory(lowerInput);

        // Extract tags
        task.tags = this.extractTags(userInput);

        // Clean up title by removing extracted information
        task.title = this.cleanTitle(userInput, timeInfo, dateInfo);

        // Generate description from context
        task.description = this.generateDescription(userInput, task);

        return task;
    }

    // Extract time information from text
    extractTime(text) {
        const result = { time: null, duration: null };
        
        // Reset regex lastIndex
        this.patterns.time.lastIndex = 0;
        
        const timeMatch = this.patterns.time.exec(text);
        if (timeMatch) {
            let hour = parseInt(timeMatch[1]);
            const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
            const ampm = timeMatch[3];

            // Convert to 24-hour format
            if (ampm) {
                const isPM = ampm.toLowerCase() === 'pm';
                if (isPM && hour !== 12) {
                    hour += 12;
                } else if (!isPM && hour === 12) {
                    hour = 0;
                }
            }

            result.time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        }

        // Extract duration
        this.patterns.duration.lastIndex = 0;
        const durationMatch = this.patterns.duration.exec(text);
        if (durationMatch) {
            const value = parseInt(durationMatch[1]);
            const unit = durationMatch[2].toLowerCase();
            
            // Convert to minutes
            let minutes = value;
            if (unit.startsWith('hour') || unit === 'hr') {
                minutes = value * 60;
            }
            
            result.duration = minutes;
        }

        return result;
    }

    // Extract date information from text
    extractDate(text, currentDate) {
        const today = new Date(currentDate);
        const lowerText = text.toLowerCase();
        
        // Handle relative dates
        if (lowerText.includes('today')) {
            return today.toISOString().split('T')[0];
        }
        
        if (lowerText.includes('tomorrow')) {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.toISOString().split('T')[0];
        }
        
        if (lowerText.includes('next week')) {
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);
            return nextWeek.toISOString().split('T')[0];
        }

        // Handle specific days of the week
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const nextDayMatch = lowerText.match(/next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/);
        if (nextDayMatch) {
            const targetDay = dayNames.indexOf(nextDayMatch[1]);
            const nextDate = this.getNextDayOfWeek(today, targetDay);
            return nextDate.toISOString().split('T')[0];
        }

        const thisDayMatch = lowerText.match(/this\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/);
        if (thisDayMatch) {
            const targetDay = dayNames.indexOf(thisDayMatch[1]);
            const thisDate = this.getThisDayOfWeek(today, targetDay);
            return thisDate.toISOString().split('T')[0];
        }

        // Handle MM/DD or MM-DD format
        const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})/);
        if (dateMatch) {
            const month = parseInt(dateMatch[1]) - 1; // JavaScript months are 0-indexed
            const day = parseInt(dateMatch[2]);
            const year = today.getFullYear();
            
            const date = new Date(year, month, day);
            // If the date is in the past, assume next year
            if (date < today) {
                date.setFullYear(year + 1);
            }
            
            return date.toISOString().split('T')[0];
        }

        return null;
    }

    // Extract priority level from text
    extractPriority(lowerText) {
        // Check for high priority keywords
        for (const keyword of this.fallbackPatterns.priorityKeywords.high) {
            if (lowerText.includes(keyword)) {
                return 'high';
            }
        }

        // Check for low priority keywords
        for (const keyword of this.fallbackPatterns.priorityKeywords.low) {
            if (lowerText.includes(keyword)) {
                return 'low';
            }
        }

        return 'medium'; // Default priority
    }

    // Extract category from text
    extractCategory(lowerText) {
        for (const [category, keywords] of Object.entries(this.fallbackPatterns.categories)) {
            for (const keyword of keywords) {
                if (lowerText.includes(keyword)) {
                    return category;
                }
            }
        }
        return null;
    }

    // Extract hashtags as tags
    extractTags(text) {
        const hashtagPattern = /#[\w]+/g;
        const hashtags = text.match(hashtagPattern);
        return hashtags ? hashtags.map(tag => tag.substring(1)) : [];
    }

    // Clean the title by removing time/date references
    cleanTitle(originalText, timeInfo, dateInfo) {
        let cleanTitle = originalText;
        
        // Remove time patterns
        cleanTitle = cleanTitle.replace(this.patterns.time, '').trim();
        
        // Remove date patterns
        cleanTitle = cleanTitle.replace(this.patterns.date, '').trim();
        
        // Remove duration patterns
        cleanTitle = cleanTitle.replace(this.patterns.duration, '').trim();
        
        // Remove hashtags
        cleanTitle = cleanTitle.replace(/#[\w]+/g, '').trim();
        
        // Remove common connector words if they're at the beginning or end
        const connectors = ['at', 'on', 'by', 'before', 'after', 'due', 'for'];
        const words = cleanTitle.split(' ');
        
        // Remove connectors from the beginning
        while (words.length > 0 && connectors.includes(words[0].toLowerCase())) {
            words.shift();
        }
        
        // Remove connectors from the end
        while (words.length > 0 && connectors.includes(words[words.length - 1].toLowerCase())) {
            words.pop();
        }
        
        cleanTitle = words.join(' ').trim();
        
        // Ensure we don't return an empty title
        return cleanTitle || 'New Task';
    }

    // Generate a description based on extracted information
    generateDescription(originalText, task) {
        const details = [];
        
        if (task.category) {
            details.push(`Category: ${task.category}`);
        }
        
        if (task.duration) {
            const hours = Math.floor(task.duration / 60);
            const minutes = task.duration % 60;
            if (hours > 0) {
                details.push(`Duration: ${hours}h ${minutes}m`);
            } else {
                details.push(`Duration: ${minutes}m`);
            }
        }
        
        if (task.tags.length > 0) {
            details.push(`Tags: ${task.tags.join(', ')}`);
        }
        
        return details.join(' | ');
    }

    // Utility function to get next occurrence of a day of the week
    getNextDayOfWeek(fromDate, dayOfWeek) {
        const date = new Date(fromDate);
        const currentDay = date.getDay();
        const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
        const daysToAdd = daysUntilTarget === 0 ? 7 : daysUntilTarget; // If it's the same day, get next week
        
        date.setDate(date.getDate() + daysToAdd);
        return date;
    }

    // Utility function to get this week's occurrence of a day
    getThisDayOfWeek(fromDate, dayOfWeek) {
        const date = new Date(fromDate);
        const currentDay = date.getDay();
        const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
        
        if (daysUntilTarget === 0 && date.getDay() === dayOfWeek) {
            // It's the same day - if it's earlier in the day, use today, otherwise next week
            return date;
        }
        
        date.setDate(date.getDate() + daysUntilTarget);
        return date;
    }

    // Batch parse multiple task inputs
    async batchParse(inputs, currentDate = new Date()) {
        const results = [];
        
        for (const input of inputs) {
            try {
                const task = await this.parseTask(input, currentDate);
                results.push({ success: true, task, input });
            } catch (error) {
                results.push({ success: false, error: error.message, input });
            }
        }
        
        return results;
    }

    // Parse task update commands (for editing existing tasks)
    parseTaskUpdate(updateText, existingTask) {
        const updates = {};
        const lowerText = updateText.toLowerCase();
        
        // Check for time updates
        const timeInfo = this.extractTime(updateText);
        if (timeInfo.time) {
            updates.dueTime = timeInfo.time;
        }
        
        // Check for date updates
        const dateInfo = this.extractDate(updateText, new Date());
        if (dateInfo) {
            updates.dueDate = dateInfo;
        }
        
        // Check for priority updates
        if (lowerText.includes('priority')) {
            updates.priority = this.extractPriority(lowerText);
        }
        
        // Check for status updates
        if (lowerText.includes('complete') || lowerText.includes('done')) {
            updates.status = 'completed';
            updates.completedAt = new Date().toISOString();
        } else if (lowerText.includes('pending') || lowerText.includes('todo')) {
            updates.status = 'pending';
            updates.completedAt = null;
        }
        
        return updates;
    }

    // Validate parsed task
    validateTask(task) {
        const errors = [];
        
        if (!task.title || task.title.trim().length === 0) {
            errors.push('Task title is required');
        }
        
        if (task.dueDate && !this.isValidDate(task.dueDate)) {
            errors.push('Invalid due date format');
        }
        
        if (task.dueTime && !this.isValidTime(task.dueTime)) {
            errors.push('Invalid due time format');
        }
        
        if (!['high', 'medium', 'low'].includes(task.priority)) {
            errors.push('Invalid priority level');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Utility functions
    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    isValidTime(timeString) {
        const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timePattern.test(timeString);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
}

// Export for use in other modules
window.AITaskParser = AITaskParser;