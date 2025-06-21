# 01data Website File Structure Documentation

## Dashboard

### Dashboard User Interface Files:
- `intelligent-management.html` (lines ~134-145) - Dashboard view HTML structure
- `css/modules/dashboard.css` - Dashboard-specific styling and layout
- `css/modules/components.css` - Shared UI components used in dashboard
- `css/modules/base.css` - Base styles affecting dashboard appearance

### Dashboard Function Files:
- `js/modules/features/dashboard.js` - Main dashboard functionality and logic
- `js/modules/core/main.js` (lines ~477-482) - Dashboard initialization
- `js/modules/core/utils.js` - Utility functions used by dashboard
- `js/modules/ai/ai-service.js` - AI integration for dashboard features

## Calendar

### Calendar User Interface Files:
- `intelligent-management.html` (lines ~164-183) - Calendar view HTML structure
- `css/modules/calendar.css` - Calendar-specific styling, grid layout, event display
- `css/modules/components.css` - Shared components for calendar UI
- `css/modules/base.css` - Base styles for calendar appearance

### Calendar Function Files:
- `js/modules/features/calendar.js` - Calendar functionality, event management
- `js/modules/core/main.js` (lines ~497-502) - Calendar initialization
- `js/modules/core/utils.js` - Date/time utilities and helper functions
- `js/modules/ai/ai-service.js` - AI features for calendar (scheduling assistance)

## Tasks

### Tasks User Interface Files:
- `intelligent-management.html` (lines ~147-162) - Tasks view HTML structure
- `css/modules/tasks.css` - Task list styling, task cards, filters
- `css/modules/components.css` - Shared UI elements for tasks
- `css/modules/base.css` - Base styling affecting task appearance

### Tasks Function Files:
- `js/modules/features/tasks.js` - Task CRUD operations, filtering, sorting
- `js/modules/core/main.js` (lines ~487-492) - Tasks module initialization
- `js/modules/core/utils.js` - Storage utilities and helper functions
- `js/modules/ai/ai-service.js` - AI task parsing and suggestions

## Projects

### Projects User Interface Files:
- `intelligent-management.html` (lines ~185-194) - Projects view HTML structure
- `css/modules/components.css` - Project cards and UI components
- `css/modules/base.css` - Base styling for projects section
- `css/modules/layout.css` - Layout styles affecting projects view

### Projects Function Files:
- `js/modules/features/projects.js` - Project management functionality
- `js/modules/core/main.js` (lines ~507-512) - Projects initialization
- `js/modules/core/utils.js` - Utility functions for project operations
- `js/modules/ai/ai-service.js` - AI project planning and management

## AI Assistant

### AI Assistant User Interface Files:
- `intelligent-management.html` (lines ~196-278) - AI chat interface HTML
- `css/modules/ai-chat.css` - Complete AI chat styling (sidebar, messages, input)
- `css/modules/components.css` - Shared components for chat UI
- `css/modules/base.css` - Base styling affecting chat appearance

### AI Assistant Function Files:
- `js/modules/features/ai-chat.js` - Chat interface functionality and message handling
- `js/modules/ai/ai-service.js` - Core AI service, Claude API integration
- `js/modules/core/main.js` (lines ~517-522) - AI chat initialization
- `js/modules/core/utils.js` - Utility functions for chat operations
- `netlify/functions/claude-chat.js` - Backend AI API endpoint
- `netlify/functions/assign-api-key.js` - API key management

## Core System Files

### Authentication & User Management:
- `js/modules/core/auth.js` - User authentication system
- `js/modules/core/main.js` (lines ~109-171) - Auth initialization and user management

### Application Core:
- `js/modules/core/main.js` - Main application controller and routing
- `js/modules/core/utils.js` - Shared utility functions across all modules
- `intelligent-management.html` - Main application HTML structure

### Configuration & Data:
- `config.js` - Application configuration settings
- `data/users.json` - User data storage
- `data/usage.json` - Usage tracking data
- `data/api-keys.example.json` - API key configuration template

### Backend Functions:
- `netlify/functions/admin-data.js` - Admin data management
- `netlify/functions/debug-keys.js` - API key debugging
- `proxy-server.js` - Development proxy server

## Global Styles:
- `css/modules/base.css` - CSS variables, typography, global styles
- `css/modules/layout.css` - Main layout, header, navigation
- `css/modules/auth.css` - Authentication screens styling
- `css/modules/components.css` - Reusable UI components

## Additional Files:
- `index.html` - Landing page
- `package.json` - Project dependencies and scripts
- Various `.md` files - Documentation and setup guides
- `test-*.html` files - Testing and debugging pages