/**
 * Animated Dashboard Icons - Standalone JavaScript
 * Professional animated dashboard components for any webpage
 */
class AnimatedDashboardIcons {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`❌ Container "${containerId}" not found`);
            return;
        }
        
        this.options = {
            showBackground: false,
            responsive: true,
            animationSpeed: 'normal',
            customCards: null, // Allow custom card configurations
            ...options
        };
        
        this.isInitialized = false;
        this.init();
    }
    
    init() {
        this.createHTML();
        this.startAnimations();
        this.isInitialized = true;
        console.log('✅ Animated Dashboard Icons initialized');
    }
    
    createHTML() {
        const cards = this.options.customCards || [
            { label: 'Due Today', value: '0', color: 'blue', icon: 'clock' },
            { label: 'Overdue', value: '0', color: 'red', icon: 'warning', theme: 'red-theme' },
            { label: 'Completed', value: '0', color: 'green', icon: 'checkmark', theme: 'green-theme' },
            { label: 'Completion Rate', value: '0%', color: 'purple', icon: 'chart', theme: 'purple-theme' }
        ];

        this.container.innerHTML = `
            <div class="animated-stats-wrapper">
                ${cards.map(card => this.createCard(
                    card.label, 
                    card.value, 
                    card.color, 
                    card.icon, 
                    card.theme || ''
                )).join('')}
            </div>
        `;
    }
    
    createCard(label, value, color, iconType, themeClass = '') {
        return `
            <div class="animated-stat-card ${themeClass}">
                <div class="animated-card-content">
                    <div class="animated-icon-container">
                        <div class="animated-icon-circle ${color}">
                            ${this.getIcon(iconType)}
                        </div>
                        <div class="animated-glow-ring" style="--glow-color: var(--icon-shadow);"></div>
                        <div class="animated-particles" data-color="${color}"></div>
                    </div>
                    <div class="animated-metrics">
                        <div class="animated-metric-value" data-metric="${label.toLowerCase().replace(/\s+/g, '-')}">${value}</div>
                        <div class="animated-metric-label ${color}">${label}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getIcon(type) {
        const icons = {
            clock: `
                <div class="animated-clock">
                    <div class="animated-clock-face"></div>
                    <div class="animated-clock-hand animated-hour-hand"></div>
                    <div class="animated-clock-hand animated-minute-hand"></div>
                    <div class="animated-clock-center"></div>
                </div>`,
            warning: `<div class="animated-warning"></div>`,
            checkmark: `
                <svg class="animated-checkmark" viewBox="0 0 24 24" fill="none">
                    <path class="animated-checkmark-path" d="M6 12l4 4L18 8"/>
                </svg>`,
            chart: `
                <div class="animated-chart">
                    <div class="animated-bar"></div>
                    <div class="animated-bar"></div>
                    <div class="animated-bar"></div>
                    <div class="animated-bar"></div>
                </div>`,
            // Additional icon types you can use
            users: `
                <svg class="animated-icon-svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>`,
            dollar: `
                <svg class="animated-icon-svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>`,
            star: `
                <svg class="animated-icon-svg" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                </svg>`
        };
        return icons[type] || icons.chart;
    }
    
    startAnimations() {
        setTimeout(() => {
            this.createParticles();
        }, 500);
    }
    
    createParticles() {
        const particleContainers = this.container.querySelectorAll('.animated-particles');
        const colors = {
            blue: '#4db6ac',
            red: '#ef4444', 
            green: '#10b981',
            purple: '#8b5cf6',
            orange: '#f97316',
            cyan: '#06b6d4'
        };
        
        particleContainers.forEach((container, index) => {
            const color = container.dataset.color;
            const particleColor = colors[color] || colors.blue;
            
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
    
    updateValues(values) {
        if (!this.isInitialized) {
            console.warn('⚠️ Animated Dashboard not initialized yet');
            return;
        }
        
        const metrics = ['due-today', 'overdue', 'completed', 'completion-rate'];
        values.forEach((value, index) => {
            if (value !== undefined && metrics[index]) {
                const element = this.container.querySelector(`[data-metric="${metrics[index]}"]`);
                if (element) {
                    element.style.animation = 'animatedValueUpdate 0.6s ease';
                    setTimeout(() => {
                        element.textContent = value;
                        element.style.animation = '';
                    }, 300);
                }
            }
        });
    }
    
    updateSingleValue(metric, value) {
        if (!this.isInitialized) {
            console.warn('⚠️ Animated Dashboard not initialized yet');
            return;
        }
        
        const element = this.container.querySelector(`[data-metric="${metric}"]`);
        if (element) {
            element.style.animation = 'animatedValueUpdate 0.6s ease';
            setTimeout(() => {
                element.textContent = value;
                element.style.animation = '';
            }, 300);
        }
    }
    
    addClickHandlers(handlers) {
        if (!this.isInitialized) {
            console.warn('⚠️ Animated Dashboard not initialized yet');
            return;
        }
        
        const cards = this.container.querySelectorAll('.animated-stat-card');
        cards.forEach((card, index) => {
            if (handlers[index] && typeof handlers[index] === 'function') {
                card.addEventListener('click', handlers[index]);
                card.style.cursor = 'pointer';
            }
        });
    }
    
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.isInitialized = false;
    }
}

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('animated-dashboard-container');
    if (container) {
        window.animatedDashboard = new AnimatedDashboardIcons('animated-dashboard-container');
        console.log('✅ Auto-initialized Animated Dashboard Icons');
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimatedDashboardIcons;
}