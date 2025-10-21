#!/bin/bash
# Link buttons example

curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "🌐 **Useful Links**\n\nQuick access to important resources:",
    "buttons": [
      {
        "label": "🌐 Website",
        "style": "link",
        "url": "https://discord.com"
      },
      {
        "label": "📚 Documentation",
        "style": "link", 
        "url": "https://discord.js.org"
      },
      {
        "label": "💻 GitHub",
        "style": "link",
        "url": "https://github.com"
      },
      {
        "label": "🐦 Twitter",
        "style": "link",
        "url": "https://twitter.com"
      }
    ]
  }'