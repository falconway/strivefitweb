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
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { dob, accountNumber } = req.body;
    
    if (!dob || !accountNumber) {
        return res.status(400).json({ 
            error: 'Date of birth and account number are required' 
        });
    }

    try {
        // Load accounts data using persistent storage
        const accounts = await loadAccounts();
        
        console.log('📊 get-documents - loaded data:', {
            totalAccounts: Object.keys(accounts).length,
            requestedAccount: accountNumber.substring(0, 4) + '****'
        });
        
        if (Object.keys(accounts).length === 0) {
            console.log('❌ No account data available');
            return res.status(500).json({ error: 'No account data available' });
        }
        
        const account = accounts[accountNumber];
        
        if (account) {
            console.log('✅ Found account with', account.documents ? account.documents.length : 0, 'documents');
        } else {
            console.log('❌ Account not found');
        }
        
        if (!account) {
            return res.status(401).json({ error: 'Invalid account' });
        }
        
        // Verify credentials
        const combinedHash = hashData(dob + accountNumber);
        if (combinedHash !== account.combinedHash) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
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
}