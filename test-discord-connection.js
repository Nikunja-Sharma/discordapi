import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

async function testDiscordConnection() {
    console.log('Testing Discord connection...');
    
    // Check environment variables
    console.log('Environment check:');
    console.log('- DISCORD_BOT_TOKEN:', process.env.DISCORD_BOT_TOKEN ? 'SET' : 'MISSING');
    console.log('- DISCORD_APPLICATION_ID:', process.env.DISCORD_APPLICATION_ID ? 'SET' : 'MISSING');
    
    if (!process.env.DISCORD_BOT_TOKEN) {
        console.error('DISCORD_BOT_TOKEN is missing!');
        process.exit(1);
    }
    
    const client = new Client({
        intents: [GatewayIntentBits.Guilds]
    });
    
    // Set up timeout
    const timeout = setTimeout(() => {
        console.error('Connection timeout after 30 seconds');
        client.destroy();
        process.exit(1);
    }, 30000);
    
    client.once('ready', () => {
        clearTimeout(timeout);
        console.log(`✅ Successfully connected as ${client.user.tag}`);
        console.log(`Connected to ${client.guilds.cache.size} guilds`);
        client.destroy();
        process.exit(0);
    });
    
    client.on('error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Discord connection error:', error);
        client.destroy();
        process.exit(1);
    });
    
    try {
        await client.login(process.env.DISCORD_BOT_TOKEN);
    } catch (error) {
        clearTimeout(timeout);
        console.error('❌ Login failed:', error);
        process.exit(1);
    }
}

testDiscordConnection();