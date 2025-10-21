#!/usr/bin/env node

/**
 * Render Discord Connectivity Test
 * This script tests if Render can connect to Discord's API
 */

import https from 'https';
import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Render Discord Connectivity Test');
console.log('=====================================');

// Test 1: Basic HTTP connectivity to Discord API
async function testHttpConnectivity() {
    console.log('\n1. Testing HTTP connectivity to Discord API...');
    
    return new Promise((resolve) => {
        const req = https.request('https://discord.com/api/v10/gateway', { 
            method: 'GET',
            timeout: 10000
        }, (res) => {
            console.log(`✅ HTTP Status: ${res.statusCode}`);
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    console.log(`✅ Gateway URL: ${parsed.url}`);
                    resolve(true);
                } catch (e) {
                    console.log('✅ Response received (parsing failed)');
                    resolve(true);
                }
            });
        });
        
        req.on('error', (err) => {
            console.log(`❌ HTTP Error: ${err.message}`);
            resolve(false);
        });
        
        req.on('timeout', () => {
            console.log('❌ HTTP Timeout');
            req.destroy();
            resolve(false);
        });
        
        req.end();
    });
}

// Test 2: WebSocket connectivity (Discord bot login)
async function testWebSocketConnectivity() {
    console.log('\n2. Testing WebSocket connectivity (Discord bot login)...');
    
    if (!process.env.DISCORD_BOT_TOKEN) {
        console.log('❌ DISCORD_BOT_TOKEN not set');
        return false;
    }
    
    return new Promise((resolve) => {
        const client = new Client({
            intents: [GatewayIntentBits.Guilds]
        });
        
        const timeout = setTimeout(() => {
            console.log('❌ WebSocket Timeout (30s)');
            client.destroy();
            resolve(false);
        }, 30000);
        
        client.once('ready', () => {
            console.log(`✅ WebSocket Connected as ${client.user.tag}`);
            clearTimeout(timeout);
            client.destroy();
            resolve(true);
        });
        
        client.on('error', (error) => {
            console.log(`❌ WebSocket Error: ${error.message}`);
            clearTimeout(timeout);
            client.destroy();
            resolve(false);
        });
        
        client.login(process.env.DISCORD_BOT_TOKEN).catch((error) => {
            console.log(`❌ Login Error: ${error.message}`);
            clearTimeout(timeout);
            resolve(false);
        });
    });
}

// Test 3: Environment check
function testEnvironment() {
    console.log('\n3. Environment Check...');
    
    const required = ['DISCORD_BOT_TOKEN', 'DISCORD_APPLICATION_ID'];
    let allSet = true;
    
    required.forEach(key => {
        const isSet = !!process.env[key];
        console.log(`${isSet ? '✅' : '❌'} ${key}: ${isSet ? 'SET' : 'MISSING'}`);
        if (!isSet) allSet = false;
    });
    
    return allSet;
}

// Run all tests
async function runTests() {
    const envOk = testEnvironment();
    const httpOk = await testHttpConnectivity();
    const wsOk = await testWebSocketConnectivity();
    
    console.log('\n📊 Test Results:');
    console.log('================');
    console.log(`Environment: ${envOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`HTTP API: ${httpOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`WebSocket: ${wsOk ? '✅ PASS' : '❌ FAIL'}`);
    
    if (!httpOk || !wsOk) {
        console.log('\n🚨 RENDER NETWORKING ISSUE DETECTED');
        console.log('Render appears to be blocking Discord connections.');
        console.log('This is a known issue with some Render deployments.');
        console.log('\nSolutions:');
        console.log('1. Try redeploying your service');
        console.log('2. Contact Render support');
        console.log('3. Consider alternative hosting (Railway, Heroku, etc.)');
    } else {
        console.log('\n🎉 All tests passed! Discord should work.');
    }
    
    process.exit(wsOk ? 0 : 1);
}

runTests().catch(console.error);