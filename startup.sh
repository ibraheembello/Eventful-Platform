#!/bin/bash
set -e

echo "=== Eventful Platform Startup Script ==="

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build backend if dist doesn't exist
if [ ! -d "dist" ]; then
  echo "Building backend..."
  npm run build:backend
fi

# Build frontend if client/dist doesn't exist
if [ ! -d "client/dist" ]; then
  echo "Building frontend..."
  cd client && npm install && npm run build && cd ..
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting application..."
npm start
