#!/bin/bash
# Test all timestamp formats

echo "🕐 Testing all timestamp formats..."

# Test 1: Current timestamp (true)
echo "1. Testing current timestamp (true)..."
curl -s -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "Test 1: Current Time",
        "description": "Using timestamp: true",
        "color": 65280,
        "timestamp": true
      }
    ]
  }' > /dev/null

sleep 2

# Test 2: No timestamp
echo "2. Testing no timestamp..."
curl -s -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "Test 2: No Timestamp",
        "description": "No timestamp field",
        "color": 39423
      }
    ]
  }' > /dev/null

sleep 2

# Test 3: Unix timestamp (number)
echo "3. Testing unix timestamp..."
curl -s -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "Test 3: Unix Timestamp",
        "description": "Using unix timestamp number",
        "color": 16766720,
        "timestamp": 1704067200000
      }
    ]
  }' > /dev/null

sleep 2

# Test 4: Buttons with embed
echo "4. Testing embed with buttons..."
curl -s -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "Test 4: Embed + Buttons",
        "description": "Embed with buttons and timestamp",
        "color": 16738155,
        "timestamp": true
      }
    ],
    "buttons": [
      {
        "customId": "test_complete",
        "label": "✅ All Tests Complete",
        "style": "success"
      }
    ]
  }' > /dev/null

echo "✅ All timestamp format tests completed!"
echo "📱 Check your Discord channel to see all test messages"