const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const archiver = require('archiver');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json({ 
    limit: '50mb',
    charset: 'utf-8'
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '50mb',
    charset: 'utf-8'
}));
app.use(express.static('public'));

// Data storage paths
const DATA_DIR = path.join(__dirname, 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure directories exist
async function initializeDirectories() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
        
        // Initialize accounts file if it doesn't exist
        try {
            await fs.access(ACCOUNTS_FILE);
        } catch {
            await fs.writeFile(ACCOUNTS_FILE, JSON.stringify({}));
        }
    } catch (error) {
        console.error('Error initializing directories:', error);
    }
}

// Security functions
function hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

function generateSecureAccountNumber() {
    const randomBytes = crypto.randomBytes(8);
    let accountNumber = '';
    for (let i = 0; i < 8; i++) {
        accountNumber += String(randomBytes[i] % 10);
        if (i === 1 || i === 3 || i === 5) accountNumber += '-';
    }
    // Add 8 more digits
    for (let i = 0; i < 8; i++) {
        accountNumber += String(Math.floor(Math.random() * 10));
        if (i === 1 || i === 3) accountNumber += '-';
    }
    return accountNumber;
}

// Load accounts from file
async function loadAccounts() {
    try {
        const data = await fs.readFile(ACCOUNTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading accounts:', error);
        return {};
    }
}

// Save accounts to file
async function saveAccounts(accounts) {
    try {
        await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
    } catch (error) {
        console.error('Error saving accounts:', error);
        throw error;
    }
}

// Configure multer for file uploads with UTF-8 support
const upload = multer({
    dest: UPLOADS_DIR,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    preservePath: true,
    fileFilter: (req, file, cb) => {
        // Allow common medical and office document formats
        const allowedTypes = [
            // Images
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/tiff',
            'image/gif',
            'image/bmp',
            'image/webp',
            
            // Documents
            'application/pdf',
            'text/plain',
            'text/markdown',
            'text/x-markdown',
            'text/csv',
            'application/csv',
            'text/comma-separated-values',
            
            // Microsoft Office
            'application/msword', // .doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/vnd.ms-excel', // .xls
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-powerpoint', // .ppt
            'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
            
            // OpenOffice/LibreOffice
            'application/vnd.oasis.opendocument.text', // .odt
            'application/vnd.oasis.opendocument.spreadsheet', // .ods
            'application/vnd.oasis.opendocument.presentation', // .odp
            
            // Medical formats
            'application/dicom',
            
            // Archives (for multiple files)
            'application/zip',
            'application/x-rar-compressed',
            'application/x-7z-compressed',
            
            // Additional common types that browsers might send
            'application/octet-stream' // Fallback for files that might not have specific MIME types
        ];
        
        // Additional check for file extensions if MIME type is generic
        const allowedExtensions = ['.txt', '.md', '.csv', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.gif', '.bmp', '.webp', '.odt', '.ods', '.odp', '.dcm', '.zip', '.rar', '.7z'];
        
        const fileExtension = path.extname(file.originalname).toLowerCase();
        const isValidMimeType = allowedTypes.includes(file.mimetype);
        const isValidExtension = allowedExtensions.includes(fileExtension);
        
        if (isValidMimeType || (file.mimetype === 'application/octet-stream' && isValidExtension)) {
            cb(null, true);
        } else {
            console.log('Rejected file:', file.originalname, 'MIME:', file.mimetype, 'Extension:', fileExtension);
            cb(new Error('Invalid file type. Please upload medical documents, images, or office files only.'));
        }
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Please upload medical documents, images, or office files only.'));
        }
    }
});

// API Routes

// Generate new account
app.post('/api/generate-account', async (req, res) => {
    try {
        const { dob } = req.body;
        
        console.log('🆕 Account generation request:', { dob });
        
        if (!dob) {
            return res.status(400).json({ error: 'Date of birth is required' });
        }
        
        // Generate unique account number
        let accountNumber;
        let accounts = await loadAccounts();
        
        do {
            accountNumber = generateSecureAccountNumber();
        } while (accounts[accountNumber]);
        
        // Hash DOB and create combined hash
        const dobHash = hashData(dob);
        const combinedHash = hashData(dob + accountNumber);
        
        console.log('🔑 Generated hashes:');
        console.log('DOB hash:', dobHash);
        console.log('Combined hash:', combinedHash);
        console.log('Account number:', accountNumber);
        
        // Store account
        accounts[accountNumber] = {
            dobHash,
            combinedHash,
            createdAt: new Date().toISOString(),
            documents: []
        };
        
        await saveAccounts(accounts);
        
        console.log('✅ Account created successfully:', accountNumber);
        
        res.json({ 
            success: true, 
            accountNumber,
            message: 'Account created successfully' 
        });
        
    } catch (error) {
        console.error('Error generating account:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Authenticate user
app.post('/api/authenticate', async (req, res) => {
    try {
        const { dob, accountNumber } = req.body;
        
        console.log('🔐 Authentication attempt:', { dob, accountNumber });
        
        if (!dob || !accountNumber) {
            return res.status(400).json({ error: 'Date of birth and account number are required' });
        }
        
        const accounts = await loadAccounts();
        const account = accounts[accountNumber];
        
        if (!account) {
            console.log('❌ Account not found:', accountNumber);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Verify DOB + account number combination
        const dobHash = hashData(dob);
        const combinedHash = hashData(dob + accountNumber);
        
        console.log('🔍 Debugging hashes:');
        console.log('Input DOB hash:', dobHash);
        console.log('Stored DOB hash:', account.dobHash);
        console.log('Input combined hash:', combinedHash);
        console.log('Stored combined hash:', account.combinedHash);
        
        if (combinedHash !== account.combinedHash) {
            console.log('❌ Hash mismatch - invalid credentials');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        console.log('✅ Authentication successful');
        res.json({ 
            success: true, 
            message: 'Authentication successful',
            accountNumber 
        });
        
    } catch (error) {
        console.error('Error authenticating:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload document
app.post('/api/upload-document', upload.single('document'), async (req, res) => {
    try {
        const { dob, accountNumber, description } = req.body;
        
        if (!dob || !accountNumber || !req.file) {
            return res.status(400).json({ error: 'Missing required fields or file' });
        }
        
        // Verify authentication
        const accounts = await loadAccounts();
        const account = accounts[accountNumber];
        
        if (!account) {
            return res.status(401).json({ error: 'Invalid account' });
        }
        
        const combinedHash = hashData(dob + accountNumber);
        if (combinedHash !== account.combinedHash) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Create document record with proper UTF-8 handling
        const document = {
            id: crypto.randomUUID(),
            originalName: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
            description: description || '',
            uploadDate: new Date().toISOString(),
            processed: false,
            processingStatus: {
                ocr: { status: 'pending' },
                structuring: { status: 'pending' },
                translation: { status: 'pending' }
            }
        };
        
        // Add document to account
        account.documents.push(document);
        await saveAccounts(accounts);
        
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
});

// Get user documents
app.post('/api/get-documents', async (req, res) => {
    try {
        const { dob, accountNumber } = req.body;
        
        if (!dob || !accountNumber) {
            return res.status(400).json({ error: 'Date of birth and account number are required' });
        }
        
        const accounts = await loadAccounts();
        const account = accounts[accountNumber];
        
        if (!account) {
            return res.status(401).json({ error: 'Invalid account' });
        }
        
        const combinedHash = hashData(dob + accountNumber);
        if (combinedHash !== account.combinedHash) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Set proper UTF-8 content type
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        
        // Return document list (without file paths for security)
        const documents = account.documents.map(doc => ({
            id: doc.id,
            originalName: doc.originalName,
            description: doc.description,
            uploadDate: doc.uploadDate,
            size: doc.size,
            processed: doc.processed,
            processingStatus: doc.processingStatus
        }));
        
        res.json({ 
            success: true, 
            documents 
        });
        
    } catch (error) {
        console.error('Error getting documents:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Download document
app.post('/api/download-document/:documentId', async (req, res) => {
    try {
        const { dob, accountNumber } = req.body;
        const { documentId } = req.params;
        
        if (!dob || !accountNumber) {
            return res.status(400).json({ error: 'Date of birth and account number are required' });
        }
        
        const accounts = await loadAccounts();
        const account = accounts[accountNumber];
        
        if (!account) {
            return res.status(401).json({ error: 'Invalid account' });
        }
        
        const combinedHash = hashData(dob + accountNumber);
        if (combinedHash !== account.combinedHash) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Find document
        const document = account.documents.find(doc => doc.id === documentId);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        const filePath = path.join(UPLOADS_DIR, document.filename);
        
        // Properly encode filename for UTF-8 support with fallback
        const encodedFilename = encodeURIComponent(document.originalName);
        const asciiFilename = document.originalName.replace(/[^\x00-\x7F]/g, "_"); // ASCII fallback
        
        res.setHeader('Content-Disposition', `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`);
        res.setHeader('Content-Type', document.mimetype);
        res.setHeader('Cache-Control', 'no-cache');
        res.sendFile(filePath);
        
    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete document
app.post('/api/delete-document/:documentId', async (req, res) => {
    try {
        const { dob, accountNumber } = req.body;
        const { documentId } = req.params;
        
        console.log('🗑️ Delete request:', { dob, accountNumber, documentId });
        
        if (!dob || !accountNumber) {
            return res.status(400).json({ error: 'Date of birth and account number are required' });
        }
        
        const accounts = await loadAccounts();
        const account = accounts[accountNumber];
        
        if (!account) {
            console.log('❌ Account not found:', accountNumber);
            return res.status(401).json({ error: 'Invalid account' });
        }
        
        const combinedHash = hashData(dob + accountNumber);
        if (combinedHash !== account.combinedHash) {
            console.log('❌ Invalid credentials for delete');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Find document
        const documentIndex = account.documents.findIndex(doc => doc.id === documentId);
        if (documentIndex === -1) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        const document = account.documents[documentIndex];
        const filePath = path.join(UPLOADS_DIR, document.filename);
        
        try {
            // Delete the physical file
            await fs.unlink(filePath);
            console.log('✅ Physical file deleted:', document.filename);
        } catch (fileError) {
            console.log('⚠️ Could not delete physical file (may not exist):', fileError.message);
            // Continue anyway - remove from database even if physical file is missing
        }
        
        // Remove from database
        account.documents.splice(documentIndex, 1);
        await saveAccounts(accounts);
        
        console.log('✅ Document deleted successfully:', document.originalName);
        
        res.json({ 
            success: true, 
            message: 'Document deleted successfully' 
        });
        
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Batch delete documents
app.post('/api/batch-delete-documents', async (req, res) => {
    try {
        const { dob, accountNumber, documentIds } = req.body;
        
        console.log('🗑️📦 Batch delete request:', { dob, accountNumber, documentCount: documentIds?.length });
        
        if (!dob || !accountNumber || !documentIds || !Array.isArray(documentIds)) {
            return res.status(400).json({ error: 'Date of birth, account number, and document IDs array are required' });
        }
        
        const accounts = await loadAccounts();
        const account = accounts[accountNumber];
        
        if (!account) {
            console.log('❌ Account not found:', accountNumber);
            return res.status(401).json({ error: 'Invalid account' });
        }
        
        const combinedHash = hashData(dob + accountNumber);
        if (combinedHash !== account.combinedHash) {
            console.log('❌ Invalid credentials for batch delete');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        let deletedCount = 0;
        let errors = [];
        
        // Process each document ID
        for (const documentId of documentIds) {
            try {
                const documentIndex = account.documents.findIndex(doc => doc.id === documentId);
                if (documentIndex === -1) {
                    errors.push(`Document ${documentId} not found`);
                    continue;
                }
                
                const document = account.documents[documentIndex];
                const filePath = path.join(UPLOADS_DIR, document.filename);
                
                try {
                    // Delete the physical file
                    await fs.unlink(filePath);
                    console.log('✅ Physical file deleted:', document.filename);
                } catch (fileError) {
                    console.log('⚠️ Could not delete physical file:', fileError.message);
                    // Continue anyway
                }
                
                // Remove from database
                account.documents.splice(documentIndex, 1);
                deletedCount++;
                console.log('✅ Document deleted:', document.originalName);
                
            } catch (error) {
                errors.push(`Error deleting ${documentId}: ${error.message}`);
            }
        }
        
        // Save changes
        await saveAccounts(accounts);
        
        console.log(`✅ Batch delete completed: ${deletedCount} deleted, ${errors.length} errors`);
        
        res.json({ 
            success: true, 
            message: `Successfully deleted ${deletedCount} documents`,
            deletedCount,
            errors: errors.length > 0 ? errors : undefined
        });
        
    } catch (error) {
        console.error('Error in batch delete:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Batch download documents as ZIP
app.post('/api/batch-download-documents', async (req, res) => {
    try {
        const { dob, accountNumber, documentIds } = req.body;
        
        console.log('📦⬇️ Batch download request:', { dob, accountNumber, documentCount: documentIds?.length });
        
        if (!dob || !accountNumber || !documentIds || !Array.isArray(documentIds)) {
            return res.status(400).json({ error: 'Date of birth, account number, and document IDs array are required' });
        }
        
        const accounts = await loadAccounts();
        const account = accounts[accountNumber];
        
        if (!account) {
            console.log('❌ Account not found:', accountNumber);
            return res.status(401).json({ error: 'Invalid account' });
        }
        
        const combinedHash = hashData(dob + accountNumber);
        if (combinedHash !== account.combinedHash) {
            console.log('❌ Invalid credentials for batch download');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Find all requested documents
        const documentsToZip = [];
        for (const documentId of documentIds) {
            const document = account.documents.find(doc => doc.id === documentId);
            if (document) {
                documentsToZip.push(document);
            }
        }
        
        if (documentsToZip.length === 0) {
            return res.status(404).json({ error: 'No valid documents found' });
        }
        
        // Set headers for ZIP download
        const zipFilename = `Medical_Documents_${new Date().toISOString().split('T')[0]}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
        
        // Create ZIP archive
        const archive = archiver('zip', {
            zlib: { level: 6 } // Compression level
        });
        
        // Handle archive errors
        archive.on('error', (err) => {
            console.error('Archive error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error creating ZIP file' });
            }
        });
        
        // Pipe archive to response
        archive.pipe(res);
        
        // Add files to archive
        for (const document of documentsToZip) {
            const filePath = path.join(UPLOADS_DIR, document.filename);
            try {
                // Check if file exists
                await fs.access(filePath);
                archive.file(filePath, { name: document.originalName });
                console.log('✅ Added to ZIP:', document.originalName);
            } catch (err) {
                console.log('⚠��� File not found, skipping:', document.originalName);
                // Add an error file instead
                archive.append(`File not found: ${document.originalName}`, { name: `ERROR_${document.originalName}.txt` });
            }
        }
        
        // Finalize the archive
        await archive.finalize();
        console.log(`✅ ZIP created with ${documentsToZip.length} files`);
        
    } catch (error) {
        console.error('Error in batch download:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Process document
app.post('/api/process-document/:documentId', async (req, res) => {
    try {
        const { dob, accountNumber } = req.body;
        const { documentId } = req.params;

        if (!dob || !accountNumber) {
            return res.status(400).json({ error: 'Date of birth and account number are required' });
        }

        const accounts = await loadAccounts();
        const account = accounts[accountNumber];

        if (!account) {
            return res.status(401).json({ error: 'Invalid account' });
        }

        const combinedHash = hashData(dob + accountNumber);
        if (combinedHash !== account.combinedHash) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const document = account.documents.find(doc => doc.id === documentId);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Simulate processing pipeline
        document.processingStatus.ocr.status = 'processing';
        await saveAccounts(accounts);

        setTimeout(async () => {
            document.processingStatus.ocr.status = 'completed';
            document.processingStatus.structuring.status = 'processing';
            await saveAccounts(accounts);

            setTimeout(async () => {
                document.processingStatus.structuring.status = 'completed';
                document.processingStatus.translation.status = 'processing';
                await saveAccounts(accounts);

                setTimeout(async () => {
                    document.processingStatus.translation.status = 'completed';
                    document.processed = true;
                    await saveAccounts(accounts);
                }, 2000);
            }, 2000);
        }, 2000);

        res.json({ success: true, message: 'Processing started' });

    } catch (error) {
        console.error('Error processing document:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// View document version
app.post('/api/view-document/:documentId/:version', async (req, res) => {
    try {
        const { dob, accountNumber } = req.body;
        const { documentId, version } = req.params;

        if (!dob || !accountNumber) {
            return res.status(400).json({ error: 'Date of birth and account number are required' });
        }

        const accounts = await loadAccounts();
        const account = accounts[accountNumber];

        if (!account) {
            return res.status(401).json({ error: 'Invalid account' });
        }

        const combinedHash = hashData(dob + accountNumber);
        if (combinedHash !== account.combinedHash) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const document = account.documents.find(doc => doc.id === documentId);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        if (version === 'original') {
            const filePath = path.join(UPLOADS_DIR, document.filename);
            res.setHeader('Content-Type', document.mimetype);
            res.sendFile(filePath);
        } else if (version === 'processed') {
            res.setHeader('Content-Type', 'text/markdown');
            res.send(`# Processed: ${document.originalName}\n\nThis is the structured Markdown version of the document.`);
        } else if (version === 'translated') {
            res.setHeader('Content-Type', 'text/markdown');
            res.send(`# Translated: ${document.originalName}\n\nThis is the English translation of the document.`);
        } else {
            res.status(400).json({ error: 'Invalid version requested' });
        }

    } catch (error) {
        console.error('Error viewing document version:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



// Batch process documents
app.post('/api/batch-process-documents', async (req, res) => {
    try {
        const { dob, accountNumber, documentIds } = req.body;

        if (!dob || !accountNumber || !documentIds || !Array.isArray(documentIds)) {
            return res.status(400).json({ error: 'Date of birth, account number, and document IDs array are required' });
        }

        const accounts = await loadAccounts();
        const account = accounts[accountNumber];

        if (!account) {
            return res.status(401).json({ error: 'Invalid account' });
        }

        const combinedHash = hashData(dob + accountNumber);
        if (combinedHash !== account.combinedHash) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        for (const documentId of documentIds) {
            const document = account.documents.find(doc => doc.id === documentId);
            if (document) {
                // Simulate processing pipeline
                document.processingStatus.ocr.status = 'processing';
                setTimeout(() => {
                    document.processingStatus.ocr.status = 'completed';
                    document.processingStatus.structuring.status = 'processing';
                    setTimeout(() => {
                        document.processingStatus.structuring.status = 'completed';
                        document.processingStatus.translation.status = 'processing';
                        setTimeout(() => {
                            document.processingStatus.translation.status = 'completed';
                            document.processed = true;
                            saveAccounts(accounts);
                        }, 2000);
                    }, 2000);
                }, 2000);
            }
        }
        await saveAccounts(accounts);
        res.json({ success: true, message: 'Batch processing started' });

    } catch (error) {
        console.error('Error batch processing documents:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
    await initializeDirectories();
    
    app.listen(PORT, () => {
        console.log(`🏥 Strive & Fit Medical Portal Backend running on port ${PORT}`);
        console.log(`📁 Data directory: ${DATA_DIR}`);
        console.log(`📁 Uploads directory: ${UPLOADS_DIR}`);
    });
}

startServer().catch(console.error);

module.exports = app;
