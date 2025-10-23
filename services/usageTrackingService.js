import { UsageTracking } from '../models/index.js';

/**
 * OpenAI pricing per 1K tokens (as of 2024)
 * These rates should be updated regularly to reflect current OpenAI pricing
 */
const OPENAI_PRICING = {
    'gpt-4': {
        input: 0.03,    // $0.03 per 1K input tokens
        output: 0.06    // $0.06 per 1K output tokens
    },
    'gpt-4-turbo': {
        input: 0.01,    // $0.01 per 1K input tokens
        output: 0.03    // $0.03 per 1K output tokens
    },
    'gpt-3.5-turbo': {
        input: 0.0015,  // $0.0015 per 1K input tokens
        output: 0.002   // $0.002 per 1K output tokens
    },
    'gpt-4o': {
        input: 0.005,   // $0.005 per 1K input tokens
        output: 0.015   // $0.015 per 1K output tokens
    },
    'gpt-4o-mini': {
        input: 0.00015, // $0.00015 per 1K input tokens
        output: 0.0006  // $0.0006 per 1K output tokens
    }
};

/**
 * Default model if not specified
 */
const DEFAULT_MODEL = 'gpt-4o-mini';

class UsageTrackingService {
    /**
     * Calculate cost for token usage based on OpenAI pricing
     * @param {string} model - OpenAI model name
     * @param {number} inputTokens - Number of input tokens
     * @param {number} outputTokens - Number of output tokens
     * @returns {number} Total cost in USD
     */
    static calculateCost(model = DEFAULT_MODEL, inputTokens = 0, outputTokens = 0) {
        try {
            // Normalize model name to handle variations
            const normalizedModel = model.toLowerCase().replace(/[^a-z0-9-]/g, '');
            
            // Find matching pricing model
            let pricing = OPENAI_PRICING[normalizedModel];
            
            // Fallback to similar models if exact match not found
            if (!pricing) {
                if (normalizedModel.includes('gpt-4o-mini')) {
                    pricing = OPENAI_PRICING['gpt-4o-mini'];
                } else if (normalizedModel.includes('gpt-4o')) {
                    pricing = OPENAI_PRICING['gpt-4o'];
                } else if (normalizedModel.includes('gpt-4-turbo')) {
                    pricing = OPENAI_PRICING['gpt-4-turbo'];
                } else if (normalizedModel.includes('gpt-4')) {
                    pricing = OPENAI_PRICING['gpt-4'];
                } else if (normalizedModel.includes('gpt-3.5')) {
                    pricing = OPENAI_PRICING['gpt-3.5-turbo'];
                } else {
                    // Default to most cost-effective model
                    pricing = OPENAI_PRICING[DEFAULT_MODEL];
                    console.warn(`Unknown model "${model}", using default pricing for ${DEFAULT_MODEL}`);
                }
            }
            
            // Calculate cost (pricing is per 1K tokens)
            const inputCost = (inputTokens / 1000) * pricing.input;
            const outputCost = (outputTokens / 1000) * pricing.output;
            
            return Number((inputCost + outputCost).toFixed(6));
        } catch (error) {
            console.error('Error calculating cost:', error);
            return 0;
        }
    }

