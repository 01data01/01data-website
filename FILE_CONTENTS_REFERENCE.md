# 01data Website File Contents Reference

## HTML Files

### `intelligent-management.html` (Main Application)
**Purpose**: Main single-page application interface with voice chat capabilities
**Key Sections**:
- **Lines 1-35**: HTML head, CSS/JS imports including voice-chat.css, Google Sign-in setup
- **Lines 36-72**: Loading screen with animated brain icon
- **Lines 74-83**: Google Sign-in screen interface with demo mode option
- **Lines 135-290**: Main application structure:
  - **Lines 76-130**: Header with navigation and user info
  - **Lines 135-145**: Dashboard view container (includes animated stats icons)
  - **Lines 147-162**: Tasks view with filters and task list
  - **Lines 164-183**: Calendar view with controls
  - **Lines 185-194**: Projects view container
  - **Lines 196-290**: Enhanced AI Chat interface:
    - **Lines 210-237**: Chat sidebar with history and new chat controls
    - **Lines 241-284**: Chat header with agent selection buttons (SMART/ELA), voice controls and status indicators
    - **Lines 254-262**: Agent selection buttons for switching between multiple ElevenLabs agents
    - **Lines 264-276**: Voice controls section (toggle button, activity indicators)
    - **Lines 286-302**: Chat messages area and input container
- **Lines 304-328**: Script initialization, Google Sign-in handlers, and demo mode function
- Integrated voice mode UI elements throughout chat interface
- Voice status indicators and connection status display
- Voice activity visualization bars

### `index.html` (Landing Page)
**Purpose**: Main website landing page with navigation to intelligent management
**Contains**: Marketing content, feature descriptions, navigation to app

### `admin.html` (Admin Interface)
**Purpose**: Administrative interface for system management
**Contains**: Admin controls, system monitoring, user management interface

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
- **Lines 387-407**: Demo mode button styling with glass-morphism effects

### `css/modules/dashboard.css`
**Purpose**: Dashboard-specific styling with animated dashboard icons
**Contains**:
- Dashboard grid layout
- Stats containers and cards
- Quick add task form
- Chart and graph styling
- Dashboard-specific animations
- **Lines 792-1107**: Animated dashboard icons system:
  - Glass-morphism card designs with gradient borders
  - Animated clock icon (rotating hands for Due Today)
  - Animated warning icon (pulsing diamond for Overdue)
  - Animated checkmark icon (drawing effect for Completed)
  - Animated bar chart icon (pulsing bars for Completion Rate)
  - Orbiting particle effects around each icon
  - Gradient icon circles with glowing rings
  - Value update animations with scaling and color effects

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

### `css/modules/voice-chat.css`
**Purpose**: ElevenLabs voice conversation interface styling
**Contains**:
- **Lines 112-143**: Agent selection buttons styling (SMART/ELA) with active states
- Voice control buttons and toggle states
- Voice status indicators and connection status
- Voice activity visualization (animated bars)
- Voice mode UI states (active, recording, error)
- Audio waveform visualizations
- Voice recording indicators
- Responsive design for voice controls
- Voice-specific animations and transitions
- Voice mode overlays and full-screen modes
- Audio queue status indicators

### `css/modules/voice-auth.css`
**Purpose**: Voice mode password protection and authentication styling
**Contains**:
- Authentication modal overlay and backdrop
- Password input forms and validation styling
- Premium feature messaging and contact information display
- Error states and attempt counter styling
- Lockout notifications and security messaging
- Responsive authentication dialog design
- Professional modal animations and transitions
- Access denied notifications and timeout displays

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
**Purpose**: Main application controller and initialization with enhanced authentication
**Key Functions**:
- **Lines 34-71**: Application initialization
- **Lines 111-214**: Enhanced authentication system with:
  - Google API timeout handling (3-second max wait)
  - Demo mode bypass option for development
  - Better error handling for authentication failures
  - URL parameter user data processing
  - localStorage user session management
