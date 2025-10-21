import express from 'express';
import jwt from 'jsonwebtoken';
import { sendMessage, getGuilds, getChannels } from '../controllers/discordController.js';
import { requireBotConnection } from '../middleware/discordErrorHandler.js';

const router = express.Router();

/**
 * Authentication middleware for Discord endpoints
 * Validates JWT token from Authorization header
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'MISSING_TOKEN',
                message: 'Access token is required',
                timestamp: new Date().toISOString()
            }
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid or expired access token',
                    timestamp: new Date().toISOString()
                }
            });
        }

        req.user = user;
        next();
    });
};

/**
 * Request validation middleware for message sending
 * Validates required fields and formats for sending messages
 * Uses predefined default channel instead of user-specified channel
 */
const validateMessageRequest = (req, res, next) => {
    const { content, embeds } = req.body;

    // Validate request body exists
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'EMPTY_REQUEST_BODY',
                message: 'Request body is required',
                timestamp: new Date().toISOString()
            }
        });
    }

    // Set the default channel ID from environment
    req.body.channelId = process.env.DISCORD_DEFAULT_CHANNEL_ID;

    // Validate that default channel is configured
    if (!req.body.channelId) {
        return res.status(500).json({
            success: false,
            error: {
                code: 'MISSING_DEFAULT_CHANNEL',
                message: 'Default Discord channel is not configured',
                timestamp: new Date().toISOString()
            }
        });
    }

    // Validate that either content or embeds is provided
    if (!content && (!embeds || (Array.isArray(embeds) && embeds.length === 0))) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'MISSING_MESSAGE_CONTENT',
                message: 'Either content (string) or embeds (array) must be provided',
                timestamp: new Date().toISOString()
            }
        });
    }

    // Validate content if provided
    if (content !== undefined) {
        if (typeof content !== 'string') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_CONTENT_TYPE',
                    message: 'content must be a string',
                    details: { provided: typeof content },
                    timestamp: new Date().toISOString()
                }
            });
        }

        if (content.length > 2000) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'CONTENT_TOO_LONG',
                    message: 'content exceeds Discord\'s 2000 character limit',
                    details: { length: content.length, maxLength: 2000 },
                    timestamp: new Date().toISOString()
                }
            });
        }
    }

    // Validate embeds if provided
    if (embeds !== undefined) {
        if (!Array.isArray(embeds)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_EMBEDS_TYPE',
                    message: 'embeds must be an array',
                    details: { provided: typeof embeds },
                    timestamp: new Date().toISOString()
                }
            });
        }

        if (embeds.length > 10) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'TOO_MANY_EMBEDS',
                    message: 'Maximum of 10 embeds allowed per message',
                    details: { provided: embeds.length, maxEmbeds: 10 },
                    timestamp: new Date().toISOString()
                }
            });
        }

        // Validate each embed structure
        for (let i = 0; i < embeds.length; i++) {
            const embed = embeds[i];
            
            if (typeof embed !== 'object' || embed === null) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_EMBED_TYPE',
                        message: `Embed at index ${i} must be an object`,
                        details: { embedIndex: i, provided: typeof embed },
                        timestamp: new Date().toISOString()
                    }
                });
            }

            // Validate embed title length
            if (embed.title && typeof embed.title === 'string' && embed.title.length > 256) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'EMBED_TITLE_TOO_LONG',
                        message: `Embed title at index ${i} exceeds 256 character limit`,
                        details: { embedIndex: i, titleLength: embed.title.length, maxLength: 256 },
                        timestamp: new Date().toISOString()
                    }
                });
            }

            // Validate embed description length
            if (embed.description && typeof embed.description === 'string' && embed.description.length > 4096) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'EMBED_DESCRIPTION_TOO_LONG',
                        message: `Embed description at index ${i} exceeds 4096 character limit`,
                        details: { embedIndex: i, descriptionLength: embed.description.length, maxLength: 4096 },
                        timestamp: new Date().toISOString()
                    }
                });
            }

            // Validate embed fields
            if (embed.fields) {
                if (!Array.isArray(embed.fields)) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'INVALID_EMBED_FIELDS_TYPE',
                            message: `Embed fields at index ${i} must be an array`,
                            details: { embedIndex: i, provided: typeof embed.fields },
                            timestamp: new Date().toISOString()
                        }
                    });
                }

                if (embed.fields.length > 25) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'TOO_MANY_EMBED_FIELDS',
                            message: `Embed at index ${i} has too many fields (max 25)`,
                            details: { embedIndex: i, fieldCount: embed.fields.length, maxFields: 25 },
                            timestamp: new Date().toISOString()
                        }
                    });
                }

                // Validate each field
                for (let j = 0; j < embed.fields.length; j++) {
                    const field = embed.fields[j];
                    
                    if (!field.name || !field.value) {
                        return res.status(400).json({
                            success: false,
                            error: {
                                code: 'INVALID_EMBED_FIELD',
                                message: `Embed field at index ${i}.${j} must have name and value`,
                                details: { embedIndex: i, fieldIndex: j },
                                timestamp: new Date().toISOString()
                            }
                        });
                    }

                    if (field.name.length > 256) {
                        return res.status(400).json({
                            success: false,
                            error: {
                                code: 'EMBED_FIELD_NAME_TOO_LONG',
                                message: `Embed field name at index ${i}.${j} exceeds 256 character limit`,
                                details: { embedIndex: i, fieldIndex: j, nameLength: field.name.length, maxLength: 256 },
                                timestamp: new Date().toISOString()
                            }
                        });
                    }

                    if (field.value.length > 1024) {
                        return res.status(400).json({
                            success: false,
                            error: {
                                code: 'EMBED_FIELD_VALUE_TOO_LONG',
                                message: `Embed field value at index ${i}.${j} exceeds 1024 character limit`,
                                details: { embedIndex: i, fieldIndex: j, valueLength: field.value.length, maxLength: 1024 },
                                timestamp: new Date().toISOString()
                            }
                        });
                    }
                }
            }
        }
    }

    next();
};

