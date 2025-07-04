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
        const { dob, accountNumber, fileName, fileSize, fileType, description, fileData } = req.body;

        if (!dob || !accountNumber || !fileName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // For now, we'll store document metadata without the actual file
        // In the next update, we'll add proper file upload handling with multipart/form-data

        // Try different paths for Vercel deployment
        let accounts = {};
        let dataPath;
        
        // Try to find accounts.json in different locations
        const possiblePaths = [
            path.join(process.cwd(), 'backend/data/accounts.json'),
            path.join(process.cwd(), 'data/accounts.json'),
            path.join('/tmp', 'accounts.json')
        ];
        
        let accountsLoaded = false;
        
        for (const tryPath of possiblePaths) {
            try {
                const data = await fs.readFile(tryPath, 'utf8');
                accounts = JSON.parse(data);
                dataPath = tryPath;
                accountsLoaded = true;
                break;
            } catch (error) {
                // Continue to next path
                continue;
            }
        }
        
        // If no existing file found, try to create in /tmp for Vercel
        if (!accountsLoaded) {
            dataPath = '/tmp/accounts.json';
            accounts = {};
            
            // Try to create the file
            try {
                await fs.writeFile(dataPath, JSON.stringify(accounts, null, 2));
            } catch (error) {
                console.error('Failed to create accounts file:', error);
                return res.status(500).json({ error: 'Failed to initialize data storage' });
            }
        }
        
        const account = accounts[accountNumber];
        
        if (!account) {
            return res.status(401).json({ error: 'Invalid account' });
        }
        
        // Verify credentials
        const combinedHash = hashData(dob + accountNumber);
        if (combinedHash !== account.combinedHash) {
            return res.status(401).json({ error: 'Invalid credentials' });
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
            blobUrl: null, // Will store Vercel Blob URL when we implement file storage
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
                uploadDate: document.uploadDate
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