- **Lines 314-316**: hideLoadingScreen() method to prevent infinite loading
- **Lines 320-339**: showApp() method with user info updates
- **Lines 377-414**: Event listeners setup
- **Lines 418-435**: View routing and navigation
- **Lines 454-522**: Module initialization for each view
- **Lines 589-609**: Notification system

### `js/modules/core/utils.js`
**Purpose**: Shared utility functions across all modules
**Key Functions**:
- **Lines 23-43**: DOM manipulation utilities (getElementById, querySelector with error handling)
- **Lines 51-75**: Event handling utilities
- **Lines 83-105**: Storage utilities (localStorage wrapper)
- **Lines 113-175**: Date and time formatting including getRelativeTime function
- **Lines 177-205**: getCurrentDateTime function with error handling and logging
- **Lines 207-225**: String manipulation and validation
- **Lines 173-195**: Animation and transition helpers
- **Lines 203-225**: Data processing utilities
- **Global access**: Available as both window.utils and window.Utils for compatibility

### `js/modules/core/auth.js`
**Purpose**: Authentication module (if exists)
**Contains**: User authentication, session management, Google Sign-in integration

### `js/modules/features/dashboard.js`
**Purpose**: Dashboard functionality with animated dashboard icons
**Key Features**:
- **Lines 28-34**: Dashboard initialization with animated icons integration
- **Lines 46-127**: Enhanced stats cards HTML generation with animated icon structure
- **Lines 190-221**: Animated icons initialization and particle creation system
- **Lines 448-508**: Enhanced stats updating with animated value transitions
- **Lines 477-508**: animateNumber() method with visual update effects
- **Lines 526-572**: updateUrgencyIndicators() with dynamic animation speeds
- **Lines 1003-1014**: animateStatsCards() with staggered entrance animations
- Stats calculation and display with real-time data
- Quick task creation with AI enhancement
- Sample task generation for testing
- Particle animation management for orbiting effects around icons

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
**Purpose**: AI chat interface and message handling with voice capabilities
**Key Functions**:
- **Lines 15-30**: Module initialization with voice chat integration
- **Lines 35-100**: Event listener setup for input/buttons, voice controls, and agent selection
- **Lines 79-120**: Message sending and handling with datetime context
- **Lines 125-151**: Message display in chat
- **Lines 166-199**: Typing indicator management
- **Lines 214-240**: AI service integration with fallback responses
- **Lines 267-285**: Connection status management
- **Lines 284-320**: Enhanced streaming with contextual datetime information
- **Lines 715-736**: Agent selection functionality (SMART/ELA buttons)
- **Lines 705-825**: Voice chat integration functions:
  - Voice chat initialization and configuration
  - Voice mode toggle functionality
  - Voice UI state management
  - Voice connection status handling
  - Agent selection support for multiple ElevenLabs accounts

### `js/modules/features/voice-chat.js`
**Purpose**: ElevenLabs Conversational AI WebSocket integration with secure signed URL authentication
**Key Functions**:
- **Lines 1-25**: VoiceChat class initialization and configuration with agent selection support
- **Lines 59-82**: Agent selection methods (setSelectedAgent, sendDateTimeUpdate)
- **Lines 84-106**: Voice conversation startup and microphone access
- **Lines 108-190**: Secure WebSocket connection using Netlify signed URL function with agent routing
- **Lines 135-165**: Dynamic variables and datetime context initialization
- **Lines 186-210**: Audio recording and real-time streaming
- **Lines 212-295**: WebSocket message handling (transcripts, responses, audio)
- **Lines 297-365**: Enhanced audio response playback with null buffer handling
- **Lines 367-435**: Utility functions for audio processing and cleanup
- Secure signed URL authentication for private agent access
- WebSocket event handling for conversation flow
- Real-time audio capture and base64 encoding
- Audio response playback with sequential queue management
- Voice activity detection and connection status
- Enhanced error handling and recovery mechanisms

