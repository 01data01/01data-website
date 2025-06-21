# 01data Website File Contents Reference

## HTML Files

### `intelligent-management.html` (Main Application)
**Purpose**: Main single-page application interface
**Key Sections**:
- **Lines 1-33**: HTML head, CSS/JS imports, Google Sign-in setup
- **Lines 35-71**: Loading screen with animated brain icon
- **Lines 73-130**: Google Sign-in screen interface
- **Lines 132-279**: Main application structure:
  - **Lines 76-130**: Header with navigation and user info
  - **Lines 135-145**: Dashboard view container
  - **Lines 147-162**: Tasks view with filters and task list
  - **Lines 164-183**: Calendar view with controls
  - **Lines 185-194**: Projects view container
  - **Lines 196-278**: AI Chat interface (sidebar + main chat area)
- **Lines 282-329**: Script initialization and Google Sign-in handlers

### `index.html` (Landing Page)
**Purpose**: Main website landing page with navigation to intelligent management
**Contains**: Marketing content, feature descriptions, navigation to app

## CSS Files

### `css/modules/base.css`
**Purpose**: Global styles, CSS variables, typography
**Contains**:
- CSS custom properties (colors, fonts, spacing)
- Global reset and typography
- Button styles and form elements
- Animation keyframes
- Utility classes

### `css/modules/layout.css`
**Purpose**: Main application layout and structure
**Contains**:
- App container and header layout
- Navigation styling
- Main content area layout
- Mobile responsive layouts
- Sidebar and panel layouts

### `css/modules/auth.css`
**Purpose**: Authentication screens styling
**Contains**:
- Sign-in screen layout
- Loading screen with brain animation
- Google Sign-in button styling
- Error message styling
- Authentication form elements

### `css/modules/dashboard.css`
**Purpose**: Dashboard-specific styling
**Contains**:
- Dashboard grid layout
- Stats containers and cards
- Quick add task form
- Chart and graph styling
- Dashboard-specific animations

### `css/modules/tasks.css`
**Purpose**: Tasks module styling
**Contains**:
- Task list layouts
- Task card styling
- Filter button styles
- Task priority indicators
- Task completion states
- Add/edit task modal styling

### `css/modules/calendar.css`
**Purpose**: Calendar interface styling
**Contains**:
- Calendar grid layout
- Month/week/day view styles
- Event styling and positioning
- Calendar navigation controls
- Date picker styling
- Event creation modal

### `css/modules/ai-chat.css`
**Purpose**: Complete AI chat interface styling
**Contains**:
- **Lines 7-32**: Chat layout with sidebar structure
- **Lines 24-160**: Sidebar styling (new chat, history, empty states)
- **Lines 162-256**: Main chat area and header
- **Lines 258-404**: Message bubbles and conversation styling
- **Lines 405-457**: Typing indicator animations
- **Lines 459-521**: Chat input and send button styling
- **Lines 522-548**: Suggestion buttons
- **Lines 562-669**: Responsive design for mobile

### `css/modules/components.css`
**Purpose**: Reusable UI components
**Contains**:
- Modal and dialog styling
- Button variants and states
- Form components
- Card layouts
- Notification styling
- Loading states and spinners

## JavaScript Files

### `js/modules/core/main.js`
**Purpose**: Main application controller and initialization
**Key Functions**:
- **Lines 34-71**: Application initialization
- **Lines 109-171**: Authentication system
- **Lines 285-301**: Show/hide application screens
- **Lines 399-434**: View routing and navigation
- **Lines 454-522**: Module initialization for each view
- **Lines 589-609**: Notification system
- **Lines 658-661**: Auth module compatibility layer

### `js/modules/core/utils.js`
**Purpose**: Shared utility functions across all modules
**Key Functions**:
- **Lines 23-43**: DOM manipulation utilities (getElementById, querySelector)
- **Lines 51-75**: Event handling utilities
- **Lines 83-105**: Storage utilities (localStorage wrapper)
- **Lines 113-135**: Date and time formatting
- **Lines 143-165**: String manipulation and validation
- **Lines 173-195**: Animation and transition helpers
- **Lines 203-225**: Data processing utilities

### `js/modules/core/auth.js`
**Purpose**: Authentication module (if exists)
**Contains**: User authentication, session management, Google Sign-in integration

### `js/modules/features/dashboard.js`
**Purpose**: Dashboard functionality and data visualization
**Key Features**:
- Dashboard initialization and setup
- Stats calculation and display
- Quick task creation
- Data visualization
- Dashboard widgets management

