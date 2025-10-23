import express from 'express';
import { body } from 'express-validator';
import {
    getBotConfigurations,
    getCurrentBotConfig,
    selectBotConfiguration,
    updatePreferences,
    addCustomConfiguration,
    getBotConfigStatus,
    removeCustomConfiguration,
    getBotConfigHistory,
    getBotConfigStatistics
} from '../controllers/botConfigController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route GET /api/bots/configurations
 * @desc Get all available bot configurations for the authenticated user
 * @access Private
 */
router.get('/configurations', getBotConfigurations);

/**
 * @route GET /api/bots/current
 * @desc Get the currently selected bot configuration
 * @access Private
 */
router.get('/current', getCurrentBotConfig);

/**
 * @route GET /api/bots/status
 * @desc Get bot configuration status and statistics
 * @access Private
 */
router.get('/status', getBotConfigStatus);

/**
 * @route POST /api/bots/select
 * @desc Select a bot configuration
 * @access Private
 */
router.post('/select', [
    body('botId')
        .notEmpty()
        .withMessage('Bot ID is required')
        .isString()
        .withMessage('Bot ID must be a string')
        .isLength({ min: 1, max: 100 })
        .withMessage('Bot ID must be between 1 and 100 characters')
], selectBotConfiguration);

/**
 * @route PUT /api/bots/preferences
 * @desc Update bot configuration preferences
 * @access Private
 */
router.put('/preferences', [
    body('preferences')
        .isObject()
        .withMessage('Preferences must be an object'),
    body('preferences.autoUpdate')
        .optional()
        .isBoolean()
        .withMessage('autoUpdate must be a boolean'),
    body('preferences.notifyOnChanges')
        .optional()
        .isBoolean()
        .withMessage('notifyOnChanges must be a boolean'),
    body('preferences.maxTokensPerDay')
        .optional()
        .isInt({ min: 0 })
        .withMessage('maxTokensPerDay must be a non-negative integer'),
    body('preferences.costAlertThreshold')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('costAlertThreshold must be a non-negative number')
], updatePreferences);

/**
 * @route POST /api/bots/custom
 * @desc Add a custom bot configuration
 * @access Private
 */
router.post('/custom', [
    body('name')
        .notEmpty()
        .withMessage('Name is required')
        .isString()
        .withMessage('Name must be a string')
        .isLength({ min: 1, max: 100 })
        .withMessage('Name must be between 1 and 100 characters'),
    body('description')
        .notEmpty()
        .withMessage('Description is required')
        .isString()
        .withMessage('Description must be a string')
        .isLength({ min: 1, max: 500 })
        .withMessage('Description must be between 1 and 500 characters'),
    body('settings')
        .isObject()
        .withMessage('Settings must be an object')
], addCustomConfiguration);

export default router;/**

 * @route DELETE /api/bots/custom/:configId
 * @desc Remove a custom bot configuration
 * @access Private
 */
router.delete('/custom/:configId', removeCustomConfiguration);

/**
 * @route GET /api/bots/history
 * @desc Get bot configuration change history
 * @access Private
 */
router.get('/history', getBotConfigHistory);

/**
 * @route GET /api/bots/statistics
 * @desc Get comprehensive bot configuration statistics
 * @access Private
 */
router.get('/statistics', getBotConfigStatistics);