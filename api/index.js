import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from '../routes/authRoutes.js';
import discordRoutes from '../routes/discordRoutes.js';
import subscriptionRoutes from '../routes/subscriptionRoutes.js';
import apiKeyRoutes from '../routes/apiKeyRoutes.js';
import botConfigRoutes from '../routes/botConfigRoutes.js';
import usageRoutes from '../routes/usageRoutes.js';
import discordBotService from '../services/discordBot.js';
import { discordErrorHandler, discordRateLimit } from '../middleware/discordErrorHandler.js';
import commands from '../commands/index.js';

dotenv.config();

const app = express();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection with enhanced utilities
import { connectToDatabase, createIndexes } from '../utils/database.js';

const initializeDatabase = async () => {
	try {
		await connectToDatabase();
		
		// Create database indexes for performance optimization
		await createIndexes();
		
		console.log('Database initialization completed successfully');
	} catch (err) {
		console.error('Database initialization error:', err.message);
		console.log('Server will continue without database functionality');
	}
};

initializeDatabase();

// Initialize Discord Bot
async function initializeDiscordBot() {
	try {
		console.log('Initializing Discord bot...');
		
		// Add timeout wrapper to prevent hanging
		const initPromise = discordBotService.initializeBot();
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error('Discord bot initialization timeout after 45 seconds')), 45000);
		});
		
		await Promise.race([initPromise, timeoutPromise]);
		console.log('Discord bot initialized successfully');
		
		// Register commands after successful initialization
		try {
			console.log('Registering Discord commands...');
			await discordBotService.registerSlashCommands(commands, process.env.DISCORD_DEFAULT_GUILD_ID);
			
			// Also register commands with the command handler
			const commandHandler = discordBotService.getCommandHandler();
			if (commandHandler) {
				commandHandler.registerCommands(commands);
			}
			
			console.log('Discord commands registered successfully');
		} catch (commandError) {
			console.error('Failed to register Discord commands:', commandError.message);
		}
	} catch (error) {
		console.error('Failed to initialize Discord bot:', error.message);
		console.error('Discord bot error details:', error);
		console.error('Environment check:');
		console.error('- DISCORD_BOT_TOKEN:', process.env.DISCORD_BOT_TOKEN ? 'SET' : 'MISSING');
		console.error('- DISCORD_APPLICATION_ID:', process.env.DISCORD_APPLICATION_ID ? 'SET' : 'MISSING');
		console.error('- DISCORD_DEFAULT_GUILD_ID:', process.env.DISCORD_DEFAULT_GUILD_ID ? 'SET' : 'MISSING');
		
		// Additional debugging for Render
		if (process.env.NODE_ENV === 'production') {
			console.error('Production environment detected - checking network connectivity...');
			console.error('Process environment keys:', Object.keys(process.env).filter(key => key.includes('DISCORD')));
			
			// Test Discord API connectivity
			try {
				const https = await import('https');
				const testReq = https.request('https://discord.com/api/v10/gateway', { method: 'GET' }, (res) => {
					console.log('Discord API connectivity test - Status:', res.statusCode);
					res.on('data', (chunk) => {
						try {
							const data = JSON.parse(chunk.toString());
							console.log('Discord Gateway URL:', data.url);
						} catch (parseError) {
							console.log('Gateway response received (could not parse)');
						}
					});
				});
				testReq.on('error', (err) => {
					console.error('Discord API connectivity test failed:', err.message);
					console.error('This indicates network connectivity issues with Discord API');
				});
				testReq.setTimeout(10000, () => {
					console.error('Discord API connectivity test timed out');
					testReq.destroy();
				});
				testReq.end();
			} catch (netError) {
				console.error('Network test error:', netError.message);
			}
		}
		
		// Check if this is a known Render networking issue
		if (error.message.includes('timeout')) {
			console.error('');
			console.error('🔧 RENDER DEPLOYMENT ISSUE DETECTED:');
			console.error('This appears to be a network connectivity issue with Render.');
			console.error('');
			console.error('Possible solutions:');
			console.error('1. Render may be blocking Discord WebSocket connections');
			console.error('2. Try redeploying the service');
			console.error('3. Contact Render support about Discord API access');
			console.error('4. Consider using a different hosting provider');
			console.error('');
			console.error('The web API will continue to work normally.');
			console.error('Discord bot features will be unavailable until this is resolved.');
			console.error('');
		}
		
		// Don't exit the process - allow the web server to continue running
		console.log('Web server will continue without Discord functionality');
	}
}

