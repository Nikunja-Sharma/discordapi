import { validationResult } from 'express-validator';
import UsageTrackingService from '../services/usageTrackingService.js';

/**
 * Record usage for a bot operation
 * @route POST /api/usage/record
 */
export const recordUsage = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    details: errors.array()
                }
            });
        }

        const userId = req.user.id;
        const {
            botConfigId,
            model,
            inputTokens,
            outputTokens,
            requestType,
            success,
            errorMessage,
            metadata
        } = req.body;

        const result = await UsageTrackingService.recordUsage(userId, botConfigId, {
            model,
            inputTokens,
            outputTokens,
            requestType,
            success,
            errorMessage,
            metadata
        });

        res.status(201).json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error recording usage:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'USAGE_RECORD_ERROR',
                message: 'Failed to record usage',
                details: error.message
            }
        });
    }
};

/**
 * Get current pricing for OpenAI models
 * @route GET /api/usage/pricing
 */
export const getCurrentPricing = async (req, res) => {
    try {
        const { model } = req.query;
        
        if (model) {
            const pricing = UsageTrackingService.getCurrentPricing(model);
            if (!pricing) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'MODEL_NOT_FOUND',
                        message: `Pricing not found for model: ${model}`
                    }
                });
            }
            
            res.json({
                success: true,
                data: pricing,
                timestamp: new Date().toISOString()
            });
        } else {
            const allPricing = UsageTrackingService.getAllPricing();
            res.json({
                success: true,
                data: allPricing,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error getting pricing:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'PRICING_ERROR',
                message: 'Failed to get pricing information',
                details: error.message
            }
        });
    }
};

/**
 * Get usage summary for a date range
 * @route GET /api/usage/summary
 */
export const getUsageSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate, botConfigId } = req.query;

        // Validate date parameters
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_DATES',
                    message: 'startDate and endDate are required'
                }
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_DATES',
                    message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)'
                }
            });
        }

        if (start > end) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_DATE_RANGE',
                    message: 'startDate must be before endDate'
                }
            });
        }

        const summary = await UsageTrackingService.getUsageSummary(userId, start, end, botConfigId);

        res.json({
            success: true,
            data: summary,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting usage summary:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'USAGE_SUMMARY_ERROR',
                message: 'Failed to get usage summary',
                details: error.message
            }
        });
    }
};

/**
 * Get daily usage summary
 * @route GET /api/usage/daily
 */
export const getDailySummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const { date } = req.query;

        let targetDate;
        if (date) {
            targetDate = new Date(date);
            if (isNaN(targetDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_DATE',
                        message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)'
                    }
                });
            }
        } else {
            targetDate = new Date(); // Today
        }

        const summary = await UsageTrackingService.getDailySummary(userId, targetDate);

        res.json({
            success: true,
            data: summary,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting daily summary:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'DAILY_SUMMARY_ERROR',
                message: 'Failed to get daily summary',
                details: error.message
            }
        });
    }
};

/**
 * Get monthly usage summary
 * @route GET /api/usage/monthly
 */
export const getMonthlySummary = async (req, res) => {
    try {
        const userId = req.user.id;
        let { year, month } = req.query;

        // Default to current month if not provided
        if (!year || !month) {
            const now = new Date();
            year = year || now.getFullYear();
            month = month || (now.getMonth() + 1);
        }

        // Validate year and month
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_YEAR',
                    message: 'Year must be between 2020 and 2030'
                }
            });
        }

        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_MONTH',
                    message: 'Month must be between 1 and 12'
                }
            });
        }

        const summary = await UsageTrackingService.getMonthlySummary(userId, yearNum, monthNum);

        res.json({
            success: true,
            data: summary,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting monthly summary:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'MONTHLY_SUMMARY_ERROR',
                message: 'Failed to get monthly summary',
                details: error.message
            }
        });
    }
};

/**
 * Get cost estimation for the current month
 * @route GET /api/usage/estimate
 */
