import pingCommand from '../handlers/commands/ping.js';
import infoCommand from '../handlers/commands/info.js';

/**
 * Export all available commands
 */
export const commands = [
    pingCommand,
    infoCommand
];

export default commands;