import fetch from 'node-fetch';

/**
 * API Key validation utilities
 * Provides comprehensive validation for OpenAI API keys and other service keys
 */

class ApiKeyValidation {
    constructor() {
        this.OPENAI_BASE_URL = 'https://api.openai.com/v1';
        this.TIMEOUT = 10000; // 10 seconds
        this.RATE_LIMIT_DELAY = 1000; // 1 second between requests
        this.MAX_RETRIES = 3;
    }

    /**
     * Validate OpenAI API key format
     * @param {string} apiKey - API key to validate
     * @returns {Object} - Validation result
     */
    validateOpenAIKeyFormat(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            return {
                isValid: false,
                error: 'API key must be a non-empty string',
                errorCode: 'INVALID_TYPE'
            };
        }

        // Remove whitespace
        const cleanKey = apiKey.trim();

        // Check basic format: sk-...
        if (!cleanKey.startsWith('sk-')) {
            return {
                isValid: false,
                error: 'OpenAI API keys must start with "sk-"',
                errorCode: 'INVALID_PREFIX'
            };
        }

        // Check length (OpenAI keys are typically 51 characters)
        if (cleanKey.length !== 51) {
            return {
                isValid: false,
                error: `OpenAI API keys must be 51 characters long (got ${cleanKey.length})`,
                errorCode: 'INVALID_LENGTH'
            };
        }

        // Check character set (alphanumeric after sk-)
        const keyPart = cleanKey.substring(3);
        const validPattern = /^[a-zA-Z0-9]+$/;
        if (!validPattern.test(keyPart)) {
            return {
                isValid: false,
                error: 'OpenAI API keys can only contain alphanumeric characters after "sk-"',
                errorCode: 'INVALID_CHARACTERS'
            };
        }

