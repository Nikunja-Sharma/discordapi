# Discord Bot API - Curl Examples

This directory contains ready-to-use curl command examples for testing all Discord bot features.

## Quick Start

1. **Set your JWT token** in each script by replacing `YOUR_JWT_TOKEN`
2. **Make scripts executable**: `chmod +x *.sh`
3. **Run any example**: `./01-basic-message.sh`

## Examples Overview

| File | Description | Features |
|------|-------------|----------|
| `01-basic-message.sh` | Basic text with markdown | Bold, italic, code, quotes |
| `02-simple-embed.sh` | Server statistics embed | Fields, colors, timestamps |
| `03-yes-no-buttons.sh` | Confirmation dialog | Success/danger buttons |
| `04-link-buttons.sh` | External link buttons | Multiple link buttons |
| `05-complete-example.sh` | Server dashboard | Embed + interactive buttons |
| `06-counter-game.sh` | Interactive counter | Counter button functionality |
| `07-poll-example.sh` | Community poll | Multiple choice buttons |
| `08-all-button-styles.sh` | Button showcase | All styles, emojis, disabled |

## Run All Examples

Use the master script to run all examples with proper delays:

```bash
# Edit the token first
nano ../run-all-examples.sh

# Run all examples
../run-all-examples.sh
```

## Button Interactions

When you click buttons, you'll get these responses:

- **confirm_action** → "✅ Action confirmed!"
- **cancel_action** → "❌ Action cancelled."
- **info_button** → Information embed
- **counter_button** → Increments the counter
- **Custom buttons** → Generic response

## Customization

### Colors
Use hex color codes in embeds:
- `0x00ff00` - Green
- `0xff0000` - Red  
- `0x0099ff` - Blue
- `0xffd700` - Gold
- `0xff6b35` - Orange

### Button Styles
- `primary` - Blue (default)
- `secondary` - Gray
- `success` - Green
- `danger` - Red
- `link` - Blue link (requires URL)

### Emojis
Add emojis to buttons:
```json
{
  "customId": "like_btn",
  "label": "Like",
  "style": "success",
  "emoji": "👍"
}
```

## Testing Tips

1. **Start simple** - Test basic messages first
2. **Check responses** - Look for success/error messages
3. **Try interactions** - Click buttons to test functionality
4. **Monitor logs** - Check server logs for errors
5. **Validate JSON** - Use a JSON validator if you get errors

## Common Issues

### Authentication Error
```
{"success": false, "error": {"code": "MISSING_TOKEN"}}
```
**Solution**: Make sure you have a valid JWT token

### Channel Not Found
```
{"success": false, "error": {"code": "CHANNEL_NOT_FOUND"}}
```
**Solution**: Check your `DISCORD_DEFAULT_CHANNEL_ID` in `.env`

### Bot Not Ready
```
{"success": false, "error": {"code": "BOT_NOT_READY"}}
```
**Solution**: Wait for bot to connect, check Discord token

### Invalid JSON
```
{"success": false, "error": {"code": "INVALID_FORM_BODY"}}
```
**Solution**: Validate your JSON syntax

## Advanced Examples

For more complex examples, see:
- `../examples/complete-discord-guide.md` - Comprehensive guide
- `../examples/discord-buttons-examples.md` - Button-focused examples

## API Reference

### Message Structure
```json
{
  "content": "Text content (optional)",
  "embeds": [
    {
      "title": "Embed title",
      "description": "Embed description", 
      "color": 0x00ff00,
      "fields": [
        {
          "name": "Field name",
          "value": "Field value",
          "inline": true
        }
      ]
    }
  ],
  "buttons": [
    {
      "customId": "button_id",
      "label": "Button text",
      "style": "primary"
    }
  ]
}
```

### Limits
- Message content: 2000 characters
- Embed title: 256 characters
- Embed description: 4096 characters
- Fields per embed: 25 max
- Embeds per message: 10 max
- Buttons per message: 25 max
- Button label: 80 characters