    /**
     * Record usage for a user's bot operation
     * @param {string} userId - User ID
     * @param {string} botConfigId - Bot configuration ID
     * @param {Object} requestData - Request details
     * @returns {Promise<Object>} Updated usage record
     */
    static async recordUsage(userId, botConfigId, requestData) {
        try {
            const {
                model = DEFAULT_MODEL,
                inputTokens = 0,
                outputTokens = 0,
                requestType = 'chat',
                success = true,
                errorMessage = null,
                metadata = {}
            } = requestData;

            // Calculate cost
            const cost = this.calculateCost(model, inputTokens, outputTokens);

            // Prepare request details
            const requestDetails = {
                timestamp: new Date(),
                model,
                inputTokens,
                outputTokens,
                cost,
                requestType,
                success,
                errorMessage
            };

            // Record usage using the model's static method
            const usageRecord = await UsageTracking.recordUsage(userId, botConfigId, requestDetails);

            // Update metadata if provided
            if (Object.keys(metadata).length > 0) {
                usageRecord.metadata = { ...usageRecord.metadata, ...metadata };
                await usageRecord.save();
            }

            return {
                success: true,
                usageId: usageRecord._id,
                totalCost: usageRecord.totalCost,
                totalTokens: usageRecord.totalTokens,
                apiCalls: usageRecord.apiCalls
            };
        } catch (error) {
            console.error('Error recording usage:', error);
            throw new Error(`Failed to record usage: ${error.message}`);
        }
    }

    /**
     * Get current cost per token for a specific model
     * @param {string} model - OpenAI model name
     * @returns {Object} Pricing information
     */
    static getCurrentPricing(model = DEFAULT_MODEL) {
        try {
            const normalizedModel = model.toLowerCase().replace(/[^a-z0-9-]/g, '');
            let pricing = OPENAI_PRICING[normalizedModel];
            
            if (!pricing) {
                pricing = OPENAI_PRICING[DEFAULT_MODEL];
            }
            
            return {
                model: normalizedModel,
                inputCostPer1K: pricing.input,
                outputCostPer1K: pricing.output,
                currency: 'USD',
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting pricing:', error);
            return null;
        }
    }

    /**
     * Get usage summary for a user within a date range
     * @param {string} userId - User ID
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @param {string} botConfigId - Optional bot configuration filter
     * @returns {Promise<Object>} Usage summary
     */
    static async getUsageSummary(userId, startDate, endDate, botConfigId = null) {
        try {
            const usageRecords = await UsageTracking.getUsageByDateRange(userId, startDate, endDate, botConfigId);
            
            let totalInputTokens = 0;
            let totalOutputTokens = 0;
            let totalCost = 0;
            let totalApiCalls = 0;
            let totalRequests = 0;
            
            const dailyBreakdown = {};
            const modelBreakdown = {};
            
            for (const record of usageRecords) {
                totalInputTokens += record.inputTokens;
                totalOutputTokens += record.outputTokens;
                totalCost += record.totalCost;
                totalApiCalls += record.apiCalls;
                totalRequests += record.requestDetails.length;
                
                // Daily breakdown
                const dateKey = record.date.toISOString().split('T')[0];
                if (!dailyBreakdown[dateKey]) {
                    dailyBreakdown[dateKey] = {
                        inputTokens: 0,
                        outputTokens: 0,
                        cost: 0,
                        apiCalls: 0
                    };
                }
                dailyBreakdown[dateKey].inputTokens += record.inputTokens;
                dailyBreakdown[dateKey].outputTokens += record.outputTokens;
                dailyBreakdown[dateKey].cost += record.totalCost;
                dailyBreakdown[dateKey].apiCalls += record.apiCalls;
                
                // Model breakdown
                for (const request of record.requestDetails) {
                    if (!modelBreakdown[request.model]) {
                        modelBreakdown[request.model] = {
                            inputTokens: 0,
                            outputTokens: 0,
                            cost: 0,
                            requests: 0
                        };
                    }
                    modelBreakdown[request.model].inputTokens += request.inputTokens;
                    modelBreakdown[request.model].outputTokens += request.outputTokens;
                    modelBreakdown[request.model].cost += request.cost;
                    modelBreakdown[request.model].requests += 1;
                }
            }
            
            return {
                summary: {
                    totalInputTokens,
                    totalOutputTokens,
                    totalTokens: totalInputTokens + totalOutputTokens,
                    totalCost: Number(totalCost.toFixed(6)),
                    totalApiCalls,
                    totalRequests,
                    averageCostPerToken: totalInputTokens + totalOutputTokens > 0 
                        ? Number((totalCost / (totalInputTokens + totalOutputTokens)).toFixed(8))
                        : 0,
                    averageCostPerRequest: totalRequests > 0 
                        ? Number((totalCost / totalRequests).toFixed(6))
                        : 0
                },
                dailyBreakdown,
                modelBreakdown,
                dateRange: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                }
            };
        } catch (error) {
            console.error('Error getting usage summary:', error);
            throw new Error(`Failed to get usage summary: ${error.message}`);
        }
    }

