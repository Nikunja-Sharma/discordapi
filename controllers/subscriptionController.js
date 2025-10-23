import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import paymentService from '../services/paymentService.js';

// Helper function to authenticate user from token
const authenticateUser = async (req) => {
    const token = req.cookies.authToken || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
        throw new Error('User not found');
    }

    return user;
};

// Helper function to calculate end date based on plan type
const calculateEndDate = (startDate, planType) => {
    const start = new Date(startDate);
    const end = new Date(start);
    
    switch (planType) {
        case 'monthly':
            end.setMonth(end.getMonth() + 1);
            break;
        case 'yearly':
            end.setFullYear(end.getFullYear() + 1);
            break;
        case '2-year':
            end.setFullYear(end.getFullYear() + 2);
            break;
        default:
            throw new Error('Invalid plan type');
    }
    
    return end;
};

// Helper function to calculate pricing
const calculatePricing = (planType) => {
    const monthlyPrice = 29.99; // Base monthly price
    
    switch (planType) {
        case 'monthly':
            return {
                pricePerMonth: monthlyPrice,
                totalPrice: monthlyPrice,
                savings: 0
            };
        case 'yearly':
            const yearlyPricePerMonth = monthlyPrice * 0.85; // 15% discount
            return {
                pricePerMonth: yearlyPricePerMonth,
                totalPrice: yearlyPricePerMonth * 12,
                savings: (monthlyPrice - yearlyPricePerMonth) * 12
            };
        case '2-year':
            const twoYearPricePerMonth = monthlyPrice * 0.75; // 25% discount
            return {
                pricePerMonth: twoYearPricePerMonth,
                totalPrice: twoYearPricePerMonth * 24,
                savings: (monthlyPrice - twoYearPricePerMonth) * 24
            };
        default:
            throw new Error('Invalid plan type');
    }
};

// Create a new subscription
export const createSubscription = async (req, res) => {
    try {
        // For demo purposes, handle unauthenticated users
        let user;
        try {
            user = await authenticateUser(req);
        } catch (authError) {
            // Return demo response for unauthenticated users
            return res.json({
                success: true,
                message: 'Demo subscription created successfully',
                data: {
                    subscriptionId: 'demo-' + Date.now(),
                    planType: req.body.planType,
                    status: 'active',
                    paymentUrl: '#demo-payment'
                }
            });
        }
        
        const { planType, paymentMethod } = req.body;

        // Validate required fields
        if (!planType || !paymentMethod) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'Plan type and payment method are required'
                }
            });
        }

        // Check if user already has an active subscription
        const existingSubscription = await Subscription.findActiveByUserId(user._id);
        if (existingSubscription) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'SUBSCRIPTION_EXISTS',
                    message: 'User already has an active subscription'
                }
            });
        }

        // Calculate pricing and dates
        const startDate = new Date();
        const endDate = calculateEndDate(startDate, planType);
        const pricing = calculatePricing(planType);

        // Validate payment method
        try {
            paymentService.validatePaymentMethod(paymentMethod);
        } catch (validationError) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PAYMENT_METHOD',
                    message: validationError.message
                }
            });
        }

        // Create subscription first
        const subscription = new Subscription({
            userId: user._id,
            planType,
            status: 'pending',
            startDate,
            endDate,
            paymentMethod,
            pricePerMonth: pricing.pricePerMonth,
            totalPrice: pricing.totalPrice,
            autoRenew: true
        });

        await subscription.save();

        // Process payment
        try {
            const paymentResult = await paymentService.processPayment({
                amount: pricing.totalPrice,
                currency: 'USD',
                paymentMethod,
                userId: user._id,
                subscriptionId: subscription._id
            });

            // Update subscription status and add billing history
            subscription.status = 'active';
            subscription.billingHistory.push({
                date: new Date(),
                amount: pricing.totalPrice,
                currency: 'USD',
                status: 'paid',
                transactionId: paymentResult.transactionId
            });

            await subscription.save();

            res.status(201).json({
                success: true,
                data: {
                    subscription: {
                        id: subscription._id,
                        planType: subscription.planType,
                        status: subscription.status,
                        startDate: subscription.startDate,
                        endDate: subscription.endDate,
                        pricePerMonth: subscription.pricePerMonth,
                        totalPrice: subscription.totalPrice,
                        autoRenew: subscription.autoRenew,
                        daysRemaining: subscription.getDaysRemaining(),
                        expiresSoon: subscription.expiresSoon()
                    },
                    payment: {
                        transactionId: paymentResult.transactionId,
                        status: paymentResult.status,
                        amount: paymentResult.amount,
                        currency: paymentResult.currency
                    },
                    pricing: {
                        ...pricing,
                        currency: 'USD'
                    }
                },
                message: 'Subscription created and payment processed successfully'
            });

        } catch (paymentError) {
            // Payment failed, update subscription status
            subscription.status = 'expired';
            subscription.billingHistory.push({
                date: new Date(),
                amount: pricing.totalPrice,
                currency: 'USD',
                status: 'failed',
                transactionId: null
            });
            await subscription.save();

            return res.status(400).json({
                success: false,
                error: {
                    code: 'PAYMENT_FAILED',
                    message: paymentError.message || 'Payment processing failed'
                },
                data: {
                    subscriptionId: subscription._id,
                    status: 'payment_failed'
                }
            });
        }
    } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SUBSCRIPTION_CREATE_ERROR',
                message: error.message || 'Error creating subscription'
            }
        });
    }
};

