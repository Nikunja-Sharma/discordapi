# Discord Color Reference

## Common Colors (Decimal Values for JSON)

| Color Name | Hex Code | Decimal Value | Usage |
|------------|----------|---------------|-------|
| **Red** | #FF0000 | 16711680 | Errors, danger, stop |
| **Green** | #00FF00 | 65280 | Success, go, online |
| **Blue** | #0099FF | 39423 | Info, primary, links |
| **Yellow** | #FFFF00 | 16776960 | Warning, attention |
| **Orange** | #FF6600 | 16737280 | Alerts, notifications |
| **Purple** | #9900FF | 10027263 | Premium, special |
| **Pink** | #FF69B4 | 16738484 | Fun, playful |
| **Cyan** | #00FFFF | 65535 | Cool, tech |
| **Gold** | #FFD700 | 16766720 | Premium, awards |
| **Silver** | #C0C0C0 | 12632256 | Secondary, neutral |

## Discord Brand Colors

| Color | Hex Code | Decimal Value | Usage |
|-------|----------|---------------|-------|
| **Discord Blurple** | #5865F2 | 5793522 | Primary brand color |
| **Discord Green** | #57F287 | 5763719 | Success states |
| **Discord Yellow** | #FEE75C | 16705372 | Warning states |
| **Discord Fuchsia** | #EB459E | 15418782 | Accent color |
| **Discord Red** | #ED4245 | 15548997 | Error states |

## Embed Color Examples

### Success Message
```json
{
  "title": "✅ Success!",
  "description": "Operation completed successfully",
  "color": 65280
}
```

### Error Message
```json
{
  "title": "❌ Error!",
  "description": "Something went wrong",
  "color": 16711680
}
```

### Info Message
```json
{
  "title": "ℹ️ Information",
  "description": "Here's some helpful info",
  "color": 39423
}
```

### Warning Message
```json
{
  "title": "⚠️ Warning",
  "description": "Please pay attention",
  "color": 16776960
}
```

## Color Conversion

### Hex to Decimal Conversion
To convert hex colors to decimal for JSON:

**Method 1: Online Calculator**
- Go to any hex to decimal converter
- Enter hex value (e.g., `FFD700`)
- Get decimal result (e.g., `16766720`)

**Method 2: JavaScript Console**
```javascript
parseInt("FFD700", 16)  // Returns: 16766720
```

**Method 3: Python**
```python
int("FFD700", 16)  # Returns: 16766720
```

## Quick Reference Table

| Hex | Decimal | Color Preview |
|-----|---------|---------------|
| #FF0000 | 16711680 | 🔴 Red |
| #00FF00 | 65280 | 🟢 Green |
| #0000FF | 255 | 🔵 Blue |
| #FFFF00 | 16776960 | 🟡 Yellow |
| #FF6600 | 16737280 | 🟠 Orange |
| #800080 | 8388736 | 🟣 Purple |
| #FFC0CB | 16761035 | 🩷 Pink |
| #00FFFF | 65535 | 🩵 Cyan |
| #FFD700 | 16766720 | 🟨 Gold |
| #808080 | 8421504 | ⚫ Gray |

## Usage in Curl Commands

```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "Colorful Embed",
        "description": "This embed uses decimal color values",
        "color": 16766720
      }
    ]
  }'
```

## Common Mistakes

❌ **Wrong**: `"color": 0xFFD700` (hex literal)  
❌ **Wrong**: `"color": "#FFD700"` (string)  
❌ **Wrong**: `"color": "FFD700"` (string without #)  
✅ **Correct**: `"color": 16766720` (decimal integer)

## Color Palette Suggestions

### Status Colors
- **Online/Success**: 65280 (Green)
- **Offline/Error**: 16711680 (Red)
- **Away/Warning**: 16776960 (Yellow)
- **Busy/Info**: 39423 (Blue)

### Themed Colors
- **Gaming**: 5793522 (Discord Blurple)
- **Music**: 10027263 (Purple)
- **Art**: 16738484 (Pink)
- **Tech**: 65535 (Cyan)
- **Business**: 8421504 (Gray)