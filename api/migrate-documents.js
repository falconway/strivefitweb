import { loadAccounts, saveAccounts } from './data-store.js';

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
        console.log('🔄 Starting document migration...');
        
        // Load accounts data
        const accounts = await loadAccounts();
        let totalDocuments = 0;
        let migratedDocuments = 0;
        
        // Update each account's documents
        for (const [accountNumber, account] of Object.entries(accounts)) {
            if (account.documents) {
                for (const document of account.documents) {
                    totalDocuments++;
                    
                    // Check if document needs migration
                    const needsMigration = !document.hasOwnProperty('blobUrl') || 
                                         !document.hasOwnProperty('processed') ||
                                         !document.hasOwnProperty('processingStatus') ||
                                         !document.hasOwnProperty('processedVersions');
                    
                    if (needsMigration) {
                        console.log(`📄 Migrating document: ${document.originalName} (${document.id})`);
                        
                        // Add missing fields
                        if (!document.hasOwnProperty('blobUrl')) {
                            document.blobUrl = null;
                        }
                        
                        if (!document.hasOwnProperty('processed')) {
                            document.processed = false;
                        }
                        
                        if (!document.hasOwnProperty('processingStatus')) {
                            document.processingStatus = {
                                ocr: { status: 'pending' },
                                structuring: { status: 'pending' },
                                translation: { status: 'pending' }
                            };
                        }
                        
                        if (!document.hasOwnProperty('processedVersions')) {
                            document.processedVersions = {
                                ocrText: null,
                                markdownOriginal: null,
                                jsonOriginal: null,
                                markdownEnglish: null,
                                jsonEnglish: null
                            };
                        }
                        
                        migratedDocuments++;
                    }
                }
            }
        }
        
        // Save updated accounts
        await saveAccounts(accounts);
        
        console.log(`✅ Migration completed: ${migratedDocuments}/${totalDocuments} documents migrated`);
        
        res.json({
            success: true,
            message: 'Document migration completed successfully',
            stats: {
                totalDocuments,
                migratedDocuments,
                alreadyMigrated: totalDocuments - migratedDocuments
            }
        });
        
    } catch (error) {
        console.error('❌ Error during migration:', error);
        res.status(500).json({ 
            error: 'Migration failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}