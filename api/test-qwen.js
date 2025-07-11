// Test endpoint to verify Qwen API is working
import { QwenAPI } from './services/qwen-api.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Testing Qwen API initialization...');
    
    // Test API key availability
    const apiKey = process.env.DASHSCOPE_API_KEY;
    console.log('🔑 API Key check:', apiKey ? `YES (starts with ${apiKey.substring(0, 5)}...)` : 'NO');
    
    // Test QwenAPI constructor
    const qwenAPI = new QwenAPI();
    console.log('✅ QwenAPI initialized successfully');
    
    // Test a simple API call
    const testResponse = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'disable'
      },
      body: JSON.stringify({
        model: 'qwen-max',
        input: {
          messages: [
            {
              role: 'user',
              content: 'Hello, can you respond with "API connection successful"?'
            }
          ]
        },
        parameters: {
          temperature: 0.1,
          max_tokens: 50
        }
      })
    });
    
    console.log('📡 API Response status:', testResponse.status);
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('❌ API Error:', errorText);
      throw new Error(`API error: ${testResponse.status} - ${errorText}`);
    }
    
    const testData = await testResponse.json();
    console.log('✅ API Test successful:', testData);
    
    res.json({
      success: true,
      message: 'Qwen API test successful',
      apiKeyAvailable: !!apiKey,
      apiResponse: testData
    });
    
  } catch (error) {
    console.error('❌ Qwen API test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      apiKeyAvailable: !!process.env.DASHSCOPE_API_KEY
    });
  }
}