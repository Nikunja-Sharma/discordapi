#!/bin/bash
# Showcase of all fixed color codes

echo "🎨 Testing all fixed color codes..."

# Test 1: Blue
curl -s -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "🔵 Blue Color Test",
        "description": "Color: 3447003 (was 0x3498db)",
        "color": 3447003
      }
    ]
  }' > /dev/null

sleep 1

# Test 2: Green
curl -s -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "🟢 Green Color Test",
        "description": "Color: 65280 (was 0x00ff00)",
        "color": 65280
      }
    ]
  }' > /dev/null

sleep 1

# Test 3: Gold
curl -s -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "🟡 Gold Color Test",
        "description": "Color: 16766720 (was 0xffd700)",
        "color": 16766720
      }
    ]
  }' > /dev/null

sleep 1

# Test 4: Red
curl -s -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "🔴 Red Color Test",
        "description": "Color: 16711680 (was 0xff0000)",
        "color": 16711680
      }
    ]
  }' > /dev/null

sleep 1

# Test 5: Discord Blurple
curl -s -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "🟣 Discord Blurple Test",
        "description": "Color: 5793522 (was 0x5865f2)",
        "color": 5793522,
        "timestamp": true
      }
    ],
    "buttons": [
      {
        "customId": "color_test_complete",
        "label": "✅ All Colors Work!",
        "style": "success"
      }
    ]
  }' > /dev/null

echo "✅ All color tests completed!"
echo "📱 Check your Discord channel to see all the different colors"