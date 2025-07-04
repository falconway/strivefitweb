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
        const { dob, accountNumber } = req.body;
        const { params } = req.query;
        
        // Extract documentId and version from params
        const [documentId, version] = params;

        if (!dob || !accountNumber || !documentId) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        console.log('View document request:', {
            documentId,
            version,
            accountNumber: accountNumber.substring(0, 4) + '****'
        });

        // Try different paths for Vercel deployment
        let accounts = {};
        let accountsLoaded = false;
        
        const possiblePaths = [
            path.join(process.cwd(), 'backend/data/accounts.json'),
            path.join(process.cwd(), 'data/accounts.json'),
            path.join('/tmp', 'accounts.json')
        ];
        
        for (const tryPath of possiblePaths) {
            try {
                const data = await fs.readFile(tryPath, 'utf8');
                accounts = JSON.parse(data);
                accountsLoaded = true;
                break;
            } catch (error) {
                continue;
            }
        }
        
        if (!accountsLoaded) {
            return res.status(500).json({ error: 'Document data not found' });
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

        // Find the document
        const document = account.documents.find(doc => doc.id === documentId);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        console.log('Document found:', {
            id: document.id,
            name: document.originalName,
            hasBlobUrl: !!document.blobUrl
        });

        // For original version, redirect to blob URL
        if (version === 'original' && document.blobUrl) {
            return res.json({
                success: true,
                redirectUrl: document.blobUrl,
                documentName: document.originalName,
                contentType: document.mimetype
            });
        }
        
        // For processed/translated versions, return mock content for now
        if (version === 'processed' || version === 'translated') {
            const mockContent = `# ${document.originalName}\n\n**${version === 'processed' ? 'OCR Result' : 'Translation Result'}**\n\nThis is a mock ${version} version of the document.\n\nIn the full implementation, this would contain:\n- OCR extracted text (for processed)\n- English translation (for translated)\n- Structured medical data\n\nDocument details:\n- Original name: ${document.originalName}\n- Upload date: ${new Date(document.uploadDate).toLocaleString()}\n- File size: ${document.size} bytes`;
            
            return res.json({
                success: true,
                content: mockContent,
                contentType: 'text/markdown',
                documentName: `${document.originalName} (${version})`
            });
        }

        return res.status(404).json({ error: 'Version not found' });

    } catch (error) {
        console.error('Error viewing document:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}