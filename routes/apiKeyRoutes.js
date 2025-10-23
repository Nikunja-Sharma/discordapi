import express from 'express';
import ApiKeyController from '../controllers/apiKeyController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Validate API key format and test connectivity
 * POST /api/apikeys/validate
 */
router.post('/validate', authenticateToken, ApiKeyController.validateApiKey);

/**
 * Store or update API key for authenticated user
 * PUT /api/apikeys/update
 */
router.put('/update', authenticateToken, ApiKeyController.updateApiKey);

// API key management endpoints
router.get('/status', authenticateToken, ApiKeyController.getApiKeyStatus);
router.post('/save', authenticateToken, ApiKeyController.updateApiKey);
router.post('/test', authenticateToken, ApiKeyController.testApiKey);
router.delete('/remove', authenticateToken, ApiKeyController.removeApiKey);
router.get('/details', authenticateToken, ApiKeyController.getApiKeyDetails);
router.get('/usage', authenticateToken, ApiKeyController.getUsageStatistics);
router.post('/permissions', authenticateToken, ApiKeyController.validatePermissions);
router.post('/batch', authenticateToken, ApiKeyController.batchOperations);

/**
 * Health check for API key management service
 * GET /api/apikeys/health
 */
router.get('/health', ApiKeyController.healthCheck);

export default router;