/**
 * Railway Express Server
 * Main server file for Railway deployment
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// Import API handlers
import { loadAccounts, saveAccounts, storage } from './api/railway-data-store.js';
import { OpenRouterAPI } from './api/services/openrouter-api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenRouter API (lazy initialization)
let openRouterAPI = null;

function getOpenRouterAPI() {
    if (!openRouterAPI) {
        openRouterAPI = new OpenRouterAPI();
    }
    return openRouterAPI;
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Utility functions
function generateDocumentId() {
    return crypto.randomBytes(16).toString('hex');
}

function hashDOB(dob) {
    return crypto.createHash('sha256').update(dob).digest('hex');
}

function isValidDOB(dob) {
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobRegex.test(dob)) return false;
    
    const date = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    
    return age >= 0 && age <= 120 && date <= today;
}

// API Routes

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'Strive & Fit Medical Document Management',
        version: '2.0.0',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// Authentication
app.post('/api/auth', async (req, res) => {
    try {
        const { dob, accountNumber } = req.body;
        
        if (!dob || !accountNumber) {
            return res.status(400).json({ error: 'Date of birth and account number are required' });
        }
        
        if (!isValidDOB(dob)) {
            return res.status(400).json({ error: 'Invalid date of birth format' });
        }
        
        const accounts = await loadAccounts();
        const hashedDOB = hashDOB(dob);
        
        if (accounts[accountNumber] && accounts[accountNumber].hashedDOB === hashedDOB) {
            res.json({ 
                success: true, 
                message: 'Authentication successful',
                accountNumber: accountNumber 
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('❌ Auth error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get documents
app.get('/api/documents/:accountNumber', async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const accounts = await loadAccounts();
        
        if (!accounts[accountNumber]) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        const documents = accounts[accountNumber].documents || [];
        res.json(documents);
    } catch (error) {
        console.error('❌ Get documents error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload documents
app.post('/api/upload/:accountNumber', upload.array('files'), async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const files = req.files;
        
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files provided' });
        }
        
        const accounts = await loadAccounts();
        if (!accounts[accountNumber]) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        const uploadedFiles = [];
        
        for (const file of files) {
            const documentId = generateDocumentId();
            const filename = `${documentId}-${file.originalname}`;
            
            // Store file using Railway storage
            const fileInfo = await storage.storeUploadedFile(accountNumber, filename, file.buffer);
            
            const document = {
                id: documentId,
                filename: file.originalname,
                size: file.size,
                uploadDate: new Date().toISOString(),
                status: 'uploaded',
                url: fileInfo.url,
                storedFilename: filename
            };
            
            if (!accounts[accountNumber].documents) {
                accounts[accountNumber].documents = [];
            }
            
            accounts[accountNumber].documents.push(document);
            uploadedFiles.push(document);
        }
        
        await saveAccounts(accounts);
        res.json({ uploadedFiles });
        
    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Process document
app.post('/api/documents/:documentId/process', async (req, res) => {
    try {
        const { documentId } = req.params;
        const accounts = await loadAccounts();
        
        // Find the document
        let document = null;
        let accountNumber = null;
        
        for (const [accNum, account] of Object.entries(accounts)) {
            const doc = account.documents?.find(d => d.id === documentId);
            if (doc) {
                document = doc;
                accountNumber = accNum;
                break;
            }
        }
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        // Update status to processing
        document.status = 'processing';
        await saveAccounts(accounts);
        
        // Send immediate response
        res.json({ message: 'Processing started' });
        
        // Process asynchronously
        processDocumentAsync(documentId, document, accountNumber);
        
    } catch (error) {
        console.error('❌ Process document error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Async processing function
async function processDocumentAsync(documentId, document, accountNumber) {
    try {
        console.log('🔄 Starting async processing for:', documentId);
        
        // Get file from Railway storage
        const fileBuffer = await storage.getUploadedFile(accountNumber, document.storedFilename);
        
        // Convert buffer to base64 for API
        const base64Data = fileBuffer.toString('base64');
        const mimeType = getMimeType(document.filename);
        const dataUrl = `data:${mimeType};base64,${base64Data}`;
        
        // Process with OpenRouter
        const api = getOpenRouterAPI();
        const result = await api.processDocument(document, dataUrl);
        
        if (result.success) {
            // Store processed files
            const ocrFilename = `${documentId}-ocr.md`;
            const translatedFilename = `${documentId}-translated.md`;
            
            await storage.storeProcessedFile(accountNumber, ocrFilename, result.ocrText);
            await storage.storeProcessedFile(accountNumber, translatedFilename, result.translatedText);
            
            // Update document status
            const accounts = await loadAccounts();
            const doc = accounts[accountNumber].documents.find(d => d.id === documentId);
            if (doc) {
                doc.status = 'completed';
                doc.ocrFile = ocrFilename;
                doc.translatedFile = translatedFilename;
                doc.processedAt = new Date().toISOString();
                await saveAccounts(accounts);
            }
            
            console.log('✅ Document processed successfully:', documentId);
        } else {
            // Update status to failed
            const accounts = await loadAccounts();
            const doc = accounts[accountNumber].documents.find(d => d.id === documentId);
            if (doc) {
                doc.status = 'failed';
                doc.error = result.error;
                await saveAccounts(accounts);
            }
            
            console.error('❌ Document processing failed:', documentId, result.error);
        }
        
    } catch (error) {
        console.error('❌ Async processing error:', error);
        
        // Update status to failed
        try {
            const accounts = await loadAccounts();
            const doc = accounts[accountNumber].documents.find(d => d.id === documentId);
            if (doc) {
                doc.status = 'failed';
                doc.error = error.message;
                await saveAccounts(accounts);
            }
        } catch (updateError) {
            console.error('❌ Failed to update document status:', updateError);
        }
    }
}

// View document
app.get('/api/view-document/:documentId/:version?', async (req, res) => {
    try {
        const { documentId, version = 'original' } = req.params;
        const accounts = await loadAccounts();
        
        // Find the document
        let document = null;
        let accountNumber = null;
        
        for (const [accNum, account] of Object.entries(accounts)) {
            const doc = account.documents?.find(d => d.id === documentId);
            if (doc) {
                document = doc;
                accountNumber = accNum;
                break;
            }
        }
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        if (version === 'original') {
            // Serve original file
            const fileBuffer = await storage.getUploadedFile(accountNumber, document.storedFilename);
            const mimeType = getMimeType(document.filename);
            
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Disposition', `inline; filename="${document.filename}"`);
            res.send(fileBuffer);
        } else if (version === 'processed' && document.ocrFile) {
            // Serve processed markdown
            const content = await storage.getProcessedFile(accountNumber, document.ocrFile);
            res.setHeader('Content-Type', 'text/markdown');
            res.send(content);
        } else if (version === 'translated' && document.translatedFile) {
            // Serve translated markdown
            const content = await storage.getProcessedFile(accountNumber, document.translatedFile);
            res.setHeader('Content-Type', 'text/markdown');
            res.send(content);
        } else {
            res.status(404).json({ error: 'Version not found' });
        }
        
    } catch (error) {
        console.error('❌ View document error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete document
app.delete('/api/documents/:documentId', async (req, res) => {
    try {
        const { documentId } = req.params;
        const accounts = await loadAccounts();
        
        // Find and remove the document
        let found = false;
        for (const [accountNumber, account] of Object.entries(accounts)) {
            const docIndex = account.documents?.findIndex(d => d.id === documentId);
            if (docIndex !== -1) {
                const document = account.documents[docIndex];
                
                // Delete files from storage
                await storage.deleteFile(accountNumber, document.storedFilename, 'uploads');
                if (document.ocrFile) {
                    await storage.deleteFile(accountNumber, document.ocrFile, 'processed');
                }
                if (document.translatedFile) {
                    await storage.deleteFile(accountNumber, document.translatedFile, 'processed');
                }
                
                // Remove from database
                account.documents.splice(docIndex, 1);
                found = true;
                break;
            }
        }
        
        if (!found) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        await saveAccounts(accounts);
        res.json({ message: 'Document deleted successfully' });
        
    } catch (error) {
        console.error('❌ Delete document error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// File serving (handled by the [...file].js route)
app.get('/api/storage/*', (req, res) => {
    // This will be handled by the [...file].js route
    res.status(404).json({ error: 'File not found' });
});

// Helper functions
function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.md': 'text/markdown',
        '.json': 'application/json',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

// Initialize storage on startup
async function initializeApp() {
    try {
        console.log('🚀 Initializing Railway storage...');
        await storage.initializeStorage();
        console.log('✅ Storage initialized successfully');
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`📁 Storage path: ${storage.storagePath}`);
            console.log(`🌐 Health check: http://localhost:${PORT}/health`);
            console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        
        // Try to start server anyway for debugging
        console.log('⚠️ Starting server without storage initialization...');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`⚠️ Server running on port ${PORT} (storage not initialized)`);
            console.log(`🌐 Health check: http://localhost:${PORT}/health`);
        });
    }
}

// Start the server
initializeApp();