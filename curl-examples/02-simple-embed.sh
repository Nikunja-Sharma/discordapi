#!/bin/bash
# Simple embed with basic fields

curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "📊 Server Statistics",
        "description": "Current server information and metrics",
        "color": 65280,
        "fields": [
          {
            "name": "👥 Total Members",
            "value": "1,234",
            "inline": true
          },
          {
            "name": "📺 Channels",
            "value": "42",
            "inline": true
          },
          {
            "name": "🎭 Roles",
            "value": "15",
            "inline": true
          },
          {
            "name": "📅 Server Created",
            "value": "January 1, 2024",
            "inline": false
          },
          {
            "name": "🔥 Most Active Channel",
            "value": "#general (1,337 messages today)",
            "inline": false
          }
        ],
        "footer": {
          "text": "Updated every 5 minutes"
        },
        "timestamp": true
      }
    ]
  }'