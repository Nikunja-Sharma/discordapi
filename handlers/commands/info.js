import { EmbedBuilder } from 'discord.js';

/**
 * Info command - Shows bot and server information
 * Displays comprehensive information about the bot and current server
 */
const infoCommand = {
    name: 'info',
    description: 'Shows bot and server information',
    
    async execute(interaction) {
        const client = interaction.client;
        const guild = interaction.guild;
        
        // Create info embed
        const infoEmbed = new EmbedBuilder()
            .setTitle('🤖 Bot & Server Information')
            .setColor(0x0099FF)
            .setThumbnail(client.user.displayAvatarURL())
            .setTimestamp();
        
        // Bot information
        const botUptime = this.formatUptime(client.uptime);
        const botInfo = [
            `**Name:** ${client.user.tag}`,
            `**ID:** ${client.user.id}`,
            `**Uptime:** ${botUptime}`,
            `**Servers:** ${client.guilds.cache.size}`,
            `**Users:** ${client.users.cache.size}`,
            `**Ping:** ${Math.round(client.ws.ping)}ms`
        ].join('\n');
        
        infoEmbed.addFields({
            name: '🤖 Bot Information',
            value: botInfo,
            inline: true
        });
        
        // Server information (if in a guild)
        if (guild) {
            const serverInfo = [
                `**Name:** ${guild.name}`,
                `**ID:** ${guild.id}`,
                `**Owner:** <@${guild.ownerId}>`,
                `**Members:** ${guild.memberCount}`,
                `**Channels:** ${guild.channels.cache.size}`,
                `**Roles:** ${guild.roles.cache.size}`,
                `**Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`
            ].join('\n');
            
            infoEmbed.addFields({
                name: '🏠 Server Information',
                value: serverInfo,
                inline: true
            });
            
            if (guild.iconURL()) {
                infoEmbed.setThumbnail(guild.iconURL());
            }
        }
        
        // System information
        const systemInfo = [
            `**Node.js:** ${process.version}`,
            `**Discord.js:** 14.x`,
            `**Platform:** ${process.platform}`,
            `**Memory Usage:** ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
        ].join('\n');
        
        infoEmbed.addFields({
            name: '⚙️ System Information',
            value: systemInfo,
            inline: false
        });
        
        await interaction.reply({ embeds: [infoEmbed] });
    },
    
    /**
     * Format uptime from milliseconds to human readable format
     * @param {number} uptime - Uptime in milliseconds
     */
    formatUptime(uptime) {
        const seconds = Math.floor(uptime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
};

export default infoCommand;