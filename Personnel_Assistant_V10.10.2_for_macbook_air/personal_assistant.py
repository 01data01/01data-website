import os
import json
import anthropic
from typing import Dict, List, Optional, Union, Any, Generator
from datetime import datetime, timedelta
from dotenv import load_dotenv
import uuid
import pytz

class PersonalAssistant:
    def __init__(self):
        load_dotenv()
        self._initialize_api()
        self._initialize_data()

    def _initialize_api(self):
        """Initialize Claude API and timezone settings"""
        self.api_key = os.getenv('CLAUDE_API_KEY')
        if not self.api_key:
            raise ValueError("CLAUDE_API_KEY not found in .env file")
        
        self.timezone = pytz.timezone('America/Los_Angeles')
        try:
            self.client = anthropic.Anthropic(api_key=self.api_key)
        except Exception as e:
            raise Exception(f"Failed to initialize Anthropic client: {str(e)}")

    def _initialize_data(self):
        """Initialize data structures and load saved data"""
        self.tasks = []
        self.conversations = {}
        self.deleted_conversations = {}
        self.projects = []  # New structure for project management
        self.config_dir = os.path.dirname(os.path.abspath(__file__))
        self.config_file = os.path.join(self.config_dir, "assistant_config.json")
        self.load_data()
        
        # Process recurring tasks on initialization
        self._process_recurring_tasks()

    def load_data(self):
        """Load data from config file"""
        try:
            with open(self.config_file, 'r') as f:
                data = json.load(f)
                self.tasks = data.get('tasks', [])
                self.conversations = data.get('conversations', {})
                self.deleted_conversations = data.get('deleted_conversations', {})
                self.projects = data.get('projects', [])  # Load projects
        except FileNotFoundError:
            self.save_data()

    def save_data(self):
        """Save data and create auto-backup"""
        try:
            with open(self.config_file, 'w') as f:
                json.dump({
                    'tasks': self.tasks,
                    'conversations': self.conversations,
                    'deleted_conversations': self.deleted_conversations,
                    'projects': self.projects  # Save projects
                }, f, indent=4)
            
            self._auto_backup()
        except Exception as e:
            print(f"Error saving data: {str(e)}")

    def _auto_backup(self):
        """Create automatic backup with rotation"""
        try:
            timestamp = self._get_current_datetime().strftime('%Y%m%d_%H%M%S')
            filename = f"auto_backup_{timestamp}.json"
            backup_path = os.path.join(self.config_dir, 'backups', 'auto', filename)
            
            # Ensure auto-backup directory exists
            os.makedirs(os.path.dirname(backup_path), exist_ok=True)
            
            # Keep only last 5 auto-backups
            auto_backup_dir = os.path.join(self.config_dir, 'backups', 'auto')
            if os.path.exists(auto_backup_dir):
                existing_backups = sorted([
                    f for f in os.listdir(auto_backup_dir) 
                    if f.startswith('auto_backup_')
                ], reverse=True)
                
                while len(existing_backups) >= 5:
                    os.remove(os.path.join(auto_backup_dir, existing_backups.pop()))
            
            # Create new backup
            backup_data = {
                'tasks': self.tasks,
                'conversations': self.conversations,
                'deleted_conversations': self.deleted_conversations,
                'projects': self.projects,  # Include projects
                'backup_date': self._get_current_datetime().isoformat(),
                'version': '1.0'
            }
            
            with open(backup_path, 'w') as f:
                json.dump(backup_data, f, indent=4)
                
            return backup_path
        except Exception as e:
            print(f"Auto-backup failed: {str(e)}")
            return None

    def _get_priority_text(self, priority: int) -> str:
        """Convert priority number to human-readable text with emoji"""
        priority_map = {
            1: "⚡ High priority",
            2: "📌 Medium priority",
            3: "🔽 Low priority"
        }
        return priority_map.get(priority, "📌 Medium priority")

    def _format_time_difference(self, minutes: int) -> str:
        """Convert minutes to human readable time difference"""
        if minutes >= 1440:  # days
            days = minutes // 1440
            return f"{days} {'day' if days == 1 else 'days'}"
        elif minutes >= 60:  # hours
            hours = minutes // 60
            return f"{hours} {'hour' if hours == 1 else 'hours'}"
        else:  # minutes
            return f"{minutes} {'minute' if minutes == 1 else 'minutes'}"

    def add_task(self, description: str, due_date: str = None, time: str = None, 
                priority: int = 2, status: str = 'todo', reminders: List[int] = None, 
                notes: str = None, **additional_properties) -> str:
        """Add a new task with improved validation and formatting"""
        task_id = str(uuid.uuid4())
        current_time = self._get_current_datetime().isoformat()
        
        if reminders is None:
            reminders = []
            
        task = {
            'id': task_id,
            'description': description,
            'due_date': due_date,
            'time': time,
            'priority': priority,
            'status': status,
            'reminders': sorted(reminders),
            'notes': notes,
            'created_at': current_time,
            'last_modified': current_time
        }
        
        # Add any additional properties (for free time tasks or recurring tasks)
        for key, value in additional_properties.items():
            task[key] = value
            
        self.tasks.append(task)
        self.save_data()
        return task_id

    def add_recurring_task(self, description: str, start_date: str, time: str = None,
                          priority: int = 2, recurrence_type: str = 'daily', interval: int = 1,
                          end_type: str = 'never', end_date: str = None, end_count: int = None,
                          reminders: List[int] = None, notes: str = None, 
                          **additional_properties) -> str:
        """
        Add a recurring task to the system.
        
        Args:
            description: Task description
            start_date: First occurrence date (YYYY-MM-DD)
            time: Time of the task (HH:MM)
            priority: Task priority (1=high, 2=medium, 3=low)
            recurrence_type: Type of recurrence (daily, weekly, monthly, yearly)
            interval: Recurrence interval (e.g., every X days)
            end_type: When recurrence ends (never, on_date, after_count)
            end_date: Date when recurrence ends (for end_type='on_date')
            end_count: Number of occurrences (for end_type='after_count')
            reminders: List of reminder times in minutes before the event
            notes: Additional notes
            
        Returns:
            str: ID of the created task
        """
        task_id = str(uuid.uuid4())
        current_time = self._get_current_datetime().isoformat()
        
        if reminders is None:
            reminders = []
        
        # Create a master recurring task
        recurring_task = {
            'id': task_id,
            'description': description,
            'start_date': start_date,  # First occurrence
            'time': time,
            'priority': priority,
            'reminders': sorted(reminders),
            'notes': notes,
            'created_at': current_time,
            'last_modified': current_time,
            'is_recurring': True,
            'recurrence_type': recurrence_type,  # daily, weekly, monthly, yearly
            'interval': interval,  # every X days, weeks, etc.
            'end_type': end_type,  # never, on_date, after_count
            'end_date': end_date,  # Used if end_type='on_date'
            'end_count': end_count,  # Used if end_type='after_count'
            'current_count': 0,  # Track how many occurrences have been generated
            'week_days': additional_properties.get('week_days', []),  # For weekly, which days
            'day_of_month': additional_properties.get('day_of_month', None),  # For monthly
            'month_of_year': additional_properties.get('month_of_year', None),  # For yearly
            'parent_id': None,  # This is the parent
            'child_tasks': []  # IDs of individual instances
        }
        
        # Add any additional properties
        for key, value in additional_properties.items():
            if key not in recurring_task:
                recurring_task[key] = value
        
        # Create first occurrence of the task
        # This will be a child task with a reference to the parent
        child_task_id = self.add_task(
            description=description,
            due_date=start_date,
            time=time,
            priority=priority,
            status='todo',
            reminders=reminders,
            notes=notes,
            is_recurring_instance=True,
            parent_id=task_id
        )
        
        # Add this child to the parent's list
        recurring_task['child_tasks'].append(child_task_id)
        recurring_task['current_count'] = 1
        
        # Add the recurring task to the list
        self.tasks.append(recurring_task)
        self.save_data()
        
        return task_id

    def update_task(self, task_id: str, **kwargs) -> bool:
        """Update task with validation and modification tracking"""
        for task in self.tasks:
            if task['id'] == task_id:
                # Check if this is a recurring task
                if task.get('is_recurring', False):
                    return self._update_recurring_task(task, **kwargs)
                
                # Get list of valid fields for this task type
                valid_fields = {'description', 'due_date', 'time', 'priority', 
                              'status', 'reminders', 'notes'}
                
                # Add freetime and project fields if appropriate
                if task.get('task_type') == 'freetime':
                    valid_fields.add('estimated_time')
                
                if 'project_id' in task:
                    valid_fields.add('project_id')
                
                # Update the fields
                for field, value in kwargs.items():
                    if field in valid_fields:
                        if field == 'reminders' and value is not None:
                            task[field] = sorted(value)
                        else:
                            task[field] = value
                            
                task['last_modified'] = self._get_current_datetime().isoformat()
                self.save_data()
                return True
        return False

    def _update_recurring_task(self, task: Dict, **kwargs) -> bool:
        """
        Special handling for updating recurring tasks.
        
        Args:
            task: The recurring task to update
            **kwargs: Fields to update
            
        Returns:
            bool: True if successful
        """
        # Handle specific fields for recurring tasks
        special_fields = {'recurrence_type', 'interval', 'end_type', 
                         'end_date', 'end_count', 'week_days', 
                         'day_of_month', 'month_of_year'}
        
        # Update normal fields
        normal_fields = {'description', 'time', 'priority', 'reminders', 'notes'}
        
        # Update all normal fields first
        for field in normal_fields:
            if field in kwargs and kwargs[field] is not None:
                task[field] = kwargs[field]
        
        # Update special recurrence fields
        for field in special_fields:
            if field in kwargs and kwargs[field] is not None:
                task[field] = kwargs[field]
        
        # Handle change of start date (reschedule all future occurrences)
        if 'start_date' in kwargs and kwargs['start_date'] != task.get('start_date'):
            # Store new start date
            task['start_date'] = kwargs['start_date']
            # We need to regenerate all child tasks
            self._regenerate_recurring_tasks(task)
        
        task['last_modified'] = self._get_current_datetime().isoformat()
        self.save_data()
        return True

    def _regenerate_recurring_tasks(self, parent_task: Dict) -> None:
        """
        Regenerate all child tasks for a recurring task after changes.
        
        Args:
            parent_task: The parent recurring task
        """
        # Delete all child tasks
        child_ids = list(parent_task.get('child_tasks', []))
        for child_id in child_ids:
            self.delete_task(child_id)
        
        # Reset the child task list
        parent_task['child_tasks'] = []
        parent_task['current_count'] = 0
        
        # Generate new child tasks starting from the start date
        self._generate_next_recurring_tasks(parent_task)

    def _generate_next_recurring_tasks(self, parent_task: Dict, count: int = 10) -> None:
        """
        Generate the next batch of child tasks for a recurring task.
        
        Args:
            parent_task: The parent recurring task
            count: How many future occurrences to generate
        """
        # Don't generate more if we've reached the limit
        if parent_task.get('end_type') == 'after_count':
            if parent_task.get('current_count', 0) >= parent_task.get('end_count', 0):
                return
            # Adjust count to not exceed the limit
            count = min(count, parent_task.get('end_count', 0) - parent_task.get('current_count', 0))
            
        # Don't generate if we've passed the end date
        if parent_task.get('end_type') == 'on_date' and parent_task.get('end_date'):
            current_date = self._get_current_datetime().strftime('%Y-%m-%d')
            if current_date > parent_task.get('end_date'):
                return
        
        # Base attributes for child tasks
        description = parent_task.get('description')
        time = parent_task.get('time')
        priority = parent_task.get('priority', 2)
        reminders = parent_task.get('reminders', [])
        notes = parent_task.get('notes')
        
        # Determine the next date based on the last child or start date
        if parent_task.get('child_tasks'):
            # Find the latest child task
            latest_child_id = parent_task['child_tasks'][-1]
            latest_child = next((t for t in self.tasks if t.get('id') == latest_child_id), None)
            
            if latest_child:
                last_date = latest_child.get('due_date')
            else:
                last_date = parent_task.get('start_date')
        else:
            # No children yet, use start date
            last_date = parent_task.get('start_date')
        
        # Now calculate the next occurrence dates
        recurrence_type = parent_task.get('recurrence_type', 'daily')
        interval = parent_task.get('interval', 1)
        
        next_dates = self._calculate_next_dates(
            last_date, 
            count, 
            recurrence_type, 
            interval, 
            parent_task.get('week_days', []), 
            parent_task.get('day_of_month'), 
            parent_task.get('month_of_year')
        )
        
        # Check if we need to respect an end date
        if parent_task.get('end_type') == 'on_date' and parent_task.get('end_date'):
            next_dates = [d for d in next_dates if d <= parent_task.get('end_date')]
        
        # Create child tasks for each date
        for next_date in next_dates:
            child_task_id = self.add_task(
                description=description,
                due_date=next_date,
                time=time,
                priority=priority,
                status='todo',
                reminders=reminders,
                notes=notes,
                is_recurring_instance=True,
                parent_id=parent_task['id']
            )
            
            # Add this child to the parent's list
            parent_task['child_tasks'].append(child_task_id)
            parent_task['current_count'] += 1
            
            # Stop if we've reached the count limit
            if parent_task.get('end_type') == 'after_count':
                if parent_task.get('current_count', 0) >= parent_task.get('end_count', 0):
                    break
        
        self.save_data()

    def _calculate_next_dates(self, start_date: str, count: int, recurrence_type: str, 
                             interval: int, week_days: List[int] = None, 
                             day_of_month: int = None, month_of_year: int = None) -> List[str]:
        """
        Calculate the next occurrence dates based on recurrence pattern.
        
        Args:
            start_date: Starting date string (YYYY-MM-DD)
            count: How many dates to generate
            recurrence_type: Type of recurrence (daily, weekly, monthly, yearly)
            interval: Recurrence interval
            week_days: List of days of week (0=Monday, 6=Sunday)
            day_of_month: Day of month for monthly recurrence
            month_of_year: Month for yearly recurrence
            
        Returns:
            List[str]: List of date strings in YYYY-MM-DD format
        """
        if not week_days:
            week_days = []
            
        result_dates = []
        
        # Parse the start date
        current_date = datetime.strptime(start_date, '%Y-%m-%d')
        
        # Generate dates based on recurrence type
        if recurrence_type == 'daily':
            # Simple daily recurrence
            for i in range(count):
                current_date += timedelta(days=interval)
                result_dates.append(current_date.strftime('%Y-%m-%d'))
                
        elif recurrence_type == 'weekly':
            # Weekly recurrence with specific days
            if not week_days:
                # If no specific days, use the same day of week as start date
                week_days = [current_date.weekday()]
                
            # Sort the weekdays for consistent processing
            week_days = sorted(week_days)
            
            # Find the next occurrences
            i = 0
            while len(result_dates) < count:
                current_date += timedelta(days=1)
                
                # Check if we're at the start of a new interval week
                if i > 0 and current_date.weekday() == week_days[0] and i % interval == 0:
                    # This is the start of a new interval
                    pass
                    
                # Check if this is one of our target days
                if current_date.weekday() in week_days:
                    result_dates.append(current_date.strftime('%Y-%m-%d'))
                    i += 1
                
        elif recurrence_type == 'monthly':
            # Monthly recurrence
            if day_of_month is None:
                # Use the same day of month as start date
                day_of_month = current_date.day
                
            # Find the next occurrences
            for i in range(count):
                # Move to next month
                year = current_date.year
                month = current_date.month + interval
                
                # Handle year overflow
                while month > 12:
                    month -= 12
                    year += 1
                
                # Handle month lengths (e.g., Feb 30 -> Feb 28/29)
                _, last_day = self._month_range(year, month)
                actual_day = min(day_of_month, last_day)
                
                # Create the new date
                current_date = datetime(year, month, actual_day)
                result_dates.append(current_date.strftime('%Y-%m-%d'))
                
        elif recurrence_type == 'yearly':
            # Yearly recurrence
            if month_of_year is None:
                # Use the same month as start date
                month_of_year = current_date.month
                
            if day_of_month is None:
                # Use the same day as start date
                day_of_month = current_date.day
                
            # Find the next occurrences
            for i in range(count):
                # Move to next year
                year = current_date.year + interval
                
                # Handle month lengths (e.g., Feb 29 in leap years)
                _, last_day = self._month_range(year, month_of_year)
                actual_day = min(day_of_month, last_day)
                
                # Create the new date
                current_date = datetime(year, month_of_year, actual_day)
                result_dates.append(current_date.strftime('%Y-%m-%d'))
            
        return result_dates

    def _month_range(self, year: int, month: int) -> tuple:
        """Helper method to get first and last days of a month"""
        first_day = 1
        if month == 12:
            last_day = 31
        else:
            last_day = (datetime(year, month + 1, 1) - timedelta(days=1)).day
        return first_day, last_day

    def _process_recurring_tasks(self) -> None:
        """
        Process recurring tasks on startup to generate upcoming instances.
        This ensures that the calendar always shows upcoming recurring events.
        """
        current_date = self._get_current_datetime().strftime('%Y-%m-%d')
        
        # Find all recurring master tasks
        recurring_tasks = [task for task in self.tasks if task.get('is_recurring', False)]
        
        for task in recurring_tasks:
            # Check if we need to generate more instances
            last_child_id = task.get('child_tasks', [])[-1] if task.get('child_tasks') else None
            
            if last_child_id:
                # Find the last child task
                last_child = next((t for t in self.tasks if t.get('id') == last_child_id), None)
                
                if last_child and last_child.get('due_date'):
                    # Check if we should generate more
                    # We'll maintain at least 3 months of future occurrences
                    last_date = datetime.strptime(last_child.get('due_date'), '%Y-%m-%d')
                    current_datetime = self._get_current_datetime()
                    
                    # Generate more if we have less than 3 months into the future
                    if (last_date - current_datetime.replace(tzinfo=None)).days < 90:
                        self._generate_next_recurring_tasks(task)
            else:
                # No child tasks yet - generate initial batch
                self._generate_next_recurring_tasks(task)

    def delete_task(self, task_id: str) -> bool:
        """Delete a task with validation"""
        # First, check if this is a recurring parent task
        parent_task = next((task for task in self.tasks if task.get('id') == task_id and task.get('is_recurring')), None)
        
        if parent_task:
            # Delete all child tasks first
            for child_id in parent_task.get('child_tasks', []):
                # Find and remove child
                for i, task in enumerate(self.tasks):
                    if task['id'] == child_id:
                        self.tasks.pop(i)
                        break
        
        # Now delete the task itself
        for i, task in enumerate(self.tasks):
            if task['id'] == task_id:
                # If this is a recurring instance, remove it from parent's list
                if task.get('is_recurring_instance') and task.get('parent_id'):
                    parent = next((p for p in self.tasks if p.get('id') == task.get('parent_id')), None)
                    if parent and task_id in parent.get('child_tasks', []):
                        parent['child_tasks'].remove(task_id)
                
                # Remove the task
                self.tasks.pop(i)
                self.save_data()
                return True
                
        return False

    def get_tasks_by_date(self, date: str) -> List[Dict]:
        """Get tasks for a specific date, sorted by time and priority"""
        return sorted(
            [task for task in self.tasks if task.get('due_date') == date],
            key=self.sort_key_tasks
        )


    def get_tasks(self, status: str = None, start_date: str = None, end_date: str = None) -> List[Dict]:
        """Get filtered tasks with improved sorting"""
        filtered_tasks = self.tasks
        
        # Filter out recurring parent tasks (they shouldn't appear in views)
        filtered_tasks = [task for task in filtered_tasks if not task.get('is_recurring', False)]
        
        # Apply other filters
        if status:
            filtered_tasks = [task for task in filtered_tasks if task.get('status') == status]
        
        # Fix handling of None values in due_date
        if start_date:
            filtered_tasks = [task for task in filtered_tasks if (task.get('due_date') is not None and task.get('due_date') >= start_date)]
        
        if end_date:
            filtered_tasks = [task for task in filtered_tasks if (task.get('due_date') is not None and task.get('due_date') <= end_date)]
        
        return sorted(filtered_tasks, key=self.sort_key_tasks)

    def get_recurring_tasks(self) -> List[Dict]:
        """Get all recurring task master records (not the instances)"""
        return [task for task in self.tasks if task.get('is_recurring', False)]

    def update_task_status(self, task_id: str, status: str) -> bool:
        """Update task status with validation"""
        if status not in ['todo', 'done']:
            return False
        return self.update_task(task_id, status=status)

    def _get_current_datetime(self):
        """Get current datetime in configured timezone"""
        return datetime.now(self.timezone)

    def sort_key_tasks(self, task: Dict) -> tuple:
        """Sort tasks by date, time, and priority"""
        return (
            task.get('due_date') or '9999-12-31',
            task.get('time') or '23:59',
            task.get('priority', 2)
        )

    def create_new_conversation(self) -> str:
        """
        Create a new conversation with tracking.
        Ensures all required timestamp fields are set.
        
        Returns:
            str: ID of the new conversation
        """
        conversation_id = str(uuid.uuid4())
        current_time = self._get_current_datetime().isoformat()
        
        self.conversations[conversation_id] = {
            'title': 'New Conversation',
            'messages': [],
            'created_at': current_time,
            'updated_at': current_time  # Ensure updated_at is always set
        }
        self.save_data()
        return conversation_id

    def get_conversation(self, conversation_id: str) -> Optional[Dict]:
        """Get conversation by ID"""
        return self.conversations.get(conversation_id)

    def update_conversation(self, conversation_id: str, message_content: str, response_content: str):
        """
        Update conversation with new messages.
        Ensures all timestamp fields are properly maintained.
        
        Args:
            conversation_id: ID of the conversation to update
            message_content: Content of the user's message
            response_content: Content of the assistant's response
        """
        if conversation_id not in self.conversations:
            conversation_id = self.create_new_conversation()
            
        current_time = self._get_current_datetime().isoformat()
        
        # Add user message and assistant response
        self.conversations[conversation_id]['messages'].extend([
            {
                'role': 'user',
                'content': message_content,
                'timestamp': current_time
            },
            {
                'role': 'assistant',
                'content': response_content,
                'timestamp': current_time
            }
        ])
        
        
        # Update conversation timestamp
        self.conversations[conversation_id]['updated_at'] = current_time
        
        # If this is the first message, suggest a title
        if len(self.conversations[conversation_id]['messages']) == 2:
            suggested_title = self._suggest_title(message_content)
            self.conversations[conversation_id]['title'] = suggested_title
        
        self.save_data()

    def delete_conversation(self, conversation_id: str) -> bool:
        """
        Move conversation to trash with proper timestamp tracking.
        
        Args:
            conversation_id: ID of the conversation to delete
            
        Returns:
            bool: True if successful, False otherwise
        """
        if conversation_id in self.conversations:
            conversation = self.conversations.pop(conversation_id)
            conversation['deleted_at'] = self._get_current_datetime().isoformat()
            # Ensure other timestamps exist
            if 'updated_at' not in conversation:
                conversation['updated_at'] = conversation.get('created_at', conversation['deleted_at'])
            if 'created_at' not in conversation:
                conversation['created_at'] = conversation['updated_at']
            
            self.deleted_conversations[conversation_id] = conversation
            self.save_data()
            return True
        return False

    def recover_conversation(self, conversation_id: str) -> bool:
        """Recover conversation from trash"""
        if conversation_id in self.deleted_conversations:
            self.conversations[conversation_id] = self.deleted_conversations.pop(conversation_id)
            self.save_data()
            return True
        return False

    def permanently_delete_conversation(self, conversation_id: str) -> bool:
        """Permanently delete conversation"""
        if conversation_id in self.deleted_conversations:
            del self.deleted_conversations[conversation_id]
            self.save_data()
            return True
        return False

    def update_conversation_title(self, conversation_id: str, title: str) -> bool:
        """Update conversation title with validation"""
        if conversation_id in self.conversations:
            self.conversations[conversation_id].update({
                'title': title,
                'updated_at': self._get_current_datetime().isoformat()
            })
            self.save_data()
            return True
        return False

    def get_all_conversations(self) -> List[Dict]:
        """
        Get all active conversations, sorted by update time.
        Handles missing timestamp fields gracefully.
        
        Returns:
            List[Dict]: List of conversations with their metadata
        """
        def get_sort_key(conv_tuple):
            """Helper function to safely get the sort key"""
            conv_data = conv_tuple[1]
            # Use updated_at if available, fallback to created_at, or use epoch
            return conv_data.get('updated_at') or conv_data.get('created_at') or '1970-01-01T00:00:00+00:00'

        return [{
            'id': conv_id,
            **conv_data,
        } for conv_id, conv_data in sorted(
            self.conversations.items(),
            key=get_sort_key,
            reverse=True
        )]

    def get_deleted_conversations(self) -> List[Dict]:
        """
        Get all deleted conversations, sorted by deletion time.
        Handles missing timestamp fields gracefully.
        
        Returns:
            List[Dict]: List of deleted conversations with their metadata
        """
        def get_sort_key(conv_tuple):
            """Helper function to safely get the sort key"""
            conv_data = conv_tuple[1]
            # Use deleted_at if available, fallback to updated_at, then created_at, or use epoch
            return (conv_data.get('deleted_at') or 
                   conv_data.get('updated_at') or 
                   conv_data.get('created_at') or 
                   '1970-01-01T00:00:00+00:00')

        return [{
            'id': conv_id,
            **conv_data,
        } for conv_id, conv_data in sorted(
            self.deleted_conversations.items(),
            key=get_sort_key,
            reverse=True
        )]

    def chat_with_claude(self, conversation_id: str, user_input: str, stream: bool = False) -> Union[str, Generator[str, None, None]]:
        """Enhanced chat functionality with Claude"""
        current_datetime = self._get_current_datetime()
        tomorrow = (current_datetime + timedelta(days=1)).strftime('%Y-%m-%d')
        
        if not conversation_id or conversation_id not in self.conversations:
            conversation_id = self.create_new_conversation()
        
        conversation = self.conversations[conversation_id]
        conversation['updated_at'] = current_datetime.isoformat()
        
        system_prompt = self._get_system_prompt(current_datetime, tomorrow)
        context = self._prepare_chat_context(conversation, user_input)

        try:
            if stream:
                return self._handle_streaming_chat(conversation_id, user_input, context, system_prompt)
            else:
                return self._handle_normal_chat(conversation_id, user_input, context, system_prompt)
        except Exception as e:
            error_msg = f"Error communicating with Claude: {str(e)}"
            print(error_msg)
            return error_msg

    def _handle_streaming_chat(self, conversation_id: str, user_input: str, context: str, system_prompt: str) -> Generator[str, None, None]:
        """Handle streaming chat with improved error handling and task detection"""
        response_text = ""
        try:
            with self.client.messages.stream(
                messages=[{"role": "user", "content": context}],
                system=system_prompt,
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000
            ) as stream:
                for text in stream.text_stream:
                    response_text += text
                    yield text

                # Process any tasks in the response
                task_confirmation = self._handle_task_json(response_text)
                if task_confirmation:
                    yield "\n\n" + task_confirmation
                    response_text += "\n\n" + task_confirmation
                
                # Save the complete conversation after streaming
                self.update_conversation(conversation_id, user_input, response_text)

        except Exception as e:
            error_msg = f"Error communicating with Claude: {str(e)}"
            print(error_msg)
            yield error_msg

    def _handle_normal_chat(self, conversation_id: str, user_input: str, context: str, system_prompt: str) -> str:
        """Handle normal chat with improved error handling and task detection"""
        try:
            response = self.client.messages.create(
                messages=[{"role": "user", "content": context}],
                system=system_prompt,
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000
            )
            
            response_text = response.content[0].text
            
            # Process any tasks in the response
            task_confirmation = self._handle_task_json(response_text)
            if task_confirmation:
                response_text += "\n\n" + task_confirmation
            
            # Save the conversation
            self.update_conversation(conversation_id, user_input, response_text)
            return response_text

        except Exception as e:
            error_msg = f"Error communicating with Claude: {str(e)}"
            print(error_msg)
            return error_msg

    def _get_system_prompt(self, current_datetime: datetime, tomorrow: str) -> str:
        """Generate system prompt with context"""
        return f"""You are Ela, an intelligent assistant. You can add regular tasks, freetime tasks, and recurring tasks. 

When you detect a task or appointment request, respond with a JSON structure like this, and nothing else:
{{"type": "task", "description": "clear task description", "date": "YYYY-MM-DD", "time": "HH:MM", 
  "priority": 1|2|3, "reminders": [minutes_before1, minutes_before2, ...]}}

When you detect a freetime task request (tasks without specific dates that can be done whenever the user has free time), 
respond with this JSON structure, and nothing else:
{{"type": "freetime", "description": "clear task description", "priority": 1|2|3, 
  "estimated_time": minutes_to_complete}}

When you detect a recurring task request, respond with this JSON structure, and nothing else:
{{"type": "recurring", "description": "clear task description", "start_date": "YYYY-MM-DD", "time": "HH:MM",
  "priority": 1|2|3, "recurrence_type": "daily|weekly|monthly|yearly", "interval": number,
  "end_type": "never|on_date|after_count", "end_date": "YYYY-MM-DD", "end_count": number,
  "reminders": [minutes_before1, minutes_before2, ...]}}
        

Important guidelines:
- Current date and time in {self.timezone.zone}: {current_datetime.strftime('%Y-%m-%d %H:%M')}
- Tomorrow's date is: {tomorrow}
- Use proper date calculation relative to current timezone
- Verify dates are valid and in the future for regular tasks
- Up to 5 reminders allowed per task
- Priority levels: 1 (High), 2 (Medium), 3 (Low)
- For recurring tasks, detect frequency words like "every day", "weekly", "monthly"
- For recurring tasks, detect end conditions like "until June 30" or "for 10 occurrences"
- For freetime tasks, estimate completion time in minutes if mentioned
- Look for phrases like "freetime", "when I have time", "whenever", "free time", etc. to identify freetime tasks

For other queries, respond naturally and helpfully."""

    def _prepare_chat_context(self, conversation: Dict, user_input: str) -> str:
        """Prepare chat context with improved history handling"""
        # Get the last 5 conversation messages
        conversation_history = [msg['content'] for msg in conversation['messages'][-5:]]
        history_text = "\n".join(conversation_history) if conversation_history else ""
        
        # Add task summary and user input
        context = f"{self._get_task_summary()}\n\n"
        if history_text:
            context += f"Recent conversation:\n{history_text}\n\n"
        context += f"User input: {user_input}"
        
        return context

    def _get_task_summary(self) -> str:
        """Get summary of today's tasks with improved formatting"""
        today = self._get_current_datetime().strftime("%Y-%m-%d")
        today_tasks = sorted(
            [task for task in self.tasks if task.get('due_date') == today and not task.get('is_recurring', False)],
            key=self.sort_key_tasks
        )
        if not today_tasks:
            return ""
        
        summary_lines = ["Today's tasks:"]
        for task in today_tasks:
            priority_indicator = "⚡" if task.get('priority') == 1 else ""
            time_str = f" at {task['time']}" if task.get('time') else ""
            status_indicator = "✓" if task.get('status') == 'done' else "□"
            
            # Add recurring indicator if this is an instance of a recurring task
            recurring_indicator = "🔄 " if task.get('is_recurring_instance') else ""
            
            reminder_str = ""
            if task.get('reminders'):
                reminder_times = [self._format_time_difference(r) for r in task['reminders']]
                reminder_str = f" (Reminders: {', '.join(reminder_times)} before)"
            
            summary_lines.append(
                f"{status_indicator} {recurring_indicator}{priority_indicator}{task['description']}"
                f"{time_str}{reminder_str}"
            )
        
        return "\n".join(summary_lines)

    def _is_duplicate_task(self, task_details: Dict) -> bool:
        """Check for duplicate tasks with improved comparison"""
        task_type = task_details.get('type')
        
        if task_type == 'recurring':
            # For recurring tasks, check description and recurrence pattern
            return any(
                task.get('is_recurring', False) and
                task['description'].lower() == task_details['description'].lower() and
                task.get('recurrence_type') == task_details.get('recurrence_type') and
                task.get('interval') == task_details.get('interval')
                for task in self.tasks
            )
        else:
            # For regular and freetime tasks, use the old logic
            return any(
                task['description'].lower() == task_details['description'].lower() and
                (
                    # For regular tasks, check date/time
                    (task_details.get('type') == 'task' and
                     task.get('due_date') == task_details.get('date') and
                     task.get('time') == task_details.get('time')) or
                    # For freetime tasks, only check description
                    (task_details.get('type') == 'freetime' and
                     task.get('task_type') == 'freetime')
                ) and
                task.get('status') != 'done'  # Don't consider completed tasks as duplicates
                for task in self.tasks
            )

    def _handle_task_json(self, text: str) -> Optional[str]:
        """
        Enhanced task handling with better user communication.
        Now supports regular, freetime, and recurring tasks.
        
        Args:
            text (str): Input text that may contain task JSON
            
        Returns:
            Optional[str]: Response message if task was processed, None otherwise
        """
        try:
            # Extract JSON part
            text = text.strip()
            start_idx = text.find('{')
            end_idx = text.rfind('}')
            
            if start_idx != -1 and end_idx != -1:
                json_str = text[start_idx:end_idx + 1]
                task_details = json.loads(json_str)
                
                # Check if this is a task request (regular, freetime, or recurring)
                task_type = task_details.get('type')
                
                if task_type in ['task', 'freetime', 'recurring']:
                    # Check for duplicate
                    if self._is_duplicate_task(task_details):
                        return "I notice this task already exists in your tasks. Would you like to modify the existing task instead?"
                    
                    # Handle based on task type
                    if task_type == 'task':
                        return self._handle_regular_task(task_details)
                    elif task_type == 'freetime':
                        return self._handle_freetime_task(task_details)
                    elif task_type == 'recurring':
                        return self._handle_recurring_task(task_details)
                    
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {str(e)}")
            return "I had trouble understanding the task format. Could you please try again?"
        except KeyError as e:
            print(f"Missing required field: {str(e)}")
            return "Some required task information was missing. Please ensure the task has all required fields."
        except ValueError as e:
            print(f"Value error: {str(e)}")
            return "There was an issue with one of the task values. Please check the formats."
        except Exception as e:
            print(f"Error processing task: {str(e)}")
            return "I had trouble processing that task. Could you please try rephrasing it?"
            
        return None

    def _handle_regular_task(self, task_details: Dict) -> str:
        """
        Process a regular task with date and time.
        
        Args:
            task_details: Dictionary containing task details
            
        Returns:
            str: Confirmation message
        """
        # Extract location and notes if present
        notes = None
        if 'location' in task_details:
            notes = f"Location: {task_details['location']}"
        
        # Add the task
        task_id = self.add_task(
            description=task_details['description'],
            due_date=task_details['date'],
            time=task_details['time'],
            priority=task_details.get('priority', 2),
            reminders=task_details.get('reminders', []),
            notes=notes
        )
        
        # Format date nicely
        try:
            date_obj = datetime.strptime(task_details['date'], '%Y-%m-%d')
            date_str = date_obj.strftime('%A, %B %d, %Y')
        except ValueError:
            date_str = task_details['date']
        
        # Format time in 12-hour format with timezone
        try:
            time_obj = datetime.strptime(task_details['time'], '%H:%M')
            time_str = time_obj.strftime('%I:%M %p').lstrip('0')
            time_str = f"{time_str} {self.timezone.zone}"
        except ValueError:
            time_str = task_details['time']
        
        # Format reminder text with natural language
        reminder_text = ""
        if task_details.get('reminders'):
            reminder_times = sorted(task_details['reminders'], reverse=True)
            reminder_phrases = [self._format_time_difference(r) for r in reminder_times]
            
            if len(reminder_phrases) == 1:
                reminder_text = f" with a reminder {reminder_phrases[0]} before"
            elif len(reminder_phrases) > 1:
                last_reminder = reminder_phrases.pop()
                reminder_text = f" with reminders {', '.join(reminder_phrases)} and {last_reminder} before"
        
        # Add location information if present
        location_text = ""
        if task_details.get('location'):
            location_text = f"\n📍 Location: {task_details['location']}"
        
        # Build natural language confirmation
        priority_text = self._get_priority_text(task_details.get('priority', 2))
        response = (
            f"✓ Task added successfully!\n\n"
            f"📝 {task_details['description']}\n"
            f"📅 Scheduled for {date_str}\n"
            f"⏰ {time_str}{location_text}\n"
            f"{priority_text}\n"
            f"{reminder_text}\n\n"
            f"The task has been added to your calendar. You can check it in the Monthly, Weekly, or Daily views."
        )
        
        # Save data to ensure task is persisted
        self.save_data()
        
        return response

    def _handle_freetime_task(self, task_details: Dict) -> str:
        """
        Process a freetime task (without specific date/time).
        
        Args:
            task_details: Dictionary containing freetime task details
            
        Returns:
            str: Confirmation message
        """
        # Extract the estimated time if available
        estimated_time = task_details.get('estimated_time', '')
        
        # Add the freetime task
        task_id = self.add_task(
            description=task_details['description'],
            due_date=None,
            time=None,
            priority=task_details.get('priority', 2),
            reminders=[],
            notes=None,
            task_type='freetime',
            estimated_time=estimated_time
        )
        
        # Format estimated time text
        estimated_time_text = ""
        if estimated_time:
            if int(estimated_time) >= 60:
                hours = int(estimated_time) // 60
                minutes = int(estimated_time) % 60
                if minutes == 0:
                    estimated_time_text = f"Estimated time: {hours} {'hour' if hours == 1 else 'hours'}"
                else:
                    estimated_time_text = f"Estimated time: {hours} {'hour' if hours == 1 else 'hours'} and {minutes} {'minute' if minutes == 1 else 'minutes'}"
            else:
                estimated_time_text = f"Estimated time: {estimated_time} {'minute' if int(estimated_time) == 1 else 'minutes'}"
                
        # Build natural language confirmation
        priority_text = self._get_priority_text(task_details.get('priority', 2))
        response = (
            f"✓ Free time task added successfully!\n\n"
            f"📝 {task_details['description']}\n"
            f"{priority_text}\n"
        )
        
        if estimated_time_text:
            response += f"⏱️ {estimated_time_text}\n\n"
        else:
            response += "\n"
            
        response += "This task has been added to your Free Time Tasks list for when you have available time."
        
        # Save data to ensure task is persisted
        self.save_data()
        
        return response

    def _handle_recurring_task(self, task_details: Dict) -> str:
        """
        Process a recurring task.
        
        Args:
            task_details: Dictionary containing recurring task details
            
        Returns:
            str: Confirmation message
        """
        # Extract relevant fields
        description = task_details['description']
        start_date = task_details['start_date']
        time = task_details.get('time')
        priority = task_details.get('priority', 2)
        recurrence_type = task_details['recurrence_type']
        interval = task_details.get('interval', 1)
        end_type = task_details.get('end_type', 'never')
        end_date = task_details.get('end_date')
        end_count = task_details.get('end_count')
        reminders = task_details.get('reminders', [])
        
        # Create the recurring task
        task_id = self.add_recurring_task(
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
            notes=task_details.get('notes')
        )
        
        # Format date nicely
        try:
            date_obj = datetime.strptime(start_date, '%Y-%m-%d')
            date_str = date_obj.strftime('%A, %B %d, %Y')
        except ValueError:
            date_str = start_date
        
        # Format time in 12-hour format with timezone
        time_str = ""
        if time:
            try:
                time_obj = datetime.strptime(time, '%H:%M')
                time_str = time_obj.strftime('%I:%M %p').lstrip('0')
                time_str = f" at {time_str} {self.timezone.zone}"
            except ValueError:
                time_str = f" at {time}"
        
        # Format recurrence pattern
        if recurrence_type == 'daily':
            if interval == 1:
                recurrence_str = "Daily"
            else:
                recurrence_str = f"Every {interval} days"
        elif recurrence_type == 'weekly':
            if interval == 1:
                recurrence_str = "Weekly"
            else:
                recurrence_str = f"Every {interval} weeks"
        elif recurrence_type == 'monthly':
            if interval == 1:
                recurrence_str = "Monthly"
            else:
                recurrence_str = f"Every {interval} months"
        elif recurrence_type == 'yearly':
            if interval == 1:
                recurrence_str = "Yearly"
            else:
                recurrence_str = f"Every {interval} years"
        else:
            recurrence_str = "Recurring"
        
        # Format end condition
        if end_type == 'never':
            end_str = "No end date"
        elif end_type == 'on_date' and end_date:
            try:
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                end_str = f"Until {end_date_obj.strftime('%B %d, %Y')}"
            except ValueError:
                end_str = f"Until {end_date}"
        elif end_type == 'after_count' and end_count:
            end_str = f"For {end_count} occurrences"
        else:
            end_str = "Recurring"
        
        # Format reminder text
        reminder_text = ""
        if reminders:
            reminder_times = sorted(reminders, reverse=True)
            reminder_phrases = [self._format_time_difference(r) for r in reminder_times]
            
            if len(reminder_phrases) == 1:
                reminder_text = f"Reminder: {reminder_phrases[0]} before each occurrence"
            elif len(reminder_phrases) > 1:
                last_reminder = reminder_phrases.pop()
                reminder_text = f"Reminders: {', '.join(reminder_phrases)} and {last_reminder} before each occurrence"
        
        # Build natural language confirmation
        priority_text = self._get_priority_text(priority)
        response = (
            f"✓ Recurring task added successfully!\n\n"
            f"📝 {description}\n"
            f"🔄 {recurrence_str}, starting {date_str}{time_str}\n"
            f"⏳ {end_str}\n"
            f"{priority_text}\n"
        )
        
        if reminder_text:
            response += f"🔔 {reminder_text}\n\n"
        else:
            response += "\n"
            
        response += "This recurring task has been added to your calendar. Individual occurrences will appear in your calendar views."
        
        # Save data to ensure task is persisted
        self.save_data()
        
        return response

    def check_reminders(self) -> List[Dict]:
        """Check for tasks that need reminders with improved time handling"""
        current_time = self._get_current_datetime()
        tasks_to_remind = []

        # Only consider tasks with dates and reminders (not recurring parent tasks)
        valid_tasks = [task for task in self.tasks if not task.get('is_recurring', False)]
        
        for task in valid_tasks:
            if task.get('status') == 'done':
                continue

            due_date = task.get('due_date')
            due_time = task.get('time', '00:00')
            reminders = task.get('reminders', [])

            if not due_date or not reminders:
                continue

            try:
                # Parse task datetime and localize it
                task_datetime = datetime.strptime(f"{due_date} {due_time}", "%Y-%m-%d %H:%M")
                task_datetime = self.timezone.localize(task_datetime)

                for reminder_minutes in reminders:
                    reminder_time = task_datetime - timedelta(minutes=reminder_minutes)
                    time_diff = (reminder_time - current_time).total_seconds()

                    # Check if reminder should be triggered (within the last minute)
                    if 0 <= time_diff <= 60:
                        tasks_to_remind.append({
                            'task': task,
                            'reminder_minutes': reminder_minutes,
                            'due_time': task_datetime.strftime('%I:%M %p %Z')
                        })
                        break  # Only remind once per check interval

            except ValueError as e:
                print(f"Error processing reminder for task {task.get('id')}: {str(e)}")

        return tasks_to_remind

    def _suggest_title(self, first_message: str) -> str:
        """Generate conversation title with improved prompt"""
        try:
            response = self.client.messages.create(
                messages=[{
                    "role": "user", 
                    "content": f"Based on this message, suggest a brief, clear title (max 6 words): {first_message}"
                }],
                model="claude-3-5-sonnet-20241022",
                max_tokens=50,
                system="You are a helpful assistant. Respond only with a brief, clear title (max 6 words) based on the user's message. No explanations or additional text."
            )
            return response.content[0].text.strip()
        except Exception as e:
            print(f"Error suggesting title: {e}")
            return "New Conversation"

    def export_calendar(self, filename: str = None) -> str:
        """Export calendar data with improved metadata"""
        if not filename:
            timestamp = self._get_current_datetime().strftime('%Y%m%d_%H%M%S')
            filename = f"calendar_backup_{timestamp}.json"

        backup_data = {
            'tasks': self.tasks,
            'conversations': self.conversations,
            'deleted_conversations': self.deleted_conversations,
            'projects': self.projects,
            'backup_date': self._get_current_datetime().isoformat(),
            'timezone': self.timezone.zone,
            'version': '1.0'
        }

        backup_path = os.path.join(self.config_dir, 'backups', filename)
        os.makedirs(os.path.dirname(backup_path), exist_ok=True)
        
        with open(backup_path, 'w') as f:
            json.dump(backup_data, f, indent=4)
        
        return backup_path

    def import_calendar(self, filepath: str, merge: bool = False) -> Dict[str, Any]:
        """
        Import calendar data with improved validation and merging.
        
        Args:
            filepath: Path to the backup file
            merge: If True, merge with existing data; if False, replace all data
            
        Returns:
            Dictionary containing import statistics
        """
        with open(filepath, 'r') as f:
            backup_data = json.load(f)

        if not isinstance(backup_data, dict) or 'tasks' not in backup_data:
            raise ValueError("Invalid backup file format")

        stats = {
            'tasks_added': 0,
            'tasks_updated': 0,
            'conversations_added': 0,
            'projects_added': 0,
            'tasks_skipped': 0
        }

        if merge:
            # Merge tasks with duplicate checking
            existing_tasks = {task['id']: task for task in self.tasks}
            for task in backup_data['tasks']:
                if task['id'] in existing_tasks:
                    # Update only if the backup version is newer
                    backup_modified = datetime.fromisoformat(task['last_modified'])
                    existing_modified = datetime.fromisoformat(existing_tasks[task['id']]['last_modified'])
                    if backup_modified > existing_modified:
                        existing_tasks[task['id']].update(task)
                        stats['tasks_updated'] += 1
                    else:
                        stats['tasks_skipped'] += 1
                else:
                    self.tasks.append(task)
                    stats['tasks_added'] += 1

            # Merge conversations
            for conv_id, conv_data in backup_data['conversations'].items():
                if conv_id not in self.conversations:
                    self.conversations[conv_id] = conv_data
                    stats['conversations_added'] += 1

            # Merge deleted conversations if present
            if 'deleted_conversations' in backup_data:
                for conv_id, conv_data in backup_data['deleted_conversations'].items():
                    if conv_id not in self.deleted_conversations:
                        self.deleted_conversations[conv_id] = conv_data
                        
            # Merge projects if present
            if 'projects' in backup_data:
                existing_projects = {project['id']: project for project in self.projects}
                for project in backup_data['projects']:
                    if project['id'] not in existing_projects:
                        self.projects.append(project)
                        stats['projects_added'] += 1
        else:
            # Replace all data
            self.tasks = backup_data['tasks']
            self.conversations = backup_data['conversations']
            self.deleted_conversations = backup_data.get('deleted_conversations', {})
            self.projects = backup_data.get('projects', [])
            stats = {
                'tasks_added': len(self.tasks),
                'tasks_updated': 0,
                'conversations_added': len(self.conversations),
                'projects_added': len(self.projects),
                'tasks_skipped': 0
            }

        # Update timezone if present in backup
        if 'timezone' in backup_data:
            try:
                self.timezone = pytz.timezone(backup_data['timezone'])
            except pytz.exceptions.UnknownTimeZoneError:
                print(f"Warning: Unknown timezone {backup_data['timezone']} in backup file")

        # Process recurring tasks to ensure future instances are generated
        self._process_recurring_tasks()

        self.save_data()
        return stats

    def verify_data_integrity(self) -> Dict[str, Any]:
        """
        Verify data integrity and fix any issues.
        
        Returns:
            Dictionary containing verification results and fixes applied
        """
        results = {
            'tasks_checked': len(self.tasks),
            'conversations_checked': len(self.conversations),
            'projects_checked': len(self.projects),
            'tasks_fixed': 0,
            'conversations_fixed': 0,
            'projects_fixed': 0,
            'issues_found': []
        }

        # Verify tasks
        valid_tasks = []
        for task in self.tasks:
            fixed = False
            
            # Ensure required fields
            if 'id' not in task:
                task['id'] = str(uuid.uuid4())
                fixed = True
                results['issues_found'].append(f"Added missing ID to task: {task.get('description', 'Unknown')}")

            if 'created_at' not in task:
                task['created_at'] = self._get_current_datetime().isoformat()
                fixed = True
                results['issues_found'].append(f"Added missing creation time to task: {task['id']}")

            if 'last_modified' not in task:
                task['last_modified'] = task.get('created_at', self._get_current_datetime().isoformat())
                fixed = True
                results['issues_found'].append(f"Added missing modification time to task: {task['id']}")

            # Validate date format for regular tasks
            if task.get('due_date') and not task.get('is_recurring', False):
                try:
                    datetime.strptime(task['due_date'], '%Y-%m-%d')
                except ValueError:
                    task['due_date'] = None
                    fixed = True
                    results['issues_found'].append(f"Removed invalid due date from task: {task['id']}")

            # Validate time format
            if task.get('time'):
                try:
                    datetime.strptime(task['time'], '%H:%M')
                except ValueError:
                    task['time'] = None
                    fixed = True
                    results['issues_found'].append(f"Removed invalid time from task: {task['id']}")

            # Ensure valid status
            if task.get('status') not in ['todo', 'done']:
                task['status'] = 'todo'
                fixed = True
                results['issues_found'].append(f"Fixed invalid status in task: {task['id']}")

            # Ensure valid priority
            if not isinstance(task.get('priority'), int) or task.get('priority') not in [1, 2, 3]:
                task['priority'] = 2
                fixed = True
                results['issues_found'].append(f"Fixed invalid priority in task: {task['id']}")

            # Ensure reminders is a list
            if not isinstance(task.get('reminders'), list):
                task['reminders'] = []
                fixed = True
                results['issues_found'].append(f"Fixed invalid reminders in task: {task['id']}")

            # Validate child_tasks list for recurring tasks
            if task.get('is_recurring') and not isinstance(task.get('child_tasks'), list):
                task['child_tasks'] = []
                fixed = True
                results['issues_found'].append(f"Fixed invalid child_tasks in recurring task: {task['id']}")

            if fixed:
                results['tasks_fixed'] += 1

            valid_tasks.append(task)

        self.tasks = valid_tasks

        # Verify projects
        valid_projects = []
        for project in self.projects:
            fixed = False
            
            # Ensure required fields
            if 'id' not in project:
                project['id'] = str(uuid.uuid4())
                fixed = True
                results['issues_found'].append(f"Added missing ID to project: {project.get('name', 'Unknown')}")

            if 'name' not in project:
                project['name'] = "Untitled Project"
                fixed = True
                results['issues_found'].append(f"Added missing name to project: {project['id']}")

            if 'created_at' not in project:
                project['created_at'] = self._get_current_datetime().isoformat()
                fixed = True
                results['issues_found'].append(f"Added missing creation time to project: {project['id']}")

            if fixed:
                results['projects_fixed'] += 1

            valid_projects.append(project)

        self.projects = valid_projects

        # Verify conversations
        valid_conversations = {}
        for conv_id, conv in self.conversations.items():
            fixed = False
            
            # Ensure required fields
            if 'title' not in conv:
                conv['title'] = 'Untitled Conversation'
                fixed = True
                results['issues_found'].append(f"Added missing title to conversation: {conv_id}")

            if 'messages' not in conv:
                conv['messages'] = []
                fixed = True
                results['issues_found'].append(f"Added missing messages array to conversation: {conv_id}")

            if 'created_at' not in conv:
                conv['created_at'] = self._get_current_datetime().isoformat()
                fixed = True
                results['issues_found'].append(f"Added missing creation time to conversation: {conv_id}")

            if 'updated_at' not in conv:
                conv['updated_at'] = conv.get('created_at', self._get_current_datetime().isoformat())
                fixed = True
                results['issues_found'].append(f"Added missing update time to conversation: {conv_id}")

            # Verify message format
            valid_messages = []
            for msg in conv['messages']:
                if isinstance(msg, dict) and 'role' in msg and 'content' in msg:
                    if 'timestamp' not in msg:
                        msg['timestamp'] = conv.get('created_at')
                        fixed = True
                    valid_messages.append(msg)
                else:
                    fixed = True
                    results['issues_found'].append(f"Removed invalid message from conversation: {conv_id}")

            conv['messages'] = valid_messages

            if fixed:
                results['conversations_fixed'] += 1

            valid_conversations[conv_id] = conv

        self.conversations = valid_conversations

        if results['tasks_fixed'] > 0 or results['conversations_fixed'] > 0 or results['projects_fixed'] > 0:
            self.save_data()

        return results

    def cleanup_old_data(self, days: int = 30) -> Dict[str, int]:
        """
        Clean up old completed tasks and deleted conversations.
        
        Args:
            days: Number of days to keep completed tasks and deleted conversations
            
        Returns:
            Dictionary containing cleanup statistics
        """
        current_time = self._get_current_datetime()
        cutoff_date = current_time - timedelta(days=days)
        
        stats = {
            'tasks_removed': 0,
            'conversations_removed': 0
        }

        # Clean up old completed tasks
        valid_tasks = []
        for task in self.tasks:
            # Keep all recurring parent tasks
            if task.get('is_recurring', False):
                valid_tasks.append(task)
                continue
                
            if task.get('status') == 'done':
                try:
                    last_modified = datetime.fromisoformat(task['last_modified'])
                    if last_modified < cutoff_date:
                        stats['tasks_removed'] += 1
                        continue
                except (ValueError, KeyError):
                    pass
            valid_tasks.append(task)

        self.tasks = valid_tasks

        # Clean up old deleted conversations
        valid_deleted_conversations = {}
        for conv_id, conv in self.deleted_conversations.items():
            try:
                deleted_at = datetime.fromisoformat(conv['deleted_at'])
                if deleted_at >= cutoff_date:
                    valid_deleted_conversations[conv_id] = conv
                else:
                    stats['conversations_removed'] += 1
            except (ValueError, KeyError):
                valid_deleted_conversations[conv_id] = conv

        self.deleted_conversations = valid_deleted_conversations

        if stats['tasks_removed'] > 0 or stats['conversations_removed'] > 0:
            self.save_data()

        return stats

    # Project Management Functions
    def create_project(self, name: str, description: str = None, 
                      start_date: str = None, end_date: str = None,
                      color: str = None) -> str:
        """
        Create a new project.
        
        Args:
            name: Project name
            description: Project description
            start_date: Project start date (YYYY-MM-DD)
            end_date: Project end date (YYYY-MM-DD)
            color: Color code for the project
            
        Returns:
            str: ID of the created project
        """
        project_id = str(uuid.uuid4())
        current_time = self._get_current_datetime().isoformat()
        
        project = {
            'id': project_id,
            'name': name,
            'description': description,
            'start_date': start_date,
            'end_date': end_date,
            'color': color or '#3498db',  # Default blue color
            'created_at': current_time,
            'last_modified': current_time,
            'milestones': []
        }
        
        self.projects.append(project)
        self.save_data()
        return project_id

    def update_project(self, project_id: str, **kwargs) -> bool:
        """
        Update project details.
        
        Args:
            project_id: ID of the project to update
            **kwargs: Fields to update
            
        Returns:
            bool: True if successful
        """
        for project in self.projects:
            if project['id'] == project_id:
                valid_fields = {'name', 'description', 'start_date', 'end_date', 'color'}
                for field, value in kwargs.items():
                    if field in valid_fields:
                        project[field] = value
                
                project['last_modified'] = self._get_current_datetime().isoformat()
                self.save_data()
                return True
        return False

    def delete_project(self, project_id: str, delete_tasks: bool = False) -> bool:
        """
        Delete a project and optionally its tasks.
        
        Args:
            project_id: ID of the project to delete
            delete_tasks: If True, also delete all tasks in the project
            
        Returns:
            bool: True if successful
        """
        # Find the project
        project_index = next((i for i, p in enumerate(self.projects) if p['id'] == project_id), None)
        if project_index is None:
            return False
        
        # Delete associated tasks if requested
        if delete_tasks:
            self.tasks = [task for task in self.tasks if task.get('project_id') != project_id]
        else:
            # Disassociate tasks from the project
            for task in self.tasks:
                if task.get('project_id') == project_id:
                    task.pop('project_id', None)
        
        # Remove the project
        self.projects.pop(project_index)
        self.save_data()
        return True

    def get_projects(self) -> List[Dict]:
        """Get all projects"""
        return self.projects

    def get_project(self, project_id: str) -> Optional[Dict]:
        """Get a project by ID"""
        return next((p for p in self.projects if p['id'] == project_id), None)

    def get_project_tasks(self, project_id: str, include_completed: bool = False) -> List[Dict]:
        """
        Get all tasks associated with a project.
        
        Args:
            project_id: ID of the project
            include_completed: Whether to include completed tasks
            
        Returns:
            List[Dict]: List of tasks
        """
        tasks = [task for task in self.tasks if task.get('project_id') == project_id]
        if not include_completed:
            tasks = [task for task in tasks if task.get('status') != 'done']
        return sorted(tasks, key=self.sort_key_tasks)

    def add_task_to_project(self, task_id: str, project_id: str) -> bool:
        """
        Add an existing task to a project.
        
        Args:
            task_id: ID of the task
            project_id: ID of the project
            
        Returns:
            bool: True if successful
        """
        # Verify project exists
        if not next((p for p in self.projects if p['id'] == project_id), None):
            return False
        
        # Update the task
        for task in self.tasks:
            if task['id'] == task_id:
                task['project_id'] = project_id
                task['last_modified'] = self._get_current_datetime().isoformat()
                self.save_data()
                return True
        return False

    def add_milestone_to_project(self, project_id: str, name: str, 
                               due_date: str = None, description: str = None) -> Optional[str]:
        """
        Add a milestone to a project.
        
        Args:
            project_id: ID of the project
            name: Milestone name
            due_date: Due date (YYYY-MM-DD)
            description: Description
            
        Returns:
            str: ID of the created milestone, or None if project not found
        """
        # Find the project
        project = next((p for p in self.projects if p['id'] == project_id), None)
        if not project:
            return None
        
        milestone_id = str(uuid.uuid4())
        current_time = self._get_current_datetime().isoformat()
        
        milestone = {
            'id': milestone_id,
            'name': name,
            'description': description,
            'due_date': due_date,
            'completed': False,
            'created_at': current_time,
            'last_modified': current_time
        }
        
        # Add to project's milestones
        if 'milestones' not in project:
            project['milestones'] = []
        project['milestones'].append(milestone)
        
        # Also create a task for this milestone
        self.add_task(
            description=f"Milestone: {name}",
            due_date=due_date,
            priority=1,  # High priority for milestones
            notes=description,
            project_id=project_id,
            is_milestone=True,
            milestone_id=milestone_id
        )
        
        self.save_data()
        return milestone_id

    def update_milestone(self, project_id: str, milestone_id: str, 
                       completed: bool = None, **kwargs) -> bool:
        """
        Update a project milestone.
        
        Args:
            project_id: ID of the project
            milestone_id: ID of the milestone
            completed: Completion status
            **kwargs: Other fields to update
            
        Returns:
            bool: True if successful
        """
        # Find the project
        project = next((p for p in self.projects if p['id'] == project_id), None)
        if not project or 'milestones' not in project:
            return False
        
        # Find the milestone
        milestone = next((m for m in project['milestones'] if m['id'] == milestone_id), None)
        if not milestone:
            return False
        
        # Update fields
        valid_fields = {'name', 'description', 'due_date'}
        for field, value in kwargs.items():
            if field in valid_fields:
                milestone[field] = value
        
        # Update completion status if provided
        if completed is not None:
            milestone['completed'] = completed
            
            # Find and update the associated task
            for task in self.tasks:
                if task.get('is_milestone') and task.get('milestone_id') == milestone_id:
                    task['status'] = 'done' if completed else 'todo'
                    task['last_modified'] = self._get_current_datetime().isoformat()
                    break
        
        milestone['last_modified'] = self._get_current_datetime().isoformat()
        self.save_data()
        return True

    def get_suggested_tasks(self, count: int = 5) -> List[Dict]:
        """
        Get suggested tasks for the user based on priority and deadlines.
        Implements smart scheduling to help the user be more productive.
        
        Args:
            count: Number of tasks to suggest
            
        Returns:
            List[Dict]: List of suggested tasks
        """
        current_date = self._get_current_datetime().strftime('%Y-%m-%d')
        
        # Get all incomplete tasks
        incomplete_tasks = [
            task for task in self.tasks 
            if task.get('status') != 'done' and not task.get('is_recurring', False)
        ]
        
        # Calculate task urgency score
        scored_tasks = []
        for task in incomplete_tasks:
            score = 0
            
            # Priority factor (1=high gets most points)
            priority = task.get('priority', 2)
            if priority == 1:
                score += 100
            elif priority == 2:
                score += 50
            else:
                score += 10
                
            # Due date factor
            due_date = task.get('due_date')
            if due_date:
                if due_date < current_date:  # Overdue
                    score += 200
                elif due_date == current_date:  # Due today
                    score += 150
                else:
                    # Calculate days until due
                    try:
                        # Create naive datetime objects for comparison (no timezone info)
                        task_date = datetime.strptime(due_date, '%Y-%m-%d')
                        # Convert timezone-aware datetime to naive for comparison
                        current_datetime = self._get_current_datetime().replace(tzinfo=None)
                        days_until_due = (task_date - current_datetime).days
                        
                        # Closer due dates get higher scores
                        if days_until_due <= 1:
                            score += 120
                        elif days_until_due <= 3:
                            score += 80
                        elif days_until_due <= 7:
                            score += 40
                        else:
                            score += max(0, 30 - days_until_due)  # Gradually decreasing score
                    except ValueError:
                        # If date parsing fails, give a neutral score
                        score += 20
            
            # Project and milestone bonus
            if task.get('is_milestone'):
                score += 70  # Milestones are important
            elif task.get('project_id'):
                score += 30  # Project tasks get a boost
                
            # Add to scored list
            scored_tasks.append((task, score))
        
        # Sort by score (highest first) and return top tasks
        scored_tasks.sort(key=lambda x: x[1], reverse=True)
        return [task for task, _ in scored_tasks[:count]]