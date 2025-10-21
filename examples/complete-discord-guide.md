# Complete Discord Bot API Guide

This comprehensive guide covers all Discord embed and button features with detailed working examples.

## Table of Contents
1. [Basic Messages](#basic-messages)
2. [Simple Embeds](#simple-embeds)
3. [Advanced Embeds](#advanced-embeds)
4. [Button Types](#button-types)
5. [Embeds with Buttons](#embeds-with-buttons)
6. [Interactive Examples](#interactive-examples)
7. [Real-World Use Cases](#real-world-use-cases)

---

## Basic Messages

### 1. Simple Text Message
```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "Hello! This is a simple text message."
  }'
```

### 2. Text with Markdown
```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "**Bold Text** *Italic Text* `Code Text` ~~Strikethrough~~\n\n> This is a quote\n\n```javascript\nconsole.log(\"Code block\");\n```"
  }'
```

---

## Simple Embeds

### 3. Basic Embed
```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "📋 Basic Embed",
        "description": "This is a simple embed with title and description.",
        "color": 0x3498db
      }
    ]
  }'
```

### 4. Embed with Fields
```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "📊 Server Statistics",
        "description": "Current server information",
        "color": 0x00ff00,
        "fields": [
          {
            "name": "👥 Members",
            "value": "1,234",
            "inline": true
          },
          {
            "name": "📺 Channels",
            "value": "42",
            "inline": true
          },
          {
            "name": "🎭 Roles",
            "value": "15",
            "inline": true
          },
          {
            "name": "📅 Created",
            "value": "January 1, 2024",
            "inline": false
          }
        ]
      }
    ]
  }'
```

---

## Advanced Embeds

### 5. Complete Embed with All Features
```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "🎮 Game Server Status",
        "description": "Complete server information and statistics",
        "color": 0xff6b35,
        "author": {
          "name": "GameBot",
          "iconURL": "https://cdn.discordapp.com/embed/avatars/0.png",
          "url": "https://example.com"
        },
        "thumbnail": {
          "url": "https://cdn.discordapp.com/embed/avatars/1.png"
        },
        "image": {
          "url": "https://cdn.discordapp.com/embed/avatars/2.png"
        },
        "fields": [
          {
            "name": "🟢 Status",
            "value": "Online",
            "inline": true
          },
          {
            "name": "👥 Players",
            "value": "42/100",
            "inline": true
          },
          {
            "name": "🌍 Region",
            "value": "US-East",
            "inline": true
          },
          {
            "name": "📊 Performance",
            "value": "CPU: 45%\nRAM: 2.1GB/8GB\nUptime: 7d 12h",
            "inline": false
          }
        ],
        "footer": {
          "text": "Last updated",
          "iconURL": "https://cdn.discordapp.com/embed/avatars/3.png"
        },
        "timestamp": "2024-01-01T12:00:00.000Z"
      }
    ]
  }'
```

### 6. Multiple Embeds
```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "📊 **Daily Report** - Multiple sections below:",
    "embeds": [
      {
        "title": "💰 Sales Report",
        "color": 0x00ff00,
        "fields": [
          {
            "name": "Today",
            "value": "$1,234",
            "inline": true
          },
          {
            "name": "This Week",
            "value": "$8,765",
            "inline": true
          }
        ]
      },
      {
        "title": "👥 User Activity",
        "color": 0x3498db,
        "fields": [
          {
            "name": "New Users",
            "value": "42",
            "inline": true
          },
          {
            "name": "Active Users",
            "value": "1,337",
            "inline": true
          }
        ]
      },
      {
        "title": "⚠️ System Alerts",
        "color": 0xff0000,
        "description": "No critical alerts at this time.",
        "footer": {
          "text": "All systems operational"
        }
      }
    ]
  }'
