import crypto from 'crypto';
import { list, del } from '@vercel/blob';
import { loadAccounts, saveAccounts } from './data-store.js';

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
        const { dob, accountNumber, action } = req.body;

        if (!dob || !accountNumber) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log('🧹 Cleanup request received:', {
            action: action || 'analyze',
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

        // Get all blobs for this account
        const { blobs } = await list({ prefix: accountNumber });
        console.log('📊 Found', blobs.length, 'blobs for account');

        // Get all document blob URLs from metadata
        const documentBlobUrls = new Set();
        account.documents.forEach(doc => {
            if (doc.blobUrl) {
                documentBlobUrls.add(doc.blobUrl);
            }
        });

        // Find orphaned blobs (in storage but not in metadata)
        const orphanedBlobs = blobs.filter(blob => !documentBlobUrls.has(blob.url));
        
        // Find broken metadata (in metadata but not in storage)
        const blobUrlsInStorage = new Set(blobs.map(blob => blob.url));
        const brokenMetadata = account.documents.filter(doc => 
            doc.blobUrl && !blobUrlsInStorage.has(doc.blobUrl)
        );

        const analysis = {
            totalBlobs: blobs.length,
            totalDocuments: account.documents.length,
            documentsWithBlobs: account.documents.filter(doc => doc.blobUrl).length,
            orphanedBlobs: orphanedBlobs.length,
            brokenMetadata: brokenMetadata.length,
            orphanedBlobDetails: orphanedBlobs.map(blob => ({
                url: blob.url,
                pathname: blob.pathname,
                size: blob.size,
                uploadedAt: blob.uploadedAt
            })),
            brokenMetadataDetails: brokenMetadata.map(doc => ({
                id: doc.id,
                name: doc.originalName,
                blobUrl: doc.blobUrl
            }))
        };

        console.log('📈 Cleanup analysis:', analysis);

        if (action === 'cleanup') {
            let cleanupResults = {
                orphanedBlobsDeleted: 0,
                brokenMetadataFixed: 0,
                errors: []
            };

            // Delete orphaned blobs
            for (const blob of orphanedBlobs) {
                try {
                    await del(blob.url);
                    cleanupResults.orphanedBlobsDeleted++;
                    console.log('✅ Deleted orphaned blob:', blob.pathname);
                } catch (error) {
                    cleanupResults.errors.push({
                        type: 'blob_deletion',
                        url: blob.url,
                        error: error.message
                    });
                    console.error('❌ Failed to delete orphaned blob:', error);
                }
            }

            // Fix broken metadata (remove references to non-existent blobs)
            if (brokenMetadata.length > 0) {
                account.documents = account.documents.map(doc => {
                    if (doc.blobUrl && !blobUrlsInStorage.has(doc.blobUrl)) {
                        console.log('🔧 Fixing broken metadata for:', doc.originalName);
                        return { ...doc, blobUrl: null };
                    }
                    return doc;
                });
                
                try {
                    await saveAccounts(accounts);
                    cleanupResults.brokenMetadataFixed = brokenMetadata.length;
                    console.log('✅ Fixed broken metadata');
                } catch (error) {
                    cleanupResults.errors.push({
                        type: 'metadata_save',
                        error: error.message
                    });
                    console.error('❌ Failed to save fixed metadata:', error);
                }
            }

            return res.json({
                success: true,
                message: 'Cleanup completed',
                analysis,
                cleanupResults
            });
        }

        // Just return analysis
        res.json({
            success: true,
            message: 'Storage analysis completed',
            analysis,
            recommendation: orphanedBlobs.length > 0 || brokenMetadata.length > 0 
                ? 'Consider running cleanup action to fix inconsistencies'
                : 'Storage is clean and consistent'
        });

    } catch (error) {
        console.error('❌ Error in cleanup:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}