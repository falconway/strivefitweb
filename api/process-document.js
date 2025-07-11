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
    console.log('🔄 Processing document with Qwen AI:', documentId);
    console.log('📊 Request body:', { documentId, dob: dob ? 'provided' : 'missing', accountNumber: accountNumber ? 'provided' : 'missing' });
    
    // Load accounts data using persistent storage
    console.log('📂 Loading accounts data...');
    const accounts = await loadAccounts();
    console.log('✅ Accounts loaded, total:', Object.keys(accounts).length);
    
    const account = accounts[accountNumber];
    if (!account) {
      console.error('❌ Account not found:', accountNumber);
      return res.status(401).json({ error: 'Invalid account' });
    }
    console.log('✅ Account found with', account.documents.length, 'documents');
    
    const combinedHash = crypto.createHash('sha256').update(dob + accountNumber).digest('hex');
    if (combinedHash !== account.combinedHash) {
      console.error('❌ Invalid credentials for account:', accountNumber);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    console.log('✅ Credentials validated');

    // Find the document
    const document = account.documents.find(doc => doc.id === documentId);
    if (!document) {
      console.error('❌ Document not found:', documentId);
      return res.status(404).json({ error: 'Document not found' });
    }
    console.log('✅ Document found:', document.originalName);
    
    if (!document.blobUrl) {
      console.error('❌ Document blob URL not available:', documentId);
      return res.status(400).json({ error: 'Document file not available for processing' });
    }
    console.log('✅ Document blob URL available');

    // Update processing status to indicate start
    console.log('📝 Updating processing status...');
    document.processingStatus = {
      ocr: { status: 'processing', startTime: new Date().toISOString() },
      structuring: { status: 'pending' },
      translation: { status: 'pending' }
    };
    
    // Save initial status update
    await saveAccounts(accounts);
    console.log('✅ Initial processing status saved');

    // Return immediately to avoid timeout, process asynchronously
    console.log('📤 Returning success response and starting background processing...');
    res.json({ 
      success: true, 
      message: 'Processing started with OpenRouter AI'
    });
    
    // Start background processing with shorter timeout protection
    console.log('🚀 Starting background processing...');
    
    // Use setTimeout to ensure processing doesn't block response
    setTimeout(() => {
      processDocumentAsync(document, accounts, accountNumber).catch(error => {
        console.error('❌ Background processing error:', error);
      });
    }, 100); // Start processing 100ms after response is sent
    
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Process document asynchronously with OpenRouter AI API
 */
async function processDocumentAsync(document, accounts, accountNumber) {
  try {
    console.log('🚀 Starting background OpenRouter processing for:', document.originalName);
    console.log('🔧 Initializing OpenRouterAPI...');
    
    const openRouterAPI = new OpenRouterAPI();
    console.log('✅ OpenRouterAPI initialized successfully');
    
    // Process document with OpenRouter API (OCR + Translation in one step)
    const processResult = await openRouterAPI.processDocument(document, document.blobUrl);
    
    // Reload accounts data (it might have been updated)
    const updatedAccounts = await loadAccounts();
    const updatedAccount = updatedAccounts[accountNumber];
    const updatedDocument = updatedAccount.documents.find(doc => doc.id === document.id);
    
    if (!updatedDocument) {
      console.error('❌ Document not found after processing:', document.id);
      return;
    }
    
    if (processResult.success) {
      console.log('✅ OpenRouter processing completed successfully');
      console.log('🎯 Model used:', processResult.model_name);
      console.log('💰 Estimated cost:', `$${processResult.estimated_cost.toFixed(4)}`);
      
      // Update document with results
      updatedDocument.processed = true;
      updatedDocument.processingStatus = {
        ocr: { 
          status: 'completed',
          completedAt: new Date().toISOString(),
          processingTime: processResult.processing_time.ocr_translation
        },
        structuring: { 
          status: 'completed', 
          completedAt: new Date().toISOString(),
          processingTime: 0 // Combined with OCR
        },
        translation: { 
          status: 'completed',
          completedAt: new Date().toISOString(), 
          processingTime: 0 // Combined with OCR
        }
      };
      
      // Generate and store processed files with OpenRouter content
      const markdownFile = await openRouterAPI.generateMarkdownFile(document, processResult);
      
      updatedDocument.processedVersions = {
        ocrText: processResult.translated_text, // OpenRouter does OCR+translation in one step
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
      
    } else {
      console.error('❌ OpenRouter processing failed:', processResult.error);
      
      updatedDocument.processingStatus = {
        ocr: { status: 'failed', error: processResult.error },
        structuring: { status: 'failed', error: processResult.error },
        translation: { status: 'failed', error: processResult.error }
      };
    }
    
    // Save updated accounts data
    await saveAccounts(updatedAccounts);
    console.log('💾 Document processing results saved');
    
  } catch (error) {
    console.error('❌ Background processing error:', error);
    
    try {
      // Mark processing as failed
      const failedAccounts = await loadAccounts();
      const failedAccount = failedAccounts[accountNumber];
      const failedDocument = failedAccount.documents.find(doc => doc.id === document.id);
      
      if (failedDocument) {
        failedDocument.processingStatus = {
          ocr: { status: 'failed', error: error.message },
          structuring: { status: 'failed', error: error.message },
          translation: { status: 'failed', error: error.message }
        };
        await saveAccounts(failedAccounts);
      }
    } catch (saveError) {
      console.error('❌ Error saving failed status:', saveError);
    }
  }
}