#!/bin/bash
# Debug test with detailed logging

echo "🔍 Testing with detailed error logging..."

curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "🧪 **Debug Test** - Simple message first",
    "buttons": [
      {
        "customId": "debug_test",
        "label": "Debug Button",
        "style": "primary"
      }
    ]
  }'

echo -e "\n\n🔍 Testing embed with buttons..."

curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "🔧 Debug Embed",
        "description": "Testing embed with proper color value",
        "color": 65280
      }
    ],
    "buttons": [
      {
        "customId": "debug_embed_test",
        "label": "Test Embed Button",
        "style": "success"
      }
    ]
  }'

echo -e "\n\n✅ Debug tests completed. Check server logs for detailed error information."