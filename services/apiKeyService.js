import crypto from 'crypto';
import fetch from 'node-fetch';
import ApiKey from '../models/ApiKey.js';

/**
 * API Key Management Service
 * Handles secure storage, encryption, validation, and OpenAI connectivity testing
 */

class ApiKeyService {
    constructor() {
        this.OPENAI_BASE_URL = 'https://api.openai.com/v1';
        this.VALIDATION_TIMEOUT = 10000; // 10 seconds
    }

    /**
     * Validate OpenAI API key format
     * @param {string} apiKey - The API key to validate
     * @returns {boolean} - True if format is valid
     */
    validateKeyFormat(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            return false;
        }

        // OpenAI API keys start with 'sk-' and are typically 51 characters long
        const openAIPattern = /^sk-[a-zA-Z0-9]{48}$/;
        return openAIPattern.test(apiKey);
    }

    /**
     * Test OpenAI API key connectivity
     * @param {string} apiKey - The API key to test
     * @returns {Promise<Object>} - Test result with status and details
     */
    async testOpenAIConnectivity(apiKey) {
        try {
            // First validate format
            if (!this.validateKeyFormat(apiKey)) {
                return {
                    isValid: false,
                    error: 'Invalid API key format',
                    errorCode: 'INVALID_FORMAT'
                };
            }

            // Test with a simple models endpoint call
            const response = await fetch(`${this.OPENAI_BASE_URL}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: this.VALIDATION_TIMEOUT
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    isValid: true,
                    organizationId: response.headers.get('openai-organization') || null,
                    availableModels: data.data ? data.data.length : 0,
                    rateLimit: {
                        requestsPerMinute: response.headers.get('x-ratelimit-limit-requests'),
                        tokensPerMinute: response.headers.get('x-ratelimit-limit-tokens')
                    }
                };
            } else {
                const errorData = await response.json().catch(() => ({}));
                return {
                    isValid: false,
                    error: errorData.error?.message || 'API key validation failed',
                    errorCode: errorData.error?.code || 'VALIDATION_FAILED',
                    httpStatus: response.status
                };
            }
        } catch (error) {
            return {
                isValid: false,
                error: error.message || 'Network error during validation',
                errorCode: 'NETWORK_ERROR'
            };
        }
    }

    /**
     * Securely store API key for a user
     * @param {string} userId - User ID
     * @param {string} apiKey - The API key to store
     * @returns {Promise<Object>} - Storage result
     */
    async storeApiKey(userId, apiKey) {
        try {
            // Validate format first
            if (!this.validateKeyFormat(apiKey)) {
                throw new Error('Invalid API key format');
            }

            // Test connectivity
            const connectivityTest = await this.testOpenAIConnectivity(apiKey);
            
            // Encrypt the API key
            const encryptedKey = ApiKey.encryptApiKey(apiKey);
            const keyHash = ApiKey.createKeyHash(apiKey);

            // Find existing record or create new one
            let apiKeyRecord = await ApiKey.findByUserId(userId);
            
            if (apiKeyRecord) {
                // Update existing record
                apiKeyRecord.encryptedKey = encryptedKey;
                apiKeyRecord.keyHash = keyHash;
                apiKeyRecord.status = connectivityTest.isValid ? 'valid' : 'invalid';
                apiKeyRecord.lastValidated = new Date();
                apiKeyRecord.validationAttempts = (apiKeyRecord.validationAttempts || 0) + 1;
                
                if (connectivityTest.isValid) {
                    apiKeyRecord.organizationId = connectivityTest.organizationId;
                    apiKeyRecord.keyMetadata = {
                        keyType: 'user',
                        permissions: ['read', 'write'], // Default permissions
                        rateLimit: connectivityTest.rateLimit
                    };
                    apiKeyRecord.lastValidationError = undefined;
                } else {
                    apiKeyRecord.lastValidationError = connectivityTest.error;
                }
            } else {
                // Create new record
                apiKeyRecord = new ApiKey({
                    userId,
                    encryptedKey,
                    keyHash,
                    status: connectivityTest.isValid ? 'valid' : 'invalid',
                    lastValidated: new Date(),
                    validationAttempts: 1,
                    organizationId: connectivityTest.organizationId,
                    keyMetadata: connectivityTest.isValid ? {
                        keyType: 'user',
                        permissions: ['read', 'write'],
                        rateLimit: connectivityTest.rateLimit
                    } : undefined,
                    lastValidationError: connectivityTest.isValid ? undefined : connectivityTest.error
                });
            }

            await apiKeyRecord.save();

            return {
                success: true,
                status: apiKeyRecord.status,
                isValid: connectivityTest.isValid,
                organizationId: connectivityTest.organizationId,
                availableModels: connectivityTest.availableModels,
                error: connectivityTest.isValid ? null : connectivityTest.error
            };
        } catch (error) {
            throw new Error(`Failed to store API key: ${error.message}`);
        }
    }

    /**
     * Retrieve and decrypt API key for a user
     * @param {string} userId - User ID
     * @returns {Promise<string|null>} - Decrypted API key or null if not found
     */
    async retrieveApiKey(userId) {
        try {
            const apiKeyRecord = await ApiKey.findByUserId(userId);
            
            if (!apiKeyRecord || !apiKeyRecord.encryptedKey) {
                return null;
            }

            return ApiKey.decryptApiKey(apiKeyRecord.encryptedKey);
        } catch (error) {
            throw new Error(`Failed to retrieve API key: ${error.message}`);
        }
    }

    /**
     * Get API key status without exposing the key
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - API key status information
     */
    async getApiKeyStatus(userId) {
        try {
            const apiKeyRecord = await ApiKey.findByUserId(userId);
            
            if (!apiKeyRecord) {
                return {
                    hasKey: false,
                    status: 'not_set',
                    lastValidated: null,
                    validationAttempts: 0,
                    needsRevalidation: false
                };
            }

            return {
                hasKey: !!apiKeyRecord.encryptedKey,
                status: apiKeyRecord.status,
                lastValidated: apiKeyRecord.lastValidated,
                validationAttempts: apiKeyRecord.validationAttempts,
                needsRevalidation: apiKeyRecord.needsRevalidation(),
                organizationId: apiKeyRecord.organizationId,
                keyMetadata: apiKeyRecord.keyMetadata,
                lastValidationError: apiKeyRecord.status === 'invalid' ? apiKeyRecord.lastValidationError : null
            };
        } catch (error) {
            throw new Error(`Failed to get API key status: ${error.message}`);
        }
    }

    /**
     * Update existing API key
     * @param {string} userId - User ID
     * @param {string} newApiKey - New API key
     * @returns {Promise<Object>} - Update result
     */
    async updateApiKey(userId, newApiKey) {
        return this.storeApiKey(userId, newApiKey);
    }

    /**
     * Remove API key for a user
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} - True if removed successfully
     */
    async removeApiKey(userId) {
        try {
            const result = await ApiKey.deleteOne({ userId });
            return result.deletedCount > 0;
        } catch (error) {
            throw new Error(`Failed to remove API key: ${error.message}`);
        }
    }

    /**
     * Validate existing API key (re-test connectivity)
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - Validation result
     */
    async validateExistingKey(userId) {
        try {
            const apiKey = await this.retrieveApiKey(userId);
            
            if (!apiKey) {
                throw new Error('No API key found for user');
            }

            const connectivityTest = await this.testOpenAIConnectivity(apiKey);
            
            // Update the record with new validation results
            const apiKeyRecord = await ApiKey.findByUserId(userId);
            if (apiKeyRecord) {
                await apiKeyRecord.updateValidationStatus(
                    connectivityTest.isValid,
                    connectivityTest.isValid ? null : connectivityTest.error
                );
                
                if (connectivityTest.isValid) {
                    apiKeyRecord.organizationId = connectivityTest.organizationId;
                    apiKeyRecord.keyMetadata = {
                        ...apiKeyRecord.keyMetadata,
                        rateLimit: connectivityTest.rateLimit
                    };
                    await apiKeyRecord.save();
                }
            }

            return {
                isValid: connectivityTest.isValid,
                status: connectivityTest.isValid ? 'valid' : 'invalid',
                organizationId: connectivityTest.organizationId,
                availableModels: connectivityTest.availableModels,
                error: connectivityTest.isValid ? null : connectivityTest.error
            };
        } catch (error) {
            throw new Error(`Failed to validate existing key: ${error.message}`);
        }
    }

    /**
     * Get OpenAI usage statistics for an API key
     * @param {string} userId - User ID
     * @param {string} startDate - Start date for usage query (YYYY-MM-DD)
     * @param {string} endDate - End date for usage query (YYYY-MM-DD)
     * @returns {Promise<Object>} - Usage statistics
     */
    async getUsageStatistics(userId, startDate = null, endDate = null) {
        try {
            const apiKey = await this.retrieveApiKey(userId);
            
            if (!apiKey) {
                throw new Error('No API key found for user');
            }

            // Build query parameters
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);

            const response = await fetch(`${this.OPENAI_BASE_URL}/usage?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: this.VALIDATION_TIMEOUT
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    success: true,
                    usage: data
                };
            } else {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: errorData.error?.message || 'Failed to fetch usage statistics'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Network error while fetching usage statistics'
            };
        }
    }

    /**
     * Rotate encryption key (for security maintenance)
     * @param {string} newEncryptionKey - New encryption key
     * @returns {Promise<Object>} - Rotation result
     */
    async rotateEncryptionKey(newEncryptionKey) {
        try {
            // This would require decrypting all keys with old key and re-encrypting with new key
            // Implementation would depend on specific security requirements
            throw new Error('Key rotation not implemented - requires careful security planning');
        } catch (error) {
            throw new Error(`Key rotation failed: ${error.message}`);
        }
    }

    /**
     * Cleanup old or invalid API keys
     * @param {number} daysOld - Remove invalid keys older than this many days
     * @returns {Promise<Object>} - Cleanup result
     */
    async cleanupOldKeys(daysOld = 30) {
        try {
            const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
            
            const result = await ApiKey.deleteMany({
                status: 'invalid',
                updatedAt: { $lt: cutoffDate }
            });

            return {
                success: true,
                deletedCount: result.deletedCount
            };
        } catch (error) {
            throw new Error(`Cleanup failed: ${error.message}`);
        }
    }
}

export default new ApiKeyService();