    /**
     * Get monthly usage summary for a user
     * @param {string} userId - User ID
     * @param {number} year - Year
     * @param {number} month - Month (1-12)
     * @returns {Promise<Object>} Monthly usage summary
     */
    static async getMonthlySummary(userId, year, month) {
        try {
            const summary = await UsageTracking.getMonthlySummary(userId, year, month);
            
            let totalInputTokens = 0;
            let totalOutputTokens = 0;
            let totalCost = 0;
            let totalApiCalls = 0;
            
            const botConfigBreakdown = {};
            
            for (const record of summary) {
                totalInputTokens += record.totalInputTokens;
                totalOutputTokens += record.totalOutputTokens;
                totalCost += record.totalCost;
                totalApiCalls += record.totalApiCalls;
                
                botConfigBreakdown[record._id] = {
                    inputTokens: record.totalInputTokens,
                    outputTokens: record.totalOutputTokens,
                    totalTokens: record.totalInputTokens + record.totalOutputTokens,
                    cost: Number(record.totalCost.toFixed(6)),
                    apiCalls: record.totalApiCalls,
                    dailyBreakdown: record.dailyBreakdown
                };
            }
            
            return {
                month,
                year,
                summary: {
                    totalInputTokens,
                    totalOutputTokens,
                    totalTokens: totalInputTokens + totalOutputTokens,
                    totalCost: Number(totalCost.toFixed(6)),
                    totalApiCalls,
                    averageCostPerToken: totalInputTokens + totalOutputTokens > 0 
                        ? Number((totalCost / (totalInputTokens + totalOutputTokens)).toFixed(8))
                        : 0
                },
                botConfigBreakdown
            };
        } catch (error) {
            console.error('Error getting monthly summary:', error);
            throw new Error(`Failed to get monthly summary: ${error.message}`);
        }
    }

    /**
     * Get daily usage summary for a user
     * @param {string} userId - User ID
     * @param {Date} date - Date to get summary for
     * @returns {Promise<Object>} Daily usage summary
     */
    static async getDailySummary(userId, date) {
        try {
            const summary = await UsageTracking.getDailySummary(userId, date);
            
            let totalInputTokens = 0;
            let totalOutputTokens = 0;
            let totalCost = 0;
            let totalApiCalls = 0;
            let totalRequests = 0;
            
            const botConfigBreakdown = {};
            
            for (const record of summary) {
                totalInputTokens += record.totalInputTokens;
                totalOutputTokens += record.totalOutputTokens;
                totalCost += record.totalCost;
                totalApiCalls += record.totalApiCalls;
                totalRequests += record.requestCount;
                
                botConfigBreakdown[record._id] = {
                    inputTokens: record.totalInputTokens,
                    outputTokens: record.totalOutputTokens,
                    totalTokens: record.totalInputTokens + record.totalOutputTokens,
                    cost: Number(record.totalCost.toFixed(6)),
                    apiCalls: record.totalApiCalls,
                    requests: record.requestCount
                };
            }
            
            return {
                date: date.toISOString().split('T')[0],
                summary: {
                    totalInputTokens,
                    totalOutputTokens,
                    totalTokens: totalInputTokens + totalOutputTokens,
                    totalCost: Number(totalCost.toFixed(6)),
                    totalApiCalls,
                    totalRequests,
                    averageCostPerToken: totalInputTokens + totalOutputTokens > 0 
                        ? Number((totalCost / (totalInputTokens + totalOutputTokens)).toFixed(8))
                        : 0
                },
                botConfigBreakdown
            };
        } catch (error) {
            console.error('Error getting daily summary:', error);
            throw new Error(`Failed to get daily summary: ${error.message}`);
        }
    }

