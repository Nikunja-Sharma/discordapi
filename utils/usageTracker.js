import UsageTrackingService from '../services/usageTrackingService.js';

/**
 * Utility class for tracking OpenAI API usage in Discord bot operations
 */
class UsageTracker {
    /**
     * Track usage for a Discord bot operation
     * @param {string} userId - User ID
     * @param {string} botConfigId - Bot configuration ID
     * @param {Object} apiResponse - OpenAI API response
     * @param {Object} metadata - Additional metadata (Discord context)
     * @returns {Promise<Object>} Usage tracking result
     */
    static async trackBotUsage(userId, botConfigId, apiResponse, metadata = {}) {
        try {
            // Extract usage information from OpenAI API response
            const usage = apiResponse.usage || {};
            const model = apiResponse.model || 'gpt-4o-mini';
            
            const requestData = {
                model,
                inputTokens: usage.prompt_tokens || 0,
                outputTokens: usage.completion_tokens || 0,
                requestType: 'chat',
                success: true,
                metadata: {
                    ...metadata,
                    responseId: apiResponse.id,
                    created: apiResponse.created,
                    systemFingerprint: apiResponse.system_fingerprint
                }
            };

            return await UsageTrackingService.recordUsage(userId, botConfigId, requestData);
        } catch (error) {
            console.error('Error tracking bot usage:', error);
            // Don't throw error to avoid breaking bot functionality
            return { success: false, error: error.message };
        }
    }

    /**
     * Track failed API request
     * @param {string} userId - User ID
     * @param {string} botConfigId - Bot configuration ID
     * @param {Error} error - Error that occurred
     * @param {Object} metadata - Additional metadata
     * @returns {Promise<Object>} Usage tracking result
     */
    static async trackFailedRequest(userId, botConfigId, error, metadata = {}) {
        try {
            const requestData = {
                model: metadata.model || 'gpt-4o-mini',
                inputTokens: 0,
                outputTokens: 0,
                requestType: 'chat',
                success: false,
                errorMessage: error.message,
                metadata: {
                    ...metadata,
                    errorCode: error.code,
                    errorType: error.type
                }
            };

            return await UsageTrackingService.recordUsage(userId, botConfigId, requestData);
        } catch (trackingError) {
            console.error('Error tracking failed request:', trackingError);
            return { success: false, error: trackingError.message };
        }
    }

    /**
     * Create a wrapper for OpenAI API calls that automatically tracks usage
     * @param {Function} apiCall - Function that makes the OpenAI API call
     * @param {string} userId - User ID
     * @param {string} botConfigId - Bot configuration ID
     * @param {Object} metadata - Additional metadata
     * @returns {Function} Wrapped API call function
     */
    static wrapApiCall(apiCall, userId, botConfigId, metadata = {}) {
        return async (...args) => {
            try {
                const startTime = Date.now();
                const response = await apiCall(...args);
                const endTime = Date.now();

                // Track successful usage
                const trackingResult = await this.trackBotUsage(userId, botConfigId, response, {
                    ...metadata,
                    responseTime: endTime - startTime,
                    timestamp: new Date().toISOString()
                });

                // Add tracking info to response for debugging
                if (response && typeof response === 'object') {
                    response._usageTracking = trackingResult;
                }

                return response;
            } catch (error) {
                // Track failed request
                await this.trackFailedRequest(userId, botConfigId, error, {
                    ...metadata,
                    timestamp: new Date().toISOString()
                });

                // Re-throw the original error
                throw error;
            }
        };
    }