```

---

## Button Types

### 7. All Button Styles
```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "🎨 **Button Styles Showcase** - Try each button type:",
    "buttons": [
      {
        "customId": "primary_demo",
        "label": "Primary",
        "style": "primary"
      },
      {
        "customId": "secondary_demo",
        "label": "Secondary",
        "style": "secondary"
      },
      {
        "customId": "success_demo",
        "label": "Success",
        "style": "success"
      },
      {
        "customId": "danger_demo",
        "label": "Danger",
        "style": "danger"
      },
      {
        "label": "🌐 Link",
        "style": "link",
        "url": "https://discord.com"
      }
    ]
  }'
```

### 8. Buttons with Emojis
```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "😀 **Emoji Buttons** - Express yourself:",
    "buttons": [
      {
        "customId": "like_btn",
        "label": "Like",
        "style": "success",
        "emoji": "👍"
      },
      {
        "customId": "love_btn",
        "label": "Love",
        "style": "primary",
        "emoji": "❤️"
      },
      {
        "customId": "laugh_btn",
        "label": "Laugh",
        "style": "secondary",
        "emoji": "😂"
      },
      {
        "customId": "dislike_btn",
        "label": "Dislike",
        "style": "danger",
        "emoji": "👎"
      }
    ]
  }'
```

### 9. Yes/No Confirmation
```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "❓ **Confirmation Required**\n\nAre you sure you want to delete all user data? This action cannot be undone.",
    "buttons": [
      {
        "customId": "confirm_action",
        "label": "✅ Yes, Delete",
        "style": "danger"
      },
      {
        "customId": "cancel_action",
        "label": "❌ Cancel",
        "style": "secondary"
      }
    ]
  }'
```

---

## Embeds with Buttons

### 10. User Profile with Actions
```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "👤 User Profile",
        "description": "Detailed user information and statistics",
        "color": 0x7289da,
        "thumbnail": {
          "url": "https://cdn.discordapp.com/embed/avatars/0.png"
        },
        "fields": [
          {
            "name": "🏷️ Username",
            "value": "JohnDoe#1234",
            "inline": true
          },
          {
            "name": "📅 Joined",
            "value": "Jan 15, 2024",
            "inline": true
          },
          {
            "name": "🎭 Role",
            "value": "Premium Member",
            "inline": true
          },
          {
            "name": "📊 Statistics",
            "value": "Messages: 1,337\nVoice Time: 42h\nLevel: 25",
            "inline": false
          }
        ],
        "footer": {
          "text": "User ID: 123456789012345678"
        },
        "timestamp": "2024-01-01T12:00:00.000Z"
      }
    ],
    "buttons": [
      {
        "customId": "view_profile",
        "label": "👁️ View Full Profile",
        "style": "primary"
      },
      {
        "customId": "send_message",
        "label": "💬 Send Message",
        "style": "secondary"
      },
      {
        "customId": "add_friend",
        "label": "👥 Add Friend",
        "style": "success"
      },
      {
        "customId": "report_user",
        "label": "🚨 Report",
        "style": "danger"
      }
    ]
  }'
```

### 11. Game Dashboard
```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "🎮 Minecraft Server Dashboard",
        "description": "Real-time server monitoring and controls",
        "color": 0x00aa00,
        "thumbnail": {
          "url": "https://cdn.discordapp.com/embed/avatars/4.png"
        },
        "fields": [
          {
            "name": "🟢 Status",
            "value": "Online",
            "inline": true
          },
          {
            "name": "👥 Players",
            "value": "15/20",
            "inline": true
          },
          {
            "name": "🌍 World",
            "value": "Survival",
            "inline": true
          },
          {
            "name": "📊 Performance",
            "value": "TPS: 19.8/20\nRAM: 4.2GB/8GB\nCPU: 35%",
            "inline": false
          },
          {
            "name": "🔧 Version",
            "value": "1.20.4 (Paper)",
            "inline": true
          },
          {
            "name": "⏰ Uptime",
            "value": "3d 7h 42m",
            "inline": true
          }
        ],
        "footer": {
          "text": "Last updated"
        },
        "timestamp": "2024-01-01T12:00:00.000Z"
      }
    ],
    "buttons": [
      {
        "customId": "join_server",
        "label": "🎮 Join Server",
        "style": "success"
      },
      {
        "customId": "view_players",
        "label": "👥 Player List",
        "style": "primary"
      },
      {
        "customId": "server_logs",
        "label": "📋 View Logs",
        "style": "secondary"
      },
      {
        "customId": "restart_server",
        "label": "🔄 Restart",
        "style": "danger"
      },
      {
        "label": "🌐 Web Panel",
        "style": "link",
        "url": "https://panel.example.com"
      }
    ]
  }'
