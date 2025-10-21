import discordBotService from '../services/discordBot.js';
import { withRetry, logDiscordError } from '../middleware/discordErrorHandler.js';

/**
 * Send a message to a Discord channel
 * POST /api/discord/send
 */
export const sendMessage = async (req, res) => {
    try {
        // Extract validated data from middleware
        const { channelId, content, embeds, buttons } = req.body;

        // Check if Discord bot is ready
        if (!discordBotService.isConnected()) {
            return res.status(503).json({
                success: false,
                error: {
                    code: 'BOT_NOT_READY',
                    message: 'Discord bot is not connected. Please try again later.',
                    timestamp: new Date().toISOString()
                }
            });
        }

        // Send message through Discord bot service with retry logic
        const result = await withRetry(() => 
            discordBotService.sendMessage(channelId, content, embeds, buttons)
        );

        // Return success response
        res.status(200).json(result);

    } catch (error) {
        // Log error with context
        logDiscordError(error, {
            action: 'sendMessage',
            channelId: req.body.channelId,
            contentLength: req.body.content?.length || 0,
            embedCount: req.body.embeds?.length || 0
        });

        // Handle structured errors from Discord service
        if (error.success === false && error.error) {
            const statusCode = getStatusCodeFromError(error.error.code);
            return res.status(statusCode).json(error);
        }

        // Pass error to Discord error handler middleware
        throw error;
    }
};

/**
 * Get list of guilds (servers) the bot is connected to
 * GET /api/discord/guilds
 */
export const getGuilds = async (req, res) => {
    try {
        // Check if Discord bot is ready
        if (!discordBotService.isConnected()) {
            return res.status(503).json({
                success: false,
                error: {
                    code: 'BOT_NOT_READY',
                    message: 'Discord bot is not connected. Please try again later.',
                    timestamp: new Date().toISOString()
                }
            });
        }

        const client = discordBotService.getClient();
        const guilds = client.guilds.cache.map(guild => ({
            id: guild.id,
            name: guild.name,
            memberCount: guild.memberCount,
            icon: guild.iconURL(),
            owner: guild.ownerId === client.user.id
        }));

        res.status(200).json({
            success: true,
            guilds,
            count: guilds.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        // Log error with context
        logDiscordError(error, {
            action: 'getGuilds'
        });

        // Pass error to Discord error handler middleware
        throw error;
    }
};

/**
 * Get list of channels in a specific guild
 * GET /api/discord/channels/:guildId
 */
export const getChannels = async (req, res) => {
    try {
        const { guildId } = req.params;

        // Validate guild ID format
        if (!guildId || !/^\d{17,19}$/.test(guildId)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_GUILD_ID',
                    message: 'Guild ID must be a valid Discord snowflake (17-19 digits)',
                    details: { guildId },
                    timestamp: new Date().toISOString()
                }
            });
        }

        // Check if Discord bot is ready
        if (!discordBotService.isConnected()) {
            return res.status(503).json({
                success: false,
                error: {
                    code: 'BOT_NOT_READY',
                    message: 'Discord bot is not connected. Please try again later.',
                    timestamp: new Date().toISOString()
                }
            });
        }

        const client = discordBotService.getClient();
        
        // Fetch the guild with retry logic
        const guild = await withRetry(() => client.guilds.fetch(guildId));
        if (!guild) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'GUILD_NOT_FOUND',
                    message: 'Guild not found or bot is not a member',
                    details: { guildId },
                    timestamp: new Date().toISOString()
                }
            });
        }

        // Get bot member to check permissions with retry logic
        const botMember = await withRetry(() => guild.members.fetch(client.user.id));

        // Fetch channels and filter for text-based channels the bot can access
        const channels = guild.channels.cache
            .filter(channel => {
                // Only include text-based channels
                if (!channel.isTextBased()) return false;
                
                // Check if bot can view the channel
                const permissions = channel.permissionsFor(botMember);
                return permissions && permissions.has('ViewChannel');
            })
            .map(channel => {
                const permissions = channel.permissionsFor(botMember);
                return {
                    id: channel.id,
                    name: channel.name,
                    type: channel.type,
                    position: channel.position,
                    parentId: channel.parentId,
                    topic: channel.topic,
                    permissions: {
                        canSend: permissions.has('SendMessages'),
                        canView: permissions.has('ViewChannel'),
                        canManage: permissions.has('ManageChannels')
                    }
                };
            })
            .sort((a, b) => a.position - b.position);

        res.status(200).json({
            success: true,
            guild: {
                id: guild.id,
                name: guild.name
            },
            channels,
            count: channels.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        // Log error with context
        logDiscordError(error, {
            action: 'getChannels',
            guildId: req.params.guildId
        });

        // Handle Discord API errors
        if (error.code === 10004) { // Unknown Guild
            return res.status(404).json({
                success: false,
                error: {
                    code: 'GUILD_NOT_FOUND',
                    message: 'Guild not found or bot is not a member',
                    details: { guildId: req.params.guildId },
                    timestamp: new Date().toISOString()
                }
            });
        }

        if (error.code === 50001) { // Missing Access
            return res.status(403).json({
                success: false,
                error: {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'Bot lacks permission to access this guild',
                    details: { guildId: req.params.guildId },
                    timestamp: new Date().toISOString()
                }
            });
        }

        // Pass error to Discord error handler middleware
        throw error;
    }
};

/**
 * Map error codes to HTTP status codes
 * @param {string} errorCode - Error code from Discord service
 * @returns {number} HTTP status code
 */
function getStatusCodeFromError(errorCode) {
    const statusMap = {
        'CHANNEL_NOT_FOUND': 404,
        'GUILD_NOT_FOUND': 404,
        'INSUFFICIENT_PERMISSIONS': 403,
        'CONTENT_TOO_LONG': 400,
        'INVALID_CHANNEL_ID': 400,
        'INVALID_GUILD_ID': 400,
        'INVALID_CHANNEL_TYPE': 400,
        'BOT_NOT_READY': 503,
        'MISSING_CHANNEL_ID': 400,
        'MISSING_CONTENT': 400,
        'INVALID_EMBEDS_FORMAT': 400,
        'TOO_MANY_EMBEDS': 400,
        'UNKNOWN_ERROR': 500
    };

    return statusMap[errorCode] || 500;
}