    /**
     * Estimate monthly cost based on current usage patterns
     * @param {string} userId - User ID
     * @param {string} botConfigId - Bot configuration ID
     * @param {number} daysToAnalyze - Number of recent days to analyze (default: 7)
     * @returns {Promise<Object>} Cost projection
     */
    static async estimateMonthlyCost(userId, botConfigId, daysToAnalyze = 7) {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysToAnalyze);
            
            const usageSummary = await this.getUsageSummary(userId, startDate, endDate, botConfigId);
            
            if (usageSummary.summary.totalCost === 0) {
                return {
                    estimatedMonthlyCost: 0,
                    estimatedDailyCost: 0,
                    basedOnDays: 0,
                    confidence: 'low',
                    message: 'No usage data available for estimation'
                };
            }
            
            const averageDailyCost = usageSummary.summary.totalCost / daysToAnalyze;
            const estimatedMonthlyCost = averageDailyCost * 30;
            
            // Determine confidence level based on data availability
            let confidence = 'low';
            if (daysToAnalyze >= 7 && usageSummary.summary.totalRequests >= 10) {
                confidence = 'high';
            } else if (daysToAnalyze >= 3 && usageSummary.summary.totalRequests >= 5) {
                confidence = 'medium';
            }
            
            return {
                estimatedMonthlyCost: Number(estimatedMonthlyCost.toFixed(6)),
                estimatedDailyCost: Number(averageDailyCost.toFixed(6)),
                basedOnDays: daysToAnalyze,
                confidence,
                analysisData: {
                    totalCost: usageSummary.summary.totalCost,
                    totalRequests: usageSummary.summary.totalRequests,
                    averageCostPerRequest: usageSummary.summary.averageCostPerRequest
                }
            };
        } catch (error) {
            console.error('Error estimating monthly cost:', error);
            throw new Error(`Failed to estimate monthly cost: ${error.message}`);
        }
    }

    /**
     * Get all available OpenAI model pricing
     * @returns {Object} Complete pricing information
     */
    static getAllPricing() {
        return {
            models: OPENAI_PRICING,
            currency: 'USD',
            unit: 'per 1K tokens',
            lastUpdated: new Date().toISOString(),
            note: 'Prices are subject to change. Please verify with OpenAI for current rates.'
        };
    }

    /**
     * Get total usage statistics for a user across all time
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Total usage statistics
     */
    static async getTotalUsage(userId) {
        try {
            const totalUsage = await UsageTracking.getTotalUsage(userId);
            
            if (!totalUsage || totalUsage.length === 0) {
                return {
                    totalInputTokens: 0,
                    totalOutputTokens: 0,
                    totalTokens: 0,
                    totalCost: 0,
                    totalApiCalls: 0,
                    firstUsage: null,
                    lastUsage: null,
                    daysActive: 0
                };
            }
            
            const stats = totalUsage[0];
            const daysActive = stats.firstUsage && stats.lastUsage 
                ? Math.ceil((stats.lastUsage - stats.firstUsage) / (1000 * 60 * 60 * 24)) + 1
                : 0;
            
            return {
                totalInputTokens: stats.totalInputTokens,
                totalOutputTokens: stats.totalOutputTokens,
                totalTokens: stats.totalInputTokens + stats.totalOutputTokens,
                totalCost: Number(stats.totalCost.toFixed(6)),
                totalApiCalls: stats.totalApiCalls,
                firstUsage: stats.firstUsage,
                lastUsage: stats.lastUsage,
                daysActive
            };
        } catch (error) {
            console.error('Error getting total usage:', error);
            throw new Error(`Failed to get total usage: ${error.message}`);
        }
    }
}

export default UsageTrackingService;