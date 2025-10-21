import dotenv from 'dotenv';

dotenv.config();

/**
 * Discord configuration with environment variable validation
 */
class DiscordConfig {
    constructor() {
        this.botToken = process.env.DISCORD_BOT_TOKEN;
        this.applicationId = process.env.DISCORD_APPLICATION_ID;
        this.defaultGuildId = process.env.DISCORD_DEFAULT_GUILD_ID;
        this.apiKey = process.env.DISCORD_API_KEY;
        this.rateLimit = parseInt(process.env.DISCORD_API_RATE_LIMIT) || 100;
    }

    /**
     * Validate required Discord environment variables
     * @returns {Object} Validation result with success status and errors
     */
    validate() {
        const errors = [];
        const warnings = [];

        // Required variables
        if (!this.botToken || this.botToken === 'your_bot_token_here') {
            errors.push('DISCORD_BOT_TOKEN is required and must be set to a valid Discord bot token');
        }

        if (!this.applicationId || this.applicationId === 'your_application_id_here') {
            errors.push('DISCORD_APPLICATION_ID is required and must be set to your Discord application ID');
        }

        // Optional but recommended variables
        if (!this.defaultGuildId || this.defaultGuildId === 'your_guild_id_here') {
            warnings.push('DISCORD_DEFAULT_GUILD_ID is not set - commands will be registered globally (may take up to 1 hour to appear)');
        }

        if (!this.apiKey || this.apiKey === 'your_api_key_here') {
            warnings.push('DISCORD_API_KEY is not set - Discord API endpoints will not require authentication');
        }

        // Validate format of provided values
        if (this.applicationId && this.applicationId !== 'your_application_id_here') {
            if (!/^\d{17,19}$/.test(this.applicationId)) {
                errors.push('DISCORD_APPLICATION_ID must be a valid Discord snowflake (17-19 digits)');
            }
        }

        if (this.defaultGuildId && this.defaultGuildId !== 'your_guild_id_here') {
            if (!/^\d{17,19}$/.test(this.defaultGuildId)) {
                errors.push('DISCORD_DEFAULT_GUILD_ID must be a valid Discord snowflake (17-19 digits)');
            }
        }

        if (this.rateLimit < 1 || this.rateLimit > 1000) {
            warnings.push('DISCORD_API_RATE_LIMIT should be between 1 and 1000 requests per minute');
        }

        return {
            success: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Get configuration object for Discord bot
     * @returns {Object} Discord configuration
     */
    getConfig() {
        return {
            botToken: this.botToken,
            applicationId: this.applicationId,
            defaultGuildId: this.defaultGuildId,
            apiKey: this.apiKey,
            rateLimit: this.rateLimit
        };
    }

    /**
     * Check if Discord functionality is properly configured
     * @returns {boolean} True if Discord can be initialized
     */
    isConfigured() {
        const validation = this.validate();
        return validation.success;
    }
}

export default new DiscordConfig();