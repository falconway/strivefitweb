import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

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
    // Authenticate user first
    const dataPath = path.join(process.cwd(), 'backend/data/accounts.json');
    const data = await fs.readFile(dataPath, 'utf8');
    const accounts = JSON.parse(data);
    
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

    // Update processing status
    document.processingStatus = {
      ocr: { status: 'processing', startTime: new Date().toISOString() },
      structuring: { status: 'pending' },
      translation: { status: 'pending' }
    };
    await fs.writeFile(dataPath, JSON.stringify(accounts, null, 2));

    // Execute Python OCR script (simplified for Vercel)
    const pythonScript = path.join(process.cwd(), 'backend/services/qwen_bridge.py');
    const uploadPath = path.join(process.cwd(), 'backend/uploads', document.filename);
    
    const pythonProcess = spawn('python3', [pythonScript, uploadPath, documentId]);
    
    let result = '';
    let error = '';
    
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    pythonProcess.on('close', async (code) => {
      try {
        // Reload accounts data
        const updatedData = await fs.readFile(dataPath, 'utf8');
        const updatedAccounts = JSON.parse(updatedData);
        const updatedAccount = updatedAccounts[accountNumber];
        const updatedDocument = updatedAccount.documents.find(doc => doc.id === documentId);

        if (code === 0) {
          // Parse the result
          const processResult = JSON.parse(result);
          
          if (processResult.success) {
            // Update document status
            updatedDocument.processed = true;
            updatedDocument.processingStatus = {
              ocr: { 
                status: 'completed',
                processingTime: processResult.processing_time?.ocr || 0
              },
              structuring: { 
                status: 'completed',
                processingTime: processResult.processing_time?.ocr || 0
              },
              translation: { 
                status: 'completed',
                processingTime: processResult.processing_time?.translation || 0
              }
            };
            
            updatedDocument.processedVersions = {
              ocrText: processResult.extracted_text,
              markdownOriginal: `${documentId}-ocr.md`,
              jsonOriginal: `${documentId}-ocr.json`,
              markdownEnglish: `${documentId}-translated.md`,
              jsonEnglish: `${documentId}-translated.json`
            };
          } else {
            updatedDocument.processingStatus.ocr.status = 'failed';
            updatedDocument.processingStatus.ocr.error = processResult.error;
          }
        } else {
          updatedDocument.processingStatus.ocr.status = 'failed';
          updatedDocument.processingStatus.ocr.error = error || 'Processing failed';
        }

        // Save updated accounts data
        await fs.writeFile(dataPath, JSON.stringify(updatedAccounts, null, 2));
        
      } catch (updateError) {
        console.error('Error updating document status:', updateError);
      }
    });
    
    // Set timeout for long-running processes
    setTimeout(() => {
      pythonProcess.kill();
    }, 55000); // 55 seconds (under Vercel's 60s limit)
    
    // Return immediately
    res.json({ 
      success: true, 
      message: 'Processing started with Qwen AI'
    });
    
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}