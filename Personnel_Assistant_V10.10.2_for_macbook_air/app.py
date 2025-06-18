from flask import Flask, render_template, request, jsonify, redirect, url_for, abort, Response, stream_with_context
from datetime import datetime, timedelta
import calendar
from personal_assistant import PersonalAssistant
import json
import os
from flask_wtf.csrf import CSRFProtect

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
csrf = CSRFProtect(app)
assistant = PersonalAssistant()

def parse_time_string(time_str):
    """Helper function to parse various time formats"""
    if not time_str:
        return None
    
    time_str = time_str.strip()
    
    # Remove timezone suffix if present
    for tz in ['PST', 'PDT', 'EST', 'EDT', 'GMT', 'UTC']:
        time_str = time_str.replace(tz, '').strip()
    
    # Try different time formats
    formats = [
        '%H:%M',           # 24-hour format
        '%I:%M %p',        # 12-hour format with AM/PM
        '%I:%M%p',         # 12-hour format without space
        '%I:%M'            # 12-hour format without AM/PM
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(time_str, fmt).strftime('%H:%M')
        except ValueError:
            continue
    
    return time_str

@app.template_filter('datetime')
def format_datetime(value):
    """Convert ISO datetime to human-readable format"""
    if not value:
        return ''
    try:
        dt = datetime.fromisoformat(value)
        return dt.strftime('%Y-%m-%d %I:%M %p')  # 12-hour format with AM/PM
    except ValueError:
        return value

@app.template_filter('format_date')
def format_date(date_str):
    """Convert YYYY-MM-DD to Month Day, Year"""
    if not date_str:
        return ''
    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        return date_obj.strftime('%B %d, %Y')
    except ValueError:
        return date_str

@app.template_filter('format_time')
def format_time(time_str):
    """Convert time with improved handling of various formats"""
    if not time_str:
        return ''
    try:
        # Handle time ranges
        if ' - ' in time_str:
            start_time, end_time = time_str.split(' - ')
            # Parse and convert both times
            start_24h = parse_time_string(start_time)
            end_24h = parse_time_string(end_time)
            
            if start_24h and end_24h:
                start_formatted = datetime.strptime(start_24h, '%H:%M').strftime('%I:%M %p').lstrip('0')
                end_formatted = datetime.strptime(end_24h, '%H:%M').strftime('%I:%M %p').lstrip('0')
                return f"{start_formatted} - {end_formatted}"
            return time_str
        
        # Handle single time
        time_24h = parse_time_string(time_str)
        if time_24h:
            time_obj = datetime.strptime(time_24h, '%H:%M')
            return time_obj.strftime('%I:%M %p').lstrip('0')
        return time_str
        
    except (ValueError, AttributeError) as e:
        print(f"Error formatting time '{time_str}': {str(e)}")
        return time_str

@app.template_filter('format_duration')
def format_duration(minutes):
    """Convert minutes to human readable duration"""
    if not minutes:
        return ''
    try:
        minutes = int(minutes)
        if minutes >= 1440:  # days
            days = minutes // 1440
            return f"{days} {'day' if days == 1 else 'days'}"
        elif minutes >= 60:  # hours
            hours = minutes // 60
            return f"{hours} {'hour' if hours == 1 else 'hours'}"
        else:  # minutes
            return f"{minutes} {'minute' if minutes == 1 else 'minutes'}"
    except (ValueError, TypeError):
        return str(minutes)

@app.context_processor
def utility_processor():
    """Inject utility functions into templates"""
    def now():
        return datetime.now(assistant.timezone)
    
    def format_timezone():
        return assistant.timezone.zone
    
    def parse_date(date_str):
        """Parse date string in various formats"""
        formats = ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y']
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt).strftime('%Y-%m-%d')
            except ValueError:
                continue
        return date_str
    
    return dict(
        now=now, 
        format_timezone=format_timezone,
        parse_date=parse_date
    )

@app.route('/')
def index():
    # Redirect to the suggested tasks view instead of regular tasks
    return redirect(url_for('suggested_tasks'))

