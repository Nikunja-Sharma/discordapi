# Discord Bot Authentication Setup Guide

## Backend Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Fill in your Discord application credentials:
     - `DISCORD_CLIENT_ID`: Your Discord application's client ID
     - `DISCORD_CLIENT_SECRET`: Your Discord application's client secret
     - `DISCORD_REDIRECT_URI`: Should match your frontend URL + `/auth/discord/callback`
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: A secure random string for JWT signing

3. **Discord Application Setup**
   - Go to https://discord.com/developers/applications
   - Create a new application or use existing one
   - In OAuth2 settings, add redirect URI: `http://localhost:5173/auth/discord/callback`
   - Required OAuth2 scopes: `identify`, `email`

4. **Start Backend**
   ```bash
   npm run dev
   ```

## Frontend Setup

1. **Navigate to Frontend Directory**
   ```bash
   cd discordfrontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Set your Discord client ID:
     ```
     VITE_DISCORD_CLIENT_ID=your_discord_client_id_here
     ```

4. **Start Frontend**
   ```bash
   npm run dev
   ```

## Features

- **Regular Authentication**: Email/password registration and login
- **Discord OAuth**: One-click login with Discord account
- **Secure Cookies**: HTTP-only cookies for token storage
- **User Profile**: Display user information and Discord avatar
- **Subscription Management**: Ready for premium feature integration

## API Endpoints

- `POST /api/auth/register` - Register with email/password
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/discord-login` - Login with Discord OAuth code
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout and clear cookies

## Security Features

- HTTP-only cookies prevent XSS attacks
- CORS configured for frontend domain
- JWT tokens with expiration
- Password hashing with bcrypt
- Secure cookie settings for production