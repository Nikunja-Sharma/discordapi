import discordBotService from '../services/discordBot.js';

/**
 * Discord-specific error handling middleware
 * Handles Discord API errors, rate limiting, and bot connection issues
 */

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2
};

/**
 * Retry queue for rate-limited requests
 */
class RetryQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
    }

    /**
     * Add request to retry queue
     * @param {Function} requestFn - Function that makes the request
     * @param {number} delay - Delay before retry in milliseconds
     */
    async addToQueue(requestFn, delay = 0) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                requestFn,
                delay,
                resolve,
                reject,
                attempts: 0
            });

            if (!this.processing) {
                this.processQueue();
            }
        });
    }

    /**
     * Process the retry queue
     */
    async processQueue() {
        this.processing = true;

        while (this.queue.length > 0) {
            const item = this.queue.shift();
            
            try {
                // Wait for the specified delay
                if (item.delay > 0) {
                    console.log(`Retrying Discord request after ${item.delay}ms delay (attempt ${item.attempts + 1})`);
                    await new Promise(resolve => setTimeout(resolve, item.delay));
                }

                // Execute the request
                const result = await item.requestFn();
                item.resolve(result);

            } catch (error) {
                item.attempts++;

                // Check if we should retry
                if (this.shouldRetry(error, item.attempts)) {
                    const delay = this.calculateBackoffDelay(item.attempts);
                    item.delay = delay;
                    this.queue.unshift(item); // Put back at front of queue
                    console.log(`Discord request failed, queuing retry ${item.attempts}/${RATE_LIMIT_CONFIG.maxRetries} after ${delay}ms`);
                } else {
                    // Max retries exceeded or non-retryable error
                    console.error(`Discord request failed after ${item.attempts} attempts:`, error.message);
                    item.reject(error);
                }
            }
        }

        this.processing = false;
    }

    /**
     * Determine if an error should be retried
     * @param {Error} error - The error that occurred
     * @param {number} attempts - Number of attempts made
     */
    shouldRetry(error, attempts) {
        if (attempts >= RATE_LIMIT_CONFIG.maxRetries) {
            return false;
        }

        // Retry on rate limit errors
        if (error.code === 429 || (error.message && error.message.includes('rate limit'))) {
            return true;
        }

        // Retry on temporary network errors
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
            return true;
        }

        // Retry on Discord gateway errors
        if (error.code >= 500 && error.code < 600) {
            return true;
        }

        return false;
    }

    /**
     * Calculate exponential backoff delay
     * @param {number} attempts - Number of attempts made
     */
    calculateBackoffDelay(attempts) {
        const delay = RATE_LIMIT_CONFIG.baseDelay * Math.pow(RATE_LIMIT_CONFIG.backoffMultiplier, attempts - 1);
        return Math.min(delay, RATE_LIMIT_CONFIG.maxDelay);
    }
}

// Global retry queue instance
const retryQueue = new RetryQueue();

/**
 * Wrap Discord API calls with retry logic
 * @param {Function} requestFn - Function that makes the Discord API call
 */
export async function withRetry(requestFn) {
    try {
        return await requestFn();
    } catch (error) {
        // Check if this is a retryable error
        if (retryQueue.shouldRetry(error, 1)) {
            const delay = retryQueue.calculateBackoffDelay(1);
            return await retryQueue.addToQueue(requestFn, delay);
        }
        throw error;
    }
}

/**
 * Discord error classification and mapping
 */