```

---

## Interactive Examples

### 12. Poll with Reactions
```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "📊 Community Poll",
        "description": "**What should we add to the server next?**\n\nVote by clicking the buttons below. Poll ends in 24 hours.",
        "color": 0xffd700,
        "fields": [
          {
            "name": "🎵 Music Bot",
            "value": "Add music streaming capabilities",
            "inline": false
          },
          {
            "name": "🎮 Game Nights",
            "value": "Weekly community game events",
            "inline": false
          },
          {
            "name": "📚 Study Groups",
            "value": "Dedicated study and homework help",
            "inline": false
          },
          {
            "name": "🎨 Art Showcase",
            "value": "Channel for sharing artwork",
            "inline": false
          }
        ],
        "footer": {
          "text": "Poll created by Admin • Ends in 24 hours"
        }
      }
    ],
    "buttons": [
      {
        "customId": "vote_music",
        "label": "🎵 Music Bot",
        "style": "primary"
      },
      {
        "customId": "vote_games",
        "label": "🎮 Game Nights",
        "style": "success"
      },
      {
        "customId": "vote_study",
        "label": "📚 Study Groups",
        "style": "secondary"
      },
      {
        "customId": "vote_art",
        "label": "🎨 Art Showcase",
        "style": "primary"
      }
    ]
  }'
```

### 13. Support Ticket System
```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "🎫 Support Ticket System",
        "description": "Need help? Create a support ticket and our team will assist you!\n\n**Before creating a ticket:**\n• Check our FAQ channel\n• Search previous tickets\n• Make sure your issue is not already reported",
        "color": 0x5865f2,
        "fields": [
          {
            "name": "🐛 Bug Report",
            "value": "Report bugs or technical issues",
            "inline": true
          },
          {
            "name": "💡 Feature Request",
            "value": "Suggest new features or improvements",
            "inline": true
          },
          {
            "name": "❓ General Help",
            "value": "Get help with using our services",
            "inline": true
          },
          {
            "name": "💰 Billing Support",
            "value": "Questions about payments or subscriptions",
            "inline": true
          },
          {
            "name": "🔒 Account Issues",
            "value": "Problems with your account access",
            "inline": true
          },
          {
            "name": "📞 Priority Support",
            "value": "Urgent issues (Premium only)",
            "inline": true
          }
        ],
        "footer": {
          "text": "Average response time: 2-4 hours"
        }
      }
    ],
    "buttons": [
      {
        "customId": "ticket_bug",
        "label": "🐛 Bug Report",
        "style": "danger"
      },
      {
        "customId": "ticket_feature",
        "label": "💡 Feature Request",
        "style": "primary"
      },
      {
        "customId": "ticket_help",
        "label": "❓ General Help",
        "style": "secondary"
      },
      {
        "customId": "ticket_billing",
        "label": "💰 Billing",
        "style": "success"
      },
      {
        "label": "📚 View FAQ",
        "style": "link",
        "url": "https://help.example.com"
      }
    ]
  }'
```

### 14. Counter/Clicker Game
```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "🎯 Click Counter Game",
        "description": "**How fast can you click?**\n\nClick the button below to increment the counter. Try to reach 100 clicks!",
        "color": 0xff6b6b,
        "fields": [
          {
            "name": "🔢 Current Count",
            "value": "0",
            "inline": true
          },
          {
            "name": "🎯 Goal",
            "value": "100",
            "inline": true
          },
          {
            "name": "👑 High Score",
            "value": "87 (by @User123)",
            "inline": true
          }
        ],
        "footer": {
          "text": "Game started • Click the button to play!"
        }
      }
    ],
    "buttons": [
      {
        "customId": "counter_button",
        "label": "🖱️ Click Me! (0)",
        "style": "primary"
      },
      {
        "customId": "reset_counter",
        "label": "🔄 Reset",
        "style": "secondary"
      },
      {
        "customId": "leaderboard",
        "label": "🏆 Leaderboard",
        "style": "success"
      }
    ]
  }'
