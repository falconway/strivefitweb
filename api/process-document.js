import crypto from 'crypto';
import { loadAccounts, saveAccounts } from './data-store.js';
import { QwenAPI } from './services/qwen-api.js';

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
    
    // Load accounts data using persistent storage
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

    // Update processing status to indicate start
    document.processingStatus = {
      ocr: { status: 'processing', startTime: new Date().toISOString() },
      structuring: { status: 'pending' },
      translation: { status: 'pending' }
    };
    
    // Save initial status update
    await saveAccounts(accounts);

    // Process document with Qwen AI Simulator
    // Return immediately to avoid timeout, process asynchronously
    res.json({ 
      success: true, 
      message: 'Processing started with Qwen AI'
    });
    
    // Start background processing (don't await to return response immediately)
    processDocumentAsync(document, accounts, accountNumber).catch(error => {
      console.error('❌ Background processing error:', error);
    });
    
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Process document asynchronously with REAL Qwen AI API
 */
async function processDocumentAsync(document, accounts, accountNumber) {
  const qwenAPI = new QwenAPI();
  
  try {
    console.log('🚀 Starting background Qwen processing for:', document.originalName);
    
    // Process document with REAL Qwen API
    const processResult = await qwenAPI.processDocument(document, document.blobUrl);
    
    // Reload accounts data (it might have been updated)
    const updatedAccounts = await loadAccounts();
    const updatedAccount = updatedAccounts[accountNumber];
    const updatedDocument = updatedAccount.documents.find(doc => doc.id === document.id);
    
    if (!updatedDocument) {
      console.error('❌ Document not found after processing:', document.id);
      return;
    }
    
    if (processResult.success) {
      console.log('✅ Qwen processing completed successfully');
      
      // Update document with results
      updatedDocument.processed = true;
      updatedDocument.processingStatus = {
        ocr: { 
          status: 'completed',
          completedAt: new Date().toISOString(),
          processingTime: processResult.processing_time.ocr
        },
        structuring: { 
          status: 'completed', 
          completedAt: new Date().toISOString(),
          processingTime: processResult.processing_time.structuring
        },
        translation: { 
          status: 'completed',
          completedAt: new Date().toISOString(), 
          processingTime: processResult.processing_time.translation
        }
      };
      
      // Generate and store processed files with REAL content
      const markdownFiles = await qwenAPI.generateMarkdownFiles(
        document, 
        { text: processResult.extracted_text, confidence: processResult.confidence.ocr, model: 'qwen-vl-plus', processingTime: processResult.processing_time.ocr, structured_data: processResult.structured_data },
        processResult.translated_data
      );
      
      updatedDocument.processedVersions = {
        ocrText: processResult.extracted_text,
        markdownOriginal: markdownFiles.ocrMarkdown || `${document.id}-ocr.md`,
        jsonOriginal: `${document.id}-ocr.json`,
        markdownEnglish: markdownFiles.translatedMarkdown || `${document.id}-translated.md`, 
        jsonEnglish: `${document.id}-translated.json`,
        structuredData: processResult.structured_data,
        translatedData: processResult.translated_data
      };
      
    } else {
      console.error('❌ Qwen processing failed:', processResult.error);
      
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