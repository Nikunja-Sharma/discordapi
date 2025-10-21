#!/bin/bash

# Discord Bot API Button Testing Script
# Make sure to replace YOUR_JWT_TOKEN with an actual token

BASE_URL="http://localhost:3000"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGY3YWJlNjUwMTFmZjYyMDg0NzA3NmUiLCJpYXQiOjE3NjEwNjE4NzIsImV4cCI6MTc2MTA2NTQ3Mn0.2UfXhQz-tqcQ4_oCawLuHPZuKU8hupV6u6ZqF8iCvdQ"

echo "🚀 Testing Discord Bot API with Buttons"
echo "========================================"

# Test 1: Simple confirmation buttons
echo "📝 Test 1: Confirmation Buttons"
curl -X POST $BASE_URL/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "🤖 **Bot Test**: Do you want to proceed?",
    "buttons": [
      {
        "customId": "confirm_action",
        "label": "✅ Confirm",
        "style": "success"
      },
      {
        "customId": "cancel_action",
        "label": "❌ Cancel",
        "style": "danger"
      }
    ]
  }'

echo -e "\n\n"

# Test 2: Counter button
echo "📝 Test 2: Counter Button"
curl -X POST $BASE_URL/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "🔢 **Counter Test**: Click to increment!",
    "buttons": [
      {
        "customId": "counter_button",
        "label": "Clicked 0 times",
        "style": "secondary"
      }
    ]
  }'

echo -e "\n\n"

# Test 3: Embed with buttons
echo "📝 Test 3: Embed with Buttons"
curl -X POST $BASE_URL/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "🎮 Game Dashboard",
        "description": "Welcome to the game control panel!",
        "color": 0x00ff00,
        "fields": [
          {
            "name": "Status",
            "value": "🟢 Online",
            "inline": true
          },
          {
            "name": "Players",
            "value": "42",
            "inline": true
          }
        ],
        "footer": {
          "text": "Game Server v2.0"
        },
        "timestamp": "2024-01-01T00:00:00.000Z"
      }
    ],
    "buttons": [
      {
        "customId": "join_game",
        "label": "🎮 Join Game",
        "style": "success"
      },
      {
        "customId": "view_stats",
        "label": "📊 Stats",
        "style": "primary"
      },
      {
        "customId": "settings",
        "label": "⚙️ Settings",
        "style": "secondary"
      }
    ]
  }'

echo -e "\n\n"

# Test 4: Link button
echo "📝 Test 4: Link Button"
curl -X POST $BASE_URL/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "🌐 **External Link**: Visit our website!",
    "buttons": [
      {
        "label": "🌐 Visit Website",
        "style": "link",
        "url": "https://github.com"
      }
    ]
  }'

echo -e "\n\n"

# Test 5: Multiple button styles
echo "📝 Test 5: All Button Styles"
curl -X POST $BASE_URL/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "🎨 **Style Test**: All button styles showcase",
    "buttons": [
      {
        "customId": "primary_btn",
        "label": "Primary",
        "style": "primary"
      },
      {
        "customId": "secondary_btn", 
        "label": "Secondary",
        "style": "secondary"
      },
      {
        "customId": "success_btn",
        "label": "Success", 
        "style": "success"
      },
      {
        "customId": "danger_btn",
        "label": "Danger",
        "style": "danger"
      }
    ]
  }'

echo -e "\n\n✅ All tests completed!"
echo "Check your Discord channel to see the buttons in action!"
echo "Click the buttons to test the interactions."