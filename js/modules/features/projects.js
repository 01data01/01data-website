/**
 * Projects Module
 * Handles project management and organization
 */

class ProjectsModule {
    constructor() {
        this.initialized = false;
        this.projects = [];
        this.eventListeners = [];
    }

    /**
     * Initialize projects module
     */
    initialize() {
        if (this.initialized) return;
        
        try {
            console.log('Initializing Projects Module...');
            
            this.loadProjects();
            this.setupEventListeners();
            this.renderProjects();
            
            this.initialized = true;
            console.log('Projects Module initialized successfully');
            
        } catch (error) {
            utils.logError('Projects Module Initialization', error);
        }
    }

    /**
     * Load projects from storage
     */
    loadProjects() {
        this.projects = utils.loadFromStorage('projects', []);
        
        // If no projects exist, create sample projects
        if (this.projects.length === 0) {
            this.projects = this.createSampleProjects();
            utils.saveToStorage('projects', this.projects);
        }
    }

    /**
     * Create sample projects
     */
    createSampleProjects() {
        return [
            {
                id: utils.generateId('project'),
                name: 'Website Redesign',
                description: 'Complete overhaul of company website with modern design',
                status: 'in-progress',
                priority: 'high',
                startDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                progress: 65,
                team: ['John Doe', 'Jane Smith', 'Mike Johnson'],
                tasks: 12,
                completedTasks: 8,
                createdAt: new Date().toISOString()
            },
            {
                id: utils.generateId('project'),
                name: 'Mobile App Development',
                description: 'Develop iOS and Android app for customer engagement',
                status: 'planning',
                priority: 'medium',
                startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                progress: 15,
                team: ['Sarah Wilson', 'Tom Brown'],
                tasks: 25,
                completedTasks: 4,
                createdAt: new Date().toISOString()
            },
            {
                id: utils.generateId('project'),
                name: 'Data Migration',
                description: 'Migrate legacy database to new cloud infrastructure',
                status: 'completed',
                priority: 'high',
                startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                progress: 100,
                team: ['Alex Chen', 'Maria Garcia'],
                tasks: 15,
                completedTasks: 15,
                createdAt: new Date().toISOString()
            }
        ];
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add project button
        const addProjectBtn = utils.getElementById('addProjectBtn');
        if (addProjectBtn) {
            const clickListener = utils.addEventListener(addProjectBtn, 'click', () => {
                this.showAddProjectModal();
            });
            this.eventListeners.push(clickListener);
        }
    }

    /**
     * Render projects
     */
    renderProjects() {
        const projectsList = utils.getElementById('projectsList');
        if (!projectsList) return;

        if (this.projects.length === 0) {
            projectsList.innerHTML = this.getEmptyState();
            return;
        }

        projectsList.innerHTML = `
            <div class="projects-grid">
                ${this.projects.map(project => this.renderProjectCard(project)).join('')}
            </div>
        `;

        this.setupProjectCardListeners();
    }

    /**
     * Render individual project card
     */
    renderProjectCard(project) {
        const statusColors = {
            'planning': 'info',
            'in-progress': 'warning',
            'completed': 'success',
            'on-hold': 'secondary'
        };

        const priorityColors = {
            'low': 'success',
            'medium': 'warning',
            'high': 'danger'
        };

        return `
            <div class="project-card status-${project.status}" data-project-id="${project.id}">
                <div class="project-header">
                    <h3 class="project-name">${project.name}</h3>
                    <div class="project-badges">
                        <span class="badge ${statusColors[project.status]}">${utils.capitalize(project.status.replace('-', ' '))}</span>
                        <span class="badge ${priorityColors[project.priority]}">${utils.capitalize(project.priority)} Priority</span>
                    </div>
                </div>
                
                <div class="project-description">
                    ${project.description}
                </div>
                
                <div class="project-progress">
                    <div class="progress-header">
                        <span class="progress-label">Progress</span>
                        <span class="progress-percentage">${project.progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${project.progress}%"></div>
                    </div>
                    <div class="progress-details">
                        ${project.completedTasks}/${project.tasks} tasks completed
                    </div>
                </div>
                
                <div class="project-meta">
                    <div class="project-dates">
                        <div class="date-item">
                            <span class="date-label">Start:</span>
                            <span class="date-value">${utils.formatDate(project.startDate)}</span>
                        </div>
                        <div class="date-item">
                            <span class="date-label">Due:</span>
                            <span class="date-value">${utils.formatDate(project.dueDate)}</span>
                        </div>
                    </div>
                    
                    <div class="project-team">
                        <div class="team-label">Team:</div>
                        <div class="team-members">
                            ${project.team.slice(0, 3).map(member => `
                                <div class="team-member" title="${member}">
                                    ${member.split(' ').map(n => n[0]).join('')}
                                </div>
                            `).join('')}
                            ${project.team.length > 3 ? `<div class="team-member more">+${project.team.length - 3}</div>` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="project-actions">
                    <button class="btn-secondary btn-sm" onclick="projectsModule.viewProject('${project.id}')">
                        View Details
                    </button>
                    <button class="btn-primary btn-sm" onclick="projectsModule.editProject('${project.id}')">
                        Edit
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Setup project card listeners
     */
    setupProjectCardListeners() {
        // Additional event listeners for project cards if needed
    }

    /**
     * Get empty state HTML
     */
    getEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>No Projects</h3>
                <p>Create your first project to get started with organizing your work.</p>
                <button class="btn-primary" onclick="projectsModule.showAddProjectModal()">
                    + Create Your First Project
                </button>
            </div>
        `;
    }

