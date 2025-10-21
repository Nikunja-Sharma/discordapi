import commands from './commands/index.js';

/**
 * Register all sample commands with the Discord bot
 * @param {DiscordBotService} discordBotService - The Discord bot service instance
 * @param {string} guildId - Optional guild ID for guild-specific registration
 */
export async function registerSampleCommands(discordBotService, guildId = null) {
    try {
        const commandHandler = discordBotService.getCommandHandler();
        
        if (!commandHandler) {
            throw new Error('Command handler not initialized');
        }

        // Register and deploy all sample commands
        await commandHandler.registerAndDeployCommands(commands, guildId);
        
        console.log('Sample commands registered successfully:');
        commands.forEach(cmd => {
            console.log(`  - /${cmd.name}: ${cmd.description}`);
        });
        
        return true;
    } catch (error) {
        console.error('Failed to register sample commands:', error);
        throw error;
    }
}

export { commands };
export default registerSampleCommands;