### `js/modules/features/tasks.js`
**Purpose**: Task management functionality
**Key Features**:
- Task CRUD operations (Create, Read, Update, Delete)
- Task filtering and sorting
- Task status management
- Task scheduling and deadlines
- Integration with AI for task parsing

### `js/modules/features/calendar.js`
**Purpose**: Calendar functionality and event management
**Key Features**:
- Calendar rendering (month/week/day views)
- Event creation and editing
- Event scheduling and reminders
- Calendar data persistence
- Integration with tasks and AI

### `js/modules/features/projects.js`
**Purpose**: Project management functionality
**Key Features**:
- Project creation and management
- Project task organization
- Project progress tracking
- Project collaboration features
- AI-powered project planning

### `js/modules/features/ai-chat.js`
**Purpose**: AI chat interface and message handling
**Key Functions**:
- **Lines 15-30**: Module initialization
- **Lines 35-74**: Event listener setup for input/buttons
- **Lines 79-120**: Message sending and handling
- **Lines 125-151**: Message display in chat
- **Lines 166-199**: Typing indicator management
- **Lines 214-240**: AI service integration with fallback responses
- **Lines 267-285**: Connection status management

### `js/modules/ai/ai-service.js`
**Purpose**: Core AI service and Claude API integration
**Key Functions**:
- **Lines 45-66**: AI service initialization
- **Lines 71-107**: User API key management
- **Lines 197-274**: Natural language task parsing
- **Lines 367-391**: Chat functionality with conversation context
- **Lines 531-596**: Claude API communication with error handling
- **Lines 601-630**: Conversation context management

## Backend Files

### `netlify/functions/claude-chat.js`
**Purpose**: Serverless function for Claude API communication
**Contains**:
- Claude API integration
- Request/response handling
- Error management
- Rate limiting

### `netlify/functions/assign-api-key.js`
**Purpose**: API key assignment and management
**Contains**:
- User API key allocation
- Key rotation and management
- Usage tracking

### `netlify/functions/admin-data.js`
**Purpose**: Admin data management
**Contains**:
- Admin dashboard functionality
- Data export/import
- System monitoring

### `netlify/functions/debug-keys.js`
**Purpose**: API key debugging and testing
**Contains**:
- Key validation testing
- Debug information
- API connectivity checks

## Configuration Files

### `config.js`
**Purpose**: Application configuration settings
**Contains**:
- API endpoints
- Feature flags
- Environment-specific settings
- Third-party service configuration

### `package.json`
**Purpose**: Node.js project configuration
**Contains**:
- Project dependencies
- Build scripts
- Project metadata

### `proxy-server.js`
**Purpose**: Development proxy server
**Contains**:
- Local development server setup
- CORS handling
- API proxying for development

## Data Files

### `data/users.json`
**Purpose**: User data storage (development)
**Contains**: User profiles, preferences, authentication data

### `data/usage.json`
**Purpose**: Usage analytics and tracking
**Contains**: Feature usage statistics, performance metrics

### `data/api-keys.example.json`
**Purpose**: API key configuration template
**Contains**: Example structure for API key configuration

## Documentation Files

### `AI_SETUP_GUIDE.md`
**Purpose**: AI assistant setup instructions
**Contains**: Step-by-step AI configuration guide

### `JAVASCRIPT_MODULARIZATION_COMPLETE.md`
**Purpose**: JavaScript architecture documentation
**Contains**: Module system explanation and structure

### `MODULARIZATION_COMPLETE.md` / `MODULARIZATION_SUMMARY.md`
**Purpose**: Overall system architecture documentation
**Contains**: Complete system modularization details

## Test Files

### `test-ai.html`
**Purpose**: AI functionality testing page
**Contains**: Isolated AI testing interface

### `test-modular-css.html` / `test-modular-js.html`
**Purpose**: Module system testing
**Contains**: Testing interfaces for CSS and JS modules

### `debug-ai.html`
**Purpose**: AI debugging interface
**Contains**: Debug console for AI chat functionality

## Static Pages

### `cookie-policy.html`
**Purpose**: Cookie policy page
**Contains**: Cookie usage policy and GDPR compliance

### `privacy-policy.html`
**Purpose**: Privacy policy page
**Contains**: Data handling and privacy information

### `terms-of-service.html`
**Purpose**: Terms of service page
**Contains**: Legal terms and service conditions

## File Relationships

### Dependencies:
- All feature modules depend on `utils.js`
- AI chat depends on `ai-service.js`
- All modules are initialized by `main.js`
- All views share `base.css` and `components.css`

### Data Flow:
1. `main.js` → initializes all modules
2. Feature modules → use `utils.js` for common operations
3. AI modules → communicate through `ai-service.js`
4. Backend functions → handle API communication
5. Data files → store persistent information