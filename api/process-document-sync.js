/**
 * Synchronous document processing - completes within Vercel timeout
 * Uses aggressive timeouts to ensure completion
 */

import crypto from 'crypto';
import { loadAccounts, saveAccounts } from './data-store.js';
import { OpenRouterAPI } from './services/openrouter-api.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { documentId, dob, accountNumber } = req.body;
  
  if (!documentId || !dob || !accountNumber) {
    return res.status(400).json({ 
      error: 'Document ID, DOB, and account number are required' 
    });
  }

  try {
    console.log('🔄 Synchronous processing document with OpenRouter:', documentId);
    
    // Load accounts data
    const accounts = await loadAccounts();
    const account = accounts[accountNumber];
    
    if (!account) {
      return res.status(401).json({ error: 'Invalid account' });
    }
    
    const combinedHash = crypto.createHash('sha256').update(dob + accountNumber).digest('hex');
    if (combinedHash !== account.combinedHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Find the document
    const document = account.documents.find(doc => doc.id === documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    if (!document.blobUrl) {
      return res.status(400).json({ error: 'Document file not available for processing' });
    }

    console.log('🚀 Starting immediate OpenRouter processing');
    
    // Process document with OpenRouter API with aggressive timeout
    const openRouterAPI = new OpenRouterAPI();
    const processResult = await openRouterAPI.processDocument(document, document.blobUrl);
    
    if (processResult.success) {
      console.log('✅ Processing completed successfully');
      
      // Update document with results
      document.processed = true;
      document.processingStatus = {
        ocr: { 
          status: 'completed',
          completedAt: new Date().toISOString(),
          processingTime: processResult.processing_time.ocr_translation
        },
        structuring: { 
          status: 'completed', 
          completedAt: new Date().toISOString(),
          processingTime: 0
        },
        translation: { 
          status: 'completed',
          completedAt: new Date().toISOString(), 
          processingTime: 0
        }
      };
      
      // Generate markdown file
      const markdownFile = await openRouterAPI.generateMarkdownFile(document, processResult);
      
      document.processedVersions = {
        ocrText: processResult.translated_text,
        markdownOriginal: markdownFile || `${document.id}-ocr.md`,
        jsonOriginal: `${document.id}-ocr.json`,
        markdownEnglish: markdownFile || `${document.id}-translated.md`, 
        jsonEnglish: `${document.id}-translated.json`,
        structuredData: {
          document_type: 'medical_report',
          model_used: processResult.model_used,
          tier: processResult.tier,
          tokens_used: processResult.tokens_used,
          estimated_cost: processResult.estimated_cost
        },
        translatedData: {
          original_language: 'chinese',
          target_language: 'english',
          translated_text: processResult.translated_text,
          model: processResult.model_name,
          processing_time: processResult.processing_time
        }
      };
      
      // Save updated accounts
      await saveAccounts(accounts);
      
      return res.json({
        success: true,
        message: 'Document processed successfully',
        model_used: processResult.model_name,
        processing_time: processResult.processing_time,
        estimated_cost: processResult.estimated_cost,
        attempts: processResult.attempts
      });
      
    } else {
      console.error('❌ Processing failed:', processResult.error);
      
      // Update document with failure status
      document.processingStatus = {
        ocr: { status: 'failed', error: processResult.error },
        structuring: { status: 'failed', error: processResult.error },
        translation: { status: 'failed', error: processResult.error }
      };
      
      await saveAccounts(accounts);
      
      return res.status(500).json({
        success: false,
        error: processResult.error,
        attempts: processResult.attempts
      });
    }
    
  } catch (error) {
    console.error('❌ Synchronous processing error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}