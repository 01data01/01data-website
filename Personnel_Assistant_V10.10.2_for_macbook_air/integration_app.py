#!/usr/bin/env python3
"""
Enhanced Personal Assistant with 01data Website Integration
This file shows how to modify the existing app.py to integrate with the main website's authentication
"""

from flask import Flask, render_template, request, jsonify, redirect, url_for, make_response
from datetime import datetime, timedelta
import calendar
from personal_assistant import PersonalAssistant
import json
import os
from flask_wtf.csrf import CSRFProtect
from user_session import session_manager, get_user_from_request, require_authentication

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
csrf = CSRFProtect(app)

# Global assistant instance - will be user-specific
assistants = {}

def get_user_assistant(user_id: str) -> PersonalAssistant:
    """Get or create a Personal Assistant instance for a specific user"""
    if user_id not in assistants:
        # Create user-specific config directory
        user_config_dir = os.path.join(os.path.dirname(__file__), 'user_data', user_id)
        os.makedirs(user_config_dir, exist_ok=True)
        
        # Initialize Personal Assistant with user-specific config
        assistant = PersonalAssistant()
        assistant.config_file = os.path.join(user_config_dir, 'assistant_config.json')
        assistant.load_data()
        
        assistants[user_id] = assistant
    
    return assistants[user_id]

@app.context_processor
def inject_user():
    """Inject current user into all templates"""
    user = get_user_from_request(request)
    return dict(current_user=user)

@app.route('/login-required')
def login_required():
    """Show login required page with integration instructions"""
    return render_template('login_required.html')

@app.route('/auth/check')
def check_auth():
    """Check if user is authenticated from the main website"""
    # Check localStorage for user data (sent via JavaScript)
    user_data = request.args.get('user_data')
    
    if user_data:
        try:
            user_info = json.loads(user_data)
            user_id = user_info.get('id') or user_info.get('sub')
            
            if user_id:
                # Create or update session
                session_data = session_manager.create_session(user_info)
                
                # Set cookie for future requests
                response = make_response(redirect(url_for('suggested_tasks')))
                response.set_cookie('personal_assistant_user', 
                                  json.dumps(user_info), 
                                  max_age=30*24*60*60)  # 30 days
                return response
        except json.JSONDecodeError:
            pass
    
    return redirect(url_for('login_required'))

@app.route('/')
def index():
    """Enhanced index route with user authentication"""
    user = get_user_from_request(request)
    
    if not user:
        # Check if user data is in URL params (from main website)
        user_data = request.args.get('user_data')
        if user_data:
            return redirect(url_for('check_auth', user_data=user_data))
        
        return redirect(url_for('login_required'))
    
    # User is authenticated, redirect to suggested tasks
    return redirect(url_for('suggested_tasks'))

@app.route('/suggested-tasks')
def suggested_tasks():
    """Enhanced suggested tasks with user-specific data"""
    user = get_user_from_request(request)
    
    if not user:
        return redirect(url_for('login_required'))
    
    # Get user-specific assistant
    assistant = get_user_assistant(user['user_id'])
    
    # Get suggested tasks with smart prioritization
    suggested = assistant.get_suggested_tasks(5)
    
    # Get upcoming tasks for the next week
    today = datetime.now()
    week_later = (today + timedelta(days=7)).strftime('%Y-%m-%d')
    today_str = today.strftime('%Y-%m-%d')
    upcoming = assistant.get_tasks(status='todo', start_date=today_str, end_date=week_later)
    
    # Filter out any tasks already in suggested
    suggested_ids = [task['id'] for task in suggested]
    upcoming = [task for task in upcoming if task['id'] not in suggested_ids][:5]
    
    # Get free time tasks
    all_tasks = assistant.get_tasks(status='todo')
    freetime_tasks = [task for task in all_tasks if not task.get('due_date') and task.get('task_type') == 'freetime'][:3]
    
    # Calculate productivity metrics
    metrics = calculate_productivity_metrics(assistant)
    
    return render_template('suggested_tasks.html',
                         active_view='suggested',
                         suggested_tasks=suggested,
                         upcoming_tasks=upcoming,
                         freetime_tasks=freetime_tasks,
                         metrics=metrics,
                         today=today,
                         user=user)