@app.route('/monthly')
def monthly_view():
    today = datetime.now()
    year = int(request.args.get('year', today.year))
    month = int(request.args.get('month', today.month))
    
    if month == 1:
        prev_month = (year - 1, 12)
    else:
        prev_month = (year, month - 1)
        
    if month == 12:
        next_month = (year + 1, 1)
    else:
        next_month = (year, month + 1)
    
    cal = calendar.monthcalendar(year, month)
    month_name = calendar.month_name[month]
    
    tasks = {}
    for week in cal:
        for day in week:
            if day != 0:
                date = f"{year}-{month:02d}-{day:02d}"
                day_tasks = assistant.get_tasks_by_date(date)
                if day_tasks:
                    tasks[date] = day_tasks
    
    return render_template('monthly_view.html',
                         active_view='monthly',
                         year=year,
                         month=month,
                         month_name=month_name,
                         calendar_data=cal,
                         tasks=tasks,
                         prev_month=prev_month,
                         next_month=next_month,
                         current_day=today.day,
                         current_month=today.month,
                         current_year=today.year,
                         today=today)

@app.route('/weekly')
def weekly_view():
    date_str = request.args.get('date')
    if date_str:
        current_date = datetime.strptime(date_str, '%Y-%m-%d')
    else:
        current_date = datetime.now()
    
    week_start = current_date - timedelta(days=current_date.weekday())
    
    tasks = {}
    for day_offset in range(7):
        current_day = week_start + timedelta(days=day_offset)
        date_key = current_day.strftime('%Y-%m-%d')
        day_tasks = assistant.get_tasks_by_date(date_key)
        if day_tasks:
            tasks[date_key] = day_tasks
    
    return render_template('weekly_view.html',
                         active_view='weekly',
                         week_start=week_start,
                         tasks=tasks,
                         today=datetime.now(),
                         timedelta=timedelta)

@app.route('/daily')
def daily_view():
    date_str = request.args.get('date')
    if date_str:
        try:
            current_date = datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            current_date = datetime.now()
    else:
        current_date = datetime.now()

    prev_day = (current_date - timedelta(days=1)).strftime('%Y-%m-%d')
    next_day = (current_date + timedelta(days=1)).strftime('%Y-%m-%d')
    
    tasks = assistant.get_tasks_by_date(current_date.strftime('%Y-%m-%d'))
    
    return render_template('daily_view.html',
                         active_view='daily',
                         current_date=current_date,
                         tasks=tasks,
                         prev_day=prev_day,
                         next_day=next_day,
                         today=datetime.now())

@app.route('/add-task', methods=['POST'])
def add_task():
    data = request.get_json() if request.is_json else request.form
    
    description = data.get('description')
    date = data.get('date')
    time = data.get('time')
    priority = int(data.get('priority', 2))
    status = data.get('status', 'todo')
    notes = data.get('notes')
    
    # Convert time to 24-hour format if provided
    if time:
        time_24h = parse_time_string(time)
        if time_24h:
            time = time_24h
    
    # Handle multiple reminders
    reminders = []
    for i in range(1, 6):
        amount = data.get(f'reminder_amount_{i}')
        unit = data.get(f'reminder_unit_{i}')
        
        if amount and unit:
            amount = int(amount)
            if unit == 'hours':
                reminders.append(amount * 60)
            elif unit == 'days':
                reminders.append(amount * 24 * 60)
            else:
                reminders.append(amount)
    
    task_id = assistant.add_task(
        description=description,
        due_date=date,
        time=time,
        priority=priority,
        status=status,
        reminders=reminders,
        notes=notes
    )
    
    if request.is_json:
        return jsonify({'success': bool(task_id), 'task_id': task_id})
    
    return_view = data.get('return_view', 'tasks')
    if return_view == 'daily':
        return redirect(url_for('daily_view', date=date))
    elif return_view == 'weekly':
        return redirect(url_for('weekly_view', date=date))
    elif return_view == 'tasks':
        return redirect(url_for('tasks'))
    else:
        return redirect(url_for('monthly_view'))

@app.route('/freetime-tasks')
def freetime_tasks():
    # Get free time tasks (tasks without a due date)
    all_tasks = assistant.get_tasks()
    freetime_tasks = [task for task in all_tasks if not task.get('due_date')]
    
    return render_template('freetime_tasks.html',
                         active_view='freetime',
                         freetime_tasks=freetime_tasks)

@app.route('/add-freetime-task', methods=['POST'])
def add_freetime_task():
    data = request.form
    
    description = data.get('description')
    priority = int(data.get('priority', 2))
    notes = data.get('notes')
    estimated_time = data.get('estimated_time')
    
    # Additional properties for free time tasks
    task_properties = {
        'task_type': 'freetime', 
        'estimated_time': estimated_time
    }
    
    # Add the task without a due date
    task_id = assistant.add_task(
        description=description,
        due_date=None,
        time=None,
        priority=priority,
        status='todo',
        reminders=[],
        notes=notes,
        **task_properties
    )
    
    return redirect(url_for('freetime_tasks'))

