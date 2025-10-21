#!/bin/bash
# Showcase all button styles and features

curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "🎨 **Button Styles Showcase**\n\nTry all different button types and styles:",
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
      },
      {
        "label": "🌐 Link Button",
        "style": "link",
        "url": "https://discord.com"
      },
      {
        "customId": "emoji_btn",
        "label": "With Emoji",
        "style": "primary",
        "emoji": "🎉"
      },
      {
        "customId": "heart_btn",
        "label": "Love",
        "style": "success",
        "emoji": "❤️"
      },
      {
        "customId": "fire_btn",
        "label": "Fire",
        "style": "danger",
        "emoji": "🔥"
      },
      {
        "customId": "star_btn",
        "label": "Star",
        "style": "secondary",
        "emoji": "⭐"
      },
      {
        "customId": "disabled_btn",
        "label": "Disabled",
        "style": "secondary",
        "disabled": true
      }
    ]
  }'