        return {
            isValid: true,
            cleanKey: cleanKey
        };
    }

    /**
     * Test OpenAI API key connectivity with detailed error handling
     * @param {string} apiKey - API key to test
     * @param {Object} options - Test options
     * @returns {Promise<Object>} - Test result
     */
    async testOpenAIConnectivity(apiKey, options = {}) {
        const {
            endpoint = 'models',
            timeout = this.TIMEOUT,
            retries = this.MAX_RETRIES
        } = options;

        // First validate format
        const formatValidation = this.validateOpenAIKeyFormat(apiKey);
        if (!formatValidation.isValid) {
            return formatValidation;
        }

        let lastError = null;
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await this.makeOpenAIRequest(apiKey, endpoint, timeout);
                
                if (response.success) {
                    return {
                        isValid: true,
                        connectivity: 'success',
                        organizationId: response.organizationId,
                        rateLimit: response.rateLimit,
                        availableModels: response.data?.data?.length || 0,
                        responseTime: response.responseTime,
                        attempt: attempt
                    };
                } else {
                    lastError = response.error;
                    
                    // Don't retry for certain errors
                    if (response.errorCode === 'INVALID_API_KEY' || 
                        response.errorCode === 'INSUFFICIENT_QUOTA') {
                        break;
                    }
                }
            } catch (error) {
                lastError = {
                    message: error.message,
                    code: 'NETWORK_ERROR'
                };
            }

            // Wait before retry (except on last attempt)
            if (attempt < retries) {
                await this.delay(this.RATE_LIMIT_DELAY * attempt);
            }
        }

        return {
            isValid: false,
            connectivity: 'failed',
            error: lastError.message || 'Connection test failed',
            errorCode: lastError.code || 'UNKNOWN_ERROR',
            attempts: retries
        };
    }

    /**
     * Make a request to OpenAI API
     * @param {string} apiKey - API key
     * @param {string} endpoint - API endpoint
     * @param {number} timeout - Request timeout
     * @returns {Promise<Object>} - Request result
     */
    async makeOpenAIRequest(apiKey, endpoint, timeout) {
        const startTime = Date.now();
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(`${this.OPENAI_BASE_URL}/${endpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Discord-Bot-Manager/1.0'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                return {
                    success: true,
                    data: data,
                    organizationId: response.headers.get('openai-organization'),
                    rateLimit: {
                        requestsPerMinute: response.headers.get('x-ratelimit-limit-requests'),
                        tokensPerMinute: response.headers.get('x-ratelimit-limit-tokens'),
                        remainingRequests: response.headers.get('x-ratelimit-remaining-requests'),
                        remainingTokens: response.headers.get('x-ratelimit-remaining-tokens')
                    },
                    responseTime: responseTime
                };
            } else {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: {
                        message: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
                        code: this.mapHttpStatusToErrorCode(response.status, errorData.error?.code),
                        httpStatus: response.status,
                        details: errorData
                    }
                };
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    error: {
                        message: 'Request timeout',
                        code: 'TIMEOUT_ERROR'
                    }
                };
            }
            
            return {
                success: false,
                error: {
                    message: error.message || 'Network error',
                    code: 'NETWORK_ERROR'
                }
            };
        }
    }

    /**
     * Map HTTP status codes to error codes
     * @param {number} status - HTTP status code
     * @param {string} openaiCode - OpenAI error code
     * @returns {string} - Mapped error code
     */
    mapHttpStatusToErrorCode(status, openaiCode) {
        if (openaiCode) {
            return openaiCode.toUpperCase();
        }

        switch (status) {
            case 401:
                return 'INVALID_API_KEY';
            case 403:
                return 'INSUFFICIENT_PERMISSIONS';
            case 429:
                return 'RATE_LIMIT_EXCEEDED';
            case 500:
                return 'OPENAI_SERVER_ERROR';
            case 502:
            case 503:
            case 504:
                return 'OPENAI_SERVICE_UNAVAILABLE';
            default:
                return 'HTTP_ERROR';
        }
    }

    /**
     * Get detailed API key information
     * @param {string} apiKey - API key to analyze
     * @returns {Promise<Object>} - Detailed key information
     */
    async getKeyDetails(apiKey) {
        try {
            const connectivityTest = await this.testOpenAIConnectivity(apiKey);
            
            if (!connectivityTest.isValid) {
                return connectivityTest;
            }

            // Get additional details
            const [modelsResult, organizationResult] = await Promise.allSettled([
                this.getAvailableModels(apiKey),
                this.getOrganizationInfo(apiKey)
            ]);

            return {
                isValid: true,
                connectivity: connectivityTest,
                models: modelsResult.status === 'fulfilled' ? modelsResult.value : null,
                organization: organizationResult.status === 'fulfilled' ? organizationResult.value : null,
                capabilities: this.analyzeCapabilities(modelsResult.value?.models || [])
            };
        } catch (error) {
            return {
                isValid: false,
                error: error.message,
                errorCode: 'ANALYSIS_FAILED'
            };
        }
    }

    /**
     * Get available models for API key
     * @param {string} apiKey - API key
     * @returns {Promise<Object>} - Available models
     */
    async getAvailableModels(apiKey) {
        const response = await this.makeOpenAIRequest(apiKey, 'models');
        
        if (response.success) {
            const models = response.data.data || [];
            return {
                success: true,
                models: models.map(model => ({
                    id: model.id,
                    object: model.object,
                    created: model.created,
                    ownedBy: model.owned_by
                })),
                count: models.length
            };
        }
        
        return {
            success: false,
            error: response.error.message
        };
    }

    /**
     * Get organization information (if available)
     * @param {string} apiKey - API key
     * @returns {Promise<Object>} - Organization info
     */
    async getOrganizationInfo(apiKey) {
        // Note: OpenAI doesn't have a direct organization endpoint
        // This would need to be implemented based on available API endpoints
        return {
            success: false,
            error: 'Organization info not available through API'
        };
    }

    /**
     * Analyze API key capabilities based on available models
     * @param {Array} models - Available models
     * @returns {Object} - Capability analysis
     */
    analyzeCapabilities(models) {
        const capabilities = {
            textGeneration: false,
            codeGeneration: false,
            imageGeneration: false,
            embedding: false,
            moderation: false,
            fineTuning: false
        };

        models.forEach(model => {
            const modelId = model.id.toLowerCase();
            
            if (modelId.includes('gpt')) {
                capabilities.textGeneration = true;
                if (modelId.includes('code') || modelId.includes('davinci-codex')) {
                    capabilities.codeGeneration = true;
                }
            }
            
            if (modelId.includes('dall-e') || modelId.includes('image')) {
                capabilities.imageGeneration = true;
            }
            
            if (modelId.includes('embedding') || modelId.includes('ada')) {
                capabilities.embedding = true;
            }
            
            if (modelId.includes('moderation')) {
                capabilities.moderation = true;
            }
            
            if (model.ownedBy && model.ownedBy !== 'openai') {
                capabilities.fineTuning = true;
            }
        });

        return capabilities;
    }

    /**
     * Validate API key permissions for specific operations
     * @param {string} apiKey - API key
     * @param {Array} requiredCapabilities - Required capabilities
     * @returns {Promise<Object>} - Permission validation result
     */
    async validatePermissions(apiKey, requiredCapabilities = []) {
        try {
            const keyDetails = await this.getKeyDetails(apiKey);
            
            if (!keyDetails.isValid) {
                return keyDetails;
            }

            const capabilities = keyDetails.capabilities || {};
            const missingCapabilities = requiredCapabilities.filter(
                capability => !capabilities[capability]
            );

            return {
                isValid: missingCapabilities.length === 0,
                hasAllPermissions: missingCapabilities.length === 0,
                capabilities: capabilities,
                missingCapabilities: missingCapabilities,
                availableModels: keyDetails.models?.count || 0
            };
        } catch (error) {
            return {
                isValid: false,
                error: error.message,
                errorCode: 'PERMISSION_CHECK_FAILED'
            };
        }
    }

    /**
     * Utility function to delay execution
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} - Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Batch validate multiple API keys
     * @param {Array} apiKeys - Array of API keys to validate
     * @param {Object} options - Validation options
     * @returns {Promise<Array>} - Array of validation results
     */
    async batchValidate(apiKeys, options = {}) {
        const { concurrency = 3, delayBetweenBatches = 1000 } = options;
        const results = [];
        
        for (let i = 0; i < apiKeys.length; i += concurrency) {
            const batch = apiKeys.slice(i, i + concurrency);
            const batchPromises = batch.map(async (apiKey, index) => {
                const result = await this.testOpenAIConnectivity(apiKey);
                return {
                    index: i + index,
                    apiKey: apiKey.substring(0, 10) + '...', // Partial key for logging
                    result: result
                };
            });
            
            const batchResults = await Promise.allSettled(batchPromises);
            results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason }));
            
            // Delay between batches to respect rate limits
            if (i + concurrency < apiKeys.length) {
                await this.delay(delayBetweenBatches);
            }
        }
        
        return results;
    }
}

export default new ApiKeyValidation();