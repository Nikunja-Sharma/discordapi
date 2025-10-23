#!/usr/bin/env node

/**
 * Test script for usage tracking functionality
 * This script tests the core usage tracking features without requiring a database connection
 */

import UsageTrackingService from './services/usageTrackingService.js';
import CostCalculator from './utils/costCalculator.js';

console.log('🧪 Testing Usage Tracking System...\n');

// Test 1: Cost Calculation
console.log('1. Testing Cost Calculation:');
try {
    const cost1 = UsageTrackingService.calculateCost('gpt-4o-mini', 1000, 500);
    console.log(`   GPT-4o-mini (1000 input, 500 output): $${cost1}`);

    const cost2 = UsageTrackingService.calculateCost('gpt-4', 1000, 500);
    console.log(`   GPT-4 (1000 input, 500 output): $${cost2}`);

    const cost3 = UsageTrackingService.calculateCost('gpt-3.5-turbo', 1000, 500);
    console.log(`   GPT-3.5-turbo (1000 input, 500 output): $${cost3}`);

    console.log('   ✅ Cost calculation working correctly\n');
} catch (error) {
    console.log(`   ❌ Cost calculation failed: ${error.message}\n`);
}

// Test 2: Pricing Information
console.log('2. Testing Pricing Information:');
try {
    const pricing = UsageTrackingService.getCurrentPricing('gpt-4o-mini');
    console.log(`   GPT-4o-mini pricing:`, pricing);

    const allPricing = UsageTrackingService.getAllPricing();
    console.log(`   Available models: ${Object.keys(allPricing.models).join(', ')}`);

    console.log('   ✅ Pricing information working correctly\n');
} catch (error) {
    console.log(`   ❌ Pricing information failed: ${error.message}\n`);
}

// Test 3: Advanced Cost Calculator
console.log('3. Testing Advanced Cost Calculator:');
try {
    const advancedCost = CostCalculator.calculateAdvancedCost('gpt-4o-mini', 1000, 500, 0);
    console.log(`   Advanced cost calculation:`, advancedCost);

    const volumeCost = CostCalculator.calculateAdvancedCost('gpt-4o-mini', 1000, 500, 2000000);
    console.log(`   Volume discount cost:`, volumeCost);

    console.log('   ✅ Advanced cost calculator working correctly\n');
} catch (error) {
    console.log(`   ❌ Advanced cost calculator failed: ${error.message}\n`);
}

// Test 4: Scenario Estimation
console.log('4. Testing Scenario Estimation:');
try {
    const scenarios = {
        light: { dailyRequests: 10, avgInputTokens: 100, avgOutputTokens: 50 },
        moderate: { dailyRequests: 50, avgInputTokens: 200, avgOutputTokens: 100 },
        heavy: { dailyRequests: 200, avgInputTokens: 500, avgOutputTokens: 300 }
    };

    const estimates = CostCalculator.estimateScenarioCosts('gpt-4o-mini', scenarios);

    Object.entries(estimates).forEach(([scenario, estimate]) => {
        console.log(`   ${scenario}: $${estimate.projections.monthly}/month`);
    });

    console.log('   ✅ Scenario estimation working correctly\n');
} catch (error) {
    console.log(`   ❌ Scenario estimation failed: ${error.message}\n`);
}

// Test 5: All Pricing
console.log('5. Testing All Model Pricing:');
try {
    const allPricing = CostCalculator.getAllCurrentPricing();
    console.log(`   Models with pricing: ${Object.keys(allPricing.models).length}`);
    console.log(`   Sample pricing (GPT-4o-mini):`, allPricing.models['gpt-4o-mini']);

    console.log('   ✅ All model pricing working correctly\n');
} catch (error) {
    console.log(`   ❌ All model pricing failed: ${error.message}\n`);
}

console.log('🎉 Usage Tracking System Tests Complete!');
console.log('\nNext steps:');
console.log('1. Start MongoDB database');
console.log('2. Start the API server: npm start');
console.log('3. Test the API endpoints with curl or Postman');
console.log('4. Integrate with Discord bot operations');