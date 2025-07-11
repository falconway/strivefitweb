/**
 * Railway Data Store
 * Replaces Vercel Blob data store with Railway's persistent storage
 */

import RailwayStorage from './services/railway-storage.js';

const storage = new RailwayStorage();

export async function loadAccounts() {
    console.log('🔄 Loading accounts from Railway storage...');
    return await storage.loadAccounts();
}

export async function saveAccounts(accounts) {
    console.log('💾 Saving accounts to Railway storage...', Object.keys(accounts).length, 'accounts');
    return await storage.saveAccounts(accounts);
}

export { storage };