@app.route('/chat')
@app.route('/chat/<string:conversation_id>')
def chat(conversation_id=None):
    """Enhanced chat with user-specific conversations"""
    user = get_user_from_request(request)
    
    if not user:
        return redirect(url_for('login_required'))
    
    # Get user-specific assistant
    assistant = get_user_assistant(user['user_id'])
    
    try:
        conversations = assistant.get_all_conversations()
        deleted_conversations = assistant.get_deleted_conversations()
        
        current_conversation = None
        if conversation_id:
            current_conversation = assistant.get_conversation(conversation_id)
            if not current_conversation:
                conversation_id = None
        elif conversations:
            first_conversation = assistant.get_conversation(conversations[0]['id']) if conversations else None
            if first_conversation:
                return redirect(url_for('chat', conversation_id=conversations[0]['id']))
            
        # Create a new conversation if none exist
        if not conversations and not conversation_id:
            conversation_id = assistant.create_new_conversation()
            current_conversation = assistant.get_conversation(conversation_id)
            return redirect(url_for('chat', conversation_id=conversation_id))
            
        return render_template('chat.html',
                            active_view='chat',
                            conversations=conversations,
                            deleted_conversations=deleted_conversations,
                            current_conversation=current_conversation,
                            current_conversation_id=conversation_id,
                            user=user)
    except Exception as e:
        app.logger.error(f"Error in chat route: {str(e)}")
        return render_template('chat.html',
                            active_view='chat',
                            conversations=[],
                            deleted_conversations=[],
                            current_conversation=None,
                            current_conversation_id=None,
                            error=str(e),
                            user=user)

@app.route('/api/chat', methods=['POST'])
@csrf.exempt
def handle_chat():
    """Enhanced chat API with user-specific processing"""
    user = get_user_from_request(request)
    
    if not user:
        return jsonify({'error': 'Authentication required'}), 401
    
    # Get user-specific assistant
    assistant = get_user_assistant(user['user_id'])
    
    data = request.get_json()
    message = data.get('message')
    conversation_id = data.get('conversation_id')
    
    if not message:
        return jsonify({'error': 'No message provided'}), 400

    if not conversation_id:
        conversation_id = assistant.create_new_conversation()

    def generate():
        try:
            # Add user context to the message
            enhanced_message = f"[User: {user['name']} ({user['email']})]\n{message}"
            
            text_stream = assistant.chat_with_claude(conversation_id, enhanced_message, stream=True)
            for text in text_stream:
                yield f"data: {json.dumps({'chunk': text})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return Response(stream_with_context(generate()), 
                   mimetype='text/event-stream')

def calculate_productivity_metrics(assistant):
    """Calculate productivity metrics for the user"""
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Get all tasks for this user
    all_tasks = assistant.get_tasks()
    regular_tasks = [task for task in all_tasks if task.get('due_date') and not task.get('is_recurring', False)]
    
    # Count tasks due today
    due_today = len([task for task in regular_tasks if task.get('due_date') == today])
    
    # Count overdue tasks
    overdue = len([task for task in regular_tasks if task.get('due_date') < today and task.get('status') != 'done'])
    
    # Count completed tasks
    completed = len([task for task in regular_tasks if task.get('status') == 'done'])
    
    # Calculate completion rate
    total = len(regular_tasks)
    completion_rate = round((completed / total * 100) if total > 0 else 0)
    
    return {
        'due_today': due_today,
        'overdue': overdue,
        'completed': completed,
        'total': total,
        'completion_rate': completion_rate
    }

# Create login required template
@app.before_first_request
def create_templates():
    """Create necessary template files for integration"""
    templates_dir = os.path.join(os.path.dirname(__file__), 'templates')
    
    # Create login_required.html template
    login_template = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In Required - Intelligent Management</title>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #f0fffe 0%, #e8f8f5 40%, #e1f5fe 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            max-width: 500px;
            padding: 40px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            text-align: center;
        }
        h1 {
            color: #2c5f5d;
            margin-bottom: 20px;
        }
        p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .btn {
            background: linear-gradient(135deg, #4db6ac, #26a69a);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 25px;
            font-weight: 600;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.3s ease;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧠 Intelligent Management</h1>
        <p>Please sign in through the main 01data website to access your personalized AI assistant.</p>
        <p>Your intelligent task management system is waiting for you!</p>
        <a href="../index.html" class="btn">Go to 01data Website</a>
    </div>
    
    <script>
        // Try to get user data from localStorage (set by main website)
        const userData = localStorage.getItem('personal_assistant_user');
        if (userData) {
            // Redirect to auth check with user data
            window.location.href = '/auth/check?user_data=' + encodeURIComponent(userData);
        }
        
        // Listen for messages from parent window (if opened from main site)
        window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'USER_DATA') {
                // Store user data and redirect
                localStorage.setItem('personal_assistant_user', JSON.stringify(event.data.user));
                window.location.href = '/auth/check?user_data=' + encodeURIComponent(JSON.stringify(event.data.user));
            }
        });
    </script>
</body>
</html>'''
    
    os.makedirs(templates_dir, exist_ok=True)
    
    login_template_path = os.path.join(templates_dir, 'login_required.html')
    if not os.path.exists(login_template_path):
        with open(login_template_path, 'w') as f:
            f.write(login_template)

# Add user information to all task-related routes
# (You would need to modify each existing route to include user context)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)