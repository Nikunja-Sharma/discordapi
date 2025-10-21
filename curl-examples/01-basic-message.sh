#!/bin/bash
# Basic message with markdown formatting

curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "**Hello Discord!** 🎉\n\n*This is a basic message with:*\n\n• **Bold text**\n• *Italic text*\n• `Code text`\n• ~~Strikethrough~~\n\n> This is a quote block\n\n```javascript\nconsole.log(\"Code block example\");\n```"
  }'