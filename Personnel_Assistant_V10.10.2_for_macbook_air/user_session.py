#!/usr/bin/env python3
"""
User Session Management for Personal Assistant
Integrates with 01data website Google OAuth authentication
"""

import json
import os
from datetime import datetime
from typing import Optional, Dict

class UserSessionManager:
    def __init__(self):
        self.sessions = {}
        self.session_file = os.path.join(os.path.dirname(__file__), 'user_sessions.json')
        self.load_sessions()

    def load_sessions(self):
        """Load existing user sessions from file"""
        try:
            if os.path.exists(self.session_file):
                with open(self.session_file, 'r') as f:
                    self.sessions = json.load(f)
        except Exception as e:
            print(f"Error loading sessions: {e}")
            self.sessions = {}

    def save_sessions(self):
        """Save user sessions to file"""
        try:
            with open(self.session_file, 'w') as f:
                json.dump(self.sessions, f, indent=4)
        except Exception as e:
            print(f"Error saving sessions: {e}")

    def create_session(self, user_data: Dict) -> str:
        """
        Create a new user session from 01data website authentication
        
        Args:
            user_data: Dictionary containing user info from Google OAuth
            
        Returns:
            str: Session ID
        """
        user_id = user_data.get('id') or user_data.get('sub')
        
        session_data = {
            'user_id': user_id,
            'name': user_data.get('name'),
            'email': user_data.get('email'),
            'picture': user_data.get('picture'),
            'created_at': datetime.now().isoformat(),
            'last_accessed': datetime.now().isoformat(),
            'is_active': True
        }
        
        self.sessions[user_id] = session_data
        self.save_sessions()
        
        return user_id

    def get_session(self, user_id: str) -> Optional[Dict]:
        """Get user session by ID"""
        session = self.sessions.get(user_id)
        if session and session.get('is_active'):
            # Update last accessed time
            session['last_accessed'] = datetime.now().isoformat()
            self.save_sessions()
            return session
        return None

    def validate_session(self, user_id: str) -> bool:
        """Validate if user session is active"""
        session = self.sessions.get(user_id)
        return session and session.get('is_active', False)

    def invalidate_session(self, user_id: str) -> bool:
        """Invalidate a user session"""
        if user_id in self.sessions:
            self.sessions[user_id]['is_active'] = False
            self.save_sessions()
            return True
        return False

    def get_active_sessions(self) -> Dict:
        """Get all active user sessions"""
        return {
            user_id: session 
            for user_id, session in self.sessions.items() 
            if session.get('is_active', False)
        }

    def cleanup_old_sessions(self, days: int = 30):
        """Remove sessions older than specified days"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        sessions_to_remove = []
        for user_id, session in self.sessions.items():
            try:
                last_accessed = datetime.fromisoformat(session['last_accessed'])
                if last_accessed < cutoff_date:
                    sessions_to_remove.append(user_id)
            except (ValueError, KeyError):
                # Invalid date format, mark for removal
                sessions_to_remove.append(user_id)
        
        for user_id in sessions_to_remove:
            del self.sessions[user_id]
        
        if sessions_to_remove:
            self.save_sessions()
        
        return len(sessions_to_remove)

# Global session manager instance
session_manager = UserSessionManager()

def get_user_from_request(request) -> Optional[Dict]:
    """
    Extract user information from Flask request
    Checks both cookies and headers for user session data
    """
    # Check for user data in cookies (from localStorage)
    user_cookie = request.cookies.get('personal_assistant_user')
    if user_cookie:
        try:
            user_data = json.loads(user_cookie)
            user_id = user_data.get('id') or user_data.get('sub')
            
            # Validate the session
            if session_manager.validate_session(user_id):
                return session_manager.get_session(user_id)
            else:
                # Create new session if user data is valid
                return session_manager.create_session(user_data)
        except json.JSONDecodeError:
            pass
    
    # Check for user data in headers
    user_header = request.headers.get('X-User-Data')
    if user_header:
        try:
            user_data = json.loads(user_header)
            user_id = user_data.get('id') or user_data.get('sub')
            
            if user_id:
                session = session_manager.get_session(user_id)
                if not session:
                    session = session_manager.create_session(user_data)
                return session
        except json.JSONDecodeError:
            pass
    
    return None

def require_authentication(f):
    """
    Decorator to require user authentication for routes
    """
    from functools import wraps
    from flask import request, jsonify, redirect, url_for
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_user_from_request(request)
        if not user:
            if request.is_json:
                return jsonify({'error': 'Authentication required'}), 401
            else:
                return redirect(url_for('login_required'))
        
        # Add user to request context
        request.current_user = user
        return f(*args, **kwargs)
    
    return decorated_function