    /**
     * View project details
     */
    viewProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            // For now, show an alert with project details
            // In a full implementation, this would open a detailed project view
            alert(`Project: ${project.name}\nStatus: ${project.status}\nProgress: ${project.progress}%\nTeam: ${project.team.join(', ')}`);
        }
    }

    /**
     * Edit project
     */
    editProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            this.showAddProjectModal(project);
        }
    }

    /**
     * Delete project
     */
    deleteProject(projectId) {
        if (confirm('Are you sure you want to delete this project?')) {
            this.projects = this.projects.filter(p => p.id !== projectId);
            this.saveProjects();
            this.renderProjects();
        }
    }

    /**
     * Show add/edit project modal
     */
    showAddProjectModal(editProject = null) {
        const isEdit = !!editProject;
        const project = editProject || {
            name: '',
            description: '',
            status: 'planning',
            priority: 'medium',
            startDate: new Date().toISOString().split('T')[0],
            dueDate: '',
            team: []
        };

        const modalHTML = `
            <div class="modal active" id="projectModal">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h3>${isEdit ? 'Edit Project' : 'Create New Project'}</h3>
                        <button class="modal-close" onclick="projectsModule.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="projectForm">
                            <div class="form-group">
                                <label for="projectName">Project Name *</label>
                                <input type="text" id="projectName" value="${project.name}" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="projectDescription">Description</label>
                                <textarea id="projectDescription" rows="3">${project.description}</textarea>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="projectStatus">Status</label>
                                    <select id="projectStatus">
                                        <option value="planning" ${project.status === 'planning' ? 'selected' : ''}>Planning</option>
                                        <option value="in-progress" ${project.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                                        <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>Completed</option>
                                        <option value="on-hold" ${project.status === 'on-hold' ? 'selected' : ''}>On Hold</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="projectPriority">Priority</label>
                                    <select id="projectPriority">
                                        <option value="low" ${project.priority === 'low' ? 'selected' : ''}>Low</option>
                                        <option value="medium" ${project.priority === 'medium' ? 'selected' : ''}>Medium</option>
                                        <option value="high" ${project.priority === 'high' ? 'selected' : ''}>High</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="projectStartDate">Start Date</label>
                                    <input type="date" id="projectStartDate" value="${project.startDate}">
                                </div>
                                <div class="form-group">
                                    <label for="projectDueDate">Due Date</label>
                                    <input type="date" id="projectDueDate" value="${project.dueDate}">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="projectTeam">Team Members (comma-separated)</label>
                                <input type="text" id="projectTeam" value="${project.team ? project.team.join(', ') : ''}" 
                                       placeholder="John Doe, Jane Smith, Mike Johnson">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="projectsModule.closeModal()">Cancel</button>
                        <button class="btn-primary" onclick="projectsModule.saveProject(${isEdit ? `'${project.id}'` : 'null'})">
                            ${isEdit ? 'Update Project' : 'Create Project'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Save project (add or edit)
     */
    saveProject(editId = null) {
        const projectData = {
            name: utils.getElementById('projectName').value.trim(),
            description: utils.getElementById('projectDescription').value.trim(),
            status: utils.getElementById('projectStatus').value,
            priority: utils.getElementById('projectPriority').value,
            startDate: utils.getElementById('projectStartDate').value,
            dueDate: utils.getElementById('projectDueDate').value,
            team: utils.getElementById('projectTeam').value.split(',').map(name => name.trim()).filter(name => name)
        };

        if (!projectData.name) {
            alert('Please enter a project name');
            return;
        }

        if (editId) {
            // Edit existing project
            const projectIndex = this.projects.findIndex(p => p.id === editId);
            if (projectIndex !== -1) {
                this.projects[projectIndex] = { ...this.projects[projectIndex], ...projectData };
            }
        } else {
            // Add new project
            const newProject = {
                id: utils.generateId('project'),
                ...projectData,
                progress: 0,
                tasks: 0,
                completedTasks: 0,
                createdAt: new Date().toISOString()
            };
            this.projects.push(newProject);
        }

        this.saveProjects();
        this.renderProjects();
        this.closeModal();
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = utils.getElementById('projectModal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * Save projects to storage
     */
    saveProjects() {
        utils.saveToStorage('projects', this.projects);
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
const projectsModule = new ProjectsModule();

// Make it globally accessible
window.projectsModule = projectsModule;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = projectsModule;
}