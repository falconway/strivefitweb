import crypto from 'crypto';
import { loadAccounts } from '../data-store.js';

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

        // For original version, redirect to blob URL if available
        if (version === 'original') {
            if (document.blobUrl) {
                return res.json({
                    success: true,
                    redirectUrl: document.blobUrl,
                    documentName: document.originalName,
                    contentType: document.mimetype
                });
            } else {
                // Handle documents without blob URL (large files or upload failures)
                return res.json({
                    success: true,
                    content: `# ${document.originalName}\n\n**File Preview Not Available**\n\nThis document was uploaded but the file content is not available for preview.\n\nPossible reasons:\n- File is larger than 3MB (currently not stored in blob)\n- Upload partially failed\n- Legacy document from before blob storage\n\nDocument details:\n- Original name: ${document.originalName}\n- Upload date: ${new Date(document.uploadDate).toLocaleString()}\n- File size: ${document.size} bytes\n- MIME type: ${document.mimetype}`,
                    contentType: 'text/markdown',
                    documentName: document.originalName
                });
            }
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