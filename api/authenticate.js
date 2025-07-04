import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

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

  const { dob, accountNumber } = req.body;
  
  if (!dob || !accountNumber) {
    return res.status(400).json({ 
      error: 'Date of birth and account number are required' 
    });
  }

  try {
    // Try different paths for Vercel deployment
    let accounts = {};
    let accountsLoaded = false;
    
    const possiblePaths = [
      path.join(process.cwd(), 'backend/data/accounts.json'),
      path.join(process.cwd(), 'data/accounts.json'),
      path.join('/tmp', 'accounts.json')
    ];
    
    for (const tryPath of possiblePaths) {
      try {
        const data = await fs.readFile(tryPath, 'utf8');
        accounts = JSON.parse(data);
        accountsLoaded = true;
        break;
      } catch (error) {
        continue;
      }
    }
    
    if (!accountsLoaded) {
      return res.status(401).json({ error: 'Authentication system unavailable' });
    }
    
    const account = accounts[accountNumber];
    
    if (!account) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify credentials using existing hash method
    const dobHash = crypto.createHash('sha256').update(dob).digest('hex');
    const combinedHash = crypto.createHash('sha256').update(dob + accountNumber).digest('hex');
    
    if (combinedHash !== account.combinedHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    return res.json({ 
      success: true, 
      message: 'Authentication successful',
      accountNumber 
    });
    
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}