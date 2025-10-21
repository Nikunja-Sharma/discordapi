#!/bin/bash
# Test with correct decimal color values

curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "🎨 Color Test - Fixed",
        "description": "This embed uses correct decimal color values that work in JSON",
        "color": 16766720,
        "fields": [
          {
            "name": "✅ Fixed Issue",
            "value": "Color codes now use decimal values instead of hex literals",
            "inline": false
          },
          {
            "name": "🔢 This Color",
            "value": "Gold: 16766720 (was 0xFFD700)",
            "inline": true
          },
          {
            "name": "📚 Reference",
            "value": "Check color-reference.md for more colors",
            "inline": true
          }
        ],
        "footer": {
          "text": "Color issue resolved!"
        }
      }
    ],
    "buttons": [
      {
        "customId": "test_colors",
        "label": "✅ Colors Work!",
        "style": "success"
      }
    ]
  }'