/**
 * Advanced cost calculation utilities for OpenAI API usage
 */

/**
 * OpenAI pricing tiers and volume discounts
 * These should be updated regularly to reflect current pricing
 */
const PRICING_TIERS = {
    'gpt-4': {
        input: [
            { threshold: 0, price: 0.03 },
            { threshold: 1000000, price: 0.025 }, // Volume discount after 1M tokens
            { threshold: 10000000, price: 0.02 }  // Higher discount after 10M tokens
        ],
        output: [
            { threshold: 0, price: 0.06 },
            { threshold: 1000000, price: 0.05 },
            { threshold: 10000000, price: 0.04 }
        ]
    },
    'gpt-4-turbo': {
        input: [
            { threshold: 0, price: 0.01 },
            { threshold: 1000000, price: 0.008 },
            { threshold: 10000000, price: 0.006 }
        ],
        output: [
            { threshold: 0, price: 0.03 },
            { threshold: 1000000, price: 0.025 },
            { threshold: 10000000, price: 0.02 }
        ]
    },
    'gpt-3.5-turbo': {
        input: [
            { threshold: 0, price: 0.0015 },
            { threshold: 1000000, price: 0.001 },
            { threshold: 10000000, price: 0.0008 }
        ],
        output: [
            { threshold: 0, price: 0.002 },
            { threshold: 1000000, price: 0.0015 },
            { threshold: 10000000, price: 0.001 }
        ]
    },
    'gpt-4o': {
        input: [
            { threshold: 0, price: 0.005 },
            { threshold: 1000000, price: 0.004 },
            { threshold: 10000000, price: 0.003 }
        ],
        output: [
            { threshold: 0, price: 0.015 },
            { threshold: 1000000, price: 0.012 },
            { threshold: 10000000, price: 0.01 }
        ]
    },
    'gpt-4o-mini': {
        input: [
            { threshold: 0, price: 0.00015 },
            { threshold: 1000000, price: 0.0001 },
            { threshold: 10000000, price: 0.00008 }
        ],
        output: [
            { threshold: 0, price: 0.0006 },
            { threshold: 1000000, price: 0.0005 },
            { threshold: 10000000, price: 0.0004 }
        ]
    }
};

class CostCalculator {
    /**
     * Calculate cost with volume discounts
     * @param {string} model - OpenAI model name
     * @param {number} inputTokens - Number of input tokens
     * @param {number} outputTokens - Number of output tokens
     * @param {number} monthlyUsage - Monthly token usage for volume discounts
     * @returns {Object} Detailed cost breakdown
     */
    static calculateAdvancedCost(model, inputTokens, outputTokens, monthlyUsage = 0) {
        try {
            const normalizedModel = model.toLowerCase().replace(/[^a-z0-9-]/g, '');
            let pricing = PRICING_TIERS[normalizedModel];
            
            // Fallback to similar models if exact match not found
            if (!pricing) {
                if (normalizedModel.includes('gpt-4o-mini')) {
                    pricing = PRICING_TIERS['gpt-4o-mini'];
                } else if (normalizedModel.includes('gpt-4o')) {
                    pricing = PRICING_TIERS['gpt-4o'];
                } else if (normalizedModel.includes('gpt-4-turbo')) {
                    pricing = PRICING_TIERS['gpt-4-turbo'];
                } else if (normalizedModel.includes('gpt-4')) {
                    pricing = PRICING_TIERS['gpt-4'];
                } else if (normalizedModel.includes('gpt-3.5')) {
                    pricing = PRICING_TIERS['gpt-3.5-turbo'];
                } else {
                    pricing = PRICING_TIERS['gpt-4o-mini']; // Default to cheapest
                }
            }

            // Calculate input cost with volume discounts
            const inputPrice = this.getVolumePrice(pricing.input, monthlyUsage);
            const outputPrice = this.getVolumePrice(pricing.output, monthlyUsage);

            const inputCost = (inputTokens / 1000) * inputPrice;
            const outputCost = (outputTokens / 1000) * outputPrice;
            const totalCost = inputCost + outputCost;

            return {
                model: normalizedModel,
                inputTokens,
                outputTokens,
                totalTokens: inputTokens + outputTokens,
                costs: {
                    input: Number(inputCost.toFixed(8)),
                    output: Number(outputCost.toFixed(8)),
                    total: Number(totalCost.toFixed(8))
                },
                pricing: {
                    inputPricePer1K: inputPrice,
                    outputPricePer1K: outputPrice,
                    volumeTier: this.getVolumeTier(monthlyUsage)
                },
                monthlyUsage,
                savings: this.calculateSavings(pricing, inputTokens, outputTokens, monthlyUsage)
            };
        } catch (error) {
            console.error('Error calculating advanced cost:', error);
            return null;
        }
    }

