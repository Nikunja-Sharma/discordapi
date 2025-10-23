import express from 'express';
import { body, query } from 'express-validator';
import {
    recordUsage,
    getCurrentPricing,
    getUsageSummary,
    getDailySummary,
    getMonthlySummary,
    getCostEstimate,
    getTotalUsage,
    calculateCost,
    getRealtimeCost,
    getCostProjections,
    generateUsageReport,
    getUsageAnalytics,
    getUsageHistory
} from '../controllers/usageTrackingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route POST /api/usage/record
 * @desc Record token usage for a bot operation
 * @access Private
 */
router.post('/record', [
    body('botConfigId')
        .notEmpty()
        .withMessage('Bot configuration ID is required')
        .isString()
        .withMessage('Bot configuration ID must be a string'),
    body('model')
        .optional()
        .isString()
        .withMessage('Model must be a string'),
    body('inputTokens')
        .isInt({ min: 0 })
        .withMessage('Input tokens must be a non-negative integer'),
    body('outputTokens')
        .isInt({ min: 0 })
        .withMessage('Output tokens must be a non-negative integer'),
    body('requestType')
        .optional()
        .isIn(['chat', 'completion', 'embedding', 'moderation'])
        .withMessage('Request type must be one of: chat, completion, embedding, moderation'),
    body('success')
        .optional()
        .isBoolean()
        .withMessage('Success must be a boolean'),
    body('errorMessage')
        .optional()
        .isString()
        .withMessage('Error message must be a string'),
    body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object')
], recordUsage);

/**
 * @route GET /api/usage/pricing
 * @desc Get current OpenAI pricing information
 * @access Private
 */
router.get('/pricing', [
    query('model')
        .optional()
        .isString()
        .withMessage('Model must be a string')
], getCurrentPricing);

/**
 * @route GET /api/usage/summary
 * @desc Get usage summary for a date range
 * @access Private
 */
router.get('/summary', [
    query('startDate')
        .notEmpty()
        .withMessage('Start date is required')
        .isISO8601()
        .withMessage('Start date must be in ISO 8601 format'),
    query('endDate')
        .notEmpty()
        .withMessage('End date is required')
        .isISO8601()
        .withMessage('End date must be in ISO 8601 format'),
    query('botConfigId')
        .optional()
        .isString()
        .withMessage('Bot configuration ID must be a string')
], getUsageSummary);

/**
 * @route GET /api/usage/daily
 * @desc Get daily usage summary
 * @access Private
 */
router.get('/daily', [
    query('date')
        .optional()
        .isISO8601()
        .withMessage('Date must be in ISO 8601 format')
], getDailySummary);

/**
 * @route GET /api/usage/monthly
 * @desc Get monthly usage summary
 * @access Private
 */
router.get('/monthly', [
    query('year')
        .optional()
        .isInt({ min: 2020, max: 2030 })
        .withMessage('Year must be between 2020 and 2030'),
    query('month')
        .optional()
        .isInt({ min: 1, max: 12 })
        .withMessage('Month must be between 1 and 12')
], getMonthlySummary);

/**
 * @route GET /api/usage/estimate
 * @desc Get monthly cost estimation based on recent usage
 * @access Private
 */
router.get('/estimate', [
    query('botConfigId')
        .notEmpty()
        .withMessage('Bot configuration ID is required')
        .isString()
        .withMessage('Bot configuration ID must be a string'),
    query('daysToAnalyze')
        .optional()
        .isInt({ min: 1, max: 30 })
        .withMessage('Days to analyze must be between 1 and 30')
], getCostEstimate);

/**
 * @route GET /api/usage/total
 * @desc Get total usage statistics for the user
 * @access Private
 */
router.get('/total', getTotalUsage);

/**
 * @route POST /api/usage/calculate-cost
 * @desc Calculate cost for given token usage
 * @access Private
 */
