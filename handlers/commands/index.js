import pingCommand from './ping.js';
import echoCommand from './echo.js';
import infoCommand from './info.js';

/**
 * Collection of all available slash commands
 * Export all commands for easy registration
 */
const commands = [
    pingCommand,
    echoCommand,
    infoCommand
];

export default commands;
export { pingCommand, echoCommand, infoCommand };