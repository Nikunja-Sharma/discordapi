#!/bin/bash
# Test timestamp fix

echo "🕐 Testing timestamp fix..."

curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "🕐 Timestamp Test - Fixed",
        "description": "This embed should now work with proper timestamp handling",
        "color": 65280,
        "footer": {
          "text": "Timestamp issue resolved!"
        },
        "timestamp": true
      }
    ],
    "buttons": [
      {
        "customId": "timestamp_test",
        "label": "✅ Timestamps Work!",
        "style": "success"
      }
    ]
  }'

echo -e "\n\n✅ Timestamp test completed!"