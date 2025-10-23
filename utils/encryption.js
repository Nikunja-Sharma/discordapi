import crypto from 'crypto';

/**
 * Enhanced encryption utilities for API key management
 * Provides additional security features beyond the basic model encryption
 */

class EncryptionUtils {
    constructor() {
        this.ALGORITHM = 'aes-256-gcm';
        this.KEY_LENGTH = 32;
        this.IV_LENGTH = 16;
        this.TAG_LENGTH = 16;
        this.SALT_LENGTH = 32;
    }

    /**
     * Generate a secure random encryption key
     * @returns {string} - Base64 encoded encryption key
     */
    generateEncryptionKey() {
        return crypto.randomBytes(this.KEY_LENGTH).toString('base64');
    }

    /**
     * Derive encryption key from password using PBKDF2
     * @param {string} password - Password to derive key from
     * @param {string} salt - Salt for key derivation (base64)
     * @param {number} iterations - Number of iterations (default: 100000)
     * @returns {Buffer} - Derived key
     */
    deriveKey(password, salt, iterations = 100000) {
        const saltBuffer = Buffer.from(salt, 'base64');
        return crypto.pbkdf2Sync(password, saltBuffer, iterations, this.KEY_LENGTH, 'sha256');
    }

    /**
     * Enhanced encryption with authentication (AES-256-GCM)
     * @param {string} plaintext - Text to encrypt
     * @param {string} encryptionKey - Base64 encoded encryption key
     * @returns {string} - JSON string containing encrypted data and metadata
     */
    encryptWithAuth(plaintext, encryptionKey) {
        try {
            const key = Buffer.from(encryptionKey, 'base64');
            const iv = crypto.randomBytes(this.IV_LENGTH);
            const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
            
            let encrypted = cipher.update(plaintext, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            return JSON.stringify({
                encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex'),
                algorithm: this.ALGORITHM,
                timestamp: Date.now()
            });
        } catch (error) {
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }

    /**
     * Enhanced decryption with authentication verification
     * @param {string} encryptedData - JSON string containing encrypted data
     * @param {string} encryptionKey - Base64 encoded encryption key
     * @returns {string} - Decrypted plaintext
     */
    decryptWithAuth(encryptedData, encryptionKey) {
        try {
            const data = JSON.parse(encryptedData);
            const { encrypted, iv, authTag, algorithm } = data;
            
            if (algorithm !== this.ALGORITHM) {
                throw new Error('Unsupported encryption algorithm');
            }
            
            const key = Buffer.from(encryptionKey, 'base64');
            const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
            decipher.setAuthTag(Buffer.from(authTag, 'hex'));
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }

    /**
     * Create secure hash with salt
     * @param {string} data - Data to hash
     * @param {string} salt - Salt for hashing (optional, will generate if not provided)
     * @returns {Object} - Hash and salt
     */
    createSecureHash(data, salt = null) {
        try {
            const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(this.SALT_LENGTH);
            const hash = crypto.pbkdf2Sync(data, saltBuffer, 100000, 64, 'sha256');
            
            return {
                hash: hash.toString('hex'),
                salt: saltBuffer.toString('hex')
            };
        } catch (error) {
            throw new Error(`Hashing failed: ${error.message}`);
        }
    }

    /**
     * Verify data against secure hash
     * @param {string} data - Data to verify
     * @param {string} hash - Expected hash (hex)
     * @param {string} salt - Salt used for hashing (hex)
     * @returns {boolean} - True if data matches hash
     */
    verifySecureHash(data, hash, salt) {
        try {
            const computedHash = this.createSecureHash(data, salt);
            return crypto.timingSafeEqual(
                Buffer.from(hash, 'hex'),
                Buffer.from(computedHash.hash, 'hex')
            );
        } catch (error) {
            return false;
        }
    }

    /**
     * Generate cryptographically secure random string
     * @param {number} length - Length of random string
     * @param {string} charset - Character set to use (default: alphanumeric)
     * @returns {string} - Random string
     */
    generateSecureRandom(length = 32, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
        const randomBytes = crypto.randomBytes(length);
        let result = '';
        
        for (let i = 0; i < length; i++) {
            result += charset[randomBytes[i] % charset.length];
        }
        
        return result;
    }

    /**
     * Encrypt data with time-based expiration
     * @param {string} plaintext - Text to encrypt
     * @param {string} encryptionKey - Base64 encoded encryption key
     * @param {number} expirationMinutes - Expiration time in minutes
     * @returns {string} - Encrypted data with expiration
     */
    encryptWithExpiration(plaintext, encryptionKey, expirationMinutes = 60) {
        const expirationTime = Date.now() + (expirationMinutes * 60 * 1000);
        const dataWithExpiration = JSON.stringify({
            data: plaintext,
            expires: expirationTime
        });
        
        return this.encryptWithAuth(dataWithExpiration, encryptionKey);
    }

    /**
     * Decrypt data and check expiration
     * @param {string} encryptedData - Encrypted data with expiration
     * @param {string} encryptionKey - Base64 encoded encryption key
     * @returns {string} - Decrypted plaintext (throws if expired)
     */
    decryptWithExpiration(encryptedData, encryptionKey) {
        const decryptedData = this.decryptWithAuth(encryptedData, encryptionKey);
        const { data, expires } = JSON.parse(decryptedData);
        
        if (Date.now() > expires) {
            throw new Error('Encrypted data has expired');
        }
        
        return data;
    }

    /**
     * Create encrypted backup of sensitive data
     * @param {Object} data - Data to backup
     * @param {string} backupKey - Backup encryption key
     * @returns {string} - Encrypted backup
     */
    createEncryptedBackup(data, backupKey) {
        const serializedData = JSON.stringify({
            data,
            timestamp: Date.now(),
            version: '1.0'
        });
        
        return this.encryptWithAuth(serializedData, backupKey);
    }

    /**
     * Restore data from encrypted backup
     * @param {string} encryptedBackup - Encrypted backup data
     * @param {string} backupKey - Backup encryption key
     * @returns {Object} - Restored data
     */
    restoreFromEncryptedBackup(encryptedBackup, backupKey) {
        const decryptedData = this.decryptWithAuth(encryptedBackup, backupKey);
        const backup = JSON.parse(decryptedData);
        
        return {
            data: backup.data,
            timestamp: backup.timestamp,
            version: backup.version
        };
    }

    /**
     * Validate encryption key strength
     * @param {string} key - Key to validate
     * @returns {Object} - Validation result
     */
    validateKeyStrength(key) {
        const keyBuffer = Buffer.from(key, 'base64');
        
        if (keyBuffer.length < this.KEY_LENGTH) {
            return {
                isValid: false,
                reason: 'Key too short',
                requiredLength: this.KEY_LENGTH,
                actualLength: keyBuffer.length
            };
        }
        
        // Check for sufficient entropy (basic check)
        const uniqueBytes = new Set(keyBuffer).size;
        const entropyRatio = uniqueBytes / keyBuffer.length;
        
        if (entropyRatio < 0.5) {
            return {
                isValid: false,
                reason: 'Insufficient entropy',
                entropyRatio
            };
        }
        
        return {
            isValid: true,
            strength: 'strong',
            entropyRatio
        };
    }
}

export default new EncryptionUtils();