import { Events } from 'discord.js';

class CommandHandler {
    constructor(discordBotService) {
        this.discordBotService = discordBotService;
        this.commands = new Map();
        this.interactionTimeout = 3000; // 3 seconds as per requirements
    }

    /**
     * Initialize command handler and set up interaction event listener
     */
    initialize() {
        const client = this.discordBotService.getClient();
        if (!client) {
            throw new Error('Discord client not available. Initialize bot first.');
        }

        // Note: We don't add another interaction listener here since 
        // the main bot service already handles interactions
        // This prevents duplicate handling

        console.log('Command handler initialized');
    }

    /**
     * Register a command with the handler
     * @param {Object} command - Command object with name, description, and execute function
     */
    registerCommand(command) {
        if (!command.name || !command.execute) {
            throw new Error('Command must have name and execute function');
        }

        if (typeof command.execute !== 'function') {
            throw new Error('Command execute must be a function');
        }

        this.commands.set(command.name, command);
        console.log(`Registered command: ${command.name}`);
    }

    /**
     * Register multiple commands at once
     * @param {Array} commands - Array of command objects
     */
    registerCommands(commands) {
        if (!Array.isArray(commands)) {
            throw new Error('Commands must be an array');
        }

        for (const command of commands) {
            this.registerCommand(command);
        }
    }

    /**
     * Handle incoming Discord interactions
     * @param {Interaction} interaction - Discord interaction object
     */
    async handleInteraction(interaction) {
        try {
            // Only handle slash commands for now
            if (!interaction.isChatInputCommand()) {
                return;
            }

            const command = this.commands.get(interaction.commandName);
            if (!command) {
                console.warn(`Unknown command: ${interaction.commandName}`);
                await this.respondWithError(interaction, 'Unknown command');
                return;
            }

            console.log(`Executing command: ${interaction.commandName} by ${interaction.user.tag}`);

            // Set up timeout for command execution
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('Command execution timeout'));
                }, this.interactionTimeout);
            });

            // Execute command with timeout
            await Promise.race([
                command.execute(interaction),
                timeoutPromise
            ]);

        } catch (error) {
            console.error(`Error executing command ${interaction.commandName}:`, error);
            await this.handleCommandError(interaction, error);
        }
    }

    /**
     * Handle command execution errors
     * @param {Interaction} interaction - Discord interaction object
     * @param {Error} error - Error that occurred
     */
    async handleCommandError(interaction, error) {
        try {
            const errorMessage = error.message === 'Command execution timeout' 
                ? 'Command took too long to execute. Please try again.'
                : 'An error occurred while executing the command.';

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: `❌ ${errorMessage}`,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: `❌ ${errorMessage}`,
                    ephemeral: true
                });
            }
        } catch (followUpError) {
            console.error('Failed to send error response:', followUpError);
        }
    }

    /**
     * Send error response for unknown commands
     * @param {Interaction} interaction - Discord interaction object
     * @param {string} message - Error message
     */
    async respondWithError(interaction, message) {
        try {
            await interaction.reply({
                content: `❌ ${message}`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Failed to send error response:', error);
        }
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
     * Remove a command from the handler
     * @param {string} commandName - Name of the command to remove
     */
    unregisterCommand(commandName) {
        const removed = this.commands.delete(commandName);
        if (removed) {
            console.log(`Unregistered command: ${commandName}`);
        }
        return removed;
    }

    /**
     * Clear all registered commands
     */
    clearCommands() {
        this.commands.clear();
        console.log('All commands cleared from handler');
    }

    /**
     * Set interaction timeout (in milliseconds)
     * @param {number} timeout - Timeout in milliseconds
     */
    setInteractionTimeout(timeout) {
        if (typeof timeout !== 'number' || timeout <= 0) {
            throw new Error('Timeout must be a positive number');
        }
        this.interactionTimeout = timeout;
    }

    /**
     * Get current interaction timeout
     */
    getInteractionTimeout() {
        return this.interactionTimeout;
    }

    /**
     * Register commands with Discord API and the command handler
     * @param {Array} commands - Array of command objects
     * @param {string} guildId - Optional guild ID for guild-specific commands
     */
    async registerAndDeployCommands(commands, guildId = null) {
        try {
            // Register commands with the handler
            this.registerCommands(commands);

            // Deploy commands to Discord API
            await this.discordBotService.registerSlashCommands(commands, guildId);

            console.log(`Successfully registered and deployed ${commands.length} commands`);
            return true;
        } catch (error) {
            console.error('Failed to register and deploy commands:', error);
            throw error;
        }
    }
}

export default CommandHandler;