export const getCostEstimate = async (req, res) => {
    try {
        const userId = req.user.id;
        const { botConfigId, daysToAnalyze } = req.query;

        if (!botConfigId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_BOT_CONFIG',
                    message: 'botConfigId is required'
                }
            });
        }

        const days = daysToAnalyze ? parseInt(daysToAnalyze) : 7;
        if (isNaN(days) || days < 1 || days > 30) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_DAYS',
                    message: 'daysToAnalyze must be between 1 and 30'
                }
            });
        }

        const estimate = await UsageTrackingService.estimateMonthlyCost(userId, botConfigId, days);

        res.json({
            success: true,
            data: estimate,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting cost estimate:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'COST_ESTIMATE_ERROR',
                message: 'Failed to get cost estimate',
                details: error.message
            }
        });
    }
};

/**
 * Get total usage statistics for the user
 * @route GET /api/usage/total
 */
export const getTotalUsage = async (req, res) => {
    try {
        const userId = req.user.id;
        const totalUsage = await UsageTrackingService.getTotalUsage(userId);

        res.json({
            success: true,
            data: totalUsage,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting total usage:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'TOTAL_USAGE_ERROR',
                message: 'Failed to get total usage',
                details: error.message
            }
        });
    }
};

/**
 * Calculate cost for given token usage
 * @route POST /api/usage/calculate-cost
 */
export const calculateCost = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    details: errors.array()
                }
            });
        }

        const { model, inputTokens, outputTokens } = req.body;
        const cost = UsageTrackingService.calculateCost(model, inputTokens, outputTokens);
        const pricing = UsageTrackingService.getCurrentPricing(model);

        res.json({
            success: true,
            data: {
                model,
                inputTokens,
                outputTokens,
                totalTokens: inputTokens + outputTokens,
                cost,
                pricing,
                calculation: {
                    inputCost: (inputTokens / 1000) * pricing.inputCostPer1K,
                    outputCost: (outputTokens / 1000) * pricing.outputCostPer1K
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error calculating cost:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'COST_CALCULATION_ERROR',
                message: 'Failed to calculate cost',
                details: error.message
            }
        });
    }
};

/**
 * Get real-time cost per token for current usage
 * @route GET /api/usage/realtime-cost
 */
export const getRealtimeCost = async (req, res) => {
    try {
        const userId = req.user.id;
        const { botConfigId, model } = req.query;

        if (!botConfigId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_BOT_CONFIG',
                    message: 'botConfigId is required'
                }
            });
        }

        // Get current pricing
        const pricing = UsageTrackingService.getCurrentPricing(model);
        
        // Get today's usage
        const today = new Date();
        const dailySummary = await UsageTrackingService.getDailySummary(userId, today);
        
        // Get this month's usage
        const monthlySummary = await UsageTrackingService.getMonthlySummary(userId, today.getFullYear(), today.getMonth() + 1);

        // Calculate real-time metrics
        const todayUsage = dailySummary.botConfigBreakdown[botConfigId] || {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            cost: 0,
            apiCalls: 0
        };

        const monthUsage = monthlySummary.botConfigBreakdown[botConfigId] || {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            cost: 0,
            apiCalls: 0
        };

        res.json({
            success: true,
            data: {
                pricing,
                realTimeMetrics: {
                    today: {
                        ...todayUsage,
                        costPerToken: todayUsage.totalTokens > 0 ? todayUsage.cost / todayUsage.totalTokens : 0,
                        averageCostPerCall: todayUsage.apiCalls > 0 ? todayUsage.cost / todayUsage.apiCalls : 0
                    },
                    thisMonth: {
                        ...monthUsage,
                        costPerToken: monthUsage.totalTokens > 0 ? monthUsage.cost / monthUsage.totalTokens : 0,
                        averageCostPerCall: monthUsage.apiCalls > 0 ? monthUsage.cost / monthUsage.apiCalls : 0
                    }
                },
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error getting realtime cost:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'REALTIME_COST_ERROR',
                message: 'Failed to get realtime cost',
                details: error.message
            }
        });
    }
};

/**
 * Get cost projections based on usage patterns
 * @route GET /api/usage/projections
 */
