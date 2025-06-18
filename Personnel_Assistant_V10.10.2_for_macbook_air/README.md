# Personal Assistant

A web-based personal assistant with calendar, task management, and Claude AI integration.

## Features

- Calendar Views (Monthly, Weekly, Daily)
- Task Management
- Claude AI Integration
- Event Creation and Management
- Task Priority Levels
- Responsive Web Interface

## Setup

1. Create a virtual environment (optional but recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install requirements:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file and add your Claude API key:
```
CLAUDE_API_KEY=your_api_key_here
```

4. Run the application:
```bash
python app.py
```

5. Open your browser and navigate to:
```
http://localhost:8080
```

## Usage

- Use the sidebar to navigate between different views
- Click "Add Task" to create new tasks/events
- Click on any task/event to edit or delete it
- Tasks will appear in all calendar views
- Use the Ask Claude feature for AI assistance

## File Structure

```
.
├── app.py                  # Main Flask application
├── personal_assistant.py   # Personal Assistant class
├── requirements.txt        # Python dependencies
├── .env                   # Environment variables
├── assistant_config.json   # Data storage
└── templates/             # HTML templates
    ├── base.html
    ├── monthly_view.html
    ├── weekly_view.html
    ├── daily_view.html
    ├── tasks.html
    ├── ask_claude.html
    ├── task_modal.html
    └── task_details_modal.html
```