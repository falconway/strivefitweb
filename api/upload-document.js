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
        const { dob, accountNumber, fileName, fileSize, fileType, description, fileDataBase64 } = req.body;

        if (!dob || !accountNumber || !fileName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // File size validation - 4MB limit for reliable operation
        const maxFileSize = 4 * 1024 * 1024; // 4MB
        if (!fileSize || fileSize <= 0) {
            return res.status(400).json({ error: 'Invalid file size' });
        }
        if (fileSize > maxFileSize) {
            return res.status(400).json({ error: 'File too large. Maximum size is 4MB.' });
        }

        console.log('📤 Upload:', fileName, `(${Math.round(fileSize/1024)}KB)`);

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


        // Upload file to Vercel Blob (all files now go through this path)
        let blobUrl = null;
        
        if (!fileDataBase64) {
            return res.status(400).json({ error: 'File data is required' });
        }
        
        try {
            // Check if Vercel Blob token is available
            if (!process.env.BLOB_READ_WRITE_TOKEN) {
                return res.status(500).json({ error: 'Storage not configured' });
            }
            
            // Convert base64 to buffer and upload to Vercel Blob
            const buffer = Buffer.from(fileDataBase64, 'base64');
            const fileExtension = fileName.split('.').pop();
            const uniqueFileName = `${accountNumber}/${crypto.randomUUID()}.${fileExtension}`;
            
            const blob = await put(uniqueFileName, buffer, {
                access: 'public',
                contentType: fileType || 'application/octet-stream'
            });
            
            blobUrl = blob.url;
            console.log('✅ Uploaded:', fileName);
            
        } catch (blobError) {
            console.error('❌ Upload failed:', fileName, blobError.message);
            return res.status(500).json({ 
                error: 'File upload failed',
                details: process.env.NODE_ENV === 'development' ? blobError.message : undefined
            });
        }

        // Create document record with future-ready schema
        const documentId = crypto.randomUUID();
        const document = {
            id: documentId,
            originalName: fileName,
            filename: `${crypto.randomUUID()}.${fileName.split('.').pop()}`,
            mimetype: fileType || 'application/octet-stream',
            size: fileSize,
            description: description || '',
            uploadDate: new Date().toISOString(),
            
            // Storage URLs (prepared for multi-provider support)
            blobUrl: blobUrl,           // Current: Vercel Blob URL
            backupUrl: null,            // Future: Google Drive backup URL  
            awsS3Url: null,            // Future: AWS S3 URL for migration
            
            // Processing status
            processed: false,
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
            },
            
            // Lifecycle management (prepared for auto-deletion)
            lifecycle: {
                autoDeleteAfter: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
                backedUp: false,
                backupDate: null,
                readyForDeletion: false
            }
        };

        // Add document to account
        account.documents.push(document);
        console.log(`📋 Document added. Account now has ${account.documents.length} documents`);
        
        // Save accounts data using persistent storage
        try {
            await saveAccounts(accounts);
        } catch (writeError) {
            console.error('❌ Failed to save accounts data:', writeError);
            return res.status(500).json({ error: 'Failed to save document data' });
        }

        res.json({ 
            success: true, 
            message: 'Document uploaded successfully',
            document: {
                id: document.id,
                originalName: document.originalName,
                uploadDate: document.uploadDate,
                hasFile: !!blobUrl
            }
        });

    } catch (error) {
        console.error('❌ Upload error:', error.message);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error', 
            details: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    }
}