import crypto from 'crypto';
import { del } from '@vercel/blob';
import { loadAccounts, saveAccounts } from './data-store.js';

function hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { dob, accountNumber, documentId } = req.body;

        if (!dob || !accountNumber || !documentId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log('🗑️ Delete request received:', {
            documentId,
            accountNumber: accountNumber.substring(0, 4) + '****'
        });

        // Load accounts data
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

        // Find the document to delete
        const documentIndex = account.documents.findIndex(doc => doc.id === documentId);
        if (documentIndex === -1) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const documentToDelete = account.documents[documentIndex];
        console.log('📄 Found document to delete:', {
            id: documentToDelete.id,
            name: documentToDelete.originalName,
            hasBlobUrl: !!documentToDelete.blobUrl
        });

        // Delete from Vercel Blob if it exists
        if (documentToDelete.blobUrl) {
            try {
                console.log('🗑️ Deleting from Vercel Blob:', documentToDelete.blobUrl);
                await del(documentToDelete.blobUrl);
                console.log('✅ Successfully deleted from Vercel Blob');
            } catch (blobError) {
                console.error('❌ Failed to delete from Vercel Blob:', blobError);
                // Continue with metadata deletion even if blob deletion fails
            }
        } else {
            console.log('ℹ️ No blob URL found, skipping blob deletion');
        }

        // Remove document from account
        account.documents.splice(documentIndex, 1);
        console.log('📋 Removed document from account, now has:', account.documents.length, 'documents');

        // Save updated accounts data
        try {
            await saveAccounts(accounts);
            console.log('✅ Successfully saved updated accounts data');
        } catch (saveError) {
            console.error('❌ Failed to save accounts data:', saveError);
            return res.status(500).json({ error: 'Failed to update account data' });
        }

        res.json({
            success: true,
            message: 'Document deleted successfully',
            deletedDocument: {
                id: documentToDelete.id,
                name: documentToDelete.originalName,
                hadBlobFile: !!documentToDelete.blobUrl
            }
        });

    } catch (error) {
        console.error('❌ Error deleting document:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}