router.post('/calculate-cost', [
    body('model')
        .optional()
        .isString()
        .withMessage('Model must be a string'),
    body('inputTokens')
        .isInt({ min: 0 })
        .withMessage('Input tokens must be a non-negative integer'),
    body('outputTokens')
        .isInt({ min: 0 })
        .withMessage('Output tokens must be a non-negative integer')
], calculateCost);

/**
 * @route GET /api/usage/realtime-cost
 * @desc Get real-time cost per token for current usage
 * @access Private
 */
router.get('/realtime-cost', [
    query('botConfigId')
        .notEmpty()
        .withMessage('Bot configuration ID is required')
        .isString()
        .withMessage('Bot configuration ID must be a string'),
    query('model')
        .optional()
        .isString()
        .withMessage('Model must be a string')
], getRealtimeCost);

/**
 * @route GET /api/usage/projections
 * @desc Get cost projections based on usage patterns
 * @access Private
 */
router.get('/projections', [
    query('botConfigId')
        .notEmpty()
        .withMessage('Bot configuration ID is required')
        .isString()
        .withMessage('Bot configuration ID must be a string'),
    query('projectionType')
        .optional()
        .isIn(['weekly', 'monthly', 'yearly', 'all'])
        .withMessage('Projection type must be one of: weekly, monthly, yearly, all')
], getCostProjections);

/**
 * @route GET /api/usage/report
 * @desc Generate comprehensive usage report
 * @access Private
 */
router.get('/report', [
    query('period')
        .optional()
        .isIn(['day', 'week', 'month', 'year'])
        .withMessage('Period must be one of: day, week, month, year'),
    query('botConfigId')
        .optional()
        .isString()
        .withMessage('Bot configuration ID must be a string'),
    query('format')
        .optional()
        .isIn(['json', 'csv'])
        .withMessage('Format must be json or csv'),
    query('includeProjections')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('Include projections must be true or false'),
    query('includeBreakdowns')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('Include breakdowns must be true or false')
], generateUsageReport);

/**
 * @route GET /api/usage/analytics
 * @desc Get usage analytics and insights
 * @access Private
 */
router.get('/analytics', [
    query('botConfigId')
        .optional()
        .isString()
        .withMessage('Bot configuration ID must be a string'),
    query('days')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('Days must be between 1 and 365')
], getUsageAnalytics);

/**
 * @route GET /api/usage/stats
 * @desc Get usage statistics for dashboard (simplified endpoint)
 * @access Private
 */
router.get('/stats', [
    query('range')
        .optional()
        .isIn(['7d', '30d', '90d'])
        .withMessage('Range must be one of: 7d, 30d, 90d')
], async (req, res) => {
    try {
        const userId = req.user.id;
        const range = req.query.range || '30d';
        
        // Calculate date range
        const now = new Date();
        let daysBack;
        switch (range) {
            case '7d': daysBack = 7; break;
            case '30d': daysBack = 30; break;
            case '90d': daysBack = 90; break;
            default: daysBack = 30;
        }
        
        const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
        const endDate = now;
        
        // Get usage summary
        const UsageTrackingService = (await import('../services/usageTrackingService.js')).default;
        const summary = await UsageTrackingService.getUsageSummary(userId, startDate, endDate);
        
        res.json({
            success: true,
            data: summary,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting usage stats:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'USAGE_STATS_ERROR',
                message: 'Failed to get usage statistics',
                details: error.message
            }
        });
    }
});

/**
 * @route GET /api/usage/history
 * @desc Get paginated usage history
 * @access Private
 */
router.get('/history', [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('botConfigId')
        .optional()
        .isString()
        .withMessage('Bot configuration ID must be a string'),
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be in ISO 8601 format'),
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be in ISO 8601 format'),
    query('sortBy')
        .optional()
        .isIn(['date', 'totalCost', 'inputTokens', 'outputTokens', 'apiCalls'])
        .withMessage('Sort by must be one of: date, totalCost, inputTokens, outputTokens, apiCalls'),
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc')
], getUsageHistory);

export default router;