// Start Discord bot initialization (non-blocking)
initializeDiscordBot();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/discord', discordRateLimit(60000, 30), discordRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/apikeys', apiKeyRoutes);
app.use('/api/bots', botConfigRoutes);
app.use('/api/usage', usageRoutes);

// Dummy data to store users
let users = [
	{ id: "1", name: "John Doe", email: "john@example.com" },
	{ id: "2", name: "Jane Smith", email: "jane@example.com" },
	{ id: "3", name: "Bob Wilson", email: "bob@example.com" }
];

app.use(express.static('public'));

app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname, '..', 'components', 'home.htm'));
});

// Health check endpoint
app.get('/health', (req, res) => {
	const health = {
		status: 'ok',
		timestamp: new Date().toISOString(),
		services: {
			web: 'online',
			database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
			discord: discordBotService.isConnected() ? 'connected' : 'disconnected'
		},
		environment: process.env.NODE_ENV || 'development'
	};
	
	res.json(health);
});

app.get('/about', function (req, res) {
	res.sendFile(path.join(__dirname, '..', 'components', 'about.htm'));
});

app.get('/uploadUser', function (req, res) {
	res.sendFile(path.join(__dirname, '..', 'components', 'user_upload_form.htm'));
});

app.post('/uploadSuccessful', bodyParser.urlencoded({ extended: false }), (req, res) => {
	try {
		const newUser = {
			id: req.body.user_id,
			name: req.body.name,
			email: req.body.email
		};
		users.push(newUser);
		res.status(200).send('<h1>User added successfully</h1>');
	} catch (error) {
		console.error(error);
		res.status(500).send('Error adding user');
	}
});

app.get('/allUsers', (req, res) => {
	try {
		if (users.length > 0) {
			let tableContent = users
				.map(
					(user) =>
						`<tr>
                        <td>${user.id}</td>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                    </tr>`
				)
				.join('');

			res.status(200).send(`
                <html>
                    <head>
                        <title>Users</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                            }
                            table {
                                width: 100%;
                                border-collapse: collapse;
                                margin-bottom: 15px;
                            }
                            th, td {
                                border: 1px solid #ddd;
                                padding: 8px;
                                text-align: left;
                            }
                            th {
                                background-color: #f2f2f2;
                            }
                            a {
                                text-decoration: none;
                                color: #0a16f7;
                                margin: 15px;
                            }
                        </style>
                    </head>
                    <body>
                        <h1>Users</h1>
                        <table>
                            <thead>
                                <tr>
                                    <th>User ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableContent}
                            </tbody>
                        </table>
                        <div>
                            <a href="/">Home</a>
                            <a href="/uploadUser">Add User</a>
                        </div>
                    </body>
                </html>
            `);
		} else {
			res.status(404).send('Users not found');
		}
	} catch (error) {
		console.error(error);
		res.status(500).send('Error retrieving users');
	}
});

// Discord-specific error handling middleware (must be after Discord routes)
app.use('/api/discord', discordErrorHandler);

// General error handling middleware
app.use((err, req, res, next) => {
	console.error('Unhandled error:', err);
	
	if (res.headersSent) {
		return next(err);
	}
	
	res.status(500).json({
		success: false,
		error: {
			code: 'INTERNAL_ERROR',
			message: 'An unexpected error occurred',
			timestamp: new Date().toISOString()
		}
	});
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
	console.log('\nReceived SIGINT. Graceful shutdown...');
	await gracefulShutdown();
});

process.on('SIGTERM', async () => {
	console.log('\nReceived SIGTERM. Graceful shutdown...');
	await gracefulShutdown();
});

async function gracefulShutdown() {
	try {
		console.log('Shutting down services...');
		
		// Shutdown Discord bot
		await discordBotService.shutdown();
		
		// Close MongoDB connection
		await mongoose.connection.close();
		console.log('MongoDB connection closed');
		
		console.log('Graceful shutdown complete');
		process.exit(0);
	} catch (error) {
		console.error('Error during graceful shutdown:', error);
		process.exit(1);
	}
}

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle server shutdown
server.on('close', () => {
	console.log('HTTP server closed');
});

export default app;