    /**
     * Get usage statistics for a user's bot configuration
     * @param {string} userId - User ID
     * @param {string} botConfigId - Bot configuration ID
     * @param {number} days - Number of days to look back (default: 30)
     * @returns {Promise<Object>} Usage statistics
     */
    static async getBotUsageStats(userId, botConfigId, days = 30) {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const summary = await UsageTrackingService.getUsageSummary(userId, startDate, endDate, botConfigId);
            const estimate = await UsageTrackingService.estimateMonthlyCost(userId, botConfigId, Math.min(days, 7));

            return {
                period: {
                    days,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                },
                usage: summary.summary,
                estimate,
                dailyBreakdown: summary.dailyBreakdown
            };
        } catch (error) {
            console.error('Error getting bot usage stats:', error);
            throw error;
        }
    }

    /**
     * Check if user is approaching usage limits
     * @param {string} userId - User ID
     * @param {string} botConfigId - Bot configuration ID
     * @param {Object} limits - Usage limits to check against
     * @returns {Promise<Object>} Limit check result
     */
    static async checkUsageLimits(userId, botConfigId, limits = {}) {
        try {
            const {
                dailyCostLimit = null,
                monthlyCostLimit = null,
                dailyTokenLimit = null,
                monthlyTokenLimit = null
            } = limits;

            const results = {
                withinLimits: true,
                warnings: [],
                exceeded: []
            };

            // Check daily limits
            if (dailyCostLimit || dailyTokenLimit) {
                const today = new Date();
                const dailySummary = await UsageTrackingService.getDailySummary(userId, today);

                if (dailyCostLimit && dailySummary.summary.totalCost >= dailyCostLimit) {
                    results.withinLimits = false;
                    results.exceeded.push({
                        type: 'daily_cost',
                        limit: dailyCostLimit,
                        current: dailySummary.summary.totalCost,
                        percentage: (dailySummary.summary.totalCost / dailyCostLimit) * 100
                    });
                } else if (dailyCostLimit && dailySummary.summary.totalCost >= dailyCostLimit * 0.8) {
                    results.warnings.push({
                        type: 'daily_cost',
                        limit: dailyCostLimit,
                        current: dailySummary.summary.totalCost,
                        percentage: (dailySummary.summary.totalCost / dailyCostLimit) * 100
                    });
                }

                if (dailyTokenLimit && dailySummary.summary.totalTokens >= dailyTokenLimit) {
                    results.withinLimits = false;
                    results.exceeded.push({
                        type: 'daily_tokens',
                        limit: dailyTokenLimit,
                        current: dailySummary.summary.totalTokens,
                        percentage: (dailySummary.summary.totalTokens / dailyTokenLimit) * 100
                    });
                } else if (dailyTokenLimit && dailySummary.summary.totalTokens >= dailyTokenLimit * 0.8) {
                    results.warnings.push({
                        type: 'daily_tokens',
                        limit: dailyTokenLimit,
                        current: dailySummary.summary.totalTokens,
                        percentage: (dailySummary.summary.totalTokens / dailyTokenLimit) * 100
                    });
                }
            }

            // Check monthly limits
            if (monthlyCostLimit || monthlyTokenLimit) {
                const now = new Date();
                const monthlySummary = await UsageTrackingService.getMonthlySummary(userId, now.getFullYear(), now.getMonth() + 1);

                if (monthlyCostLimit && monthlySummary.summary.totalCost >= monthlyCostLimit) {
                    results.withinLimits = false;
                    results.exceeded.push({
                        type: 'monthly_cost',
                        limit: monthlyCostLimit,
                        current: monthlySummary.summary.totalCost,
                        percentage: (monthlySummary.summary.totalCost / monthlyCostLimit) * 100
                    });
                } else if (monthlyCostLimit && monthlySummary.summary.totalCost >= monthlyCostLimit * 0.8) {
                    results.warnings.push({
                        type: 'monthly_cost',
                        limit: monthlyCostLimit,
                        current: monthlySummary.summary.totalCost,
                        percentage: (monthlySummary.summary.totalCost / monthlyCostLimit) * 100
                    });
                }

                if (monthlyTokenLimit && monthlySummary.summary.totalTokens >= monthlyTokenLimit) {
                    results.withinLimits = false;
                    results.exceeded.push({
                        type: 'monthly_tokens',
                        limit: monthlyTokenLimit,
                        current: monthlySummary.summary.totalTokens,
                        percentage: (monthlySummary.summary.totalTokens / monthlyTokenLimit) * 100
                    });
                } else if (monthlyTokenLimit && monthlySummary.summary.totalTokens >= monthlyTokenLimit * 0.8) {
                    results.warnings.push({
                        type: 'monthly_tokens',
                        limit: monthlyTokenLimit,
                        current: monthlySummary.summary.totalTokens,
                        percentage: (monthlySummary.summary.totalTokens / monthlyTokenLimit) * 100
                    });
                }
            }

            return results;
        } catch (error) {
            console.error('Error checking usage limits:', error);
            throw error;
        }
    }

    /**
     * Generate usage report for a user
     * @param {string} userId - User ID
     * @param {Object} options - Report options
     * @returns {Promise<Object>} Usage report
     */
    static async generateUsageReport(userId, options = {}) {
        try {
            const {
                period = 'month', // 'day', 'week', 'month', 'year'
                botConfigId = null,
                includeProjections = true,
                includeBreakdowns = true
            } = options;

            const report = {
                userId,
                period,
                generatedAt: new Date().toISOString(),
                summary: {},
                breakdowns: {},
                projections: {}
            };

            let startDate, endDate;
            const now = new Date();

            switch (period) {
                case 'day':
                    startDate = new Date(now);
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(now);
                    endDate.setHours(23, 59, 59, 999);
                    break;
                case 'week':
                    startDate = new Date(now);
                    startDate.setDate(now.getDate() - 7);
                    endDate = new Date(now);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                    break;
                default:
                    throw new Error(`Invalid period: ${period}`);
            }

            // Get usage summary
            const usageSummary = await UsageTrackingService.getUsageSummary(userId, startDate, endDate, botConfigId);
            report.summary = usageSummary.summary;
            report.dateRange = usageSummary.dateRange;

            if (includeBreakdowns) {
                report.breakdowns = {
                    daily: usageSummary.dailyBreakdown,
                    models: usageSummary.modelBreakdown
                };
            }

            if (includeProjections && botConfigId) {
                const estimate = await UsageTrackingService.estimateMonthlyCost(userId, botConfigId);
                report.projections = {
                    monthly: estimate
                };
            }

            // Get total usage for context
            const totalUsage = await UsageTrackingService.getTotalUsage(userId);
            report.totalUsage = totalUsage;

            return report;
        } catch (error) {
            console.error('Error generating usage report:', error);
            throw error;
        }
    }
}

export default UsageTracker;