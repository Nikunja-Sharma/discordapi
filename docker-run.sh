#!/bin/bash

# Docker run script for the Express Discord Bot API

echo "🐳 Starting Docker containers..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your actual values before running again."
    echo "   Required: DISCORD_BOT_TOKEN, DISCORD_APPLICATION_ID, etc."
    exit 1
fi

# Build and start containers
docker-compose up --build -d

echo "✅ Containers started!"
echo ""
echo "📊 Container status:"
docker-compose ps

echo ""
echo "🌐 Application URLs:"
echo "   Web App: http://localhost:3000"
echo "   MongoDB: mongodb://localhost:27017"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop containers: docker-compose down"
echo "   Restart: docker-compose restart"
echo "   Shell into app: docker-compose exec app sh"