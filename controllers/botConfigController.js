import { BotConfiguration } from '../models/index.js';
import { validationResult } from 'express-validator';
import * as botConfigService from '../services/botConfigService.js';

/**
 * Bot Configuration Controller
 * Handles bot configuration management operations
 */

/**
 * Get all available bot configurations for a user
 */
export const getBotConfigurations = async (req, res) => {
    try {
        const userId = req.user.id;
        const configData = await botConfigService.getUserBotConfig(userId);
        
        res.json({
            success: true,
            data: {
                configurations: configData.availableConfigs,
                selectedBotId: configData.selectedBotId,
                preferences: configData.preferences,
                customConfigurations: configData.customConfigurations,
                lastUpdated: configData.lastUpdated
            }
        });
    } catch (error) {
        console.error('Error fetching bot configurations:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_CONFIGS_ERROR',
                message: 'Failed to fetch bot configurations',
                details: error.message
            }
        });
    }
};

/**
 * Get the currently selected bot configuration
 */
export const getCurrentBotConfig = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const userConfig = await BotConfiguration.findOne({ userId });
        
        if (!userConfig) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'CONFIG_NOT_FOUND',
                    message: 'Bot configuration not found for user'
                }
            });
        }
        
        const selectedBot = userConfig.selectedBot;
        
        if (!selectedBot) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'SELECTED_BOT_NOT_FOUND',
                    message: 'Selected bot configuration not found'
                }
            });
        }
        
        const estimatedMonthlyCost = userConfig.getEstimatedMonthlyCost();
        
        res.json({
            success: true,
            data: {
                selectedBot,
                estimatedMonthlyCost,
                preferences: userConfig.preferences
            }
        });
    } catch (error) {
        console.error('Error fetching current bot config:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_CURRENT_CONFIG_ERROR',
                message: 'Failed to fetch current bot configuration',
                details: error.message
            }
        });
    }
};

/**
 * Select a bot configuration
 */
export const selectBotConfiguration = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: errors.array()
                }
            });
        }
        
        const userId = req.user.id;
        const { botId } = req.body;
        
        const result = await botConfigService.selectBotConfig(userId, botId);
        
        res.json({
            success: true,
            message: result.changed ? 'Bot configuration changed successfully' : 'Bot configuration confirmed',
            data: {
                selectedBot: result.selectedBot,
                estimatedMonthlyCost: result.estimatedMonthlyCost,
                changed: result.changed,
                changeDetails: result.changeDetails
            }
        });
    } catch (error) {
        console.error('Error selecting bot configuration:', error);
        
        if (error.message.includes('Bot configuration not found or inactive')) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_BOT_ID',
                    message: 'Invalid or inactive bot configuration',
                    details: error.message
                }
            });
        }
        
        res.status(500).json({
            success: false,
            error: {
                code: 'SELECT_BOT_ERROR',
                message: 'Failed to select bot configuration',
                details: error.message
            }
        });
    }
};

/**
 * Update bot configuration preferences
 */
export const updatePreferences = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: errors.array()
                }
            });
        }
        
        const userId = req.user.id;
        const { preferences } = req.body;
        
        // Validate preferences
        const validation = botConfigService.validateBotConfigSettings(preferences);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PREFERENCES',
                    message: 'Invalid preference values',
                    details: validation.errors
                }
            });
        }
        
        const result = await botConfigService.updateUserPreferences(userId, preferences);
        
        res.json({
            success: true,
            message: result.hasChanges ? 'Preferences updated successfully' : 'No changes made to preferences',
            data: {
                preferences: result.preferences,
                changes: result.changes,
                hasChanges: result.hasChanges
            }
        });
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'UPDATE_PREFERENCES_ERROR',
                message: 'Failed to update preferences',
                details: error.message
            }
        });
    }
};

/**
 * Add a custom bot configuration
 */
export const addCustomConfiguration = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: errors.array()
                }
            });
        }
        
        const userId = req.user.id;
        const { name, description, settings } = req.body;
        
        const result = await botConfigService.addCustomBotConfig(userId, name, description, settings);
        
        res.json({
            success: true,
            message: 'Custom configuration added successfully',
            data: {
                customConfigurations: result.customConfigurations,
                addedConfiguration: result.addedConfiguration
            }
        });
    } catch (error) {
        console.error('Error adding custom configuration:', error);
        
        if (error.message.includes('already exists')) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'DUPLICATE_CONFIG_NAME',
                    message: 'Custom configuration with this name already exists',
                    details: error.message
                }
            });
        }
        
        res.status(500).json({
            success: false,
            error: {
                code: 'ADD_CUSTOM_CONFIG_ERROR',
                message: 'Failed to add custom configuration',
                details: error.message
            }
        });
    }
};

/**
 * Get bot configuration status and statistics
 */
export const getBotConfigStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const userConfig = await BotConfiguration.findOne({ userId });
        
        if (!userConfig) {
            return res.json({
                success: true,
                data: {
                    hasConfiguration: false,
                    selectedBotId: null,
                    totalConfigurations: 0,
                    customConfigurations: 0
                }
            });
        }
        
        const selectedBot = userConfig.selectedBot;
        const estimatedMonthlyCost = userConfig.getEstimatedMonthlyCost();
        
        res.json({
            success: true,
            data: {
                hasConfiguration: true,
                selectedBotId: userConfig.selectedBotId,
                selectedBotName: selectedBot ? selectedBot.name : null,
                totalConfigurations: userConfig.botConfigs.length,
                customConfigurations: userConfig.customConfigurations.length,
                estimatedMonthlyCost,
                preferences: userConfig.preferences,
                lastUpdated: userConfig.updatedAt
            }
        });
    } catch (error) {
        console.error('Error fetching bot config status:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_STATUS_ERROR',
                message: 'Failed to fetch bot configuration status',
                details: error.message
            }
        });
    }
};
/**

 * Remove a custom bot configuration
 */
export const removeCustomConfiguration = async (req, res) => {
    try {
        const userId = req.user.id;
        const { configId } = req.params;
        
        const result = await botConfigService.removeCustomBotConfig(userId, configId);
        
        res.json({
            success: true,
            message: 'Custom configuration removed successfully',
            data: {
                removedConfiguration: result.removedConfiguration,
                remainingConfigurations: result.remainingConfigurations
            }
        });
    } catch (error) {
        console.error('Error removing custom configuration:', error);
        
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'CONFIG_NOT_FOUND',
                    message: 'Custom configuration not found',
                    details: error.message
                }
            });
        }
        
        res.status(500).json({
            success: false,
            error: {
                code: 'REMOVE_CUSTOM_CONFIG_ERROR',
                message: 'Failed to remove custom configuration',
                details: error.message
            }
        });
    }
};

/**
 * Get bot configuration change history
 */
export const getBotConfigHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 10;
        
        const history = await botConfigService.getBotConfigHistory(userId, limit);
        
        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Error fetching bot config history:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_HISTORY_ERROR',
                message: 'Failed to fetch bot configuration history',
                details: error.message
            }
        });
    }
};

/**
 * Get comprehensive bot configuration statistics
 */
export const getBotConfigStatistics = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const stats = await botConfigService.getBotConfigStats(userId);
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching bot config statistics:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_STATS_ERROR',
                message: 'Failed to fetch bot configuration statistics',
                details: error.message
            }
        });
    }
};