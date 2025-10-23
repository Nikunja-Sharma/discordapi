import mongoose from 'mongoose';

const botConfigSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        unique: true,
        index: true
    },
    selectedBotId: {
        type: String,
        required: [true, 'Selected bot ID is required'],
        index: true
    },
    botConfigs: [{
        id: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        features: [{
            type: String,
            required: true
        }],
        estimatedTokensPerMonth: {
            type: Number,
            required: true,
            min: 0
        },
        category: {
            type: String,
            enum: ['general', 'moderation', 'entertainment', 'utility', 'custom'],
            default: 'general'
        },
        complexity: {
            type: String,
            enum: ['basic', 'intermediate', 'advanced'],
            default: 'basic'
        },
        pricing: {
            inputTokenCost: {
                type: Number,
                required: true,
                min: 0
            },
            outputTokenCost: {
                type: Number,
                required: true,
                min: 0
            }
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    customConfigurations: [{
        name: String,
        description: String,
        settings: mongoose.Schema.Types.Mixed,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    preferences: {
        autoUpdate: {
            type: Boolean,
            default: true
        },
        notifyOnChanges: {
            type: Boolean,
            default: true
        },
        maxTokensPerDay: {
            type: Number,
            min: 0
        },
        costAlertThreshold: {
            type: Number,
            min: 0
        }
    }
}, {
    timestamps: true
});

// Index for efficient queries
botConfigSchema.index({ userId: 1, selectedBotId: 1 });
botConfigSchema.index({ 'botConfigs.id': 1 });

// Virtual to get the currently selected bot configuration
botConfigSchema.virtual('selectedBot').get(function() {
    return this.botConfigs.find(config => config.id === this.selectedBotId);
});

// Method to get available bot configurations
botConfigSchema.methods.getAvailableConfigs = function() {
    return this.botConfigs.filter(config => config.isActive);
};

// Method to select a bot configuration
botConfigSchema.methods.selectBot = function(botId) {
    const botExists = this.botConfigs.some(config => config.id === botId && config.isActive);
    if (!botExists) {
        throw new Error('Bot configuration not found or inactive');
    }
    
    this.selectedBotId = botId;
    return this.save();
};

// Method to add custom configuration
botConfigSchema.methods.addCustomConfiguration = function(name, description, settings) {
    this.customConfigurations.push({
        name,
        description,
        settings
    });
    return this.save();
};

// Method to get estimated monthly cost for selected bot
botConfigSchema.methods.getEstimatedMonthlyCost = function() {
    const selectedBot = this.selectedBot;
    if (!selectedBot) return 0;
    
    const inputCost = selectedBot.estimatedTokensPerMonth * selectedBot.pricing.inputTokenCost;
    const outputCost = selectedBot.estimatedTokensPerMonth * selectedBot.pricing.outputTokenCost;
    
    return inputCost + outputCost;
};

// Static method to get default bot configurations
botConfigSchema.statics.getDefaultConfigurations = function() {
    return [
        {
            id: 'general-assistant',
            name: 'General Assistant',
            description: 'A versatile bot for general questions, conversations, and basic tasks',
            features: [
                'Natural conversation',
                'Question answering',
                'Basic task assistance',
                'Friendly personality'
            ],
            estimatedTokensPerMonth: 50000,
            category: 'general',
            complexity: 'basic',
            pricing: {
                inputTokenCost: 0.0015, // per 1K tokens
                outputTokenCost: 0.002  // per 1K tokens
            },
            isActive: true
        },
        {
            id: 'moderation-bot',
            name: 'Moderation Assistant',
            description: 'Advanced moderation capabilities with content filtering and user management',
            features: [
                'Content moderation',
                'Spam detection',
                'User warnings and timeouts',
                'Automated rule enforcement',
                'Detailed logging'
            ],
            estimatedTokensPerMonth: 75000,
            category: 'moderation',
            complexity: 'intermediate',
            pricing: {
                inputTokenCost: 0.0015,
                outputTokenCost: 0.002
            },
            isActive: true
        },
        {
            id: 'entertainment-bot',
            name: 'Entertainment Hub',
            description: 'Fun and engaging bot with games, jokes, and interactive features',
            features: [
                'Interactive games',
                'Jokes and memes',
                'Trivia questions',
                'Music recommendations',
                'Random fun facts'
            ],
            estimatedTokensPerMonth: 100000,
            category: 'entertainment',
            complexity: 'advanced',
            pricing: {
                inputTokenCost: 0.0015,
                outputTokenCost: 0.002
            },
            isActive: true
        }
    ];
};

// Static method to initialize user configuration with defaults
botConfigSchema.statics.initializeForUser = async function(userId) {
    const existingConfig = await this.findOne({ userId });
    if (existingConfig) {
        return existingConfig;
    }
    
    const defaultConfigs = this.getDefaultConfigurations();
    const newConfig = new this({
        userId,
        selectedBotId: defaultConfigs[0].id, // Default to first configuration
        botConfigs: defaultConfigs,
        preferences: {
            autoUpdate: true,
            notifyOnChanges: true
        }
    });
    
    return await newConfig.save();
};

// Method to update bot configuration
botConfigSchema.methods.updateBotConfig = function(botId, updates) {
    const configIndex = this.botConfigs.findIndex(config => config.id === botId);
    if (configIndex === -1) {
        throw new Error('Bot configuration not found');
    }
    
    Object.assign(this.botConfigs[configIndex], updates);
    return this.save();
};

// Pre-save middleware to validate selected bot exists
botConfigSchema.pre('save', function(next) {
    if (this.selectedBotId) {
        const botExists = this.botConfigs.some(config => config.id === this.selectedBotId);
        if (!botExists) {
            return next(new Error('Selected bot ID must exist in bot configurations'));
        }
    }
    next();
});

const BotConfiguration = mongoose.model('BotConfiguration', botConfigSchema);

export default BotConfiguration;