export const getCostProjections = async (req, res) => {
    try {
        const userId = req.user.id;
        const { botConfigId, projectionType = 'monthly' } = req.query;

        if (!botConfigId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_BOT_CONFIG',
                    message: 'botConfigId is required'
                }
            });
        }

        const projections = {};

        // Monthly projection
        if (projectionType === 'monthly' || projectionType === 'all') {
            const monthlyEstimate = await UsageTrackingService.estimateMonthlyCost(userId, botConfigId, 7);
            projections.monthly = monthlyEstimate;
        }

        // Weekly projection
        if (projectionType === 'weekly' || projectionType === 'all') {
            const weeklyEstimate = await UsageTrackingService.estimateMonthlyCost(userId, botConfigId, 3);
            projections.weekly = {
                estimatedWeeklyCost: Number((weeklyEstimate.estimatedDailyCost * 7).toFixed(6)),
                estimatedDailyCost: weeklyEstimate.estimatedDailyCost,
                basedOnDays: weeklyEstimate.basedOnDays,
                confidence: weeklyEstimate.confidence
            };
        }

        // Yearly projection (based on monthly)
        if (projectionType === 'yearly' || projectionType === 'all') {
            const monthlyEstimate = await UsageTrackingService.estimateMonthlyCost(userId, botConfigId, 14);
            projections.yearly = {
                estimatedYearlyCost: Number((monthlyEstimate.estimatedMonthlyCost * 12).toFixed(2)),
                estimatedMonthlyCost: monthlyEstimate.estimatedMonthlyCost,
                basedOnDays: monthlyEstimate.basedOnDays,
                confidence: monthlyEstimate.confidence
            };
        }

        res.json({
            success: true,
            data: {
                botConfigId,
                projections,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error getting cost projections:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'COST_PROJECTIONS_ERROR',
                message: 'Failed to get cost projections',
                details: error.message
            }
        });
    }
};

/**
 * Generate comprehensive usage report
 * @route GET /api/usage/report
 */
export const generateUsageReport = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            period = 'month',
            botConfigId,
            format = 'json',
            includeProjections = 'true',
            includeBreakdowns = 'true'
        } = req.query;

        const validPeriods = ['day', 'week', 'month', 'year'];
        if (!validPeriods.includes(period)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PERIOD',
                    message: `Period must be one of: ${validPeriods.join(', ')}`
                }
            });
        }

        const { default: UsageTracker } = await import('../utils/usageTracker.js');
        
        const report = await UsageTracker.generateUsageReport(userId, {
            period,
            botConfigId,
            includeProjections: includeProjections === 'true',
            includeBreakdowns: includeBreakdowns === 'true'
        });

        if (format === 'csv') {
            // Convert to CSV format
            const csv = convertReportToCSV(report);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="usage-report-${period}-${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csv);
        } else {
            res.json({
                success: true,
                data: report,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error generating usage report:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'USAGE_REPORT_ERROR',
                message: 'Failed to generate usage report',
                details: error.message
            }
        });
    }
};

/**
 * Get usage analytics and insights
 * @route GET /api/usage/analytics
 */
