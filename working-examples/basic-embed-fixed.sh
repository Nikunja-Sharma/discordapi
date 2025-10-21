#!/bin/bash
# Basic embed with fixed color code

curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "📋 Basic Embed - Fixed",
        "description": "This embed uses correct decimal color values",
        "color": 3447003
      }
    ]
  }'