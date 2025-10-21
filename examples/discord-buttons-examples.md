# Discord Buttons Examples

This document provides comprehensive examples of how to use Discord buttons with the API.

## Basic Button Examples

### 1. Simple Confirmation Buttons

```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "Do you want to proceed with this action?",
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
```

### 2. Information Button

```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "Click the button below for more information:",
    "buttons": [
      {
        "customId": "info_button",
        "label": "ℹ️ More Info",
        "style": "primary"
      }
    ]
  }'
```

### 3. Counter Button

```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "Click the button to increment the counter:",
    "buttons": [
      {
        "customId": "counter_button",
        "label": "Clicked 0 times",
        "style": "secondary"
      }
    ]
  }'
```

### 4. Link Button

```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "Visit our website:",
    "buttons": [
      {
        "label": "🌐 Visit Website",
        "style": "link",
        "url": "https://example.com"
      }
    ]
  }'
```

## Advanced Examples

### 5. Multiple Button Styles

```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "Choose an action:",
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
```

### 6. Buttons with Embeds

```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "🎮 Game Menu",
        "description": "Choose your action:",
        "color": 65280,
        "fields": [
          {
            "name": "Players Online",
            "value": "1,234",
            "inline": true
          },
          {
            "name": "Server Status",
            "value": "🟢 Online",
            "inline": true
          }
        ],
        "footer": {
          "text": "Game Server v1.0"
        },
        "timestamp": true
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
        "label": "📊 View Stats",
        "style": "primary"
      },
      {
        "customId": "settings",
        "label": "⚙️ Settings",
        "style": "secondary"
      }
    ]
  }'
```

### 7. Maximum Buttons (5 per row)

```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "Navigation Menu:",
    "buttons": [
      {
        "customId": "home",
        "label": "🏠 Home",
        "style": "primary"
      },
      {
        "customId": "profile",
        "label": "👤 Profile",
        "style": "secondary"
      },
      {
        "customId": "settings",
        "label": "⚙️ Settings",
        "style": "secondary"
      },
      {
        "customId": "help",
        "label": "❓ Help",
        "style": "secondary"
      },
      {
        "customId": "logout",
        "label": "🚪 Logout",
        "style": "danger"
      }
    ]
  }'
```

### 8. Multiple Rows of Buttons

```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "Control Panel:",
    "buttons": [
      {
        "customId": "start",
        "label": "▶️ Start",
        "style": "success"
      },
      {
        "customId": "pause",
        "label": "⏸️ Pause",
        "style": "secondary"
      },
      {
        "customId": "stop",
        "label": "⏹️ Stop",
        "style": "danger"
      },
      {
        "customId": "restart",
        "label": "🔄 Restart",
        "style": "primary"
      },
      {
        "customId": "status",
        "label": "📊 Status",
        "style": "secondary"
      },
      {
        "customId": "logs",
        "label": "📋 Logs",
        "style": "secondary"
      },
      {
        "customId": "config",
        "label": "⚙️ Config",
        "style": "secondary"
      },
      {
        "customId": "backup",
        "label": "💾 Backup",
        "style": "primary"
      },
      {
        "customId": "restore",
        "label": "📥 Restore",
        "style": "primary"
      },
      {
        "customId": "delete",
        "label": "🗑️ Delete",
        "style": "danger"
      }
    ]
  }'
```

### 9. Disabled Button

```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "Some buttons are disabled:",
    "buttons": [
      {
        "customId": "available",
        "label": "Available",
        "style": "success"
      },
      {
        "customId": "disabled",
        "label": "Disabled",
        "style": "secondary",
        "disabled": true
      }
    ]
  }'
```

### 10. Buttons with Emojis

```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "React with buttons:",
    "buttons": [
      {
        "customId": "like",
        "label": "Like",
        "style": "success",
        "emoji": "👍"
      },
      {
        "customId": "dislike",
        "label": "Dislike",
        "style": "danger",
        "emoji": "👎"
      },
      {
        "customId": "heart",
        "label": "Love",
        "style": "primary",
        "emoji": "❤️"
      }
    ]
  }'
```

## Button Interaction Handling

The bot automatically handles these button interactions:

- **confirm_action**: Shows "✅ Action confirmed!" message
- **cancel_action**: Shows "❌ Action cancelled." message  
- **info_button**: Shows an information embed
- **counter_button**: Increments the counter in the button label
- **Custom buttons**: Shows a generic "Button clicked!" message

## Button Configuration Options

### Required Fields
- `label`: Button text (max 80 characters)

### Optional Fields
- `customId`: Unique identifier for the button (auto-generated if not provided)
- `style`: Button style (`primary`, `secondary`, `success`, `danger`, `link`)
- `emoji`: Emoji to display on the button
- `disabled`: Whether the button is disabled (boolean)
- `url`: URL for link-style buttons (required for link buttons)

### Button Styles
- **Primary**: Blue button (default)
- **Secondary**: Gray button  
- **Success**: Green button
- **Danger**: Red button
- **Link**: Link button (requires URL)

## Limitations

- Maximum 25 buttons per message (5 buttons per row, 5 rows max)
- Button labels must be 80 characters or less
- Link buttons require a URL and cannot have a customId
- Non-link buttons can have customId for interaction handling
- Buttons persist until the message is deleted or edited

## Error Handling

The API will return validation errors for:
- Invalid button configurations
- Too many buttons
- Missing required fields
- Invalid button styles
- Missing URLs for link buttons
- Labels that are too long

All button interactions are logged and handled gracefully with user-friendly error messages.