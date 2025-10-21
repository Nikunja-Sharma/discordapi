#!/bin/bash
# Complete example with fixed colors and timestamp

curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "🎮 Game Server Status - Fixed",
        "description": "Complete server information with correct formatting",
        "color": 16738101,
        "author": {
          "name": "GameBot",
          "iconURL": "https://cdn.discordapp.com/embed/avatars/0.png",
          "url": "https://example.com"
        },
        "thumbnail": {
          "url": "https://cdn.discordapp.com/embed/avatars/1.png"
        },
        "fields": [
          {
            "name": "🟢 Status",
            "value": "Online",
            "inline": true
          },
          {
            "name": "👥 Players",
            "value": "42/100",
            "inline": true
          },
          {
            "name": "🌍 Region",
            "value": "US-East",
            "inline": true
          },
          {
            "name": "📊 Performance",
            "value": "CPU: 45%\nRAM: 2.1GB/8GB\nUptime: 7d 12h",
            "inline": false
          }
        ],
        "footer": {
          "text": "Last updated"
        },
        "timestamp": true
      }
    ],
    "buttons": [
      {
        "customId": "join_server",
        "label": "🎮 Join Server",
        "style": "success"
      },
      {
        "customId": "view_players",
        "label": "👥 Player List",
        "style": "primary"
      },
      {
        "customId": "server_logs",
        "label": "📋 View Logs",
        "style": "secondary"
      },
      {
        "customId": "restart_server",
        "label": "🔄 Restart",
        "style": "danger"
      },
      {
        "label": "🌐 Web Panel",
        "style": "link",
        "url": "https://panel.example.com"
      }
    ]
  }'