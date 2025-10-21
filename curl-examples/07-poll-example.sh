#!/bin/bash
# Poll with multiple choice buttons

curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "📊 Community Poll",
        "description": "**What should we add to the server next?**\n\nVote by clicking one of the buttons below. Poll ends in 24 hours.\n\n*You can only vote once!*",
        "color": 16766720,
        "fields": [
          {
            "name": "🎵 Music Bot",
            "value": "Add music streaming and playlist features",
            "inline": false
          },
          {
            "name": "🎮 Game Events",
            "value": "Weekly community gaming sessions",
            "inline": false
          },
          {
            "name": "📚 Study Rooms",
            "value": "Dedicated channels for homework help",
            "inline": false
          },
          {
            "name": "🎨 Art Gallery",
            "value": "Showcase channel for community artwork",
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
        "label": "🎮 Game Events",
        "style": "success"
      },
      {
        "customId": "vote_study",
        "label": "📚 Study Rooms",
        "style": "secondary"
      },
      {
        "customId": "vote_art",
        "label": "🎨 Art Gallery",
        "style": "primary"
      }
    ]
  }'