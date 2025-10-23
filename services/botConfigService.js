import { BotConfiguration } from '../models/index.js';

/**
 * Bot Configuration Service
 * Handles bot configuration business logic and user preferences
 */

/**
 * Initialize bot configuration for a new user
 */
export const initializeUserBotConfig = async (userId) => {
    try {
        const existingConfig = await BotConfiguration.findOne({ userId });
        if (existingConfig) {
            return existingConfig;
        }
        
        return await BotConfiguration.initializeForUser(userId);
    } catch (error) {
        throw new Error(`Failed to initialize bot configuration: ${error.message}`);
    }
};

/**
 * Get user's bot configuration with preferences
 */
export const getUserBotConfig = async (userId) => {
    try {
        let userConfig = await BotConfiguration.findOne({ userId });
        
        if (!userConfig) {
            userConfig = await BotConfiguration.initializeForUser(userId);
        }
        
        return {
            selectedBotId: userConfig.selectedBotId,
            selectedBot: userConfig.selectedBot,
            availableConfigs: userConfig.getAvailableConfigs(),
            preferences: userConfig.preferences,
            customConfigurations: userConfig.customConfigurations,
            estimatedMonthlyCost: userConfig.getEstimatedMonthlyCost(),
            lastUpdated: userConfig.updatedAt
        };
    } catch (error) {
        throw new Error(`Failed to get user bot configuration: ${error.message}`);
    }
};

/**
 * Update user preferences with change tracking
 */
export const updateUserPreferences = async (userId, newPreferences) => {
    try {
        let userConfig = await BotConfiguration.findOne({ userId });
        
        if (!userConfig) {
            userConfig = await BotConfiguration.initializeForUser(userId);
        }
        
        // Track changes
        const oldPreferences = { ...userConfig.preferences };
        const changes = {};
        
        for (const [key, value] of Object.entries(newPreferences)) {
            if (oldPreferences[key] !== value) {
                changes[key] = {
                    from: oldPreferences[key],
                    to: value
                };
            }
        }
        
        // Update preferences
        Object.assign(userConfig.preferences, newPreferences);
        await userConfig.save();
        
        return {
            preferences: userConfig.preferences,
            changes,
            hasChanges: Object.keys(changes).length > 0
        };
    } catch (error) {
        throw new Error(`Failed to update user preferences: ${error.message}`);
    }
};

/**
 * Select bot configuration with change tracking
 */
export const selectBotConfig = async (userId, botId) => {
    try {
        let userConfig = await BotConfiguration.findOne({ userId });
        
        if (!userConfig) {
            userConfig = await BotConfiguration.initializeForUser(userId);
        }
        
        const previousBotId = userConfig.selectedBotId;
        const previousBot = userConfig.selectedBot;
        
        // Select new bot
        await userConfig.selectBot(botId);
        
        const newBot = userConfig.selectedBot;
        const estimatedMonthlyCost = userConfig.getEstimatedMonthlyCost();
        
        return {
            selectedBot: newBot,
            previousBot: previousBot,
            estimatedMonthlyCost,
            changed: previousBotId !== botId,
            changeDetails: {
                from: {
                    id: previousBotId,
                    name: previousBot ? previousBot.name : null
                },
                to: {
                    id: botId,
                    name: newBot.name
                }
            }
        };
    } catch (error) {
        throw new Error(`Failed to select bot configuration: ${error.message}`);
    }
};

/**
 * Add custom configuration with validation
 */
export const addCustomBotConfig = async (userId, name, description, settings) => {
    try {
        let userConfig = await BotConfiguration.findOne({ userId });
        
        if (!userConfig) {
            userConfig = await BotConfiguration.initializeForUser(userId);
        }
        
        // Validate custom configuration name uniqueness
        const existingCustom = userConfig.customConfigurations.find(
            config => config.name.toLowerCase() === name.toLowerCase()
        );
        
        if (existingCustom) {
            throw new Error('Custom configuration with this name already exists');
        }
        
        // Add custom configuration
        await userConfig.addCustomConfiguration(name, description, settings);
        
        return {
            customConfigurations: userConfig.customConfigurations,
            addedConfiguration: userConfig.customConfigurations[userConfig.customConfigurations.length - 1]
        };
    } catch (error) {
        throw new Error(`Failed to add custom configuration: ${error.message}`);
    }
};