export const getUsageAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;
        const { botConfigId, days = 30 } = req.query;

        const daysNum = parseInt(days);
        if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_DAYS',
                    message: 'Days must be between 1 and 365'
                }
            });
        }

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysNum);

        const usageSummary = await UsageTrackingService.getUsageSummary(userId, startDate, endDate, botConfigId);
        
        // Calculate analytics
        const analytics = {
            period: {
                days: daysNum,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            },
            summary: usageSummary.summary,
            trends: {},
            insights: [],
            recommendations: []
        };

        // Calculate trends
        const dailyData = Object.entries(usageSummary.dailyBreakdown).map(([date, data]) => ({
            date,
            ...data
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        if (dailyData.length > 1) {
            const recentDays = dailyData.slice(-7);
            const previousDays = dailyData.slice(-14, -7);

            const recentAvgCost = recentDays.reduce((sum, day) => sum + day.cost, 0) / recentDays.length;
            const previousAvgCost = previousDays.length > 0 
                ? previousDays.reduce((sum, day) => sum + day.cost, 0) / previousDays.length 
                : 0;

            analytics.trends = {
                costTrend: previousAvgCost > 0 
                    ? ((recentAvgCost - previousAvgCost) / previousAvgCost * 100).toFixed(2)
                    : 0,
                averageDailyCost: recentAvgCost.toFixed(6),
                peakUsageDay: dailyData.reduce((max, day) => day.cost > max.cost ? day : max, dailyData[0]),
                lowestUsageDay: dailyData.reduce((min, day) => day.cost < min.cost ? day : min, dailyData[0])
            };
        }

        // Generate insights
        if (usageSummary.summary.totalCost > 0) {
            const avgCostPerToken = usageSummary.summary.averageCostPerToken;
            const avgCostPerRequest = usageSummary.summary.averageCostPerRequest;

            analytics.insights.push({
                type: 'cost_efficiency',
                message: `Average cost per token: $${avgCostPerToken.toFixed(8)}`,
                value: avgCostPerToken
            });

            analytics.insights.push({
                type: 'request_efficiency',
                message: `Average cost per request: $${avgCostPerRequest.toFixed(6)}`,
                value: avgCostPerRequest
            });

            // Model usage insights
            const modelBreakdown = usageSummary.modelBreakdown;
            const mostUsedModel = Object.entries(modelBreakdown).reduce((max, [model, data]) => 
                data.requests > (max.data?.requests || 0) ? { model, data } : max, {});

            if (mostUsedModel.model) {
                analytics.insights.push({
                    type: 'model_usage',
                    message: `Most used model: ${mostUsedModel.model} (${mostUsedModel.data.requests} requests)`,
                    model: mostUsedModel.model,
                    requests: mostUsedModel.data.requests
                });
            }
        }

        // Generate recommendations
        if (analytics.trends.costTrend > 20) {
            analytics.recommendations.push({
                type: 'cost_increase',
                priority: 'high',
                message: 'Your usage costs have increased significantly. Consider reviewing your bot configuration or setting usage limits.'
            });
        }

        if (usageSummary.summary.totalCost > 10) {
            analytics.recommendations.push({
                type: 'high_usage',
                priority: 'medium',
                message: 'You have high API usage. Consider optimizing your prompts or using a more cost-effective model.'
            });
        }

        res.json({
            success: true,
            data: analytics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting usage analytics:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'USAGE_ANALYTICS_ERROR',
                message: 'Failed to get usage analytics',
                details: error.message
            }
        });
    }
};

/**
 * Helper function to convert report to CSV format
 */
function convertReportToCSV(report) {
    const lines = [];
    
    // Header
    lines.push('Date,Input Tokens,Output Tokens,Total Tokens,Cost,API Calls');
    
    // Daily breakdown data
    if (report.breakdowns && report.breakdowns.daily) {
        Object.entries(report.breakdowns.daily).forEach(([date, data]) => {
            lines.push(`${date},${data.inputTokens},${data.outputTokens},${data.inputTokens + data.outputTokens},${data.cost},${data.apiCalls}`);
        });
    }
    
    return lines.join('\n');
}

/**
 * Get usage history with pagination
 * @route GET /api/usage/history
 */
export const getUsageHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            page = 1, 
            limit = 10, 
            botConfigId, 
            startDate, 
            endDate,
            sortBy = 'date',
            sortOrder = 'desc'
        } = req.query;

        // Validate pagination parameters
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PAGE',
                    message: 'Page must be a positive integer'
                }
            });
        }

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_LIMIT',
                    message: 'Limit must be between 1 and 100'
                }
            });
        }

        // Build query
        const query = { userId };
        if (botConfigId) {
            query.botConfigId = botConfigId;
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                const start = new Date(startDate);
                if (isNaN(start.getTime())) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'INVALID_START_DATE',
                            message: 'Invalid startDate format'
                        }
                    });
                }
                query.date.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                if (isNaN(end.getTime())) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'INVALID_END_DATE',
                            message: 'Invalid endDate format'
                        }
                    });
                }
                query.date.$lte = end;
            }
        }

        // Build sort
        const sort = {};
        const validSortFields = ['date', 'totalCost', 'inputTokens', 'outputTokens', 'apiCalls'];
        if (validSortFields.includes(sortBy)) {
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        } else {
            sort.date = -1; // Default sort
        }

        // Execute query with pagination
        const { UsageTracking } = await import('../models/index.js');
        const skip = (pageNum - 1) * limitNum;
        
        const [records, totalCount] = await Promise.all([
            UsageTracking.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            UsageTracking.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            success: true,
            data: {
                records,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalRecords: totalCount,
                    recordsPerPage: limitNum,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting usage history:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'USAGE_HISTORY_ERROR',
                message: 'Failed to get usage history',
                details: error.message
            }
        });
    }
};