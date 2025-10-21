/**
 * Ping command - Basic command for testing bot responsiveness
 * Responds with "Pong!" and latency information
 */
const pingCommand = {
    name: 'ping',
    description: 'Replies with Pong! and shows bot latency',
    
    async execute(interaction) {
        const sent = await interaction.reply({ 
            content: 'Pinging...', 
            fetchReply: true 
        });
        
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);
        
        await interaction.editReply({
            content: `🏓 Pong!\n📡 Latency: ${latency}ms\n💓 API Latency: ${apiLatency}ms`
        });
    }
};

export default pingCommand;