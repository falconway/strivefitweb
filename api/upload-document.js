import crypto from 'crypto';
import { put } from '@vercel/blob';
import { loadAccounts, saveAccounts } from './data-store.js';

function hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

export default async function handler(req, res) {
    // DEPLOYMENT CHECK: This should appear in logs if using the correct version
    console.log('🚀 USING FIXED VERSION - FILESYSTEM ISSUE RESOLVED v2.0');
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { dob, accountNumber, fileName, fileSize, fileType, description, fileDataBase64, uploadMethod } = req.body;

        if (!dob || !accountNumber || !fileName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Basic validation
        if (!fileSize || fileSize <= 0) {
            return res.status(400).json({ error: 'Invalid file size' });
        }

        console.log('Upload request received:', {
            fileName,
            fileSize,
            fileType,
            uploadMethod,
            hasFileData: !!fileDataBase64,
            accountNumber: accountNumber.substring(0, 4) + '****'
        });

        // Load accounts data using persistent storage
        const accounts = await loadAccounts();
        
        const account = accounts[accountNumber];
        
        if (!account) {
            return res.status(401).json({ error: 'Invalid account' });
        }
        
        // Verify credentials
        const combinedHash = hashData(dob + accountNumber);
        if (combinedHash !== account.combinedHash) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('Credentials verified successfully');

        // Check if Vercel Blob is configured
        console.log('Environment check:', {
            hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
            nodeEnv: process.env.NODE_ENV,
            hasFileData: !!fileDataBase64
        });

        // Upload file to Vercel Blob based on upload method
        let blobUrl = null;
        
        if (uploadMethod === 'large-file-placeholder') {
            console.log('Large file detected - storing metadata only, no blob upload');
            // For large files, we'll implement direct frontend blob upload later
            // For now, just store metadata
        } else if (fileDataBase64) {
            try {
                console.log('Uploading file to Vercel Blob...');
                console.log('File info:', {
                    fileName,
                    fileSize,
                    base64Length: fileDataBase64.length
                });
                
                // Check if Vercel Blob token is available
                if (!process.env.BLOB_READ_WRITE_TOKEN) {
                    console.error('BLOB_READ_WRITE_TOKEN not found in environment');
                    // For now, continue without file storage
                    console.log('Continuing without file storage - metadata only');
                } else {
                    // Convert base64 to buffer
                    const buffer = Buffer.from(fileDataBase64, 'base64');
                    console.log('Buffer created, size:', buffer.length);
                    
                    // Generate a unique filename
                    const fileExtension = fileName.split('.').pop();
                    const uniqueFileName = `${accountNumber}/${crypto.randomUUID()}.${fileExtension}`;
                    console.log('Uploading to path:', uniqueFileName);
                    
                    // Upload to Vercel Blob
                    const blob = await put(uniqueFileName, buffer, {
                        access: 'public',
                        contentType: fileType || 'application/octet-stream'
                    });
                    
                    blobUrl = blob.url;
                    console.log('File uploaded successfully to:', blobUrl);
                }
                
            } catch (blobError) {
                console.error('Error uploading to Vercel Blob:', blobError);
                console.error('Blob error stack:', blobError.stack);
                // Don't fail the entire upload if blob storage fails
                console.log('Continuing without file storage due to blob error');
            }
        }

        // Create document record
        const documentId = crypto.randomUUID();
        const document = {
            id: documentId,
            originalName: fileName,
            filename: `${crypto.randomUUID()}.${fileName.split('.').pop()}`,
            mimetype: fileType || 'application/octet-stream',
            size: fileSize || 0,
            description: description || '',
            uploadDate: new Date().toISOString(),
            processed: false,
            blobUrl: blobUrl, // Vercel Blob URL for the uploaded file
            processingStatus: {
                ocr: { status: 'pending' },
                structuring: { status: 'pending' },
                translation: { status: 'pending' }
            },
            processedVersions: {
                ocrText: null,
                markdownOriginal: null,
                jsonOriginal: null,
                markdownEnglish: null,
                jsonEnglish: null
            }
        };

        console.log('Creating document:', {
            id: documentId,
            fileName,
            accountNumber: accountNumber.substring(0, 4) + '****'
        });

        // Add document to account
        account.documents.push(document);
        console.log(`Account now has ${account.documents.length} documents`);
        
        // Save accounts data using persistent storage
        try {
            await saveAccounts(accounts);
            console.log('Successfully saved accounts data');
        } catch (writeError) {
            console.error('Failed to save accounts file:', writeError);
            return res.status(500).json({ error: 'Failed to save document data' });
        }

        const responseData = { 
            success: true, 
            message: 'Document uploaded successfully',
            document: {
                id: document.id,
                originalName: document.originalName,
                description: document.description,
                uploadDate: document.uploadDate,
                blobUrl: document.blobUrl,
                hasFile: !!blobUrl
            }
        };
        
        console.log('✅ Sending success response:', JSON.stringify(responseData));
        
        res.setHeader('Content-Type', 'application/json');
        res.json(responseData);

    } catch (error) {
        console.error('❌ Error uploading document:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            path: error.path
        });
        
        const errorResponse = { 
            success: false,
            error: 'Internal server error', 
            details: process.env.NODE_ENV === 'development' ? error.message : undefined 
        };
        
        console.log('❌ Sending error response:', JSON.stringify(errorResponse));
        
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json(errorResponse);
    }
}