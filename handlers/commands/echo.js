/**
 * Echo command - Repeats user input
 * Takes a string parameter and echoes it back to the user
 */
const echoCommand = {
    name: 'echo',
    description: 'Repeats the message you provide',
    options: [
        {
            name: 'message',
            description: 'The message to echo back',
            type: 3, // STRING type
            required: true
        }
    ],
    
    async execute(interaction) {
        const message = interaction.options.getString('message');
        
        // Validate message length
        if (message.length > 1900) {
            await interaction.reply({
                content: '❌ Message is too long! Please keep it under 1900 characters.',
                ephemeral: true
            });
            return;
        }
        
        // Echo the message back
        await interaction.reply({
            content: `🔄 **Echo:** ${message}`
        });
    }
};

export default echoCommand;