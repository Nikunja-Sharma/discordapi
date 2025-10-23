import express from 'express';
import {
    createSubscription,
    getSubscriptionStatus,
    updateSubscription,
    cancelSubscription,
    getSubscriptionPlans,
    handlePaymentWebhook,
    getBillingHistory,
    retryPayment
} from '../controllers/subscriptionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get available subscription plans
router.get('/plans', getSubscriptionPlans);

// Create a new subscription
router.post('/create', authenticateToken, createSubscription);

// Get current user's subscription status
router.get('/status', authenticateToken, getSubscriptionStatus);

// Alias for current subscription (used by frontend)
router.get('/current', authenticateToken, getSubscriptionStatus);

// Update subscription (change plan, auto-renew settings)
router.put('/update', authenticateToken, updateSubscription);

// Cancel subscription
router.delete('/cancel', authenticateToken, cancelSubscription);

// Get billing history
router.get('/billing-history', authenticateToken, getBillingHistory);

// Retry failed payment
router.post('/retry-payment', authenticateToken, retryPayment);

// Webhook endpoint for payment status updates
router.post('/webhook', handlePaymentWebhook);

export default router;