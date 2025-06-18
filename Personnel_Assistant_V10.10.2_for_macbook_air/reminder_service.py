#!/usr/bin/env python3
import rumps
import os
import json
import time
import logging
from datetime import datetime, timedelta
import pytz
import rumps
import schedule
from pathlib import Path
import subprocess

class ReminderService(rumps.App):
    def __init__(self):
        super(ReminderService, self).__init__("📅", quit_button=None)
        
        # Setup paths
        self.home_dir = str(Path.home())
        self.config_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assistant_config.json")
        self.log_file = os.path.expanduser('~/Library/Logs/personal_assistant_reminder.log')
        
        # Setup logging
        logging.basicConfig(
            filename=self.log_file,
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        
        # Initialize
        self.timezone = pytz.timezone('America/Los_Angeles')
        self.setup_menu()
        self.start_reminder_checker()

    def setup_menu(self):
        self.menu = [
            rumps.MenuItem("Check Reminders Now", callback=self.check_reminders),
            rumps.MenuItem("Open Assistant", callback=self.open_assistant),
            None,  # Separator
            rumps.MenuItem("Quit", callback=self.quit_app)
        ]

    def open_assistant(self, _):
        """Open the web assistant in default browser"""
        subprocess.run(['open', 'http://localhost:8080'])

    def load_tasks(self):
        try:
            with open(self.config_file, 'r') as f:
                data = json.load(f)
                return data.get('tasks', [])
        except FileNotFoundError:
            logging.error(f"Config file not found: {self.config_file}")
            return []
        except json.JSONDecodeError:
            logging.error("Invalid JSON in config file")
            return []

    def check_reminders(self, _=None):
        tasks = self.load_tasks()
        current_time = datetime.now(self.timezone)
        
        for task in tasks:
            if task.get('status') == 'done':
                continue

            due_date = task.get('due_date')
            due_time = task.get('time', '00:00')
            reminders = task.get('reminders', [])

            if not due_date or not reminders:
                continue

            try:
                # Calculate task datetime
                task_datetime = datetime.strptime(f"{due_date} {due_time}", "%Y-%m-%d %H:%M")
                task_datetime = self.timezone.localize(task_datetime)

                # Check each reminder time
                for reminder_minutes in reminders:
                    reminder_time = task_datetime - timedelta(minutes=reminder_minutes)
                    
                    # Check if it's time for reminder
                    time_diff = (reminder_time - current_time).total_seconds()
                    if 0 <= time_diff <= 60:  # Within the last minute
                        self.send_notification(task, reminder_minutes)
                        break  # Only send one notification per check
            except ValueError as e:
                logging.error(f"Error processing task {task.get('id')}: {str(e)}")

    def send_notification(self, task, reminder_minutes):
        title = "Task Reminder"
        
        # Format the reminder time in a user-friendly way
        if reminder_minutes >= 1440:  # days
            reminder_str = f"{reminder_minutes // 1440} {'day' if reminder_minutes // 1440 == 1 else 'days'}"
        elif reminder_minutes >= 60:  # hours
            reminder_str = f"{reminder_minutes // 60} {'hour' if reminder_minutes // 60 == 1 else 'hours'}"
        else:  # minutes
            reminder_str = f"{reminder_minutes} {'minute' if reminder_minutes == 1 else 'minutes'}"
            
        message = f"{task['description']}\nDue: {task['due_date']} {task.get('time', '')}\n({reminder_str} before)"
        
        # Send macOS notification
        os.system(f"""
            osascript -e 'display notification "{message}" with title "{title}"'
        """)
        
        logging.info(f"Sent reminder for task: {task['description']} ({reminder_str} before)")

    def start_reminder_checker(self):
        schedule.every(1).minutes.do(self.check_reminders)

    @rumps.timer(60)  # Run every 60 seconds
    def run_schedule(self, _):
        schedule.run_pending()

    def quit_app(self, _):
        logging.info("Reminder service stopping...")
        rumps.quit_application()

if __name__ == '__main__':
    ReminderService().run()