@app.route('/update-task', methods=['POST'])
def update_task():
    data = request.get_json() if request.is_json else request.form
    
    task_id = data.get('id')
    description = data.get('description')
    date = data.get('date')
    time = data.get('time')
    priority = int(data.get('priority', 2))
    notes = data.get('notes')
    task_type = data.get('task_type')
    
    # Handle freetime tasks
    if task_type == 'freetime':
        estimated_time = data.get('estimated_time', '')
        
        success = assistant.update_task(
            task_id=task_id,
            description=description,
            due_date=None,
            time=None,
            priority=priority,
            reminders=[],
            notes=notes,
            task_type='freetime',
            estimated_time=estimated_time
        )
        
        if request.is_json:
            return jsonify({'success': success})
        
        return redirect(url_for('freetime_tasks'))
    
    # Handle regular tasks
    else:
        # Convert time to 24-hour format if provided
        if time:
            time_24h = parse_time_string(time)
            if time_24h:
                time = time_24h
        
        # Handle multiple reminders
        reminders = []
        for i in range(1, 6):
            amount = data.get(f'reminder_amount_{i}')
            unit = data.get(f'reminder_unit_{i}')
            
            if amount and unit:
                amount = int(amount)
                if unit == 'hours':
                    reminders.append(amount * 60)
                elif unit == 'days':
                    reminders.append(amount * 24 * 60)
                else:
                    reminders.append(amount)
        
        success = assistant.update_task(
            task_id=task_id,
            description=description,
            due_date=date,
            time=time,
            priority=priority,
            reminders=reminders,
            notes=notes
        )
        
        if request.is_json:
            return jsonify({'success': success})
        
        return_view = data.get('return_view', 'tasks')
        if return_view == 'daily':
            return redirect(url_for('daily_view', date=date))
        elif return_view == 'weekly':
            return redirect(url_for('weekly_view', date=date))
        elif return_view == 'tasks':
            return redirect(url_for('tasks'))
        elif return_view == 'freetime':
            return redirect(url_for('freetime_tasks'))
        else:
            return redirect(url_for('monthly_view'))

@app.route('/update-task-status/<string:task_id>', methods=['POST'])
def update_task_status(task_id):
    data = request.get_json()
    status = data.get('status')
    if status not in ['todo', 'done']:
        return jsonify({'error': 'Invalid status'}), 400
    
    success = assistant.update_task_status(task_id, status)
    return jsonify({'success': success})

@app.route('/delete-task/<string:task_id>', methods=['POST'])
def delete_task(task_id):
    success = assistant.delete_task(task_id)
    
    if request.is_json:
        return jsonify({'success': success})
    
    return_view = request.args.get('return_view', 'tasks')
    if return_view == 'daily':
        return redirect(url_for('daily_view'))
    elif return_view == 'weekly':
        return redirect(url_for('weekly_view'))
    elif return_view == 'tasks':
        return redirect(url_for('tasks'))
    elif return_view == 'freetime':
        return redirect(url_for('freetime_tasks'))
    else:
        return redirect(url_for('monthly_view'))

@app.route('/chat')
@app.route('/chat/<string:conversation_id>')
def chat(conversation_id=None):
    try:
        conversations = assistant.get_all_conversations()
        deleted_conversations = assistant.get_deleted_conversations()
        
        current_conversation = None
        if conversation_id:
            current_conversation = assistant.get_conversation(conversation_id)
            if not current_conversation:
                # Instead of redirecting which could cause a loop,
                # we'll just render the template with no conversation selected
                conversation_id = None
        elif conversations:
            # Only redirect if we have conversations and we're sure the first one exists
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
                            current_conversation_id=conversation_id)
    except Exception as e:
        # Log the error for debugging
        app.logger.error(f"Error in chat route: {str(e)}")
        # Render a basic error template instead of redirecting
        return render_template('chat.html',
                            active_view='chat',
                            conversations=[],
                            deleted_conversations=[],
                            current_conversation=None,
                            current_conversation_id=None,
                            error=str(e))

@app.route('/chat/create')
def create_chat():
    conversation_id = assistant.create_new_conversation()
    return redirect(url_for('chat', conversation_id=conversation_id))