    /**
     * Get price based on volume tier
     * @param {Array} pricingTiers - Array of pricing tiers
     * @param {number} monthlyUsage - Monthly token usage
     * @returns {number} Price per 1K tokens
     */
    static getVolumePrice(pricingTiers, monthlyUsage) {
        for (let i = pricingTiers.length - 1; i >= 0; i--) {
            if (monthlyUsage >= pricingTiers[i].threshold) {
                return pricingTiers[i].price;
            }
        }
        return pricingTiers[0].price;
    }

    /**
     * Get volume tier name
     * @param {number} monthlyUsage - Monthly token usage
     * @returns {string} Volume tier name
     */
    static getVolumeTier(monthlyUsage) {
        if (monthlyUsage >= 10000000) return 'Enterprise';
        if (monthlyUsage >= 1000000) return 'High Volume';
        return 'Standard';
    }

    /**
     * Calculate potential savings from volume discounts
     * @param {Object} pricing - Pricing structure
     * @param {number} inputTokens - Input tokens
     * @param {number} outputTokens - Output tokens
     * @param {number} monthlyUsage - Monthly usage
     * @returns {Object} Savings information
     */
    static calculateSavings(pricing, inputTokens, outputTokens, monthlyUsage) {
        const standardInputPrice = pricing.input[0].price;
        const standardOutputPrice = pricing.output[0].price;
        const currentInputPrice = this.getVolumePrice(pricing.input, monthlyUsage);
        const currentOutputPrice = this.getVolumePrice(pricing.output, monthlyUsage);

        const standardCost = (inputTokens / 1000) * standardInputPrice + (outputTokens / 1000) * standardOutputPrice;
        const currentCost = (inputTokens / 1000) * currentInputPrice + (outputTokens / 1000) * currentOutputPrice;
        const savings = standardCost - currentCost;

        return {
            amount: Number(savings.toFixed(8)),
            percentage: standardCost > 0 ? Number(((savings / standardCost) * 100).toFixed(2)) : 0,
            tier: this.getVolumeTier(monthlyUsage)
        };
    }

    /**
     * Estimate cost for different usage scenarios
     * @param {string} model - OpenAI model name
     * @param {Object} scenarios - Usage scenarios
     * @returns {Object} Cost estimates for each scenario
     */
    static estimateScenarioCosts(model, scenarios) {
        const estimates = {};

        Object.entries(scenarios).forEach(([scenarioName, scenario]) => {
            const {
                dailyRequests = 0,
                avgInputTokens = 0,
                avgOutputTokens = 0,
                daysPerMonth = 30
            } = scenario;

            const monthlyInputTokens = dailyRequests * avgInputTokens * daysPerMonth;
            const monthlyOutputTokens = dailyRequests * avgOutputTokens * daysPerMonth;
            const monthlyTotalTokens = monthlyInputTokens + monthlyOutputTokens;

            const costBreakdown = this.calculateAdvancedCost(
                model,
                monthlyInputTokens,
                monthlyOutputTokens,
                monthlyTotalTokens
            );

            estimates[scenarioName] = {
                ...costBreakdown,
                scenario: {
                    dailyRequests,
                    avgInputTokens,
                    avgOutputTokens,
                    daysPerMonth
                },
                projections: {
                    daily: Number((costBreakdown.costs.total / daysPerMonth).toFixed(6)),
                    weekly: Number((costBreakdown.costs.total / 4.33).toFixed(6)),
                    monthly: costBreakdown.costs.total,
                    yearly: Number((costBreakdown.costs.total * 12).toFixed(2))
                }
            };
        });

        return estimates;
    }

