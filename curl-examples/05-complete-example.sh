#!/bin/bash
# Complete example with embed and interactive buttons

curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "🎮 Game Server Dashboard",
        "description": "**Minecraft Server Control Panel**\n\nManage your server with the buttons below.",
        "color": 43520,
        "thumbnail": {
          "url": "https://cdn.discordapp.com/embed/avatars/0.png"
        },
        "fields": [
          {
            "name": "🟢 Status",
            "value": "Online",
            "inline": true
          },
          {
            "name": "👥 Players",
            "value": "15/20",
            "inline": true
          },
          {
            "name": "🌍 World",
            "value": "Survival",
            "inline": true
          },
          {
            "name": "📊 Performance",
            "value": "**TPS:** 19.8/20\n**RAM:** 4.2GB/8GB\n**CPU:** 35%",
            "inline": false
          },
          {
            "name": "🔧 Server Info",
            "value": "**Version:** 1.20.4\n**Uptime:** 3d 7h 42m\n**World Size:** 2.1GB",
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
        "customId": "server_start",
        "label": "▶️ Start Server",
        "style": "success"
      },
      {
        "customId": "server_stop",
        "label": "⏹️ Stop Server",
        "style": "danger"
      },
      {
        "customId": "server_restart",
        "label": "🔄 Restart",
        "style": "primary"
      },
      {
        "customId": "view_players",
        "label": "👥 Player List",
        "style": "secondary"
      },
      {
        "label": "🌐 Web Panel",
        "style": "link",
        "url": "https://panel.example.com"
      }
    ]
  }'