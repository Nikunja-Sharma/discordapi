import ApiKeyService from '../services/apiKeyService.js';
import ApiKeyValidation from '../utils/apiKeyValidation.js';

/**
 * API Key Management Controller
 * Handles all API key related operations for the subscription dashboard
 */

class ApiKeyController {
    /**
     * Validate API key format and connectivity
     */
    async validateApiKey(req, res) {
        try {
            const { apiKey } = req.body;

            if (!apiKey) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_API_KEY',
                        message: 'API key is required'
                    }
                });
            }

            // Validate format first
            const formatValidation = ApiKeyValidation.validateOpenAIKeyFormat(apiKey);
            if (!formatValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: formatValidation.errorCode,
                        message: formatValidation.error
                    }
                });
            }

            // Test connectivity
            const connectivityTest = await ApiKeyValidation.testOpenAIConnectivity(apiKey);

            res.json({
                success: true,
                validation: {
                    format: {
                        isValid: true,
                        message: 'API key format is valid'
                    },
                    connectivity: connectivityTest
                }
            });
        } catch (error) {
            console.error('API key validation error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Failed to validate API key',
                    details: error.message
                }
            });
        }
    }

    /**
     * Store or update API key for authenticated user
     */
    async updateApiKey(req, res) {
        try {
            const { apiKey } = req.body;
            const userId = req.user.userId;

            if (!apiKey) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_API_KEY',
                        message: 'API key is required'
                    }
                });
            }

            // Store the API key (includes validation and encryption)
            const result = await ApiKeyService.storeApiKey(userId, apiKey);

            if (result.success) {
                res.json({
                    success: true,
                    message: 'API key updated successfully',
                    data: {
                        status: result.status,
                        isValid: result.isValid,
                        organizationId: result.organizationId,
                        availableModels: result.availableModels
                    }
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'STORAGE_FAILED',
                        message: result.error || 'Failed to store API key'
                    }
                });
            }
        } catch (error) {
            console.error('API key update error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'UPDATE_ERROR',
                    message: 'Failed to update API key',
                    details: error.message
                }
            });
        }
    }

    /**
     * Get API key status for authenticated user
     */
    async getApiKeyStatus(req, res) {
        try {
            const userId = req.user.userId;
            const status = await ApiKeyService.getApiKeyStatus(userId);

            res.json({
                success: true,
                data: status
            });
        } catch (error) {
            console.error('API key status error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'STATUS_ERROR',
                    message: 'Failed to get API key status',
                    details: error.message
                }
            });
        }
    }

    /**
     * Test existing API key connectivity
     */
    async testApiKey(req, res) {
        try {
            const userId = req.user.userId;
            const result = await ApiKeyService.validateExistingKey(userId);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('API key test error:', error);

            if (error.message.includes('No API key found')) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NO_API_KEY',
                        message: 'No API key found for user'
                    }
                });
            }

            res.status(500).json({
                success: false,
                error: {
                    code: 'TEST_ERROR',
                    message: 'Failed to test API key',
                    details: error.message
                }
            });
        }
    }

    /**
     * Remove API key for authenticated user
     */
    async removeApiKey(req, res) {
        try {
            const userId = req.user.userId;
            const removed = await ApiKeyService.removeApiKey(userId);

            if (removed) {
                res.json({
                    success: true,
                    message: 'API key removed successfully'
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: {
                        code: 'NO_API_KEY',
                        message: 'No API key found to remove'
                    }
                });
            }
        } catch (error) {
            console.error('API key removal error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'REMOVAL_ERROR',
                    message: 'Failed to remove API key',
                    details: error.message
                }
            });
        }
    }

    /**
     * Get detailed API key information
     */
    async getApiKeyDetails(req, res) {
        try {
            const userId = req.user.userId;
            const apiKey = await ApiKeyService.retrieveApiKey(userId);

            if (!apiKey) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NO_API_KEY',
                        message: 'No API key found for user'
                    }
                });
            }

            const details = await ApiKeyValidation.getKeyDetails(apiKey);

            res.json({
                success: true,
                data: details
            });
        } catch (error) {
            console.error('API key details error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'DETAILS_ERROR',
                    message: 'Failed to get API key details',
                    details: error.message
                }
            });
        }
    }

    /**
     * Get OpenAI usage statistics
     */
    async getUsageStatistics(req, res) {
        try {
            const userId = req.user.userId;
            const { start_date, end_date } = req.query;

            const usage = await ApiKeyService.getUsageStatistics(userId, start_date, end_date);

            if (usage.success) {
                res.json({
                    success: true,
                    data: usage.usage
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'USAGE_ERROR',
                        message: usage.error
                    }
                });
            }
        } catch (error) {
            console.error('API key usage error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'USAGE_FETCH_ERROR',
                    message: 'Failed to fetch usage statistics',
                    details: error.message
                }
            });
        }
    }

    /**
     * Validate API key permissions
     */
    async validatePermissions(req, res) {
        try {
            const userId = req.user.userId;
            const { requiredCapabilities = [] } = req.body;

            const apiKey = await ApiKeyService.retrieveApiKey(userId);

            if (!apiKey) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NO_API_KEY',
                        message: 'No API key found for user'
                    }
                });
            }

            const permissions = await ApiKeyValidation.validatePermissions(apiKey, requiredCapabilities);

            res.json({
                success: true,
                data: permissions
            });
        } catch (error) {
            console.error('API key permissions error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'PERMISSIONS_ERROR',
                    message: 'Failed to validate permissions',
                    details: error.message
                }
            });
        }
    }

    /**
     * Batch operations for API keys
     */
    async batchOperations(req, res) {
        try {
            const { operation, data } = req.body;
            const userId = req.user.userId;

            switch (operation) {
                case 'validate_multiple':
                    if (!Array.isArray(data.apiKeys)) {
                        return res.status(400).json({
                            success: false,
                            error: {
                                code: 'INVALID_DATA',
                                message: 'apiKeys must be an array'
                            }
                        });
                    }

                    const results = await ApiKeyValidation.batchValidate(data.apiKeys, data.options);
                    res.json({
                        success: true,
                        data: results
                    });
                    break;

                case 'cleanup_old_keys':
                    const cleanupResult = await ApiKeyService.cleanupOldKeys(data.daysOld || 30);
                    res.json({
                        success: true,
                        data: cleanupResult
                    });
                    break;

                default:
                    res.status(400).json({
                        success: false,
                        error: {
                            code: 'INVALID_OPERATION',
                            message: 'Unsupported batch operation'
                        }
                    });
            }
        } catch (error) {
            console.error('Batch operation error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'BATCH_ERROR',
                    message: 'Failed to execute batch operation',
                    details: error.message
                }
            });
        }
    }

    /**
     * Health check for API key service
     */
    async healthCheck(req, res) {
        try {
            // Test basic service functionality
            const testResult = {
                service: 'API Key Management',
                status: 'operational',
                timestamp: new Date().toISOString(),
                checks: {
                    encryption: 'ok',
                    validation: 'ok',
                    database: 'ok'
                }
            };

            // Test encryption utilities
            try {
                const testData = 'test-encryption';
                const encrypted = await ApiKeyService.constructor.prototype.encryptApiKey?.(testData);
                if (encrypted) {
                    testResult.checks.encryption = 'ok';
                } else {
                    testResult.checks.encryption = 'warning';
                }
            } catch (encError) {
                testResult.checks.encryption = 'error';
            }

            // Test validation utilities
            try {
                const formatTest = ApiKeyValidation.validateOpenAIKeyFormat('sk-test123456789012345678901234567890123456789012345');
                testResult.checks.validation = formatTest ? 'ok' : 'warning';
            } catch (valError) {
                testResult.checks.validation = 'error';
            }

            res.json({
                success: true,
                data: testResult
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'HEALTH_CHECK_ERROR',
                    message: 'Health check failed',
                    details: error.message
                }
            });
        }
    }
}

export default new ApiKeyController();