```

---

## Real-World Use Cases

### 15. E-commerce Product Showcase
```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "🛍️ New Product Launch!",
        "description": "**Premium Wireless Headphones**\n\nExperience crystal-clear audio with our latest wireless headphones featuring active noise cancellation and 30-hour battery life.",
        "color": 0x1abc9c,
        "image": {
          "url": "https://cdn.discordapp.com/embed/avatars/5.png"
        },
        "fields": [
          {
            "name": "💰 Price",
            "value": "~~$199.99~~ **$149.99**\n*25% OFF Launch Sale!*",
            "inline": true
          },
          {
            "name": "📦 Stock",
            "value": "47 remaining",
            "inline": true
          },
          {
            "name": "⭐ Rating",
            "value": "4.8/5 (124 reviews)",
            "inline": true
          },
          {
            "name": "🎧 Features",
            "value": "• Active Noise Cancellation\n• 30-hour battery life\n• Quick charge (15min = 3hrs)\n• Premium leather comfort\n• Bluetooth 5.2",
            "inline": false
          },
          {
            "name": "📋 Specifications",
            "value": "**Driver:** 40mm Dynamic\n**Frequency:** 20Hz-20kHz\n**Weight:** 250g\n**Colors:** Black, White, Blue",
            "inline": false
          }
        ],
        "footer": {
          "text": "Free shipping on orders over $100 • 30-day return policy"
        }
      }
    ],
    "buttons": [
      {
        "customId": "add_to_cart",
        "label": "🛒 Add to Cart",
        "style": "success"
      },
      {
        "customId": "buy_now",
        "label": "⚡ Buy Now",
        "style": "primary"
      },
      {
        "customId": "wishlist",
        "label": "❤️ Wishlist",
        "style": "secondary"
      },
      {
        "customId": "compare",
        "label": "⚖️ Compare",
        "style": "secondary"
      },
      {
        "label": "🌐 View on Website",
        "style": "link",
        "url": "https://shop.example.com/headphones"
      }
    ]
  }'
```

### 16. Event Registration
```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "🎉 Community Game Tournament",
        "description": "**Join our epic gaming tournament!**\n\nCompete against other community members in various games and win amazing prizes!",
        "color": 0xe74c3c,
        "thumbnail": {
          "url": "https://cdn.discordapp.com/embed/avatars/6.png"
        },
        "fields": [
          {
            "name": "📅 Date & Time",
            "value": "Saturday, January 20th\n2:00 PM EST",
            "inline": true
          },
          {
            "name": "⏱️ Duration",
            "value": "4-6 hours",
            "inline": true
          },
          {
            "name": "👥 Participants",
            "value": "24/64 registered",
            "inline": true
          },
          {
            "name": "🎮 Games",
            "value": "• Rocket League\n• Among Us\n• Fall Guys\n• Minecraft\n• Custom Challenges",
            "inline": false
          },
          {
            "name": "🏆 Prizes",
            "value": "🥇 **1st Place:** $100 Steam Gift Card\n🥈 **2nd Place:** $50 Steam Gift Card\n🥉 **3rd Place:** $25 Steam Gift Card\n🎁 **Participation:** Discord Nitro (1 month)",
            "inline": false
          },
          {
            "name": "📋 Requirements",
            "value": "• Discord account\n• Microphone recommended\n• Games installed\n• Positive attitude!",
            "inline": false
          }
        ],
        "footer": {
          "text": "Registration closes 24 hours before the event"
        }
      }
    ],
    "buttons": [
      {
        "customId": "register_tournament",
        "label": "🎯 Register Now",
        "style": "success"
      },
      {
        "customId": "view_rules",
        "label": "📜 View Rules",
        "style": "primary"
      },
      {
        "customId": "ask_question",
        "label": "❓ Ask Question",
        "style": "secondary"
      },
      {
        "customId": "remind_me",
        "label": "⏰ Remind Me",
        "style": "secondary"
      },
      {
        "label": "📺 Watch Stream",
        "style": "link",
        "url": "https://twitch.tv/example"
      }
    ]
  }'
