#!/bin/bash

# Start Personal Assistant with 01data Integration
# This script sets up and runs the intelligent management system

echo "🧠 Starting Intelligent Management System..."
echo "============================================="

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Navigate to the project directory
cd "$DIR"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update requirements
if [ -f "requirements.txt" ]; then
    echo "📚 Installing dependencies..."
    pip install -r requirements.txt
else
    echo "📚 Installing basic dependencies..."
    pip install flask flask-wtf anthropic python-dotenv pytz rumps schedule
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  WARNING: .env file not found!"
    echo "Please create a .env file with your Claude API key:"
    echo "CLAUDE_API_KEY=your_api_key_here"
    echo ""
    echo "You can get an API key from: https://console.anthropic.com/"
    echo ""
    read -p "Press Enter to continue without API key (limited functionality)..."
fi

# Create necessary directories
mkdir -p user_data
mkdir -p uploads
mkdir -p backups/auto
mkdir -p templates

# Start the application
echo "🚀 Starting the Personal Assistant server..."
echo "📱 Access your system at: http://localhost:8080"
echo "🌐 Make sure to sign in through the main 01data website first!"
echo ""
echo "Press Ctrl+C to stop the server"
echo "============================================="

# Use the integration app if it exists, otherwise fall back to regular app
if [ -f "integration_app.py" ]; then
    python integration_app.py
else
    python app.py
fi