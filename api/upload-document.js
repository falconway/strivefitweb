import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';

function hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

export default async function handler(req, res) {
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
        
        // Basic validation
        if (!fileSize || fileSize <= 0) {
            return res.status(400).json({ error: 'Invalid file size' });
        }

        console.log('Upload request received:', {
            fileName,
            fileSize,
            fileType,
            hasFileData: !!fileDataBase64,
            accountNumber: accountNumber.substring(0, 4) + '****'
        });

        // Load accounts data - try read-only sources first, then /tmp
        let accounts = {};
        let dataPath = '/tmp/accounts.json'; // Always write to /tmp
        let accountsLoaded = false;
        
        // Try to read from read-only deployment files first
        const readOnlyPaths = [
            path.join(process.cwd(), 'backend/data/accounts.json'),
            path.join(process.cwd(), 'data/accounts.json')
        ];
        
        for (const tryPath of readOnlyPaths) {
            try {
                const data = await fs.readFile(tryPath, 'utf8');
                accounts = JSON.parse(data);
                accountsLoaded = true;
                console.log('Loaded accounts from read-only path:', tryPath);
                break;
            } catch (error) {
                continue;
            }
        }
        
        // If not found in read-only, try /tmp (from previous function calls)
        if (!accountsLoaded) {
            try {
                const data = await fs.readFile(dataPath, 'utf8');
                accounts = JSON.parse(data);
                accountsLoaded = true;
                console.log('Loaded accounts from /tmp');
            } catch (error) {
                // File doesn't exist in /tmp, start fresh
                accounts = {};
                console.log('Starting with empty accounts data');
            }
        }
        
        console.log('Accounts loaded:', {
            accountsLoaded,
            accountCount: Object.keys(accounts).length,
            writePath: dataPath
        });
        
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

        // Upload file to Vercel Blob if file data is provided
        let blobUrl = null;
        if (fileDataBase64) {
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
        
        // Save accounts data
        try {
            console.log('Saving to path:', dataPath);
            await fs.writeFile(dataPath, JSON.stringify(accounts, null, 2));
            console.log('Successfully saved accounts data');
        } catch (writeError) {
            console.error('Failed to save accounts file:', writeError);
            console.error('Write error details:', {
                code: writeError.code,
                path: writeError.path,
                errno: writeError.errno
            });
            return res.status(500).json({ error: 'Failed to save document data' });
        }

        res.json({ 
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
        });

    } catch (error) {
        console.error('Error uploading document:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            path: error.path
        });
        res.status(500).json({ 
            error: 'Internal server error', 
            details: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    }
}