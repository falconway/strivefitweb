/**
 * Railway Storage Service
 * Replaces Vercel Blob with Railway's persistent file system
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RailwayStorage {
    constructor() {
        // Use Railway storage mount path or fallback for local development
        this.storagePath = process.env.RAILWAY_STORAGE_PATH || path.join(process.cwd(), 'storage');
        this.accountsFile = path.join(this.storagePath, 'accounts.json');
        this.uploadsDir = path.join(this.storagePath, 'uploads');
        this.processedDir = path.join(this.storagePath, 'processed');
        
        console.log('📁 Railway Storage initialized at:', this.storagePath);
    }

    /**
     * Initialize storage directories
     */
    async initializeStorage() {
        try {
            await fs.mkdir(this.storagePath, { recursive: true });
            await fs.mkdir(this.uploadsDir, { recursive: true });
            await fs.mkdir(this.processedDir, { recursive: true });
            
            // Create accounts.json if it doesn't exist
            try {
                await fs.access(this.accountsFile);
            } catch {
                await fs.writeFile(this.accountsFile, JSON.stringify({}, null, 2));
                console.log('✅ Created initial accounts.json');
            }
            
            console.log('✅ Railway storage initialized');
        } catch (error) {
            console.error('❌ Failed to initialize storage:', error);
            throw error;
        }
    }

    /**
     * Load accounts data
     */
    async loadAccounts() {
        try {
            await this.initializeStorage();
            const data = await fs.readFile(this.accountsFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('❌ Failed to load accounts:', error);
            return {};
        }
    }

    /**
     * Save accounts data
     */
    async saveAccounts(accounts) {
        try {
            await this.initializeStorage();
            await fs.writeFile(this.accountsFile, JSON.stringify(accounts, null, 2));
            console.log('✅ Accounts saved to Railway storage');
            return true;
        } catch (error) {
            console.error('❌ Failed to save accounts:', error);
            throw error;
        }
    }

    /**
     * Store uploaded file
     */
    async storeUploadedFile(accountNumber, filename, fileBuffer) {
        try {
            const accountDir = path.join(this.uploadsDir, accountNumber);
            await fs.mkdir(accountDir, { recursive: true });
            
            const filePath = path.join(accountDir, filename);
            await fs.writeFile(filePath, fileBuffer);
            
            // Return file info similar to Vercel Blob
            return {
                url: `/storage/uploads/${accountNumber}/${filename}`,
                pathname: filename,
                size: fileBuffer.length,
                uploadedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Failed to store file:', error);
            throw error;
        }
    }

    /**
     * Get uploaded file
     */
    async getUploadedFile(accountNumber, filename) {
        try {
            const filePath = path.join(this.uploadsDir, accountNumber, filename);
            const fileBuffer = await fs.readFile(filePath);
            return fileBuffer;
        } catch (error) {
            console.error('❌ Failed to get file:', error);
            throw error;
        }
    }

    /**
     * Store processed file
     */
    async storeProcessedFile(accountNumber, filename, content) {
        try {
            const accountDir = path.join(this.processedDir, accountNumber);
            await fs.mkdir(accountDir, { recursive: true });
            
            const filePath = path.join(accountDir, filename);
            await fs.writeFile(filePath, content, 'utf8');
            
            return {
                url: `/storage/processed/${accountNumber}/${filename}`,
                pathname: filename,
                size: content.length,
                processedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Failed to store processed file:', error);
            throw error;
        }
    }

    /**
     * Get processed file
     */
    async getProcessedFile(accountNumber, filename) {
        try {
            const filePath = path.join(this.processedDir, accountNumber, filename);
            const content = await fs.readFile(filePath, 'utf8');
            return content;
        } catch (error) {
            console.error('❌ Failed to get processed file:', error);
            throw error;
        }
    }

    /**
     * Delete file
     */
    async deleteFile(accountNumber, filename, type = 'uploads') {
        try {
            const dir = type === 'uploads' ? this.uploadsDir : this.processedDir;
            const filePath = path.join(dir, accountNumber, filename);
            await fs.unlink(filePath);
            console.log('✅ File deleted:', filename);
            return true;
        } catch (error) {
            console.error('❌ Failed to delete file:', error);
            return false;
        }
    }

    /**
     * Get file URL for serving
     */
    getFileUrl(accountNumber, filename, type = 'uploads') {
        return `/api/storage/${type}/${accountNumber}/${filename}`;
    }

    /**
     * Get file path for local access
     */
    getFilePath(accountNumber, filename, type = 'uploads') {
        const dir = type === 'uploads' ? this.uploadsDir : this.processedDir;
        return path.join(dir, accountNumber, filename);
    }

    /**
     * List files for account
     */
    async listFiles(accountNumber, type = 'uploads') {
        try {
            const dir = type === 'uploads' ? this.uploadsDir : this.processedDir;
            const accountDir = path.join(dir, accountNumber);
            
            try {
                const files = await fs.readdir(accountDir);
                const fileList = [];
                
                for (const file of files) {
                    const filePath = path.join(accountDir, file);
                    const stats = await fs.stat(filePath);
                    fileList.push({
                        name: file,
                        size: stats.size,
                        modified: stats.mtime.toISOString(),
                        url: this.getFileUrl(accountNumber, file, type)
                    });
                }
                
                return fileList;
            } catch {
                return []; // Directory doesn't exist yet
            }
        } catch (error) {
            console.error('❌ Failed to list files:', error);
            return [];
        }
    }

    /**
     * Get storage stats
     */
    async getStorageStats() {
        try {
            const accounts = await this.loadAccounts();
            const accountCount = Object.keys(accounts).length;
            
            let totalFiles = 0;
            let totalSize = 0;
            
            // Count uploaded files
            for (const accountNumber of Object.keys(accounts)) {
                const files = await this.listFiles(accountNumber, 'uploads');
                totalFiles += files.length;
                totalSize += files.reduce((sum, file) => sum + file.size, 0);
            }
            
            return {
                accountCount,
                totalFiles,
                totalSize,
                storagePath: this.storagePath
            };
        } catch (error) {
            console.error('❌ Failed to get storage stats:', error);
            return null;
        }
    }
}

export default RailwayStorage;