import { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';
import CommandHandler from '../handlers/commandHandler.js';

dotenv.config();

class DiscordBotService {
    constructor() {
        this.client = null;
        this.isReady = false;
        this.commands = new Map();
        this.commandHandler = null;
    }

    /**
     * Initialize the Discord bot client with proper intents and event handlers
     */
    async initializeBot() {
        try {
            // Validate required environment variables
            if (!process.env.DISCORD_BOT_TOKEN) {
                throw new Error('DISCORD_BOT_TOKEN is required in environment variables');
            }
            if (!process.env.DISCORD_APPLICATION_ID) {
                throw new Error('DISCORD_APPLICATION_ID is required in environment variables');
            }

            // Create Discord client with necessary intents
            this.client = new Client({
                intents: [
                    GatewayIntentBits.Guilds,
                    GatewayIntentBits.GuildMessages,
                    GatewayIntentBits.MessageContent
                ]
            });

            // Set up event handlers
            this.setupEventHandlers();

            // Initialize command handler
            this.commandHandler = new CommandHandler(this);

            // Authenticate and connect to Discord
            await this.client.login(process.env.DISCORD_BOT_TOKEN);

            return true;
        } catch (error) {
            console.error('Failed to initialize Discord bot:', error.message);
            throw error;
        }
    }

    /**
     * Set up event handlers for Discord client events
     */
    setupEventHandlers() {
        // Ready event - bot successfully connected
        this.client.on(Events.ClientReady, () => {
            this.isReady = true;
            console.log(`Discord bot logged in as ${this.client.user.tag}!`);
            console.log(`Bot is ready and connected to ${this.client.guilds.cache.size} guilds`);
            
            // Initialize command handler after bot is ready
            if (this.commandHandler) {
                this.commandHandler.initialize();
            }
        });

        // Error event - handle connection and API errors
        this.client.on(Events.Error, (error) => {
            console.error('Discord client error:', error);
            this.isReady = false;
        });

        // Disconnect event - handle unexpected disconnections
        this.client.on(Events.Disconnect, () => {
            console.warn('Discord bot disconnected');
            this.isReady = false;
        });

        // Reconnecting event - bot attempting to reconnect
        this.client.on(Events.Reconnecting, () => {
            console.log('Discord bot reconnecting...');
            this.isReady = false;
        });

        // Resume event - bot resumed connection
        this.client.on(Events.Resume, () => {
            console.log('Discord bot connection resumed');
            this.isReady = true;
        });

        // Rate limit event - handle rate limiting
        this.client.on(Events.RateLimited, (rateLimitData) => {
            console.warn('Discord API rate limit hit:', {
                timeout: rateLimitData.timeout,
                limit: rateLimitData.limit,
                method: rateLimitData.method,
                path: rateLimitData.path
            });
        });
    }

    /**
     * Check if the bot is ready and connected
     */
    isConnected() {
        return this.isReady && this.client && this.client.isReady();
    }

    /**
     * Get the Discord client instance
     */
    getClient() {
        return this.client;
    }

    /**
     * Get the command handler instance
     */
    getCommandHandler() {
        return this.commandHandler;
    }

    /**
     * Register slash commands with Discord API
     * @param {Array} commands - Array of command objects to register
     * @param {string} guildId - Optional guild ID for guild-specific commands
     */
    async registerSlashCommands(commands = [], guildId = null) {
        try {
            if (!this.client || !this.isReady) {
                throw new Error('Discord bot is not ready. Call initializeBot() first.');
            }

            // Validate commands array
            if (!Array.isArray(commands)) {
                throw new Error('Commands must be an array');
            }

            // Validate and build command data
            const commandData = [];
            for (const command of commands) {
                const validatedCommand = this.validateCommand(command);
                commandData.push(validatedCommand.toJSON());

                // Store command for later execution
                this.commands.set(validatedCommand.name, command);
            }

            // Set up REST client for Discord API
            const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

            console.log(`Registering ${commandData.length} slash commands...`);

            let registeredCommands;
            if (guildId) {
                // Register guild-specific commands (faster deployment)
                registeredCommands = await rest.put(
                    Routes.applicationGuildCommands(process.env.DISCORD_APPLICATION_ID, guildId),
                    { body: commandData }
                );
                console.log(`Successfully registered ${registeredCommands.length} guild commands for guild ${guildId}`);
            } else {
                // Register global commands (takes up to 1 hour to deploy)
                registeredCommands = await rest.put(
                    Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID),
                    { body: commandData }
                );
                console.log(`Successfully registered ${registeredCommands.length} global commands`);
            }

            return registeredCommands;
        } catch (error) {
            console.error('Failed to register slash commands:', error);
            throw error;
        }
    }

    /**
     * Validate command structure and convert to SlashCommandBuilder
     * @param {Object} command - Command object to validate
     */
    validateCommand(command) {
        try {
            // Validate required fields
            if (!command.name || typeof command.name !== 'string') {
                throw new Error('Command name is required and must be a string');
            }
            if (!command.description || typeof command.description !== 'string') {
                throw new Error('Command description is required and must be a string');
            }

            // Validate name format (Discord requirements)
            if (!/^[\w-]{1,32}$/.test(command.name)) {
                throw new Error('Command name must be 1-32 characters and contain only letters, numbers, hyphens, and underscores');
            }

            // Validate description length
            if (command.description.length > 100) {
                throw new Error('Command description must be 100 characters or less');
            }

            // Build slash command
            const slashCommand = new SlashCommandBuilder()
                .setName(command.name.toLowerCase())
                .setDescription(command.description);

            // Add options if provided
            if (command.options && Array.isArray(command.options)) {
                for (const option of command.options) {
                    this.addCommandOption(slashCommand, option);
                }
            }

            return slashCommand;
        } catch (error) {
            console.error(`Command validation failed for "${command.name}":`, error.message);
            throw error;
        }
    }

    /**
     * Add option to slash command builder
     * @param {SlashCommandBuilder} slashCommand - Command builder instance
     * @param {Object} option - Option configuration
     */
    addCommandOption(slashCommand, option) {
        if (!option.name || !option.description || typeof option.type !== 'number') {
            throw new Error('Option must have name, description, and type');
        }

        // Discord application command option types
        const optionTypes = {
            1: 'addSubcommand',
            2: 'addSubcommandGroup',
            3: 'addStringOption',
            4: 'addIntegerOption',
            5: 'addBooleanOption',
            6: 'addUserOption',
            7: 'addChannelOption',
            8: 'addRoleOption',
            9: 'addMentionableOption',
            10: 'addNumberOption',
            11: 'addAttachmentOption'
        };

        const methodName = optionTypes[option.type];
        if (!methodName) {
            throw new Error(`Invalid option type: ${option.type}`);
        }

        slashCommand[methodName](opt => {
            opt.setName(option.name.toLowerCase())
                .setDescription(option.description);

            if (typeof option.required === 'boolean') {
                opt.setRequired(option.required);
            }

            return opt;
        });
    }

    /**
     * Get registered command by name
     * @param {string} commandName - Name of the command
     */
    getCommand(commandName) {
        return this.commands.get(commandName);
    }

    /**
     * Get all registered commands
     */
    getAllCommands() {
        return Array.from(this.commands.values());
    }

    /**
     * Clear all registered commands from memory
     */
    clearCommands() {
        this.commands.clear();
    }

    /**
     * Send a message to a Discord channel
     * @param {string} channelId - Discord channel ID (snowflake)
     * @param {string|Object} content - Message content or message options object
     * @param {Array} embeds - Optional array of embed objects
     */
    async sendMessage(channelId, content, embeds = []) {
        try {
            if (!this.client || !this.isReady) {
                throw new Error('Discord bot is not ready. Call initializeBot() first.');
            }

            // Validate channel ID format (Discord snowflake)
            if (!channelId || !/^\d{17,19}$/.test(channelId)) {
                throw new Error('Invalid channel ID format. Must be a Discord snowflake (17-19 digits)');
            }

            // Fetch the channel
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) {
                throw new Error(`Channel with ID ${channelId} not found`);
            }

            // Check if it's a text-based channel
            if (!channel.isTextBased()) {
                throw new Error(`Channel ${channelId} is not a text-based channel`);
            }

            // Validate bot permissions
            await this.validateChannelPermissions(channel);

            // Prepare message options
            const messageOptions = this.prepareMessageOptions(content, embeds);

            // Send the message
            const sentMessage = await channel.send(messageOptions);

            console.log(`Message sent successfully to channel ${channelId}: ${sentMessage.id}`);

            return {
                success: true,
                messageId: sentMessage.id,
                channelId: channelId,
                timestamp: sentMessage.createdAt.toISOString(),
                content: sentMessage.content
            };

        } catch (error) {
            console.error(`Failed to send message to channel ${channelId}:`, error.message);

            // Return structured error information
            const errorResponse = {
                success: false,
                error: {
                    code: this.getErrorCode(error),
                    message: error.message,
                    channelId: channelId,
                    timestamp: new Date().toISOString()
                }
            };

            throw errorResponse;
        }
    }

    /**
     * Validate bot permissions for a channel
     * @param {Channel} channel - Discord channel object
     */
    async validateChannelPermissions(channel) {
        if (!channel.guild) {
            // DM channel - no permission check needed
            return true;
        }

        const botMember = await channel.guild.members.fetch(this.client.user.id);
        const permissions = channel.permissionsFor(botMember);

        // Check required permissions
        const requiredPermissions = [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages
        ];

        for (const permission of requiredPermissions) {
            if (!permissions.has(permission)) {
                const permissionName = Object.keys(PermissionFlagsBits).find(
                    key => PermissionFlagsBits[key] === permission
                );
                throw new Error(`Bot lacks required permission: ${permissionName}`);
            }
        }

        return true;
    }

    /**
     * Prepare message options object from content and embeds
     * @param {string|Object} content - Message content
     * @param {Array} embeds - Array of embed objects
     */
    prepareMessageOptions(content, embeds) {
        const messageOptions = {};

        // Handle content
        if (typeof content === 'string') {
            if (content.length > 2000) {
                throw new Error('Message content exceeds 2000 character limit');
            }
            messageOptions.content = content;
        } else if (typeof content === 'object' && content !== null) {
            // Content is already a message options object
            Object.assign(messageOptions, content);
        }

        // Handle embeds
        if (embeds && Array.isArray(embeds) && embeds.length > 0) {
            if (embeds.length > 10) {
                throw new Error('Maximum of 10 embeds allowed per message');
            }

            messageOptions.embeds = embeds.map(embedData => {
                if (embedData instanceof EmbedBuilder) {
                    return embedData;
                }
                return this.createEmbed(embedData);
            });
        }

        // Ensure at least content or embeds are provided
        if (!messageOptions.content && (!messageOptions.embeds || messageOptions.embeds.length === 0)) {
            throw new Error('Message must have either content or embeds');
        }

        return messageOptions;
    }

    /**
     * Create an embed from embed data object
     * @param {Object} embedData - Embed configuration object
     */
    createEmbed(embedData) {
        const embed = new EmbedBuilder();

        if (embedData.title) {
            if (embedData.title.length > 256) {
                throw new Error('Embed title exceeds 256 character limit');
            }
            embed.setTitle(embedData.title);
        }

        if (embedData.description) {
            if (embedData.description.length > 4096) {
                throw new Error('Embed description exceeds 4096 character limit');
            }
            embed.setDescription(embedData.description);
        }

        if (embedData.color) {
            embed.setColor(embedData.color);
        }

        if (embedData.fields && Array.isArray(embedData.fields)) {
            if (embedData.fields.length > 25) {
                throw new Error('Maximum of 25 fields allowed per embed');
            }

            for (const field of embedData.fields) {
                if (!field.name || !field.value) {
                    throw new Error('Embed fields must have name and value');
                }
                if (field.name.length > 256) {
                    throw new Error('Embed field name exceeds 256 character limit');
                }
                if (field.value.length > 1024) {
                    throw new Error('Embed field value exceeds 1024 character limit');
                }

                embed.addFields({
                    name: field.name,
                    value: field.value,
                    inline: field.inline || false
                });
            }
        }

        if (embedData.footer) {
            if (embedData.footer.text && embedData.footer.text.length > 2048) {
                throw new Error('Embed footer text exceeds 2048 character limit');
            }
            embed.setFooter({
                text: embedData.footer.text,
                iconURL: embedData.footer.iconURL
            });
        }

        if (embedData.author) {
            if (embedData.author.name && embedData.author.name.length > 256) {
                throw new Error('Embed author name exceeds 256 character limit');
            }
            embed.setAuthor({
                name: embedData.author.name,
                iconURL: embedData.author.iconURL,
                url: embedData.author.url
            });
        }

        if (embedData.thumbnail) {
            embed.setThumbnail(embedData.thumbnail.url);
        }

        if (embedData.image) {
            embed.setImage(embedData.image.url);
        }

        if (embedData.timestamp) {
            embed.setTimestamp(embedData.timestamp);
        }

        return embed;
    }

    /**
     * Get error code based on error type
     * @param {Error} error - Error object
     */
    getErrorCode(error) {
        if (error.message.includes('not found')) {
            return 'CHANNEL_NOT_FOUND';
        }
        if (error.message.includes('permission')) {
            return 'INSUFFICIENT_PERMISSIONS';
        }
        if (error.message.includes('character limit') || error.message.includes('exceeds')) {
            return 'CONTENT_TOO_LONG';
        }
        if (error.message.includes('Invalid channel ID')) {
            return 'INVALID_CHANNEL_ID';
        }
        if (error.message.includes('not a text-based channel')) {
            return 'INVALID_CHANNEL_TYPE';
        }
        if (error.message.includes('bot is not ready')) {
            return 'BOT_NOT_READY';
        }
        return 'UNKNOWN_ERROR';
    }

    /**
     * Gracefully shutdown the Discord bot
     */
    async shutdown() {
        try {
            if (this.client) {
                console.log('Shutting down Discord bot...');
                await this.client.destroy();
                this.isReady = false;
                console.log('Discord bot shutdown complete');
            }
        } catch (error) {
            console.error('Error during Discord bot shutdown:', error);
        }
    }
}

// Create and export a singleton instance
const discordBotService = new DiscordBotService();
export default discordBotService;