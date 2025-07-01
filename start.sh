#!/bin/bash

echo "🎫 Starting SEO Description Generator..."
echo ""

# Check if .env file exists and has credentials
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with your API credentials."
    echo "Example:"
    echo "DATAFORSEO_LOGIN=your_login"
    echo "DATAFORSEO_PASSWORD=your_password" 
    echo "OPENAI_API_KEY=your_api_key"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the server
echo "🚀 Starting server on http://localhost:3000"
echo "Press Ctrl+C to stop the server"
echo ""

npm start