// Get subscription status for current user
export const getSubscriptionStatus = async (req, res) => {
    try {
        // For demo purposes, handle unauthenticated users
        let user;
        try {
            user = await authenticateUser(req);
        } catch (authError) {
            // Return demo response for unauthenticated users
            return res.json({
                success: true,
                data: {
                    hasSubscription: false,
                    subscription: null,
                    demo: true
                }
            });
        }
        
        const subscription = await Subscription.findOne({ userId: user._id })
            .sort({ createdAt: -1 }); // Get most recent subscription

        if (!subscription) {
            return res.json({
                success: true,
                data: {
                    hasSubscription: false,
                    subscription: null
                }
            });
        }

        res.json({
            success: true,
            data: {
                hasSubscription: true,
                subscription: {
                    id: subscription._id,
                    planType: subscription.planType,
                    status: subscription.status,
                    startDate: subscription.startDate,
                    endDate: subscription.endDate,
                    pricePerMonth: subscription.pricePerMonth,
                    totalPrice: subscription.totalPrice,
                    autoRenew: subscription.autoRenew,
                    daysRemaining: subscription.getDaysRemaining(),
                    expiresSoon: subscription.expiresSoon(),
                    isActive: subscription.isActive,
                    billingHistory: subscription.billingHistory,
                    cancelledAt: subscription.cancelledAt,
                    cancellationReason: subscription.cancellationReason
                }
            }
        });
    } catch (error) {
        console.error('Get subscription status error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SUBSCRIPTION_STATUS_ERROR',
                message: error.message || 'Error retrieving subscription status'
            }
        });
    }
};