@app.route('/chat/<string:conversation_id>/delete', methods=['POST'])
def delete_chat(conversation_id):
    success = assistant.delete_conversation(conversation_id)
    return jsonify({'success': success})

@app.route('/chat/<string:conversation_id>/recover', methods=['POST'])
def recover_chat(conversation_id):
    success = assistant.recover_conversation(conversation_id)
    return jsonify({'success': success})


@app.route('/chat/<string:conversation_id>/permanent-delete', methods=['POST'])
def permanent_delete_chat(conversation_id):
    success = assistant.permanently_delete_conversation(conversation_id)
    return jsonify({'success': success})

@app.route('/chat/<string:conversation_id>/title', methods=['POST'])
def update_chat_title(conversation_id):
    data = request.get_json()
    title = data.get('title')
    if not title:
        return jsonify({'error': 'Title is required'}), 400
    
    success = assistant.update_conversation_title(conversation_id, title)
    return jsonify({'success': success})

@app.route('/tasks')
def tasks():
    status_filter = request.args.get('status')
    # Only get tasks WITH a due date (to exclude free time tasks)
    all_tasks = assistant.get_tasks(status=status_filter)
    tasks = [task for task in all_tasks if task.get('due_date')]
    
    return render_template('tasks.html',
                         active_view='tasks',
                         tasks=tasks,
                         today=datetime.now())

@app.route('/todo-done')
def todo_done():
    # Get todo tasks (with due dates)
    all_todo_tasks = assistant.get_tasks(status='todo')
    todo_tasks = [task for task in all_todo_tasks if task.get('due_date')]
    
    # Get done tasks (with due dates)
    all_done_tasks = assistant.get_tasks(status='done')
    done_tasks = [task for task in all_done_tasks if task.get('due_date')]
    
    return render_template('todo_done.html',
                         active_view='todo-done',
                         todo_tasks=todo_tasks,
                         done_tasks=done_tasks)

@app.route('/api/chat', methods=['POST'])
@csrf.exempt
def handle_chat():
    data = request.get_json()
    message = data.get('message')
    conversation_id = data.get('conversation_id')
    
    if not message:
        return jsonify({'error': 'No message provided'}), 400

    if not conversation_id:
        conversation_id = assistant.create_new_conversation()

    def generate():
        try:
            text_stream = assistant.chat_with_claude(conversation_id, message, stream=True)
            for text in text_stream:
                yield f"data: {json.dumps({'chunk': text})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return Response(stream_with_context(generate()), 
                   mimetype='text/event-stream')

@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('q', '')
    if not query:
        return jsonify({'tasks': []})
    
    tasks = []
    for task in assistant.tasks:
        if query.lower() in task['description'].lower():
            tasks.append(task)
    
    return jsonify({'tasks': tasks})

