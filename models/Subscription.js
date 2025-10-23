import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    planType: {
        type: String,
        required: [true, 'Plan type is required'],
        enum: ['monthly', 'yearly', '2-year'],
        index: true
    },
    status: {
        type: String,
        required: [true, 'Status is required'],
        enum: ['active', 'cancelled', 'expired', 'pending'],
        default: 'pending',
        index: true
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required'],
        index: true
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required'],
        index: true
    },
    paymentMethod: {
        type: {
            type: String,
            enum: ['stripe', 'paypal'],
            required: true
        },
        paymentId: {
            type: String,
            required: true
        },
        customerId: String,
        last4: String,
        brand: String
    },
    billingHistory: [{
        date: {
            type: Date,
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        currency: {
            type: String,
            required: true,
            default: 'USD'
        },
        status: {
            type: String,
            enum: ['paid', 'failed', 'pending', 'refunded'],
            required: true
        },
        transactionId: String,
        invoiceUrl: String
    }],
    pricePerMonth: {
        type: Number,
        required: [true, 'Price per month is required'],
        min: 0
    },
    totalPrice: {
        type: Number,
        required: [true, 'Total price is required'],
        min: 0
    },
    autoRenew: {
        type: Boolean,
        default: true
    },
    cancelledAt: Date,
    cancellationReason: String
}, {
    timestamps: true
});

// Compound indexes for performance
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ status: 1, endDate: 1 });
subscriptionSchema.index({ userId: 1, planType: 1 });

// Virtual for checking if subscription is currently active
subscriptionSchema.virtual('isActive').get(function() {
    return this.status === 'active' && this.endDate > new Date();
});

// Method to calculate days remaining
subscriptionSchema.methods.getDaysRemaining = function() {
    if (this.status !== 'active') return 0;
    const now = new Date();
    const timeDiff = this.endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
};

// Method to check if subscription expires soon (within 7 days)
subscriptionSchema.methods.expiresSoon = function() {
    return this.getDaysRemaining() <= 7 && this.getDaysRemaining() > 0;
};

// Static method to find active subscription for user
subscriptionSchema.statics.findActiveByUserId = function(userId) {
    return this.findOne({
        userId,
        status: 'active',
        endDate: { $gt: new Date() }
    });
};

// Pre-save middleware to validate dates
subscriptionSchema.pre('save', function(next) {
    if (this.startDate && this.endDate && this.startDate >= this.endDate) {
        return next(new Error('End date must be after start date'));
    }
    next();
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;