```

### 17. Server Status Dashboard
```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "🖥️ System Status Dashboard",
        "description": "Real-time monitoring of all services and infrastructure",
        "color": 0x2ecc71,
        "fields": [
          {
            "name": "🌐 Web Server",
            "value": "🟢 **Operational**\nResponse: 45ms\nUptime: 99.9%",
            "inline": true
          },
          {
            "name": "🗄️ Database",
            "value": "🟢 **Operational**\nConnections: 23/100\nQuery time: 12ms",
            "inline": true
          },
          {
            "name": "📧 Email Service",
            "value": "🟡 **Degraded**\nQueue: 156 pending\nDelay: ~5 minutes",
            "inline": true
          },
          {
            "name": "🔐 Authentication",
            "value": "🟢 **Operational**\nActive sessions: 1,247\nSuccess rate: 99.8%",
            "inline": true
          },
          {
            "name": "💾 File Storage",
            "value": "🟢 **Operational**\nUsage: 2.1TB/5TB\nBandwidth: 45MB/s",
            "inline": true
          },
          {
            "name": "🤖 Discord Bot",
            "value": "🟢 **Operational**\nLatency: 67ms\nGuilds: 1,337",
            "inline": true
          },
          {
            "name": "📊 Recent Incidents",
            "value": "• **Jan 15:** Database maintenance (2h)\n• **Jan 10:** Email service outage (45m)\n• **Jan 5:** Web server restart (5m)",
            "inline": false
          }
        ],
        "footer": {
          "text": "Last updated • Auto-refresh every 30 seconds"
        },
        "timestamp": "2024-01-01T12:00:00.000Z"
      }
    ],
    "buttons": [
      {
        "customId": "refresh_status",
        "label": "🔄 Refresh",
        "style": "primary"
      },
      {
        "customId": "view_metrics",
        "label": "📊 Detailed Metrics",
        "style": "secondary"
      },
      {
        "customId": "incident_history",
        "label": "📋 Incident History",
        "style": "secondary"
      },
      {
        "customId": "subscribe_alerts",
        "label": "🔔 Subscribe to Alerts",
        "style": "success"
      },
      {
        "label": "🌐 Status Page",
        "style": "link",
        "url": "https://status.example.com"
      }
    ]
  }'
```

---

## Advanced Features

### 18. Multi-Row Button Layout
```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "🎛️ **Advanced Control Panel** - Multiple button rows:",
    "buttons": [
      {
        "customId": "start_service",
        "label": "▶️ Start",
        "style": "success"
      },
      {
        "customId": "pause_service",
        "label": "⏸️ Pause",
        "style": "secondary"
      },
      {
        "customId": "stop_service",
        "label": "⏹️ Stop",
        "style": "danger"
      },
      {
        "customId": "restart_service",
        "label": "🔄 Restart",
        "style": "primary"
      },
      {
        "customId": "status_service",
        "label": "📊 Status",
        "style": "secondary"
      },
      {
        "customId": "logs_service",
        "label": "📋 Logs",
        "style": "secondary"
      },
      {
        "customId": "config_service",
        "label": "⚙️ Config",
        "style": "secondary"
      },
      {
        "customId": "backup_service",
        "label": "💾 Backup",
        "style": "primary"
      },
      {
        "customId": "restore_service",
        "label": "📥 Restore",
        "style": "primary"
      },
      {
        "customId": "delete_service",
        "label": "🗑️ Delete",
        "style": "danger"
      }
    ]
  }'
