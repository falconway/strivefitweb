import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

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

    const { dob } = req.body;
    
    if (!dob) {
        return res.status(400).json({ error: 'Date of birth is required' });
    }

    try {
        // Try different paths for Vercel deployment
        let accounts = {};
        let dataPath;
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
                dataPath = tryPath;
                accountsLoaded = true;
                break;
            } catch (error) {
                continue;
            }
        }
        
        // If no existing file found, try to create in /tmp for Vercel
        if (!accountsLoaded) {
            dataPath = '/tmp/accounts.json';
            accounts = {};
            
            // Try to create the file
            try {
                await fs.writeFile(dataPath, JSON.stringify(accounts, null, 2));
            } catch (error) {
                console.error('Failed to create accounts file:', error);
                return res.status(500).json({ error: 'Failed to initialize data storage' });
            }
        }
        
        // Generate unique account number
        let accountNumber;
        do {
            accountNumber = generateSecureAccountNumber();
        } while (accounts[accountNumber]);
        
        // Hash DOB and create combined hash
        const dobHash = hashData(dob);
        const combinedHash = hashData(dob + accountNumber);
        
        // Store account
        accounts[accountNumber] = {
            dobHash,
            combinedHash,
            createdAt: new Date().toISOString(),
            documents: []
        };
        
        // Save accounts
        try {
            await fs.writeFile(dataPath, JSON.stringify(accounts, null, 2));
        } catch (writeError) {
            console.error('Failed to save accounts file:', writeError);
            return res.status(500).json({ error: 'Failed to save account data' });
        }
        
        res.json({ 
            success: true, 
            accountNumber,
            message: 'Account created successfully' 
        });
        
    } catch (error) {
        console.error('Error generating account:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}