### `js/modules/features/voice-auth.js`
**Purpose**: Voice mode password protection and access control system
**Key Functions**:
- **Lines 1-30**: VoiceAuth class initialization and state management
- **Lines 32-65**: Authentication state persistence and lockout management
- **Lines 67-95**: Voice access request and validation flow
- **Lines 97-200**: Professional authentication modal with premium feature messaging
- **Lines 202-250**: Password validation and security attempt tracking
- **Lines 252-300**: Error handling and user feedback systems
- Password protection with configurable access credentials
- Rate limiting with 3 attempts and 15-minute lockout protection
- Session persistence until browser restart
- Professional modal with support contact information (support@01data.org)
- Responsive authentication interface with clear premium feature messaging

### `js/modules/ai/ai-service.js`
**Purpose**: Core AI service and Claude API integration
**Key Functions**:
- **Lines 45-66**: AI service initialization
- **Lines 71-107**: User API key management
- **Lines 197-274**: Natural language task parsing
- **Lines 367-391**: Chat functionality with conversation context
- **Lines 531-596**: Claude API communication with error handling
- **Lines 601-630**: Conversation context management

## Standalone JavaScript Files

### `js/ai-assistant-handler.js`
**Purpose**: Standalone AI assistant handling utilities
**Contains**: Independent AI assistant functionality and helper functions

### `js/ai-chat-manager.js`
**Purpose**: AI chat management utilities
**Contains**: Chat management functions and conversation handling

### `js/ai-task-parser.js`
**Purpose**: AI-powered task parsing functionality
**Contains**: Natural language task parsing and interpretation

### `js/ai-utils.js`
**Purpose**: AI-related utility functions
**Contains**: Shared AI utilities and helper functions

### `js/simple-ai-assistant.js`
**Purpose**: Simplified AI assistant implementation
**Contains**: Lightweight AI assistant functionality

### `js/projects.js`
**Purpose**: Standalone projects functionality
**Contains**: Project management features and utilities

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

### `netlify/functions/elevenlabs-signed-url.js`
**Purpose**: Secure ElevenLabs signed URL generation for private agent access with multi-agent support
**Contains**:
- ElevenLabs API authentication with server-side API keys (primary and secondary)
- Multi-agent support via query parameters (agent_id parameter routing)
- Signed URL generation for private conversational AI agents
- CORS handling for client-side requests
- Environment variable security (ELEVENLABS_API_KEY, ELEVENLABS_API_KEY_2, ELEVENLABS_AGENT_ID, ELEVENLABS_AGENT_ID_2)
- Enhanced error handling and API response management
- Agent selection validation and security controls

## Configuration Files

### `config.js`
**Purpose**: Application configuration settings
**Contains**:
- **Lines 1-81**: Claude API key management and validation
- **Lines 83-99**: ElevenLabs Conversational AI configuration
- **Lines 101-107**: Global configuration object setup
- API endpoints and feature flags
- Environment-specific settings
- Third-party service configuration
- ElevenLabs agent ID and voice settings
- Audio format and sample rate configuration
- Browser-compatible base64 decoding functions
- **Note**: All sensitive API keys (Claude API, ElevenLabs API key, ElevenLabs Agent ID) are stored as environment variables for security

### `package.json`
**Purpose**: Node.js project configuration
**Contains**:
- Project dependencies
- Build scripts
- Project metadata

### `netlify.toml`
**Purpose**: Netlify build and deployment configuration
**Contains**:
- Functions directory configuration
- Secrets scanning bypass for ElevenLabs function
- SPA redirect rules for client-side routing
- Environment variable handling

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

### `ELEVENLABS_INTEGRATION_GUIDE.md`
**Purpose**: ElevenLabs voice chat integration documentation
**Contains**:
- Complete setup and configuration guide
- ElevenLabs account and agent creation steps
- Technical architecture and API integration details
- Voice chat features and capabilities overview
- Browser compatibility and security considerations
- Troubleshooting guide and performance optimization
- Future enhancement roadmap and extension points