```

### 19. Disabled Buttons Example
```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "🔒 Access Control Demo",
        "description": "Some buttons are disabled based on your permissions:",
        "color": 0x95a5a6,
        "fields": [
          {
            "name": "👤 Your Role",
            "value": "Member",
            "inline": true
          },
          {
            "name": "🔑 Permissions",
            "value": "Read, Write",
            "inline": true
          }
        ]
      }
    ],
    "buttons": [
      {
        "customId": "read_data",
        "label": "📖 Read Data",
        "style": "primary"
      },
      {
        "customId": "write_data",
        "label": "✏️ Write Data",
        "style": "success"
      },
      {
        "customId": "admin_panel",
        "label": "👑 Admin Panel",
        "style": "danger",
        "disabled": true
      },
      {
        "customId": "delete_all",
        "label": "🗑️ Delete All",
        "style": "danger",
        "disabled": true
      }
    ]
  }'
```

### 20. Information Request System
```bash
curl -X POST http://localhost:3000/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "embeds": [
      {
        "title": "ℹ️ Information Center",
        "description": "Click any button below to get detailed information about that topic:",
        "color": 0x3498db,
        "footer": {
          "text": "Click buttons for more details"
        }
      }
    ],
    "buttons": [
      {
        "customId": "info_button",
        "label": "ℹ️ General Info",
        "style": "primary"
      },
      {
        "customId": "help_commands",
        "label": "❓ Commands Help",
        "style": "secondary"
      },
      {
        "customId": "server_rules",
        "label": "📜 Server Rules",
        "style": "secondary"
      },
      {
        "customId": "contact_staff",
        "label": "👨‍💼 Contact Staff",
        "style": "success"
      },
      {
        "label": "🌐 Website",
        "style": "link",
        "url": "https://example.com"
      }
    ]
  }'
```

---

## Testing Your Implementation

### Quick Test Script
Save this as `test-all-features.sh`:

```bash
#!/bin/bash
TOKEN="YOUR_JWT_TOKEN"
BASE_URL="http://localhost:3000"

echo "🧪 Testing all Discord features..."

# Test 1: Simple message
echo "1. Testing simple message..."
curl -s -X POST $BASE_URL/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content": "✅ Simple message test"}' > /dev/null

# Test 2: Embed only
echo "2. Testing embed..."
curl -s -X POST $BASE_URL/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"embeds": [{"title": "✅ Embed Test", "color": 0x00ff00}]}' > /dev/null

# Test 3: Buttons only
echo "3. Testing buttons..."
curl -s -X POST $BASE_URL/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content": "✅ Button test", "buttons": [{"customId": "test", "label": "Test", "style": "primary"}]}' > /dev/null

# Test 4: Everything combined
echo "4. Testing embed + buttons..."
curl -s -X POST $BASE_URL/api/discord/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"embeds": [{"title": "✅ Combined Test", "color": 0x00ff00}], "buttons": [{"customId": "combined", "label": "Combined", "style": "success"}]}' > /dev/null

echo "✅ All tests completed! Check your Discord channel."
```

---

## Button Interaction Responses

When users click buttons, they get these responses:

- **confirm_action** → "✅ Action confirmed!"
- **cancel_action** → "❌ Action cancelled."
- **info_button** → Information embed with details
- **counter_button** → Updates button label with new count
- **Custom buttons** → Generic "Button clicked!" message

---

## API Limits & Best Practices

### Discord Limits:
- **Message content:** 2000 characters max
- **Embed title:** 256 characters max
- **Embed description:** 4096 characters max
- **Embed fields:** 25 max per embed
- **Field name:** 256 characters max
- **Field value:** 1024 characters max
- **Embeds per message:** 10 max
- **Buttons per message:** 25 max (5 per row, 5 rows max)
- **Button label:** 80 characters max

### Best Practices:
1. Always include either content or embeds
2. Use appropriate button styles for actions
3. Keep button labels short and descriptive
4. Use emojis to make buttons more engaging
5. Disable buttons when actions aren't available
6. Provide clear feedback for button interactions
7. Use link buttons for external resources
8. Group related buttons logically

This guide covers all major Discord embed and button features with practical, working examples you can use immediately!