import { put, list } from '@vercel/blob';
import fs from 'fs/promises';
import path from 'path';

const ACCOUNTS_BLOB_PATH = 'accounts-data.json';

export async function loadAccounts() {
    console.log('🔄 Loading accounts data...');
    
    let accounts = {};
    let accountsLoaded = false;
    
    // Try to load from Vercel Blob first (persistent storage)
    try {
        console.log('Attempting to load from Vercel Blob...');
        
        // List blobs to find our accounts data file
        const { blobs } = await list({ prefix: 'accounts-data' });
        console.log('Found blobs:', blobs.map(b => b.pathname));
        
        const accountsBlob = blobs.find(blob => blob.pathname === ACCOUNTS_BLOB_PATH);
        
        if (accountsBlob) {
            console.log('Found accounts blob at:', accountsBlob.url);
            const response = await fetch(accountsBlob.url);
            if (response.ok) {
                const text = await response.text();
                accounts = JSON.parse(text);
                accountsLoaded = true;
                console.log('✅ Loaded accounts from Vercel Blob:', Object.keys(accounts).length, 'accounts');
            } else {
                console.log('Failed to fetch blob content, status:', response.status);
            }
        } else {
            console.log('No accounts blob found');
        }
    } catch (error) {
        console.log('Blob load failed (expected for first time):', error.message);
    }
    
    // Fallback to read-only deployment files
    if (!accountsLoaded) {
        const readOnlyPaths = [
            path.join(process.cwd(), 'backend/data/accounts.json'),
            path.join(process.cwd(), 'data/accounts.json')
        ];
        
        for (const tryPath of readOnlyPaths) {
            try {
                const data = await fs.readFile(tryPath, 'utf8');
                accounts = JSON.parse(data);
                accountsLoaded = true;
                console.log('✅ Loaded accounts from deployment files:', Object.keys(accounts).length, 'accounts');
                break;
            } catch (error) {
                continue;
            }
        }
    }
    
    // Last resort: try /tmp
    if (!accountsLoaded) {
        try {
            const data = await fs.readFile('/tmp/accounts.json', 'utf8');
            accounts = JSON.parse(data);
            accountsLoaded = true;
            console.log('✅ Loaded accounts from /tmp:', Object.keys(accounts).length, 'accounts');
        } catch (error) {
            accounts = {};
            console.log('🆕 Starting with empty accounts data');
        }
    }
    
    return accounts;
}

export async function saveAccounts(accounts) {
    console.log('💾 Saving accounts data...', Object.keys(accounts).length, 'accounts');
    
    const accountsJson = JSON.stringify(accounts, null, 2);
    
    // Save to Vercel Blob (persistent)
    try {
        const blob = await put(ACCOUNTS_BLOB_PATH, accountsJson, {
            access: 'public',
            contentType: 'application/json'
        });
        console.log('✅ Saved accounts to Vercel Blob:', blob.url);
        console.log('Saved data preview:', accountsJson.substring(0, 200) + '...');
    } catch (error) {
        console.error('❌ Failed to save to Vercel Blob:', error);
        throw error;
    }
    
    // Also save to /tmp as backup (for current function instance)
    try {
        await fs.writeFile('/tmp/accounts.json', accountsJson);
        console.log('✅ Saved accounts to /tmp as backup');
    } catch (error) {
        console.log('⚠️ Failed to save to /tmp:', error.message);
    }
    
    return true;
}