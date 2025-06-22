/**
 * Core Utilities Module
 * Shared utility functions, DOM helpers, and common functionality
 */

class Utils {
    constructor() {
        this.dateFormats = {
            short: { month: 'short', day: 'numeric' },
            long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
            time: { hour: '2-digit', minute: '2-digit' },
            datetime: { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        };
    }

    // DOM Utilities
    
    /**
     * Get element by ID with error handling
     * @param {string} id - Element ID
     * @returns {HTMLElement|null}
     */
    getElementById(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with ID '${id}' not found`);
        }
        return element;
    }

    /**
     * Get element by selector with error handling
     * @param {string} selector - CSS selector
     * @param {HTMLElement} parent - Parent element (optional)
     * @returns {HTMLElement|null}
     */
    querySelector(selector, parent = document) {
        const element = parent.querySelector(selector);
        if (!element && !selector.includes('dashboard-refresh-btn')) {
            console.warn(`Element with selector '${selector}' not found`);
        }
        return element;
    }

    /**
     * Get all elements by selector
     * @param {string} selector - CSS selector
     * @param {HTMLElement} parent - Parent element (optional)
     * @returns {NodeList}
     */
    querySelectorAll(selector, parent = document) {
        return parent.querySelectorAll(selector);
    }

    /**
     * Add event listener with cleanup tracking
     * @param {HTMLElement|string} element - Element or selector
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     * @returns {Object} Cleanup function
     */
    addEventListener(element, event, handler, options = {}) {
        const el = typeof element === 'string' ? this.querySelector(element) : element;
        if (!el) return null;

        el.addEventListener(event, handler, options);
        
        return {
            element: el,
            event,
            handler,
            options,
            remove: () => el.removeEventListener(event, handler, options)
        };
    }

    /**
     * Show element with optional animation
     * @param {HTMLElement|string} element - Element or selector
     * @param {string} display - Display value (default: 'block')
     */
    show(element, display = 'block') {
        const el = typeof element === 'string' ? this.querySelector(element) : element;
        if (el) {
            el.style.display = display;
            el.classList.add('active');
        }
    }

    /**
     * Hide element
     * @param {HTMLElement|string} element - Element or selector
     */
    hide(element) {
        const el = typeof element === 'string' ? this.querySelector(element) : element;
        if (el) {
            el.style.display = 'none';
            el.classList.remove('active');
        }
    }

    /**
     * Toggle element visibility
     * @param {HTMLElement|string} element - Element or selector
     */
    toggle(element) {
        const el = typeof element === 'string' ? this.querySelector(element) : element;
        if (el) {
            if (el.style.display === 'none' || !el.style.display) {
                this.show(el);
            } else {
                this.hide(el);
            }
        }
    }

    // Date and Time Utilities

    /**
     * Format date for display
     * @param {string|Date} dateInput - Date to format
     * @param {string} format - Format type
     * @returns {string}
     */
    formatDate(dateInput, format = 'short') {
        if (!dateInput) return '';
        
        const date = new Date(dateInput);
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
        
        return date.toLocaleDateString('en-US', this.dateFormats[format] || this.dateFormats.short);
    }

    /**
     * Get relative time string (e.g., "2 hours ago", "just now")
     * @param {string|Date} dateInput - Date to get relative time for
     * @returns {string}
     */
    getRelativeTime(dateInput) {
        if (!dateInput) return '';
        
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return '';
        
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        
        if (diffSec < 60) return 'just now';
        if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
        if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
        if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
        
        return this.formatDate(date);
    }

    /**
     * Get current date and time information
     * @returns {object} Current datetime information
     */
    getCurrentDateTime() {
        try {
            const now = new Date();
            const dateTime = {
                date: now.toLocaleDateString(),
                time: now.toLocaleTimeString(),
                day: now.toLocaleDateString('en-US', { weekday: 'long' }),
                fullDateTime: now.toISOString(),
                timestamp: now.getTime()
            };
            
            console.log('DateTime context generated:', dateTime);
            return dateTime;
        } catch (error) {
            console.error('Error getting date/time:', error);
            // Return fallback values
            return {
                date: 'Unknown',
                time: 'Unknown',
                day: 'Unknown',
                fullDateTime: new Date().toISOString(),
                timestamp: Date.now()
            };
        }
    }

    /**
     * Format time for display
     * @param {string} timeString - Time string
     * @returns {string}
     */
    formatTime(timeString) {
        if (!timeString) return '';
        
        const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (timePattern.test(timeString)) {
            const [hour, minute] = timeString.split(':').map(Number);
            const date = new Date();
            date.setHours(hour, minute);
            return date.toLocaleTimeString('en-US', this.dateFormats.time);
        }
        
        return timeString;
    }

    /**
     * Check if date is overdue
     * @param {string|Date} dateInput - Date to check
     * @returns {boolean}
     */
    isOverdue(dateInput) {
        if (!dateInput) return false;
        const date = new Date(dateInput);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    }

    /**
     * Get relative date string
     * @param {string|Date} dateInput - Date to format
     * @returns {string}
     */
    getRelativeDate(dateInput) {
        if (!dateInput) return '';
        
        const date = new Date(dateInput);
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';
        if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
        if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
        
        return this.formatDate(dateInput);
    }

    // String Utilities

    /**
     * Capitalize first letter of string
     * @param {string} str - String to capitalize
     * @returns {string}
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Truncate string to specified length
     * @param {string} str - String to truncate
     * @param {number} length - Maximum length
     * @returns {string}
     */
    truncate(str, length = 50) {
        if (!str || str.length <= length) return str;
        return str.substring(0, length).trim() + '...';
    }

    /**
     * Generate unique ID
     * @param {string} prefix - ID prefix
     * @returns {string}
     */
    generateId(prefix = 'id') {
        return `${prefix}_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`;
    }

    // Validation Utilities

    /**
     * Validate email address
     * @param {string} email - Email to validate
     * @returns {boolean}
     */
    isValidEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }

    /**
     * Validate URL
     * @param {string} url - URL to validate
     * @returns {boolean}
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // Storage Utilities

    /**
     * Save data to localStorage with error handling
     * @param {string} key - Storage key
     * @param {any} data - Data to store
     * @returns {boolean} Success status
     */
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    /**
     * Load data from localStorage with error handling
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if not found
     * @returns {any}
     */
    loadFromStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return defaultValue;
        }
    }

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     */
    removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }

    // Animation Utilities

    /**
     * Animate element with CSS classes
     * @param {HTMLElement|string} element - Element or selector
     * @param {string} animationClass - CSS animation class
     * @param {number} duration - Animation duration in ms
     * @returns {Promise}
     */
    animate(element, animationClass, duration = 300) {
        return new Promise((resolve) => {
            const el = typeof element === 'string' ? this.querySelector(element) : element;
            if (!el) {
                resolve();
                return;
            }

            el.classList.add(animationClass);
            
            setTimeout(() => {
                el.classList.remove(animationClass);
                resolve();
            }, duration);
        });
    }

    /**
     * Smooth scroll to element
     * @param {HTMLElement|string} element - Element or selector
     * @param {Object} options - Scroll options
     */
    scrollTo(element, options = {}) {
        const el = typeof element === 'string' ? this.querySelector(element) : element;
        if (el) {
            el.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest',
                ...options
            });
        }
    }

    // Debounce and Throttle

    /**
     * Debounce function execution
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function}
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function execution
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in ms
     * @returns {Function}
     */
    throttle(func, limit = 100) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Error Handling

    /**
     * Safe function execution with error handling
     * @param {Function} func - Function to execute
     * @param {any} fallback - Fallback value on error
     * @returns {any}
     */
    safeExecute(func, fallback = null) {
        try {
            return func();
        } catch (error) {
            console.error('Safe execution error:', error);
            return fallback;
        }
    }

    /**
     * Log error with context
     * @param {string} context - Error context
     * @param {Error} error - Error object
     * @param {any} data - Additional data
     */
    logError(context, error, data = null) {
        console.error(`[${context}]`, error);
        if (data) {
            console.error('Additional data:', data);
        }
    }
}

// Create and export singleton instance
const utils = new Utils();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = utils;
}

// Global access
window.utils = utils;
window.Utils = utils;