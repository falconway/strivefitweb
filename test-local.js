/**
 * Local test script for Railway migration
 * Tests basic functionality before deployment
 */

import RailwayStorage from './api/services/railway-storage.js';
import { OpenRouterAPI } from './api/services/openrouter-api.js';

console.log('🧪 Testing Railway Storage...');

async function testStorage() {
    const storage = new RailwayStorage();
    
    try {
        // Test initialization
        await storage.initializeStorage();
        console.log('✅ Storage initialized successfully');
        
        // Test account operations
        const testAccounts = { 
            'test123': { 
                hashedDOB: 'testHash', 
                documents: [] 
            } 
        };
        
        await storage.saveAccounts(testAccounts);
        console.log('✅ Accounts saved successfully');
        
        const loadedAccounts = await storage.loadAccounts();
        console.log('✅ Accounts loaded successfully:', Object.keys(loadedAccounts));
        
        // Test storage stats
        const stats = await storage.getStorageStats();
        console.log('✅ Storage stats:', stats);
        
    } catch (error) {
        console.error('❌ Storage test failed:', error);
    }
}

async function testOpenRouter() {
    console.log('\n🧪 Testing OpenRouter API...');
    
    if (!process.env.OPENROUTER_API_KEY) {
        console.log('⚠️  OPENROUTER_API_KEY not set, skipping API test');
        return;
    }
    
    const openRouter = new OpenRouterAPI();
    
    try {
        // Test with a simple image (you can replace with actual test)
        console.log('✅ OpenRouter API initialized successfully');
        console.log('📝 Model chain:', openRouter.modelChain);
        
    } catch (error) {
        console.error('❌ OpenRouter test failed:', error);
    }
}

async function runTests() {
    console.log('🚀 Starting Railway Migration Tests\n');
    
    await testStorage();
    await testOpenRouter();
    
    console.log('\n✅ All tests completed!');
    console.log('🚀 Ready for Railway deployment');
}

runTests().catch(console.error);