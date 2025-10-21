#!/bin/bash

# Quick test for buttons functionality
# Replace YOUR_JWT_TOKEN with actual token

echo "Testing simple button message..."

curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "🧪 **Quick Test**: Simple button test",
    "buttons": [
      {
        "customId": "test_button",
        "label": "Click Me!",
        "style": "primary"
      }
    ]
  }'

echo -e "\n\nTest completed! Check your Discord channel."