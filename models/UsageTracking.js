import mongoose from 'mongoose';

const usageTrackingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        index: true
    },
    botConfigId: {
        type: String,
        required: [true, 'Bot configuration ID is required'],
        index: true
    },
    inputTokens: {
        type: Number,
        required: [true, 'Input tokens is required'],
        min: 0,
        default: 0
    },
    outputTokens: {
        type: Number,
        required: [true, 'Output tokens is required'],
        min: 0,
        default: 0
    },
    totalCost: {
        type: Number,
        required: [true, 'Total cost is required'],
        min: 0,
        default: 0
    },
    apiCalls: {
        type: Number,
        required: [true, 'API calls is required'],
        min: 0,
        default: 0
    },
    sessionId: String, // For grouping related API calls
    requestDetails: [{
        timestamp: {
            type: Date,
            required: true
        },
        model: String, // GPT model used
        inputTokens: {
            type: Number,
            required: true,
            min: 0
        },
        outputTokens: {
            type: Number,
            required: true,
            min: 0
        },
        cost: {
            type: Number,
            required: true,
            min: 0
        },
        requestType: {
            type: String,
            enum: ['chat', 'completion', 'embedding', 'moderation'],
            default: 'chat'
        },
        success: {
            type: Boolean,
            default: true
        },
        errorMessage: String
    }],
    metadata: {
        guildId: String, // Discord server ID
        channelId: String, // Discord channel ID
        messageId: String, // Discord message ID
        userAgent: String,
        ipAddress: String
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
usageTrackingSchema.index({ userId: 1, date: 1 });
usageTrackingSchema.index({ userId: 1, botConfigId: 1, date: 1 });
usageTrackingSchema.index({ date: 1, userId: 1 });
usageTrackingSchema.index({ userId: 1, 'requestDetails.timestamp': 1 });

// Virtual for total tokens
usageTrackingSchema.virtual('totalTokens').get(function() {
    return this.inputTokens + this.outputTokens;
});

// Method to add a request detail
usageTrackingSchema.methods.addRequest = function(requestData) {
    this.requestDetails.push({
        timestamp: new Date(),
        ...requestData
    });
    
    // Update totals
    this.inputTokens += requestData.inputTokens || 0;
    this.outputTokens += requestData.outputTokens || 0;
    this.totalCost += requestData.cost || 0;
    this.apiCalls += 1;
    
    return this.save();
};

// Static method to get usage for date range
usageTrackingSchema.statics.getUsageByDateRange = function(userId, startDate, endDate, botConfigId = null) {
    const query = {
        userId,
        date: {
            $gte: startDate,
            $lte: endDate
        }
    };
    
    if (botConfigId) {
        query.botConfigId = botConfigId;
    }
    
    return this.find(query).sort({ date: 1 });
};

// Static method to get daily usage summary
usageTrackingSchema.statics.getDailySummary = function(userId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return this.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                date: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            }
        },
        {
            $group: {
                _id: '$botConfigId',
                totalInputTokens: { $sum: '$inputTokens' },
                totalOutputTokens: { $sum: '$outputTokens' },
                totalCost: { $sum: '$totalCost' },
                totalApiCalls: { $sum: '$apiCalls' },
                requestCount: { $sum: { $size: '$requestDetails' } }
            }
        }
    ]);
};

// Static method to get monthly usage summary
usageTrackingSchema.statics.getMonthlySummary = function(userId, year, month) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    
    return this.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                date: {
                    $gte: startOfMonth,
                    $lte: endOfMonth
                }
            }
        },
        {
            $group: {
                _id: {
                    day: { $dayOfMonth: '$date' },
                    botConfigId: '$botConfigId'
                },
                dailyInputTokens: { $sum: '$inputTokens' },
                dailyOutputTokens: { $sum: '$outputTokens' },
                dailyCost: { $sum: '$totalCost' },
                dailyApiCalls: { $sum: '$apiCalls' }
            }
        },
        {
            $group: {
                _id: '$_id.botConfigId',
                totalInputTokens: { $sum: '$dailyInputTokens' },
                totalOutputTokens: { $sum: '$dailyOutputTokens' },
                totalCost: { $sum: '$dailyCost' },
                totalApiCalls: { $sum: '$dailyApiCalls' },
                dailyBreakdown: {
                    $push: {
                        day: '$_id.day',
                        inputTokens: '$dailyInputTokens',
                        outputTokens: '$dailyOutputTokens',
                        cost: '$dailyCost',
                        apiCalls: '$dailyApiCalls'
                    }
                }
            }
        },
        {
            $sort: { '_id': 1 }
        }
    ]);
};

// Static method to create or update daily usage
usageTrackingSchema.statics.recordUsage = async function(userId, botConfigId, requestData) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let usageRecord = await this.findOne({
        userId,
        botConfigId,
        date: today
    });
    
    if (!usageRecord) {
        usageRecord = new this({
            userId,
            botConfigId,
            date: today,
            inputTokens: 0,
            outputTokens: 0,
            totalCost: 0,
            apiCalls: 0,
            requestDetails: []
        });
    }
    
    return await usageRecord.addRequest(requestData);
};

// Method to calculate cost per token
usageTrackingSchema.methods.getCostPerToken = function() {
    const totalTokens = this.totalTokens;
    return totalTokens > 0 ? this.totalCost / totalTokens : 0;
};

// Static method to get user's total usage across all time
usageTrackingSchema.statics.getTotalUsage = function(userId) {
    return this.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalInputTokens: { $sum: '$inputTokens' },
                totalOutputTokens: { $sum: '$outputTokens' },
                totalCost: { $sum: '$totalCost' },
                totalApiCalls: { $sum: '$apiCalls' },
                firstUsage: { $min: '$date' },
                lastUsage: { $max: '$date' }
            }
        }
    ]);
};

// Method to check if usage exceeds daily limit
usageTrackingSchema.methods.exceedsDailyLimit = function(dailyLimit) {
    return this.totalCost > dailyLimit;
};

// Pre-save middleware to ensure date is set to start of day
usageTrackingSchema.pre('save', function(next) {
    if (this.isNew || this.isModified('date')) {
        const date = new Date(this.date);
        date.setHours(0, 0, 0, 0);
        this.date = date;
    }
    next();
});

const UsageTracking = mongoose.model('UsageTracking', usageTrackingSchema);

export default UsageTracking;