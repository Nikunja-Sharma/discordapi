#!/bin/bash
# Yes/No confirmation buttons

curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "❓ **Confirmation Required**\n\nAre you sure you want to proceed with this action?\n\n⚠️ *This action cannot be undone.*",
    "buttons": [
      {
        "customId": "confirm_action",
        "label": "✅ Yes, Proceed",
        "style": "success"
      },
      {
        "customId": "cancel_action",
        "label": "❌ Cancel",
        "style": "danger"
      }
    ]
  }'