    /**
     * Calculate cost optimization recommendations
     * @param {Array} usageHistory - Historical usage data
     * @returns {Object} Optimization recommendations
     */
    static getOptimizationRecommendations(usageHistory) {
        const recommendations = [];
        
        if (!usageHistory || usageHistory.length === 0) {
            return { recommendations: [] };
        }

        // Analyze model usage patterns
        const modelUsage = {};
        let totalCost = 0;
        let totalTokens = 0;

        usageHistory.forEach(record => {
            record.requestDetails.forEach(request => {
                if (!modelUsage[request.model]) {
                    modelUsage[request.model] = {
                        requests: 0,
                        inputTokens: 0,
                        outputTokens: 0,
                        cost: 0
                    };
                }
                
                modelUsage[request.model].requests += 1;
                modelUsage[request.model].inputTokens += request.inputTokens;
                modelUsage[request.model].outputTokens += request.outputTokens;
                modelUsage[request.model].cost += request.cost;
                
                totalCost += request.cost;
                totalTokens += request.inputTokens + request.outputTokens;
            });
        });

        // Check for expensive model usage
        Object.entries(modelUsage).forEach(([model, usage]) => {
            const avgCostPerToken = usage.cost / (usage.inputTokens + usage.outputTokens);
            
            if (model.includes('gpt-4') && !model.includes('turbo') && usage.requests > 10) {
                const potentialSavings = this.calculateModelSwitchSavings(usage, 'gpt-4-turbo');
                if (potentialSavings.monthlySavings > 1) {
                    recommendations.push({
                        type: 'model_optimization',
                        priority: 'high',
                        title: 'Consider switching to GPT-4 Turbo',
                        description: `You could save approximately $${potentialSavings.monthlySavings.toFixed(2)}/month by switching from ${model} to GPT-4 Turbo`,
                        currentModel: model,
                        recommendedModel: 'gpt-4-turbo',
                        estimatedSavings: potentialSavings
                    });
                }
            }
        });

        // Check for volume discount opportunities
        if (totalTokens > 500000) {
            recommendations.push({
                type: 'volume_discount',
                priority: 'medium',
                title: 'Volume discount opportunity',
                description: 'Your usage qualifies for volume discounts. Contact OpenAI for enterprise pricing.',
                monthlyTokens: totalTokens,
                currentTier: this.getVolumeTier(totalTokens)
            });
        }

        // Check for usage patterns
        const avgCostPerToken = totalCost / totalTokens;
        if (avgCostPerToken > 0.00005) { // Threshold for expensive usage
            recommendations.push({
                type: 'usage_optimization',
                priority: 'medium',
                title: 'Optimize prompt efficiency',
                description: 'Your average cost per token is high. Consider optimizing prompts to reduce token usage.',
                avgCostPerToken,
                suggestions: [
                    'Use more concise prompts',
                    'Implement prompt caching',
                    'Consider using system messages effectively'
                ]
            });
        }

        return {
            recommendations,
            analysis: {
                totalCost,
                totalTokens,
                avgCostPerToken,
                modelBreakdown: modelUsage,
                optimizationPotential: recommendations.length > 0
            }
        };
    }

    /**
     * Calculate savings from switching models
     * @param {Object} currentUsage - Current model usage
     * @param {string} newModel - New model to switch to
     * @returns {Object} Savings calculation
     */
    static calculateModelSwitchSavings(currentUsage, newModel) {
        const currentCost = currentUsage.cost;
        const newCost = this.calculateAdvancedCost(
            newModel,
            currentUsage.inputTokens,
            currentUsage.outputTokens
        );

        const savings = currentCost - newCost.costs.total;
        const monthlySavings = savings * (30 / 1); // Assuming daily usage

        return {
            currentCost,
            newCost: newCost.costs.total,
            savings,
            monthlySavings,
            percentage: currentCost > 0 ? (savings / currentCost) * 100 : 0
        };
    }

    /**
     * Get real-time pricing for all models
     * @returns {Object} Current pricing for all models
     */
    static getAllCurrentPricing() {
        const pricing = {};
        
        Object.entries(PRICING_TIERS).forEach(([model, tiers]) => {
            pricing[model] = {
                input: tiers.input[0].price,
                output: tiers.output[0].price,
                volumeTiers: {
                    standard: {
                        input: tiers.input[0].price,
                        output: tiers.output[0].price
                    },
                    highVolume: tiers.input.length > 1 ? {
                        input: tiers.input[1].price,
                        output: tiers.output[1].price,
                        threshold: tiers.input[1].threshold
                    } : null,
                    enterprise: tiers.input.length > 2 ? {
                        input: tiers.input[2].price,
                        output: tiers.output[2].price,
                        threshold: tiers.input[2].threshold
                    } : null
                }
            };
        });

        return {
            models: pricing,
            currency: 'USD',
            unit: 'per 1K tokens',
            lastUpdated: new Date().toISOString(),
            note: 'Prices include volume discounts. Contact OpenAI for current enterprise rates.'
        };
    }
}

export default CostCalculator;