### `INTELLIGENT_MANAGEMENT_SETUP.md`
**Purpose**: Intelligent management system setup guide
**Contains**: System setup instructions and configuration details

### `WEBSITE_FILE_STRUCTURE.md`
**Purpose**: Website file organization documentation
**Contains**: Directory structure and file organization overview

### `README.md`
**Purpose**: Project overview and getting started guide
**Contains**: Project description, installation, and usage instructions

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

## Standalone Components

### `css/animated-dashboard-icons.css`
**Purpose**: Standalone animated dashboard icons stylesheet
**Contains**: 
- Complete CSS for animated dashboard icons system
- Glass-morphism card designs and animations
- All 4 animated icon types (clock, warning, checkmark, chart)
- Particle orbit animations and glowing ring effects
- Responsive design and keyframe animations
- Can be used independently in other projects

### `js/animated-dashboard-icons.js`
**Purpose**: Standalone animated dashboard icons JavaScript class
**Contains**:
- AnimatedDashboardIcons class for easy integration
- Particle creation and management
- Value update animations
- Click handler support
- Customizable card configurations
- Auto-initialization capabilities
- Module export support

### `animated-dashboard-example.html`
**Purpose**: Standalone example page for animated dashboard icons
**Contains**:
- Complete working example of animated dashboard icons
- Custom dashboard configuration examples
- Interactive demo controls
- Responsive showcase
- Integration guide and usage examples

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
- AI chat depends on `ai-service.js` and `voice-chat.js`
- Voice chat module uses ElevenLabs WebSocket API
- All modules are initialized by `main.js`
- All views share `base.css` and `components.css`
- Dashboard module integrates animated icons CSS and JavaScript
- Authentication system supports both Google Sign-In and demo mode
- Animated dashboard icons can work independently or integrated
- Voice chat requires `config.js` for ElevenLabs agent configuration

### Data Flow:
1. `config.js` → loads ElevenLabs and Claude API configurations
2. `main.js` → initializes all modules with enhanced authentication
3. Feature modules → use `utils.js` for common operations
4. AI modules → communicate through `ai-service.js`
5. Voice chat → connects to ElevenLabs WebSocket API for real-time conversations
6. Backend functions → handle API communication
7. Data files → store persistent information
8. Dashboard → creates animated icons → displays real-time stats with animations
9. Authentication → supports URL parameters, localStorage, Google API, and demo mode
10. Voice integration → seamlessly integrates with existing text chat interface

### Recent Enhancements (Latest Update):
- **Password-Protected Voice Mode**: Premium voice chat feature with authentication system
- **ElevenLabs Secure Integration**: Private agent access using signed URLs and Netlify functions
- **Voice Authentication System**: Professional modal with support contact (support@01data.org)
- **Security Features**: Rate limiting, session management, and lockout protection
- **Premium Feature Messaging**: Clear instructions for obtaining voice access
- **Voice Chat Module**: Complete voice conversation system with audio processing
- **Voice UI Controls**: Professional voice mode toggle and status indicators
- **Audio Management**: Real-time audio capture, playback, and queue management
- **Voice Activity Detection**: Visual indicators for voice activity and connection status
- **Seamless Integration**: Voice mode works alongside existing text chat functionality
- **Secure Configuration**: Environment variable protection for API keys and agent IDs
- **Enhanced Error Handling**: Improved audio buffer handling and connection management
- **Browser Compatibility**: Cross-browser support with proper error handling
- **Animated Dashboard Icons**: Professional glass-morphism cards with 4 animated icon types
- **Enhanced Authentication**: Added demo mode, timeout handling, and better error management
- **Standalone Components**: Created reusable animated dashboard icons for other projects
- **Loading Screen Fix**: Prevented infinite loading with proper timeout handling
- **Development Mode**: Added demo mode bypass for easier testing and development