// Update subscription (change plan, auto-renew settings)
export const updateSubscription = async (req, res) => {
    try {
        const user = await authenticateUser(req);
        const { planType, autoRenew } = req.body;

        const subscription = await Subscription.findOne({
            userId: user._id,
            status: { $in: ['active', 'pending'] }
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'SUBSCRIPTION_NOT_FOUND',
                    message: 'No active subscription found for user'
                }
            });
        }

        let updated = false;

        // Update plan type if provided and different
        if (planType && planType !== subscription.planType) {
            const pricing = calculatePricing(planType);
            const newEndDate = calculateEndDate(subscription.startDate, planType);
            
            subscription.planType = planType;
            subscription.pricePerMonth = pricing.pricePerMonth;
            subscription.totalPrice = pricing.totalPrice;
            subscription.endDate = newEndDate;
            updated = true;
        }

        // Update auto-renew setting if provided
        if (typeof autoRenew === 'boolean' && autoRenew !== subscription.autoRenew) {
            subscription.autoRenew = autoRenew;
            updated = true;
        }

        if (!updated) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'NO_CHANGES',
                    message: 'No valid changes provided'
                }
            });
        }

        await subscription.save();

        res.json({
            success: true,
            data: {
                subscription: {
                    id: subscription._id,
                    planType: subscription.planType,
                    status: subscription.status,
                    startDate: subscription.startDate,
                    endDate: subscription.endDate,
                    pricePerMonth: subscription.pricePerMonth,
                    totalPrice: subscription.totalPrice,
                    autoRenew: subscription.autoRenew,
                    daysRemaining: subscription.getDaysRemaining(),
                    expiresSoon: subscription.expiresSoon()
                }
            },
            message: 'Subscription updated successfully'
        });
    } catch (error) {
        console.error('Update subscription error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SUBSCRIPTION_UPDATE_ERROR',
                message: error.message || 'Error updating subscription'
            }
        });
    }
};

// Cancel subscription
export const cancelSubscription = async (req, res) => {
    try {
        const user = await authenticateUser(req);
        const { reason } = req.body;

        const subscription = await Subscription.findOne({
            userId: user._id,
            status: 'active'
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'SUBSCRIPTION_NOT_FOUND',
                    message: 'No active subscription found for user'
                }
            });
        }

        // Update subscription status
        subscription.status = 'cancelled';
        subscription.cancelledAt = new Date();
        subscription.autoRenew = false;
        
        if (reason) {
            subscription.cancellationReason = reason;
        }

        await subscription.save();

        res.json({
            success: true,
            data: {
                subscription: {
                    id: subscription._id,
                    status: subscription.status,
                    cancelledAt: subscription.cancelledAt,
                    cancellationReason: subscription.cancellationReason,
                    daysRemaining: subscription.getDaysRemaining()
                }
            },
            message: 'Subscription cancelled successfully'
        });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SUBSCRIPTION_CANCEL_ERROR',
                message: error.message || 'Error cancelling subscription'
            }
        });
    }
};

// Get available subscription plans with pricing
export const getSubscriptionPlans = async (req, res) => {
    try {
        const plans = [
            {
                id: 'monthly',
                name: 'Monthly Plan',
                planType: 'monthly',
                ...calculatePricing('monthly'),
                billingCycle: 'Monthly',
                popular: false
            },
            {
                id: 'yearly',
                name: 'Yearly Plan',
                planType: 'yearly',
                ...calculatePricing('yearly'),
                billingCycle: 'Yearly',
                popular: true,
                savingsPercentage: 15
            },
            {
                id: '2-year',
                name: '2-Year Plan',
                planType: '2-year',
                ...calculatePricing('2-year'),
                billingCycle: 'Every 2 Years',
                popular: false,
                savingsPercentage: 25
            }
        ];

        res.json({
            success: true,
            data: {
                plans,
                currency: 'USD'
            }
        });
    } catch (error) {
        console.error('Get subscription plans error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'PLANS_ERROR',
                message: 'Error retrieving subscription plans'
            }
        });
    }
};
// Handle payment webhooks (dummy implementation)
export const handlePaymentWebhook = async (req, res) => {
    try {
        const { transactionId, status, eventType, subscriptionId } = req.body;

        // Process webhook with payment service
        await paymentService.handleWebhook({
            transactionId,
            status,
            eventType
        });

        // Update subscription if needed
        if (subscriptionId && status) {
            const subscription = await Subscription.findById(subscriptionId);
            if (subscription) {
                // Update billing history
                const billingEntry = subscription.billingHistory.find(
                    entry => entry.transactionId === transactionId
                );
                
                if (billingEntry) {
                    billingEntry.status = status;
                } else {
                    // Add new billing entry for webhook events
                    subscription.billingHistory.push({
                        date: new Date(),
                        amount: subscription.totalPrice,
                        currency: 'USD',
                        status,
                        transactionId
                    });
                }

                // Update subscription status based on payment status
                if (status === 'paid' && subscription.status === 'pending') {
                    subscription.status = 'active';
                } else if (status === 'failed') {
                    subscription.status = 'expired';
                }

                await subscription.save();
            }
        }

        res.json({
            success: true,
            message: 'Webhook processed successfully'
        });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'WEBHOOK_ERROR',
                message: 'Error processing webhook'
            }
        });
    }
};

