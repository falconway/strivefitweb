import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

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
        // For now, we'll simulate the upload since file handling in Vercel is complex
        // In a real implementation, you'd store files in Vercel Blob or external storage
        
        const { dob, accountNumber, fileName, fileSize, fileType, description } = req.body;

        if (!dob || !accountNumber || !fileName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Load accounts data
        const dataPath = path.join(process.cwd(), 'backend/data/accounts.json');
        let accounts = {};
        
        try {
            const data = await fs.readFile(dataPath, 'utf8');
            accounts = JSON.parse(data);
        } catch (error) {
            // File doesn't exist, create it
            await fs.mkdir(path.dirname(dataPath), { recursive: true });
            accounts = {};
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
        const document = {
            id: crypto.randomUUID(),
            originalName: fileName,
            filename: `${crypto.randomUUID()}.${fileName.split('.').pop()}`,
            mimetype: fileType || 'application/octet-stream',
            size: fileSize || 0,
            description: description || '',
            uploadDate: new Date().toISOString(),
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
            }
        };

        // Add document to account
        account.documents.push(document);
        
        // Save accounts data
        await fs.writeFile(dataPath, JSON.stringify(accounts, null, 2));

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
        res.status(500).json({ error: 'Internal server error' });
    }
}