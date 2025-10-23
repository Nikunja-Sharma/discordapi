import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Authentication middleware to verify JWT tokens
 */
export const authenticateToken = async (req, res, next) => {
    try {
        // Check for token in cookies first, then in Authorization header
        let token = req.cookies.authToken;
        
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'NO_TOKEN',
                    message: 'Access denied. No authentication token provided.'
                }
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Get user from database
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'Access denied. User not found.'
                }
            });
        }

        // Add user to request object
        req.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            discordId: user.discordId,
            avatar: user.avatar
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Access denied. Invalid token.'
                }
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'TOKEN_EXPIRED',
                    message: 'Access denied. Token has expired.'
                }
            });
        }

        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'AUTH_ERROR',
                message: 'Authentication error occurred.',
                details: error.message
            }
        });
    }
};

/**
 * Middleware to check if user has an active subscription
 */
export const requireSubscription = async (req, res, next) => {
    try {
        // This middleware should be used after authenticateToken
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'NOT_AUTHENTICATED',
                    message: 'User must be authenticated to access this resource.'
                }
            });
        }

        // Import Subscription model dynamically to avoid circular dependencies
        const { Subscription } = await import('../models/index.js');
        
        const subscription = await Subscription.findOne({ 
            userId: req.user.id,
            status: 'active'
        });

        if (!subscription) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'NO_ACTIVE_SUBSCRIPTION',
                    message: 'Active subscription required to access this resource.'
                }
            });
        }

        // Add subscription to request object
        req.subscription = subscription;
        next();
    } catch (error) {
        console.error('Subscription check error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SUBSCRIPTION_CHECK_ERROR',
                message: 'Error checking subscription status.',
                details: error.message
            }
        });
    }
};