@app.route('/calendar/export', methods=['POST'])
def export_calendar():
    try:
        filepath = assistant.export_calendar()
        filename = os.path.basename(filepath)
        return jsonify({
            'success': True,
            'filename': filename,
            'message': f'Calendar exported successfully to {filename}'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/calendar/import', methods=['POST'])
def import_calendar():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if not file.filename.endswith('.json'):
        return jsonify({'error': 'Invalid file format. Please upload a JSON file'}), 400

    merge = request.form.get('merge', 'false').lower() == 'true'
    
    try:
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        file.save(temp_path)
        
        stats = assistant.import_calendar(temp_path, merge=merge)
        os.remove(temp_path)
        
        return jsonify({
            'success': True,
            'stats': stats,
            'message': 'Calendar imported successfully'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/suggested-tasks')
def suggested_tasks():
    # Get suggested tasks with smart prioritization
    suggested = assistant.get_suggested_tasks(5)
    
    # Get upcoming tasks for the next week
    today = datetime.now()
    week_later = (today + timedelta(days=7)).strftime('%Y-%m-%d')
    today_str = today.strftime('%Y-%m-%d')
    upcoming = assistant.get_tasks(status='todo', start_date=today_str, end_date=week_later)
    # Filter out any tasks already in suggested
    suggested_ids = [task['id'] for task in suggested]
    upcoming = [task for task in upcoming if task['id'] not in suggested_ids][:5]  # Limit to 5
    
    # Get free time tasks
    all_tasks = assistant.get_tasks(status='todo')
    freetime_tasks = [task for task in all_tasks if not task.get('due_date') and task.get('task_type') == 'freetime'][:3]  # Limit to 3
    
    # Calculate productivity metrics
    metrics = calculate_productivity_metrics()
    
    return render_template('suggested_tasks.html',
                         active_view='suggested',
                         suggested_tasks=suggested,
                         upcoming_tasks=upcoming,
                         freetime_tasks=freetime_tasks,
                         metrics=metrics,
                         today=today)

def calculate_productivity_metrics():
    """Calculate productivity metrics for the dashboard"""
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Get all tasks
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

@app.route('/recurring-tasks')
def recurring_tasks():
    # Get all recurring tasks
    recurring = assistant.get_recurring_tasks()
    
    # Get all child tasks for the recurring tasks
    child_tasks = []
    for task in recurring:
        for child_id in task.get('child_tasks', []):
            child = next((t for t in assistant.tasks if t.get('id') == child_id), None)
            if child:
                child_tasks.append(child)
    
    return render_template('recurring_tasks.html',
                         active_view='recurring',
                         recurring_tasks=recurring,
                         child_tasks=child_tasks)

@app.route('/add-recurring-task', methods=['POST'])
def add_recurring_task():
    data = request.form
    
    # Extract basic task information
    description = data.get('description')
    start_date = data.get('start_date')
    time = data.get('time')
    priority = int(data.get('priority', 2))
    notes = data.get('notes')
    
    # Extract recurrence pattern
    recurrence_type = data.get('recurrence_type', 'daily')
    interval = int(data.get('interval', 1))
    
    # Process specific pattern details based on type
    additional_properties = {}
    
    if recurrence_type == 'weekly':
        week_days = data.getlist('week_days')
        week_days = [int(day) for day in week_days] if week_days else []
        additional_properties['week_days'] = week_days
    
    elif recurrence_type == 'monthly':
        day_of_month = data.get('day_of_month')
        if day_of_month:
            additional_properties['day_of_month'] = int(day_of_month)
    
    elif recurrence_type == 'yearly':
        month_of_year = data.get('month_of_year')
        yearly_day = data.get('yearly_day')
        if month_of_year:
            additional_properties['month_of_year'] = int(month_of_year)
        if yearly_day:
            additional_properties['day_of_month'] = int(yearly_day)
    
    # Extract end conditions
    end_type = data.get('end_type', 'never')
    end_date = data.get('end_date') if end_type == 'on_date' else None
    end_count = int(data.get('end_count', 10)) if end_type == 'after_count' else None
    
    # Process reminders
    reminders = []
    for i in range(1, 6):
        amount = data.get(f'reminder_amount_{i}')
        unit = data.get(f'reminder_unit_{i}')
        
        if amount and unit:
            amount = int(amount)
            if unit == 'hours':
                reminders.append(amount * 60)
            elif unit == 'days':
                reminders.append(amount * 24 * 60)
            else:
                reminders.append(amount)
    
    # Create the recurring task
    task_id = assistant.add_recurring_task(
        description=description,
        start_date=start_date,
        time=time,
        priority=priority,
        recurrence_type=recurrence_type,
        interval=interval,
        end_type=end_type,
        end_date=end_date,
        end_count=end_count,
        reminders=reminders,
        notes=notes,
        **additional_properties
    )
    
    # Redirect based on the return view
    return_view = data.get('return_view', 'recurring')
    
    if return_view == 'recurring':
        return redirect(url_for('recurring_tasks'))
    elif return_view == 'daily':
        return redirect(url_for('daily_view', date=start_date))
    elif return_view == 'weekly':
        return redirect(url_for('weekly_view', date=start_date))
    elif return_view == 'monthly':
        return redirect(url_for('monthly_view'))
    else:
        return redirect(url_for('suggested_tasks'))

@app.route('/delete-recurring-task/<string:task_id>', methods=['POST'])
def delete_recurring_task(task_id):
    success = assistant.delete_task(task_id)  # This handles deleting child tasks too
    return jsonify({'success': success})

@app.route('/generate-more-occurrences/<string:task_id>', methods=['POST'])
def generate_more_occurrences(task_id):
    # Find the recurring task
    task = next((t for t in assistant.tasks if t.get('id') == task_id and t.get('is_recurring')), None)
    
    if task:
        # Generate more occurrences
        assistant._generate_next_recurring_tasks(task, count=10)
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'error': 'Task not found'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
