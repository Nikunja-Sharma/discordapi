// Dummy Payment Service - Replace with actual payment gateway later (Razorpay/Stripe)

class PaymentService {
    constructor() {
        this.transactions = new Map(); // In-memory storage for demo
    }

    // Simulate payment processing
    async processPayment(paymentData) {
        const { amount, currency = 'USD', paymentMethod, userId, subscriptionId } = paymentData;
        
        // Generate dummy transaction ID
        const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate 95% success rate (5% failure for testing)
        const isSuccess = Math.random() > 0.05;
        
        const transaction = {
            id: transactionId,
            amount,
            currency,
            status: isSuccess ? 'paid' : 'failed',
            paymentMethod: paymentMethod.type,
            userId,
            subscriptionId,
            timestamp: new Date(),
            failureReason: isSuccess ? null : 'Insufficient funds' // Dummy failure reason
        };
        
        // Store transaction
        this.transactions.set(transactionId, transaction);
        
        if (isSuccess) {
            return {
                success: true,
                transactionId,
                status: 'paid',
                amount,
                currency,
                timestamp: transaction.timestamp
            };
        } else {
            throw new Error(`Payment failed: ${transaction.failureReason}`);
        }
    }

    // Simulate webhook for payment status updates
    async handleWebhook(webhookData) {
        const { transactionId, status, eventType } = webhookData;
        
        // Simulate webhook processing
        console.log(`Processing webhook: ${eventType} for transaction ${transactionId}`);
        
        const transaction = this.transactions.get(transactionId);
        if (transaction) {
            transaction.status = status;
            transaction.webhookProcessedAt = new Date();
        }
        
        return {
            success: true,
            message: 'Webhook processed successfully'
        };
    }

    // Get transaction details
    async getTransaction(transactionId) {
        const transaction = this.transactions.get(transactionId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        return transaction;
    }

    // Simulate refund processing
    async processRefund(transactionId, amount = null) {
        const originalTransaction = this.transactions.get(transactionId);
        if (!originalTransaction) {
            throw new Error('Original transaction not found');
        }

        if (originalTransaction.status !== 'paid') {
            throw new Error('Cannot refund unpaid transaction');
        }

        const refundAmount = amount || originalTransaction.amount;
        const refundId = `rfnd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Simulate refund processing delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const refund = {
            id: refundId,
            originalTransactionId: transactionId,
            amount: refundAmount,
            currency: originalTransaction.currency,
            status: 'refunded',
            timestamp: new Date()
        };
        
        // Store refund
        this.transactions.set(refundId, refund);
        
        return {
            success: true,
            refundId,
            amount: refundAmount,
            status: 'refunded',
            timestamp: refund.timestamp
        };
    }

    // Create customer (dummy implementation)
    async createCustomer(customerData) {
        const { userId, email, name } = customerData;
        
        const customerId = `cust_${userId}_${Math.random().toString(36).substr(2, 9)}`;
        
        return {
            customerId,
            email,
            name,
            createdAt: new Date()
        };
    }

    // Get payment methods for customer (dummy implementation)
    async getPaymentMethods(customerId) {
        // Return dummy payment methods
        return [
            {
                id: 'pm_dummy_card_1',
                type: 'card',
                last4: '4242',
                brand: 'visa',
                expiryMonth: 12,
                expiryYear: 2025,
                isDefault: true
            },
            {
                id: 'pm_dummy_card_2',
                type: 'card',
                last4: '0000',
                brand: 'mastercard',
                expiryMonth: 6,
                expiryYear: 2026,
                isDefault: false
            }
        ];
    }

    // Validate payment method (dummy implementation)
    validatePaymentMethod(paymentMethod) {
        const { type, paymentId } = paymentMethod;
        
        if (!type || !paymentId) {
            throw new Error('Payment method type and ID are required');
        }
        
        const validTypes = ['stripe', 'paypal', 'card', 'bank_transfer', 'wallet'];
        if (!validTypes.includes(type)) {
            throw new Error('Invalid payment method type');
        }
        
        return true;
    }

    // Get all transactions for a user (for billing history)
    async getUserTransactions(userId) {
        const userTransactions = Array.from(this.transactions.values())
            .filter(transaction => transaction.userId === userId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return userTransactions;
    }
}

// Export singleton instance
const paymentService = new PaymentService();
export default paymentService;