export function classifyDiscordError(error) {
    // Discord API error codes
    const discordErrorCodes = {
        10003: { code: 'UNKNOWN_CHANNEL', message: 'Unknown channel', status: 404 },
        10004: { code: 'UNKNOWN_GUILD', message: 'Unknown guild', status: 404 },
        10008: { code: 'UNKNOWN_MESSAGE', message: 'Unknown message', status: 404 },
        10013: { code: 'UNKNOWN_USER', message: 'Unknown user', status: 404 },
        20001: { code: 'BOTS_CANNOT_USE_ENDPOINT', message: 'Bots cannot use this endpoint', status: 403 },
        20002: { code: 'ONLY_BOTS_CAN_USE_ENDPOINT', message: 'Only bots can use this endpoint', status: 403 },
        30001: { code: 'MAXIMUM_GUILDS', message: 'Maximum number of guilds reached', status: 400 },
        30003: { code: 'MAXIMUM_PINS', message: 'Maximum number of pins reached', status: 400 },
        30005: { code: 'MAXIMUM_RECIPIENTS', message: 'Maximum number of recipients reached', status: 400 },
        30010: { code: 'MAXIMUM_REACTIONS', message: 'Maximum number of reactions reached', status: 400 },
        30013: { code: 'MAXIMUM_CHANNELS', message: 'Maximum number of channels reached', status: 400 },
        30016: { code: 'MAXIMUM_ATTACHMENTS', message: 'Maximum number of attachments reached', status: 400 },
        30018: { code: 'MAXIMUM_INVITES', message: 'Maximum number of invites reached', status: 400 },
        40001: { code: 'UNAUTHORIZED', message: 'Unauthorized', status: 401 },
        40002: { code: 'VERIFY_ACCOUNT', message: 'You need to verify your account', status: 403 },
        40003: { code: 'OPENING_DM_TOO_FAST', message: 'You are opening direct messages too fast', status: 429 },
        50001: { code: 'MISSING_ACCESS', message: 'Missing access', status: 403 },
        50002: { code: 'INVALID_ACCOUNT_TYPE', message: 'Invalid account type', status: 403 },
        50003: { code: 'CANNOT_EXECUTE_ON_DM', message: 'Cannot execute action on a DM channel', status: 403 },
        50004: { code: 'GUILD_WIDGET_DISABLED', message: 'Guild widget disabled', status: 403 },
        50005: { code: 'CANNOT_EDIT_MESSAGE_BY_OTHER', message: 'Cannot edit a message authored by another user', status: 403 },
        50006: { code: 'CANNOT_SEND_EMPTY_MESSAGE', message: 'Cannot send an empty message', status: 400 },
        50007: { code: 'CANNOT_MESSAGE_USER', message: 'Cannot send messages to this user', status: 403 },
        50008: { code: 'CANNOT_SEND_MESSAGES_IN_VOICE_CHANNEL', message: 'Cannot send messages in a voice channel', status: 403 },
        50009: { code: 'CHANNEL_VERIFICATION_LEVEL_TOO_HIGH', message: 'Channel verification level is too high', status: 403 },
        50013: { code: 'MISSING_PERMISSIONS', message: 'You lack permissions to perform that action', status: 403 },
        50014: { code: 'INVALID_AUTHENTICATION_TOKEN', message: 'Invalid authentication token', status: 401 },
        50015: { code: 'NOTE_TOO_LONG', message: 'Note was too long', status: 400 },
        50016: { code: 'INVALID_BULK_DELETE_QUANTITY', message: 'Provided too few or too many messages to delete', status: 400 },
        50019: { code: 'MESSAGE_PIN_IN_WRONG_CHANNEL', message: 'A message can only be pinned to the channel it was sent in', status: 400 },
        50021: { code: 'INVITE_CODE_INVALID', message: 'Invite code was invalid', status: 400 },
        50025: { code: 'INVALID_OAUTH_STATE', message: 'Invalid OAuth2 state', status: 400 },
        50033: { code: 'INVALID_FORM_BODY', message: 'Invalid form body', status: 400 },
        50035: { code: 'INVALID_FORM_BODY_FIELD', message: 'Invalid form body field', status: 400 },
        50041: { code: 'CANNOT_REPLY_WITHOUT_READ_MESSAGE_HISTORY', message: 'Cannot reply without permission to read message history', status: 403 },
        50045: { code: 'REQUEST_ENTITY_TOO_LARGE', message: 'File uploaded is too large', status: 413 },
        50109: { code: 'INVALID_WEBHOOK_TOKEN', message: 'The provided webhook token is invalid', status: 401 }
    };

    // Check for Discord API error code
    if (error.code && discordErrorCodes[error.code]) {
        return discordErrorCodes[error.code];
    }

    // Check for HTTP status codes
    if (error.status) {
        switch (error.status) {
            case 400:
                return { code: 'BAD_REQUEST', message: 'Bad request', status: 400 };
            case 401:
                return { code: 'UNAUTHORIZED', message: 'Unauthorized', status: 401 };
            case 403:
                return { code: 'FORBIDDEN', message: 'Forbidden', status: 403 };
            case 404:
                return { code: 'NOT_FOUND', message: 'Not found', status: 404 };
            case 429:
                return { code: 'RATE_LIMITED', message: 'Rate limited', status: 429 };
            case 500:
                return { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error', status: 500 };
            case 502:
                return { code: 'BAD_GATEWAY', message: 'Bad gateway', status: 502 };
            case 503:
                return { code: 'SERVICE_UNAVAILABLE', message: 'Service unavailable', status: 503 };
            case 504:
                return { code: 'GATEWAY_TIMEOUT', message: 'Gateway timeout', status: 504 };
        }
    }

    // Check for common error patterns
    if (error.message) {
        const message = error.message.toLowerCase();
        
        if (message.includes('not found') || message.includes('unknown')) {
            return { code: 'RESOURCE_NOT_FOUND', message: 'Resource not found', status: 404 };
        }
        
        if (message.includes('permission') || message.includes('forbidden')) {
            return { code: 'INSUFFICIENT_PERMISSIONS', message: 'Insufficient permissions', status: 403 };
        }
        
        if (message.includes('rate limit') || message.includes('too many requests')) {
            return { code: 'RATE_LIMITED', message: 'Rate limited', status: 429 };
        }
        
        if (message.includes('bot is not ready') || message.includes('not connected')) {
            return { code: 'BOT_NOT_READY', message: 'Discord bot is not ready', status: 503 };
        }
        
        if (message.includes('invalid') || message.includes('malformed')) {
            return { code: 'INVALID_REQUEST', message: 'Invalid request', status: 400 };
        }
        
        if (message.includes('timeout') || message.includes('timed out')) {
            return { code: 'REQUEST_TIMEOUT', message: 'Request timeout', status: 408 };
        }
    }

    // Default classification
    return { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred', status: 500 };
}

/**
 * Enhanced error logging for Discord operations
 * @param {Error} error - The error to log
 * @param {Object} context - Additional context information
 */
export function logDiscordError(error, context = {}) {
    const timestamp = new Date().toISOString();
    const classified = classifyDiscordError(error);
    
    const logEntry = {
        timestamp,
        level: 'ERROR',
        service: 'discord',
        error: {
            code: classified.code,
            message: error.message || 'No error message provided',
            stack: error.stack || 'No stack trace available',
            originalCode: error.code,
            status: error.status,
            fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
        },
        context: {
            ...context,
            botReady: discordBotService.isConnected(),
            guildCount: discordBotService.getClient()?.guilds?.cache?.size || 0
        }
    };

    // Log to console with structured format
    console.error('Discord Error:', JSON.stringify(logEntry, null, 2));

    // In production, you might want to send this to a logging service
    // Example: await sendToLoggingService(logEntry);
}

/**
 * Main Discord error handling middleware
 * Processes Discord-related errors and returns appropriate responses
 */
export function discordErrorHandler(err, req, res, next) {
    // Skip if response already sent
    if (res.headersSent) {
        return next(err);
    }

    // Log the error with context
    logDiscordError(err, {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id
    });

    // Classify the error
    const classified = classifyDiscordError(err);

    // Handle specific error types
    let responseBody = {
        success: false,
        error: {
            code: classified.code,
            message: classified.message,
            timestamp: new Date().toISOString()
        }
    };

    // Add additional details for certain error types
    if (classified.code === 'RATE_LIMITED') {
        responseBody.error.retryAfter = err.retryAfter || 60; // seconds
        responseBody.error.details = 'Request was rate limited. Please try again later.';
    }

    if (classified.code === 'BOT_NOT_READY') {
        responseBody.error.details = 'Discord bot is currently unavailable. Please try again in a few moments.';
    }

    if (classified.code === 'INSUFFICIENT_PERMISSIONS') {
        responseBody.error.details = 'The bot lacks the necessary permissions to perform this action.';
    }

    if (classified.code === 'RESOURCE_NOT_FOUND') {
        responseBody.error.details = 'The requested Discord resource (channel, guild, etc.) was not found.';
    }

    // Send error response
    res.status(classified.status).json(responseBody);
}

/**
 * Bot connection status middleware
 * Checks if Discord bot is ready before processing requests
 */
export function requireBotConnection(req, res, next) {
    if (!discordBotService.isConnected()) {
        const error = new Error('Discord bot is not ready');
        error.code = 'BOT_NOT_READY';
        return next(error);
    }
    next();
}

/**
 * Rate limiting middleware for Discord endpoints
 * Implements per-user rate limiting to prevent abuse
 */
export function discordRateLimit(windowMs = 60000, maxRequests = 30) {
    const requests = new Map();

    return (req, res, next) => {
        const identifier = req.user?.id || req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean up old entries
        if (requests.has(identifier)) {
            const userRequests = requests.get(identifier);
            const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
            requests.set(identifier, validRequests);
        }

        // Get current request count
        const currentRequests = requests.get(identifier) || [];

        // Check if rate limit exceeded
        if (currentRequests.length >= maxRequests) {
            const error = new Error('Rate limit exceeded');
            error.code = 429;
            error.retryAfter = Math.ceil(windowMs / 1000);
            return next(error);
        }

        // Add current request
        currentRequests.push(now);
        requests.set(identifier, currentRequests);

        next();
    };
}

export default {
    discordErrorHandler,
    requireBotConnection,
    discordRateLimit,
    withRetry,
    classifyDiscordError,
    logDiscordError
};