#!/bin/bash
# Poll example with fixed colors and timestamp

curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "📊 Community Poll - Fixed",
        "description": "**What should we add to the server next?**\n\nVote by clicking the buttons below. Poll ends in 24 hours.",
        "color": 16766720,
        "fields": [
          {
            "name": "🎵 Music Bot",
            "value": "Add music streaming capabilities",
            "inline": false
          },
          {
            "name": "🎮 Game Nights",
            "value": "Weekly community game events",
            "inline": false
          },
          {
            "name": "📚 Study Groups",
            "value": "Dedicated study and homework help",
            "inline": false
          },
          {
            "name": "🎨 Art Showcase",
            "value": "Channel for sharing artwork",
            "inline": false
          }
        ],
        "footer": {
          "text": "Poll created by Admin • Ends in 24 hours"
        },
        "timestamp": true
      }
    ],
    "buttons": [
      {
        "customId": "vote_music",
        "label": "🎵 Music Bot",
        "style": "primary"
      },
      {
        "customId": "vote_games",
        "label": "🎮 Game Nights",
        "style": "success"
      },
      {
        "customId": "vote_study",
        "label": "📚 Study Groups",
        "style": "secondary"
      },
      {
        "customId": "vote_art",
        "label": "🎨 Art Showcase",
        "style": "primary"
      }
    ]
  }'