// Get billing history for current user
export const getBillingHistory = async (req, res) => {
    try {
        const user = await authenticateUser(req);
        
        // Get all user subscriptions with billing history
        const subscriptions = await Subscription.find({ userId: user._id })
            .sort({ createdAt: -1 });

        // Flatten billing history from all subscriptions
        const billingHistory = [];
        subscriptions.forEach(subscription => {
            subscription.billingHistory.forEach(entry => {
                billingHistory.push({
                    ...entry.toObject(),
                    subscriptionId: subscription._id,
                    planType: subscription.planType
                });
            });
        });

        // Sort by date (newest first)
        billingHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            success: true,
            data: {
                billingHistory,
                totalTransactions: billingHistory.length,
                totalPaid: billingHistory
                    .filter(entry => entry.status === 'paid')
                    .reduce((sum, entry) => sum + entry.amount, 0)
            }
        });
    } catch (error) {
        console.error('Get billing history error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'BILLING_HISTORY_ERROR',
                message: error.message || 'Error retrieving billing history'
            }
        });
    }
};

// Retry failed payment
export const retryPayment = async (req, res) => {
    try {
        const user = await authenticateUser(req);
        const { subscriptionId, paymentMethod } = req.body;

        const subscription = await Subscription.findOne({
            _id: subscriptionId,
            userId: user._id,
            status: { $in: ['expired', 'pending'] }
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'SUBSCRIPTION_NOT_FOUND',
                    message: 'No subscription found or subscription is not eligible for payment retry'
                }
            });
        }

        // Validate payment method if provided
        const paymentMethodToUse = paymentMethod || subscription.paymentMethod;
        try {
            paymentService.validatePaymentMethod(paymentMethodToUse);
        } catch (validationError) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PAYMENT_METHOD',
                    message: validationError.message
                }
            });
        }

        // Process payment retry
        try {
            const paymentResult = await paymentService.processPayment({
                amount: subscription.totalPrice,
                currency: 'USD',
                paymentMethod: paymentMethodToUse,
                userId: user._id,
                subscriptionId: subscription._id
            });

            // Update subscription
            subscription.status = 'active';
            subscription.paymentMethod = paymentMethodToUse;
            subscription.billingHistory.push({
                date: new Date(),
                amount: subscription.totalPrice,
                currency: 'USD',
                status: 'paid',
                transactionId: paymentResult.transactionId
            });

            await subscription.save();

            res.json({
                success: true,
                data: {
                    subscription: {
                        id: subscription._id,
                        status: subscription.status,
                        daysRemaining: subscription.getDaysRemaining()
                    },
                    payment: {
                        transactionId: paymentResult.transactionId,
                        status: paymentResult.status,
                        amount: paymentResult.amount
                    }
                },
                message: 'Payment retry successful'
            });

        } catch (paymentError) {
            // Add failed payment to billing history
            subscription.billingHistory.push({
                date: new Date(),
                amount: subscription.totalPrice,
                currency: 'USD',
                status: 'failed',
                transactionId: null
            });
            await subscription.save();

            return res.status(400).json({
                success: false,
                error: {
                    code: 'PAYMENT_RETRY_FAILED',
                    message: paymentError.message || 'Payment retry failed'
                }
            });
        }
    } catch (error) {
        console.error('Retry payment error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'PAYMENT_RETRY_ERROR',
                message: error.message || 'Error retrying payment'
            }
        });
    }
};