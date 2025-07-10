import crypto from 'crypto';
import { loadAccounts } from './data-store.js';

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
        const { dob, accountNumber, documentId, version = 'original' } = req.body;
        
        console.log('View document request:', {
            documentId,
            version,
            accountNumber: accountNumber ? accountNumber.substring(0, 4) + '****' : 'missing',
            dob: dob ? 'provided' : 'missing'
        });

        if (!dob || !accountNumber || !documentId) {
            console.log('Missing parameters:', { dob: !!dob, accountNumber: !!accountNumber, documentId: !!documentId });
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Load accounts data using persistent storage
        const accounts = await loadAccounts();
        console.log('Loaded accounts count:', Object.keys(accounts).length);

        const account = accounts[accountNumber];
        
        if (!account) {
            console.log('Account not found:', accountNumber, 'Available accounts:', Object.keys(accounts).slice(0, 3));
            return res.status(401).json({ error: 'Invalid account' });
        }
        
        console.log('Account found with', account.documents?.length || 0, 'documents');
        
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
                console.log('Returning blob URL:', document.blobUrl);
                return res.json({
                    success: true,
                    redirectUrl: document.blobUrl,
                    documentName: document.originalName,
                    contentType: document.mimetype
                });
            } else {
                console.log('No blob URL found for document:', document.id);
                // Handle documents without blob URL (legacy documents or upload failures)
                return res.json({
                    success: true,
                    content: `# ${document.originalName}\n\n**File Preview Not Available**\n\nThis document was uploaded but the file content is not available for preview.\n\nPossible reasons:\n- Legacy document from before Vercel Blob storage\n- Upload partially failed\n- File was not stored in blob storage\n\nDocument details:\n- Original name: ${document.originalName}\n- Upload date: ${new Date(document.uploadDate).toLocaleString()}\n- File size: ${document.size ? Math.round(document.size/1024) + ' KB' : 'Unknown'}\n- MIME type: ${document.mimetype || 'Unknown'}\n\n**Note**: You can try re-uploading this file to enable preview functionality.`,
                    contentType: 'text/markdown',
                    documentName: document.originalName
                });
            }
        }
        
        // For processed/translated versions, return actual processed content
        if (version === 'processed' || version === 'translated') {
            console.log('Requested version:', version, 'Document processed:', !!document.processed);
            console.log('Processing status:', document.processingStatus);
            console.log('Processed versions:', document.processedVersions);
            
            // Check if document has been processed
            if (!document.processed || !document.processedVersions) {
                return res.json({
                    success: true,
                    content: `# ${document.originalName} - ${version === 'processed' ? 'OCR Processing' : 'Translation'}\n\n**Status**: Not yet processed\n\nThis document has not been processed with Qwen AI yet. \n\n**To process this document:**\n1. Click the "Process" button in the document list\n2. Wait for OCR and translation to complete\n3. Refresh this view to see results\n\n**Current Processing Status:**\n- OCR: ${document.processingStatus?.ocr?.status || 'pending'}\n- Structuring: ${document.processingStatus?.structuring?.status || 'pending'}\n- Translation: ${document.processingStatus?.translation?.status || 'pending'}`,
                    contentType: 'text/markdown',
                    documentName: `${document.originalName} (${version} - pending)`
                });
            }
            
            // Check processing status
            const isProcessingComplete = 
                document.processingStatus?.ocr?.status === 'completed' &&
                document.processingStatus?.structuring?.status === 'completed' &&
                document.processingStatus?.translation?.status === 'completed';
                
            if (!isProcessingComplete) {
                const ocrStatus = document.processingStatus?.ocr?.status || 'pending';
                const structuringStatus = document.processingStatus?.structuring?.status || 'pending';
                const translationStatus = document.processingStatus?.translation?.status || 'pending';
                
                return res.json({
                    success: true,
                    content: `# ${document.originalName} - Processing in Progress\n\n**Current Status**: Processing with Qwen AI\n\n**Processing Steps:**\n\n✅ **OCR**: ${ocrStatus}\n${structuringStatus === 'completed' ? '✅' : structuringStatus === 'processing' ? '🔄' : '⏳'} **Structuring**: ${structuringStatus}\n${translationStatus === 'completed' ? '✅' : translationStatus === 'processing' ? '🔄' : '⏳'} **Translation**: ${translationStatus}\n\n${version === 'processed' ? 'OCR and structuring' : 'Translation'} results will appear here when processing is complete.\n\n*Refresh this page to see updated status*`,
                    contentType: 'text/markdown',
                    documentName: `${document.originalName} (${version} - processing)`
                });
            }
            
            // Return processed content
            try {
                if (version === 'processed') {
                    // Try to fetch from blob URL first
                    if (document.processedVersions.markdownOriginal && document.processedVersions.markdownOriginal.startsWith('http')) {
                        const response = await fetch(document.processedVersions.markdownOriginal);
                        if (response.ok) {
                            const content = await response.text();
                            return res.json({
                                success: true,
                                content: content,
                                contentType: 'text/markdown',
                                documentName: `${document.originalName} (OCR Results)`
                            });
                        }
                    }
                    
                    // Fallback to stored OCR text
                    const ocrContent = document.processedVersions.ocrText || 'OCR text not available';
                    return res.json({
                        success: true,
                        content: `# OCR Results - ${document.originalName}\n\n**Processing Date:** ${new Date(document.processingStatus.ocr.completedAt).toLocaleString()}\n**Processing Time:** ${document.processingStatus.ocr.processingTime}ms\n\n## Extracted Text\n\n${ocrContent}`,
                        contentType: 'text/markdown',
                        documentName: `${document.originalName} (OCR Results)`
                    });
                }
                
                if (version === 'translated') {
                    // Try to fetch from blob URL first
                    if (document.processedVersions.markdownEnglish && document.processedVersions.markdownEnglish.startsWith('http')) {
                        const response = await fetch(document.processedVersions.markdownEnglish);
                        if (response.ok) {
                            const content = await response.text();
                            return res.json({
                                success: true,
                                content: content,
                                contentType: 'text/markdown',
                                documentName: `${document.originalName} (English Translation)`
                            });
                        }
                    }
                    
                    // Fallback to structured translation data
                    const translationData = document.processedVersions.translatedData;
                    if (translationData) {
                        const translatedContent = `# Medical Report Translation - ${document.originalName}\n\n**Translation Date:** ${new Date(document.processingStatus.translation.completedAt).toLocaleString()}\n**Processing Time:** ${document.processingStatus.translation.processingTime}ms\n**Translation Confidence:** ${(translationData.confidence * 100).toFixed(1)}%\n\n## Summary\n\n${translationData.summary}\n\n## Translated Sections\n\n${translationData.translated_sections.map(section => `### ${section.content}\n\n*Original:* ${section.original}\n`).join('\n')}`;
                        
                        return res.json({
                            success: true,
                            content: translatedContent,
                            contentType: 'text/markdown',
                            documentName: `${document.originalName} (English Translation)`
                        });
                    }
                }
                
            } catch (fetchError) {
                console.error('Error fetching processed content:', fetchError);
            }
            
            // Final fallback
            return res.json({
                success: true,
                content: `# ${document.originalName} - ${version === 'processed' ? 'OCR Results' : 'Translation'}\n\n**Status**: Processing completed but content not available\n\nThe document was processed successfully, but the ${version} content could not be retrieved.\n\n**Processing Details:**\n- Completed: ${new Date(document.processingStatus[version === 'processed' ? 'ocr' : 'translation'].completedAt).toLocaleString()}\n- Processing Time: ${document.processingStatus[version === 'processed' ? 'ocr' : 'translation'].processingTime}ms\n\nPlease try processing the document again.`,
                contentType: 'text/markdown',
                documentName: `${document.originalName} (${version} - error)`
            });
        }

        return res.status(404).json({ error: 'Version not found' });

    } catch (error) {
        console.error('Error viewing document:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}