import mongoose from 'mongoose';

/**
 * Validation utilities for subscription dashboard models
 */

/**
 * Validate MongoDB ObjectId
 */
export const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate OpenAI API key format
 */
export const isValidOpenAIKey = (apiKey) => {
    if (!apiKey || typeof apiKey !== 'string') {
        return false;
    }
    
    // OpenAI API keys typically start with 'sk-' and are 51 characters long
    const openAIPattern = /^sk-[a-zA-Z0-9]{48}$/;
    return openAIPattern.test(apiKey);
};

/**
 * Validate subscription plan type
 */
export const isValidPlanType = (planType) => {
    const validPlans = ['monthly', 'yearly', '2-year'];
    return validPlans.includes(planType);
};

/**
 * Validate subscription status
 */
export const isValidSubscriptionStatus = (status) => {
    const validStatuses = ['active', 'cancelled', 'expired', 'pending'];
    return validStatuses.includes(status);
};

/**
 * Validate API key status
 */
export const isValidApiKeyStatus = (status) => {
    const validStatuses = ['valid', 'invalid', 'not_set', 'testing'];
    return validStatuses.includes(status);
};

/**
 * Validate bot configuration ID
 */
export const isValidBotConfigId = (botId) => {
    if (!botId || typeof botId !== 'string') {
        return false;
    }
    
    // Bot IDs should be kebab-case strings
    const botIdPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    return botIdPattern.test(botId);
};

/**
 * Validate date range
 */
export const isValidDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) {
        return false;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return false;
    }
    
    // Start date should be before end date
    return start < end;
};

/**
 * Validate price/cost values
 */
export const isValidPrice = (price) => {
    return typeof price === 'number' && price >= 0 && isFinite(price);
};

/**
 * Validate token count
 */
export const isValidTokenCount = (tokens) => {
    return Number.isInteger(tokens) && tokens >= 0;
};

/**
 * Validate payment method data
 */
export const isValidPaymentMethod = (paymentMethod) => {
    if (!paymentMethod || typeof paymentMethod !== 'object') {
        return false;
    }
    
    const { type, paymentId } = paymentMethod;
    
    // Check required fields
    if (!type || !paymentId) {
        return false;
    }
    
    // Validate payment type
    const validTypes = ['stripe', 'paypal'];
    if (!validTypes.includes(type)) {
        return false;
    }
    
    // Basic validation for payment ID (should be non-empty string)
    if (typeof paymentId !== 'string' || paymentId.trim().length === 0) {
        return false;
    }
    
    return true;
};

/**
 * Validate billing history entry
 */
export const isValidBillingEntry = (entry) => {
    if (!entry || typeof entry !== 'object') {
        return false;
    }
    
    const { date, amount, currency, status } = entry;
    
    // Check required fields
    if (!date || !amount || !currency || !status) {
        return false;
    }
    
    // Validate date
    const entryDate = new Date(date);
    if (isNaN(entryDate.getTime())) {
        return false;
    }
    
    // Validate amount
    if (!isValidPrice(amount)) {
        return false;
    }
    
    // Validate currency (basic check for 3-letter code)
    if (typeof currency !== 'string' || currency.length !== 3) {
        return false;
    }
    
    // Validate status
    const validStatuses = ['paid', 'failed', 'pending', 'refunded'];
    if (!validStatuses.includes(status)) {
        return false;
    }
    
    return true;
};

/**
 * Validate bot configuration object
 */
export const isValidBotConfig = (config) => {
    if (!config || typeof config !== 'object') {
        return false;
    }
    
    const { id, name, description, features, estimatedTokensPerMonth, pricing } = config;
    
    // Check required fields
    if (!id || !name || !description || !features || !estimatedTokensPerMonth || !pricing) {
        return false;
    }
    
    // Validate ID
    if (!isValidBotConfigId(id)) {
        return false;
    }
    
    // Validate name and description
    if (typeof name !== 'string' || name.trim().length === 0) {
        return false;
    }
    
    if (typeof description !== 'string' || description.trim().length === 0) {
        return false;
    }
    
    // Validate features array
    if (!Array.isArray(features) || features.length === 0) {
        return false;
    }
    
    for (const feature of features) {
        if (typeof feature !== 'string' || feature.trim().length === 0) {
            return false;
        }
    }
    
    // Validate estimated tokens
    if (!isValidTokenCount(estimatedTokensPerMonth)) {
        return false;
    }
    
    // Validate pricing
    if (!pricing.inputTokenCost || !pricing.outputTokenCost) {
        return false;
    }
    
    if (!isValidPrice(pricing.inputTokenCost) || !isValidPrice(pricing.outputTokenCost)) {
        return false;
    }
    
    return true;
};

