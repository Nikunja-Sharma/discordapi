# Discord Bot Backend API

Express.js backend service for Discord bot integration with authentication and message sending capabilities.

## Features

- JWT-based authentication
- Discord bot integration
- Secure message sending to predefined channels
- Guild and channel management
- MongoDB integration

## Environment Setup

Create a `.env` file based on `.env.example` and configure:

- `DISCORD_BOT_TOKEN`: Your Discord bot token
- `DISCORD_APPLICATION_ID`: Your Discord application ID  
- `DISCORD_DEFAULT_GUILD_ID`: Default server/guild ID
- `DISCORD_DEFAULT_CHANNEL_ID`: Default channel ID for messages
- `JWT_SECRET`: Secret key for JWT tokens
- `MONGODB_URI`: MongoDB connection string

## API Endpoints

### Authentication Required
All Discord endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Discord Endpoints

#### Send Message
```
POST /api/discord/send
```
Sends a message to the predefined default channel.

**Request Body:**
```json
{
  "content": "Your message text (optional if embeds provided)",
  "embeds": [
    {
      "title": "Embed Title",
      "description": "Embed description",
      "color": 0x00ff00
    }
  ],
  "buttons": [
    {
      "customId": "my_button",
      "label": "Click Me!",
      "style": "primary"
    }
  ]
}
```

**Note:** Channel is automatically set to the configured default channel. Users cannot specify custom channels.

**Button Support:** Messages can include interactive buttons. See `examples/discord-buttons-examples.md` for comprehensive examples.

#### Get Default Channel Info
```
GET /api/discord/default-channel
```
Returns information about the configured default channel.

#### Get Guilds
```
GET /api/discord/guilds
```
Returns list of guilds/servers the bot is connected to.

#### Get Channels
```
GET /api/discord/channels/:guildId
```
Returns list of channels in a specific guild.

You can choose from one of the following two methods to use this repository:

### One-Click Deploy

Deploy the example using [Vercel](https://vercel.com?utm_source=github&utm_medium=readme&utm_campaign=vercel-examples):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/vercel/examples/tree/main/solutions/express&project-name=express&repository-name=express)

### Clone and Deploy

```bash
git clone https://github.com/vercel/examples/tree/main/solutions/express
```

Install the Vercel CLI:

```bash
npm i -g vercel
```

Then run the app at the root of the repository:

```bash
vercel dev
```