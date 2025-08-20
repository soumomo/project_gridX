#!/bin/bash

# Change to the directory where the script is located
cd "$(dirname "$0")"

# Start both api and frontend servers
echo "Starting Split & Post Application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm and try again."
    exit 1
fi

# Function to start api
start_api() {
    echo "Starting api server..."
    cd api
    if [ ! -d "node_modules" ]; then
        echo "Installing api dependencies..."
        npm install
    fi
    npm run dev &
    API_PID=$!
    cd ..
}

# Function to start frontend
start_frontend() {
    echo "Starting frontend server..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install
    fi
    npm start &
    FRONTEND_PID=$!
    cd ..
}

# Start servers
start_api
sleep 3
start_frontend

echo ""
echo "✅ Servers started successfully!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 API: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $API_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "Servers stopped."
    exit 0
}

# Set trap to catch Ctrl+C
trap cleanup SIGINT

# Wait for servers
wait