/**
 * Remove custom configuration
 */
export const removeCustomBotConfig = async (userId, configId) => {
    try {
        const userConfig = await BotConfiguration.findOne({ userId });
        
        if (!userConfig) {
            throw new Error('User bot configuration not found');
        }
        
        const configIndex = userConfig.customConfigurations.findIndex(
            config => config._id.toString() === configId
        );
        
        if (configIndex === -1) {
            throw new Error('Custom configuration not found');
        }
        
        const removedConfig = userConfig.customConfigurations[configIndex];
        userConfig.customConfigurations.splice(configIndex, 1);
        await userConfig.save();
        
        return {
            removedConfiguration: removedConfig,
            remainingConfigurations: userConfig.customConfigurations
        };
    } catch (error) {
        throw new Error(`Failed to remove custom configuration: ${error.message}`);
    }
};

/**
 * Get bot configuration change history (simplified tracking)
 */
export const getBotConfigHistory = async (userId, limit = 10) => {
    try {
        const userConfig = await BotConfiguration.findOne({ userId });
        
        if (!userConfig) {
            return {
                hasHistory: false,
                changes: []
            };
        }
        
        // For now, return basic information
        // In a full implementation, you might want to create a separate ChangeLog model
        return {
            hasHistory: true,
            currentConfig: {
                selectedBotId: userConfig.selectedBotId,
                selectedBotName: userConfig.selectedBot ? userConfig.selectedBot.name : null,
                lastUpdated: userConfig.updatedAt
            },
            preferences: userConfig.preferences,
            customConfigurationsCount: userConfig.customConfigurations.length
        };
    } catch (error) {
        throw new Error(`Failed to get bot configuration history: ${error.message}`);
    }
};

/**
 * Validate bot configuration settings
 */
export const validateBotConfigSettings = (settings) => {
    const errors = [];
    
    if (settings.maxTokensPerDay && settings.maxTokensPerDay < 0) {
        errors.push('maxTokensPerDay must be non-negative');
    }
    
    if (settings.costAlertThreshold && settings.costAlertThreshold < 0) {
        errors.push('costAlertThreshold must be non-negative');
    }
    
    if (settings.maxTokensPerDay && settings.costAlertThreshold) {
        // Basic validation - alert threshold should be reasonable
        const estimatedDailyCost = settings.maxTokensPerDay * 0.002; // Rough estimate
        if (settings.costAlertThreshold > estimatedDailyCost * 10) {
            errors.push('costAlertThreshold seems too high compared to maxTokensPerDay');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Get bot configuration statistics
 */
export const getBotConfigStats = async (userId) => {
    try {
        const userConfig = await BotConfiguration.findOne({ userId });
        
        if (!userConfig) {
            return {
                hasConfiguration: false,
                stats: null
            };
        }
        
        const selectedBot = userConfig.selectedBot;
        const estimatedMonthlyCost = userConfig.getEstimatedMonthlyCost();
        
        return {
            hasConfiguration: true,
            stats: {
                selectedBotId: userConfig.selectedBotId,
                selectedBotName: selectedBot ? selectedBot.name : null,
                selectedBotCategory: selectedBot ? selectedBot.category : null,
                selectedBotComplexity: selectedBot ? selectedBot.complexity : null,
                totalAvailableConfigs: userConfig.botConfigs.filter(c => c.isActive).length,
                customConfigurationsCount: userConfig.customConfigurations.length,
                estimatedMonthlyCost,
                estimatedDailyCost: estimatedMonthlyCost / 30,
                preferences: userConfig.preferences,
                lastUpdated: userConfig.updatedAt,
                createdAt: userConfig.createdAt
            }
        };
    } catch (error) {
        throw new Error(`Failed to get bot configuration statistics: ${error.message}`);
    }
};