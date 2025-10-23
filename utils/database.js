import mongoose from 'mongoose';

/**
 * Database connection utilities for subscription dashboard
 */

// Connection state tracking
let isConnected = false;

/**
 * Enhanced MongoDB connection with retry logic
 */
export const connectToDatabase = async (retries = 3, delay = 5000) => {
    if (isConnected) {
        console.log('Database already connected');
        return mongoose.connection;
    }

    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not defined');
    }

    const connectionOptions = {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000 // Close sockets after 45 seconds of inactivity
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`Attempting database connection (attempt ${attempt}/${retries})...`);
            
            await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
            
            isConnected = true;
            console.log('Successfully connected to MongoDB');
            
            // Set up connection event listeners
            setupConnectionListeners();
            
            return mongoose.connection;
        } catch (error) {
            console.error(`Database connection attempt ${attempt} failed:`, error.message);
            
            if (attempt === retries) {
                throw new Error(`Failed to connect to database after ${retries} attempts: ${error.message}`);
            }
            
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

/**
 * Set up connection event listeners
 */
const setupConnectionListeners = () => {
    mongoose.connection.on('connected', () => {
        console.log('Mongoose connected to MongoDB');
        isConnected = true;
    });

    mongoose.connection.on('error', (err) => {
        console.error('Mongoose connection error:', err);
        isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
        console.log('Mongoose disconnected from MongoDB');
        isConnected = false;
    });

    // Handle application termination
    process.on('SIGINT', async () => {
        await gracefulShutdown();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        await gracefulShutdown();
        process.exit(0);
    });
};

/**
 * Graceful shutdown of database connection
 */
export const gracefulShutdown = async () => {
    try {
        if (isConnected) {
            await mongoose.connection.close();
            console.log('Database connection closed gracefully');
            isConnected = false;
        }
    } catch (error) {
        console.error('Error during database shutdown:', error);
    }
};

/**
 * Check if database is connected
 */
export const isDatabaseConnected = () => {
    return isConnected && mongoose.connection.readyState === 1;
};

/**
 * Get database connection status
 */
export const getConnectionStatus = () => {
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    
    return {
        isConnected,
        readyState: mongoose.connection.readyState,
        status: states[mongoose.connection.readyState] || 'unknown',
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
    };
};

/**
 * Create database indexes for performance optimization
 */
export const createIndexes = async () => {
    try {
        console.log('Creating database indexes...');
        
        // Import models to ensure they're registered
        const { default: User } = await import('../models/User.js');
        const { default: Subscription } = await import('../models/Subscription.js');
        const { default: ApiKey } = await import('../models/ApiKey.js');
        const { default: BotConfiguration } = await import('../models/BotConfiguration.js');
        const { default: UsageTracking } = await import('../models/UsageTracking.js');
        
        // Create indexes for all models
        await Promise.all([
            User.createIndexes(),
            Subscription.createIndexes(),
            ApiKey.createIndexes(),
            BotConfiguration.createIndexes(),
            UsageTracking.createIndexes()
        ]);
        
        console.log('Database indexes created successfully');
    } catch (error) {
        console.error('Error creating database indexes:', error);
        throw error;
    }
};

/**
 * Validate database connection and collections
 */
export const validateDatabase = async () => {
    try {
        if (!isDatabaseConnected()) {
            throw new Error('Database is not connected');
        }
        
        // Test database operations
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`Database validation successful. Found ${collections.length} collections.`);
        
        return {
            isValid: true,
            collections: collections.map(col => col.name),
            connectionStatus: getConnectionStatus()
        };
    } catch (error) {
        console.error('Database validation failed:', error);
        return {
            isValid: false,
            error: error.message,
            connectionStatus: getConnectionStatus()
        };
    }
};

/**
 * Clean up old or invalid data
 */
export const cleanupDatabase = async () => {
    try {
        console.log('Starting database cleanup...');
        
        const { default: Subscription } = await import('../models/Subscription.js');
        const { default: ApiKey } = await import('../models/ApiKey.js');
        const { default: UsageTracking } = await import('../models/UsageTracking.js');
        
        // Clean up expired subscriptions (older than 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const expiredSubscriptions = await Subscription.deleteMany({
            status: 'expired',
            endDate: { $lt: thirtyDaysAgo }
        });
        
        // Clean up invalid API keys (older than 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const invalidApiKeys = await ApiKey.deleteMany({
            status: 'invalid',
            updatedAt: { $lt: sevenDaysAgo }
        });
        
        // Clean up old usage tracking data (older than 1 year)
        const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        const oldUsageData = await UsageTracking.deleteMany({
            date: { $lt: oneYearAgo }
        });
        
        console.log('Database cleanup completed:', {
            expiredSubscriptions: expiredSubscriptions.deletedCount,
            invalidApiKeys: invalidApiKeys.deletedCount,
            oldUsageData: oldUsageData.deletedCount
        });
        
        return {
            success: true,
            cleaned: {
                expiredSubscriptions: expiredSubscriptions.deletedCount,
                invalidApiKeys: invalidApiKeys.deletedCount,
                oldUsageData: oldUsageData.deletedCount
            }
        };
    } catch (error) {
        console.error('Database cleanup failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Database health check
 */
export const healthCheck = async () => {
    try {
        const startTime = Date.now();
        
        // Test basic connection
        await mongoose.connection.db.admin().ping();
        
        const responseTime = Date.now() - startTime;
        
        return {
            status: 'healthy',
            responseTime: `${responseTime}ms`,
            connection: getConnectionStatus(),
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message,
            connection: getConnectionStatus(),
            timestamp: new Date().toISOString()
        };
    }
};

export default {
    connectToDatabase,
    gracefulShutdown,
    isDatabaseConnected,
    getConnectionStatus,
    createIndexes,
    validateDatabase,
    cleanupDatabase,
    healthCheck
};