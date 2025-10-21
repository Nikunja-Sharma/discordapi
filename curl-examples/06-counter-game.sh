#!/bin/bash
# Interactive counter button game

curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "🎯 Click Counter Challenge",
        "description": "**How fast can you click?**\n\nClick the button below to increment the counter!\n\n🏆 *Try to reach 50 clicks!*",
        "color": 16738155,
        "fields": [
          {
            "name": "🔢 Current Score",
            "value": "0 clicks",
            "inline": true
          },
          {
            "name": "🎯 Target",
            "value": "50 clicks",
            "inline": true
          },
          {
            "name": "👑 Record",
            "value": "127 clicks",
            "inline": true
          }
        ],
        "footer": {
          "text": "Click the button to start playing!"
        }
      }
    ],
    "buttons": [
      {
        "customId": "counter_button",
        "label": "🖱️ Click Me! (0)",
        "style": "primary"
      },
      {
        "customId": "info_button",
        "label": "ℹ️ How to Play",
        "style": "secondary"
      }
    ]
  }'