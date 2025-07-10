import { put, list, del } from '@vercel/blob';
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
        
        // List blobs to find our accounts data file (now with timestamp)
        const { blobs } = await list({ prefix: 'accounts-data' });
        console.log('Found blobs:', blobs.map(b => b.pathname));
        
        // Find the most recent accounts file (sorted by timestamp in filename)
        const accountsBlobs = blobs.filter(b => b.pathname.startsWith('accounts-data'));
        const accountsBlob = accountsBlobs.sort((a, b) => b.pathname.localeCompare(a.pathname))[0];
        
        if (accountsBlob) {
            console.log('Found accounts blob at:', accountsBlob.url);
            const response = await fetch(accountsBlob.url);
            if (response.ok) {
                const text = await response.text();
                accounts = JSON.parse(text);
                accountsLoaded = true;
                console.log('✅ Accounts loaded from blob storage');
            } else {
                console.log('Failed to fetch blob content, status:', response.status);
            }
        } else {
            console.log('No accounts blob found');
        }
    } catch (error) {
        console.log('Blob load failed (expected for first time):', error.message);
    }
    
    // Fallback to read-only deployment file (single source of truth)
    if (!accountsLoaded) {
        try {
            const data = await fs.readFile(path.join(process.cwd(), 'backend/data/accounts.json'), 'utf8');
            accounts = JSON.parse(data);
            accountsLoaded = true;
            console.log('✅ Accounts loaded from deployment file');
        } catch (error) {
            console.log('⚠️ Failed to load deployment file:', error.message);
        }
    }
    
    // Last resort: try /tmp
    if (!accountsLoaded) {
        try {
            const data = await fs.readFile('/tmp/accounts.json', 'utf8');
            accounts = JSON.parse(data);
            accountsLoaded = true;
            console.log('✅ Accounts loaded from /tmp');
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
    
    // Save to Vercel Blob with cleanup of old versions
    try {
        // Cleanup existing accounts-data files to prevent duplicates
        try {
            const { blobs } = await list({ prefix: 'accounts-data' });
            if (blobs.length > 0) {
                for (const blob of blobs) {
                    try {
                        await del(blob.url);
                    } catch (delError) {
                        console.log('⚠️ Failed to delete old file:', blob.pathname);
                    }
                }
            }
        } catch (listError) {
            // Ignore cleanup errors
        }
        
        // Small delay to ensure deletions are processed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Save the new version with timestamp to ensure uniqueness
        const timestampedPath = `accounts-data-${Date.now()}.json`;
        const blob = await put(timestampedPath, accountsJson, {
            access: 'public',
            contentType: 'application/json'
        });
        console.log('✅ Accounts data saved to blob storage');
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