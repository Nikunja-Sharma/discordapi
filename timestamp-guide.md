# Discord Timestamp Guide

## Timestamp Formats

Discord embeds support timestamps in several formats:

### ✅ **Supported Formats**

| Format | Example | Description |
|--------|---------|-------------|
| `true` | `"timestamp": true` | Current time (recommended) |
| `null` | `"timestamp": null` | No timestamp |
| Unix timestamp | `"timestamp": 1704067200000` | Milliseconds since epoch |
| Date object | `new Date()` | JavaScript Date (server-side only) |

### ❌ **Invalid Formats**

| Format | Example | Issue |
|--------|---------|-------|
| ISO String | `"timestamp": "2024-01-01T12:00:00.000Z"` | Discord expects Date object, not string |
| Date string | `"timestamp": "January 1, 2024"` | Not a valid format |
| Seconds | `"timestamp": 1704067200` | Must be milliseconds, not seconds |

## Usage Examples

### Current Timestamp (Recommended)
```json
{
  "embeds": [
    {
      "title": "Current Time",
      "description": "This embed shows the current time",
      "timestamp": true
    }
  ]
}
```

### No Timestamp
```json
{
  "embeds": [
    {
      "title": "No Time",
      "description": "This embed has no timestamp"
    }
  ]
}
```

### Specific Unix Timestamp
```json
{
  "embeds": [
    {
      "title": "Specific Time",
      "description": "This embed shows a specific time",
      "timestamp": 1704067200000
    }
  ]
}
```

## Curl Examples

### Working Example
```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "✅ Working Timestamp",
        "description": "This will work correctly",
        "color": 65280,
        "timestamp": true
      }
    ]
  }'
```

### Broken Example (Don't Use)
```bash
# ❌ This will cause validation errors
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "❌ Broken Timestamp",
        "description": "This will fail",
        "color": 16711680,
        "timestamp": "2024-01-01T12:00:00.000Z"
      }
    ]
  }'
```

## JavaScript Date Conversion

If you need to convert dates in JavaScript:

```javascript
// Current time
const now = Date.now(); // Returns unix timestamp in milliseconds

// Specific date
const specificDate = new Date('2024-01-01').getTime();

// ISO string to unix timestamp
const isoString = "2024-01-01T12:00:00.000Z";
const unixTimestamp = new Date(isoString).getTime();
```

## Common Errors

### Error: "Expected values to be equals"
**Cause**: Using string timestamp instead of proper format
**Solution**: Use `true` for current time or unix timestamp number

### Error: "Unknown validation error occurred"
**Cause**: Invalid timestamp format
**Solution**: Check timestamp format matches supported types

### Error: "s.date() validation failed"
**Cause**: Discord.js expects Date object but received string
**Solution**: Convert string to Date object or use `true`

## Best Practices

1. **Use `true` for current time** - Most common use case
2. **Omit timestamp field** if you don't need it
3. **Use unix timestamps** for specific dates (in milliseconds)
4. **Never use ISO strings** directly in JSON
5. **Test your timestamps** with the provided test scripts

## Testing

Use the provided test scripts to verify timestamp functionality:

```bash
# Test current timestamp
./test-timestamp-fix.sh

# Test all formats
./test-all-timestamp-formats.sh
```