/**
 * Request validation middleware for guild ID parameters
 * Validates Discord snowflake format for guild IDs
 */
const validateGuildId = (req, res, next) => {
    const { guildId } = req.params;

    if (!guildId) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'MISSING_GUILD_ID',
                message: 'guildId parameter is required',
                timestamp: new Date().toISOString()
            }
        });
    }

    if (!/^\d{17,19}$/.test(guildId)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_GUILD_ID_FORMAT',
                message: 'guildId must be a valid Discord snowflake (17-19 digits)',
                details: { provided: guildId },
                timestamp: new Date().toISOString()
            }
        });
    }

    next();
};

/**
 * Error handling middleware for Discord routes
 * Catches any unhandled errors and returns consistent error format
 */
const handleDiscordErrors = (err, req, res, next) => {
    console.error('Discord route error:', err);

    // If response already sent, delegate to default Express error handler
    if (res.headersSent) {
        return next(err);
    }

    // Return consistent error format
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
            timestamp: new Date().toISOString()
        }
    });
};

// Discord API Routes

/**
 * POST /api/discord/send
 * Send a message to the default Discord channel
 * Requires authentication and validates message content
 * Channel is predefined in environment configuration
 */
router.post('/send', authenticateToken, requireBotConnection, validateMessageRequest, sendMessage);

/**
 * GET /api/discord/guilds
 * Get list of guilds (servers) the bot is connected to
 * Requires authentication
 */
router.get('/guilds', authenticateToken, requireBotConnection, getGuilds);

/**
 * GET /api/discord/channels/:guildId
 * Get list of channels in a specific guild
 * Requires authentication and validates guild ID format
 */
router.get('/channels/:guildId', authenticateToken, requireBotConnection, validateGuildId, getChannels);

/**
 * GET /api/discord/default-channel
 * Get information about the configured default channel
 * Requires authentication
 */
router.get('/default-channel', authenticateToken, requireBotConnection, (req, res) => {
    const defaultChannelId = process.env.DISCORD_DEFAULT_CHANNEL_ID;
    const defaultGuildId = process.env.DISCORD_DEFAULT_GUILD_ID;
    
    if (!defaultChannelId || !defaultGuildId) {
        return res.status(500).json({
            success: false,
            error: {
                code: 'MISSING_DEFAULT_CONFIG',
                message: 'Default Discord channel or guild is not configured',
                timestamp: new Date().toISOString()
            }
        });
    }
    
    res.status(200).json({
        success: true,
        defaultChannel: {
            channelId: defaultChannelId,
            guildId: defaultGuildId
        },
        message: 'All messages will be sent to this predefined channel',
        timestamp: new Date().toISOString()
    });
});

// Apply error handling middleware
router.use(handleDiscordErrors);

export default router;