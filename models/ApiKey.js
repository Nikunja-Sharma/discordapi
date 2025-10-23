import mongoose from 'mongoose';
import crypto from 'crypto';
import EncryptionUtils from '../utils/encryption.js';

const apiKeySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        unique: true,
        index: true
    },
    encryptedKey: {
        type: String,
        required: [true, 'Encrypted key is required']
    },
    keyHash: {
        type: String,
        required: [true, 'Key hash is required'],
        index: true
    },
    status: {
        type: String,
        required: [true, 'Status is required'],
        enum: ['valid', 'invalid', 'not_set', 'testing'],
        default: 'not_set',
        index: true
    },
    lastValidated: {
        type: Date,
        index: true
    },
    validationAttempts: {
        type: Number,
        default: 0
    },
    lastValidationError: String,
    organizationId: String, // OpenAI organization ID if applicable
    keyMetadata: {
        keyType: String, // 'user', 'service', etc.
        permissions: [String], // API permissions if available
        rateLimit: {
            requestsPerMinute: Number,
            tokensPerMinute: Number
        }
    }
}, {
    timestamps: true
});

// Index for cleanup of old invalid keys
apiKeySchema.index({ status: 1, updatedAt: 1 });

// Encryption configuration
const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_KEY || EncryptionUtils.generateEncryptionKey();

// Static method to encrypt API key using enhanced encryption
apiKeySchema.statics.encryptApiKey = function(apiKey) {
    try {
        return EncryptionUtils.encryptWithAuth(apiKey, ENCRYPTION_KEY);
    } catch (error) {
        throw new Error(`Failed to encrypt API key: ${error.message}`);
    }
};

// Static method to decrypt API key using enhanced encryption
apiKeySchema.statics.decryptApiKey = function(encryptedData) {
    try {
        return EncryptionUtils.decryptWithAuth(encryptedData, ENCRYPTION_KEY);
    } catch (error) {
        throw new Error(`Failed to decrypt API key: ${error.message}`);
    }
};

// Static method to create secure hash for validation without decryption
apiKeySchema.statics.createKeyHash = function(apiKey) {
    const hashResult = EncryptionUtils.createSecureHash(apiKey);
    return hashResult.hash;
};

// Method to validate API key format
apiKeySchema.methods.validateKeyFormat = function(apiKey) {
    // OpenAI API keys typically start with 'sk-' and are 51 characters long
    const openAIPattern = /^sk-[a-zA-Z0-9]{48}$/;
    return openAIPattern.test(apiKey);
};

// Method to safely get key status without exposing the key
apiKeySchema.methods.getSecureStatus = function() {
    return {
        status: this.status,
        lastValidated: this.lastValidated,
        hasKey: !!this.encryptedKey,
        validationAttempts: this.validationAttempts,
        lastValidationError: this.status === 'invalid' ? this.lastValidationError : null
    };
};

// Static method to find by user ID
apiKeySchema.statics.findByUserId = function(userId) {
    return this.findOne({ userId });
};

// Method to update validation status
apiKeySchema.methods.updateValidationStatus = function(isValid, error = null) {
    this.status = isValid ? 'valid' : 'invalid';
    this.lastValidated = new Date();
    this.validationAttempts += 1;
    
    if (!isValid && error) {
        this.lastValidationError = error;
    } else {
        this.lastValidationError = undefined;
    }
    
    return this.save();
};

// Pre-save middleware to ensure key hash is created
apiKeySchema.pre('save', function(next) {
    if (this.isModified('encryptedKey') && !this.keyHash) {
        return next(new Error('Key hash must be provided when setting encrypted key'));
    }
    next();
});

// Method to check if key needs revalidation (older than 24 hours)
apiKeySchema.methods.needsRevalidation = function() {
    if (!this.lastValidated) return true;
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.lastValidated < twentyFourHoursAgo;
};

const ApiKey = mongoose.model('ApiKey', apiKeySchema);

export default ApiKey;