/**
 * Validate usage tracking request data
 */
export const isValidUsageRequest = (requestData) => {
    if (!requestData || typeof requestData !== 'object') {
        return false;
    }
    
    const { inputTokens, outputTokens, cost } = requestData;
    
    // Check required fields
    if (inputTokens === undefined || outputTokens === undefined || cost === undefined) {
        return false;
    }
    
    // Validate token counts
    if (!isValidTokenCount(inputTokens) || !isValidTokenCount(outputTokens)) {
        return false;
    }
    
    // Validate cost
    if (!isValidPrice(cost)) {
        return false;
    }
    
    // Optional fields validation
    if (requestData.model && typeof requestData.model !== 'string') {
        return false;
    }
    
    if (requestData.requestType) {
        const validTypes = ['chat', 'completion', 'embedding', 'moderation'];
        if (!validTypes.includes(requestData.requestType)) {
            return false;
        }
    }
    
    return true;
};

/**
 * Sanitize user input to prevent injection attacks
 */
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') {
        return input;
    }
    
    // Remove potentially dangerous characters
    return input
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
};

/**
 * Validate and sanitize query parameters
 */
export const validateQueryParams = (params, schema) => {
    const validated = {};
    const errors = [];
    
    for (const [key, rules] of Object.entries(schema)) {
        const value = params[key];
        
        // Check if required field is missing
        if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push(`${key} is required`);
            continue;
        }
        
        // Skip validation if field is optional and not provided
        if (!rules.required && (value === undefined || value === null || value === '')) {
            continue;
        }
        
        // Type validation
        if (rules.type) {
            switch (rules.type) {
                case 'string':
                    if (typeof value !== 'string') {
                        errors.push(`${key} must be a string`);
                        continue;
                    }
                    validated[key] = sanitizeInput(value);
                    break;
                    
                case 'number':
                    const numValue = Number(value);
                    if (isNaN(numValue)) {
                        errors.push(`${key} must be a number`);
                        continue;
                    }
                    validated[key] = numValue;
                    break;
                    
                case 'boolean':
                    if (typeof value === 'string') {
                        validated[key] = value.toLowerCase() === 'true';
                    } else {
                        validated[key] = Boolean(value);
                    }
                    break;
                    
                case 'date':
                    const dateValue = new Date(value);
                    if (isNaN(dateValue.getTime())) {
                        errors.push(`${key} must be a valid date`);
                        continue;
                    }
                    validated[key] = dateValue;
                    break;
                    
                case 'objectId':
                    if (!isValidObjectId(value)) {
                        errors.push(`${key} must be a valid ObjectId`);
                        continue;
                    }
                    validated[key] = value;
                    break;
                    
                default:
                    validated[key] = value;
            }
        } else {
            validated[key] = value;
        }
        
        // Custom validation function
        if (rules.validate && typeof rules.validate === 'function') {
            const customResult = rules.validate(validated[key]);
            if (customResult !== true) {
                errors.push(customResult || `${key} is invalid`);
            }
        }
        
        // Enum validation
        if (rules.enum && !rules.enum.includes(validated[key])) {
            errors.push(`${key} must be one of: ${rules.enum.join(', ')}`);
        }
        
        // Min/max validation for numbers
        if (rules.min !== undefined && validated[key] < rules.min) {
            errors.push(`${key} must be at least ${rules.min}`);
        }
        
        if (rules.max !== undefined && validated[key] > rules.max) {
            errors.push(`${key} must be at most ${rules.max}`);
        }
    }
    
    return {
        isValid: errors.length === 0,
        data: validated,
        errors
    };
};

export default {
    isValidObjectId,
    isValidEmail,
    isValidOpenAIKey,
    isValidPlanType,
    isValidSubscriptionStatus,
    isValidApiKeyStatus,
    isValidBotConfigId,
    isValidDateRange,
    isValidPrice,
    isValidTokenCount,
    isValidPaymentMethod,
    isValidBillingEntry,
    isValidBotConfig,
    isValidUsageRequest,
    sanitizeInput,
    validateQueryParams
};