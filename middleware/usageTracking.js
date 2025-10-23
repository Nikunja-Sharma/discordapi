import UsageTracker from '../utils/usageTracker.js';

/**
 * Middleware to automatically track OpenAI API usage
 * This middleware should be used with routes that make OpenAI API calls
 */
export const trackUsage = (options = {}) => {
    return async (req, res, next) => {
        try {
            const {
                getBotConfigId = (req) => req.body.botConfigId || req.query.botConfigId,
                getModel = (req) => req.body.model || req.query.model || 'gpt-4o-mini',
                extractMetadata = (req) => ({
                    userAgent: req.get('User-Agent'),
                    ipAddress: req.ip,
                    endpoint: req.originalUrl
                })
            } = options;

            // Store original res.json to intercept response
            const originalJson = res.json;
            
            res.json = function(data) {
                // Check if this is a successful OpenAI API response
                if (data && data.success && data.data && data.data.usage) {
                    const userId = req.user?.id;
                    const botConfigId = getBotConfigId(req);
                    
                    if (userId && botConfigId) {
                        // Track usage asynchronously (don't block response)
                        setImmediate(async () => {
                            try {
                                await UsageTracker.trackBotUsage(
                                    userId,
                                    botConfigId,
                                    data.data,
                                    extractMetadata(req)
                                );
                            } catch (error) {
                                console.error('Error in usage tracking middleware:', error);
                            }
                        });
                    }
                }
                
                // Call original json method
                return originalJson.call(this, data);
            };

            next();
        } catch (error) {
            console.error('Error in usage tracking middleware setup:', error);
            next(); // Continue without tracking
        }
    };
};

/**
 * Middleware to check usage limits before processing requests
 */
export const checkUsageLimits = (limits = {}) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            const botConfigId = req.body.botConfigId || req.query.botConfigId;

            if (!userId || !botConfigId) {
                return next(); // Skip if no user or bot config
            }

            const limitCheck = await UsageTracker.checkUsageLimits(userId, botConfigId, limits);

            if (!limitCheck.withinLimits) {
                const exceededLimits = limitCheck.exceeded.map(limit => 
                    `${limit.type}: ${limit.current}/${limit.limit} (${limit.percentage.toFixed(1)}%)`
                ).join(', ');

                return res.status(429).json({
                    success: false,
                    error: {
                        code: 'USAGE_LIMIT_EXCEEDED',
                        message: 'Usage limits exceeded',
                        details: {
                            exceeded: limitCheck.exceeded,
                            warnings: limitCheck.warnings
                        }
                    }
                });
            }

            // Add warnings to response headers if any
            if (limitCheck.warnings.length > 0) {
                res.set('X-Usage-Warnings', JSON.stringify(limitCheck.warnings));
            }

            next();
        } catch (error) {
            console.error('Error checking usage limits:', error);
            next(); // Continue without limit checking
        }
    };
};

/**
 * Middleware to add usage statistics to response headers
 */
export const addUsageHeaders = () => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            const botConfigId = req.body.botConfigId || req.query.botConfigId;

            if (userId && botConfigId) {
                // Store original res.json to add headers before sending
                const originalJson = res.json;
                
                res.json = async function(data) {
                    try {
                        // Get current usage stats
                        const stats = await UsageTracker.getBotUsageStats(userId, botConfigId, 1);
                        
                        // Add usage headers
                        res.set({
                            'X-Usage-Today-Cost': stats.usage.totalCost.toString(),
                            'X-Usage-Today-Tokens': stats.usage.totalTokens.toString(),
                            'X-Usage-Today-Calls': stats.usage.totalApiCalls.toString(),
                            'X-Usage-Estimated-Monthly': stats.estimate.estimatedMonthlyCost.toString()
                        });
                    } catch (error) {
                        console.error('Error adding usage headers:', error);
                    }
                    
                    // Call original json method
                    return originalJson.call(this, data);
                };
            }

            next();
        } catch (error) {
            console.error('Error in usage headers middleware:', error);
            next(); // Continue without headers
        }
    };
};

/**
 * Middleware to log usage events for debugging
 */
export const logUsage = (options = {}) => {
    const { 
        logLevel = 'info',
        includeDetails = false 
    } = options;

    return (req, res, next) => {
        if (process.env.NODE_ENV === 'development' || process.env.LOG_USAGE === 'true') {
            const userId = req.user?.id;
            const botConfigId = req.body.botConfigId || req.query.botConfigId;
            
            if (userId && botConfigId) {
                const logData = {
                    timestamp: new Date().toISOString(),
                    userId,
                    botConfigId,
                    endpoint: req.originalUrl,
                    method: req.method
                };

                if (includeDetails) {
                    logData.body = req.body;
                    logData.query = req.query;
                }

                console.log(`[USAGE] ${JSON.stringify(logData)}`);
            }
        }

        next();
    };
};

/**
 * Error handling middleware for usage tracking
 */
export const handleUsageTrackingErrors = (error, req, res, next) => {
    if (error.code === 'USAGE_LIMIT_EXCEEDED') {
        return res.status(429).json({
            success: false,
            error: {
                code: 'USAGE_LIMIT_EXCEEDED',
                message: 'API usage limits exceeded',
                details: error.details,
                retryAfter: error.retryAfter || 3600 // 1 hour default
            }
        });
    }

    if (error.code === 'USAGE_TRACKING_ERROR') {
        console.error('Usage tracking error:', error);
        // Don't block the request, just log the error
        return next();
    }

    next(error);
};

export default {
    trackUsage,
    checkUsageLimits,
    addUsageHeaders,
    logUsage,
    handleUsageTrackingErrors
};