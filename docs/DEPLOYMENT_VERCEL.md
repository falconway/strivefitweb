# Vercel Deployment Guide

## Quick Reference

### Essential Commands
```bash
# Deploy to Vercel
npx vercel

# Deploy to production
vercel --prod

# Check deployment logs
vercel logs

# Set environment variable
vercel env add DASHSCOPE_API_KEY
```

### Required Files
- `vercel.json` - Deployment configuration
- `package.json` - Dependencies
- `api/` folder - Serverless functions
- `.env.example` - Environment template

## Detailed Setup

### 1. Vercel Configuration (`vercel.json`)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/*.js",
      "use": "@vercel/node"
    },
    {
      "src": "backend/requirements.txt", 
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*\\.(css|js|png|jpg|svg|ico))",
      "dest": "/$1"
    },
    {
      "src": "/",
      "dest": "/index.html"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "functions": {
    "api/*.js": {
      "maxDuration": 60
    }
  },
  "env": {
    "DASHSCOPE_API_KEY": "@dashscope-api-key",
    "NODE_ENV": "production"
  }
}
```

### 2. API Route Examples

#### Authentication API (`api/authenticate.js`)
```javascript
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
    // Load accounts data from JSON file
    const dataPath = path.join(process.cwd(), 'backend/data/accounts.json');
    const data = await fs.readFile(dataPath, 'utf8');
    const accounts = JSON.parse(data);
    
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
```

#### Document Processing API (`api/process-document.js`)
```javascript
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { documentId, dob, accountNumber } = req.body;
  
  if (!documentId || !dob || !accountNumber) {
    return res.status(400).json({ 
      error: 'Document ID, DOB, and account number are required' 
    });
  }

  try {
    // Authenticate user first
    const dataPath = path.join(process.cwd(), 'backend/data/accounts.json');
    const data = await fs.readFile(dataPath, 'utf8');
    const accounts = JSON.parse(data);
    
    const account = accounts[accountNumber];
    if (!account) {
      return res.status(401).json({ error: 'Invalid account' });
    }
    
    const combinedHash = crypto.createHash('sha256').update(dob + accountNumber).digest('hex');
    if (combinedHash !== account.combinedHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Find the document
    const document = account.documents.find(doc => doc.id === documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Execute Python OCR script (simplified for Vercel)
    const pythonScript = path.join(process.cwd(), 'backend/services/qwen-bridge.py');
    const uploadPath = path.join(process.cwd(), 'backend/uploads', document.filename);
    
    const pythonProcess = spawn('python3', [pythonScript, uploadPath, documentId]);
    
    let result = '';
    let error = '';
    
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    pythonProcess.on('close', async (code) => {
      if (code === 0) {
        // Update document status
        document.processed = true;
        document.processingStatus = {
          ocr: { status: 'completed' },
          structuring: { status: 'completed' },
          translation: { status: 'completed' }
        };
        
        // Save updated accounts data
        await fs.writeFile(dataPath, JSON.stringify(accounts, null, 2));
        
        res.json({ 
          success: true, 
          message: 'Processing completed',
          result: JSON.parse(result)
        });
      } else {
        res.status(500).json({ 
          error: 'Processing failed', 
          details: error 
        });
      }
    });
    
    // Set timeout for long-running processes
    setTimeout(() => {
      pythonProcess.kill();
      res.status(408).json({ error: 'Processing timeout' });
    }, 55000); // 55 seconds (under Vercel's 60s limit)
    
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### 3. Python Integration

#### Qwen Bridge Service (`backend/services/qwen-bridge.py`)
```python
#!/usr/bin/env python3

import sys
import json
import os
from pathlib import Path

# Add the current directory to Python path
sys.path.append(str(Path(__file__).parent))

try:
    from qwen_ocr_service import QwenOCRService
    from qwen_translation_service import QwenTranslationService
except ImportError:
    print(json.dumps({"error": "Failed to import Qwen services"}))
    sys.exit(1)

def process_document(file_path, document_id):
    """Process document with OCR and translation"""
    try:
        # Initialize services
        ocr_service = QwenOCRService()
        translation_service = QwenTranslationService()
        
        # Step 1: OCR
        extracted_text = ocr_service.extract_text(file_path)
        
        # Step 2: Structure (create markdown)
        structured_md = f"# Document: {document_id}\n\n{extracted_text}"
        
        # Step 3: Translate to English
        translated_text = translation_service.translate(
            extracted_text, 
            source_lang="auto", 
            target_lang="English"
        )
        
        translated_md = f"# Document: {document_id} (English)\n\n{translated_text}"
        
        # Step 4: Save processed versions
        base_path = Path(file_path).parent
        
        # Save OCR markdown
        ocr_md_path = base_path / f"{document_id}-ocr.md"
        with open(ocr_md_path, 'w', encoding='utf-8') as f:
            f.write(structured_md)
        
        # Save translated markdown
        translated_md_path = base_path / f"{document_id}-translated.md"
        with open(translated_md_path, 'w', encoding='utf-8') as f:
            f.write(translated_md)
        
        # Save JSON versions
        ocr_json_path = base_path / f"{document_id}-ocr.json"
        with open(ocr_json_path, 'w', encoding='utf-8') as f:
            json.dump({
                "id": document_id,
                "extracted_text": extracted_text,
                "language_detected": "auto"
            }, f, ensure_ascii=False, indent=2)
        
        translated_json_path = base_path / f"{document_id}-translated.json"
        with open(translated_json_path, 'w', encoding='utf-8') as f:
            json.dump({
                "id": document_id,
                "translated_text": translated_text,
                "target_language": "English"
            }, f, ensure_ascii=False, indent=2)
        
        return {
            "success": True,
            "extracted_text": extracted_text,
            "translated_text": translated_text,
            "files_created": [
                str(ocr_md_path),
                str(translated_md_path),
                str(ocr_json_path),
                str(translated_json_path)
            ]
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: python qwen-bridge.py <file_path> <document_id>"}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    document_id = sys.argv[2]
    
    if not os.path.exists(file_path):
        print(json.dumps({"error": f"File not found: {file_path}"}))
        sys.exit(1)
    
    result = process_document(file_path, document_id)
    print(json.dumps(result, ensure_ascii=False, indent=2))
```

### 4. Environment Variables

#### Vercel Dashboard Setup
1. Go to your project in Vercel dashboard
2. Navigate to Settings → Environment Variables
3. Add the following:

```
DASHSCOPE_API_KEY=sk-your_actual_api_key_here
QWEN_VL_MODEL=qwen-vl-plus
QWEN_TEXT_MODEL=qwen-max
NODE_ENV=production
```

#### Local Development (`.env`)
```bash
DASHSCOPE_API_KEY=sk-your_actual_api_key_here
QWEN_VL_MODEL=qwen-vl-plus
QWEN_TEXT_MODEL=qwen-max
NODE_ENV=development
```

### 5. Frontend Updates

#### Update API Base URL
```javascript
// Update in dashboard.html and other frontend files
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://your-app.vercel.app/api'
  : 'http://localhost:3000/api';
```

#### Service Worker for Caching
```javascript
// public/sw.js
const CACHE_NAME = 'strivefit-v1';
const urlsToCache = [
  '/',
  '/styles.css',
  '/js/language-switcher.js',
  '/images/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
```

### 6. Testing & Deployment

#### Local Testing
```bash
# Install Vercel CLI
npm i -g vercel

# Run local development server
vercel dev

# Test endpoints
curl http://localhost:3000/api/health
```

#### Production Deployment
```bash
# Deploy to production
vercel --prod

# Verify deployment
curl https://your-app.vercel.app/api/health
```

### 7. Monitoring & Debugging

#### Check Deployment Logs
```bash
# View recent logs
vercel logs

# View function logs
vercel logs --function=api/authenticate

# Real-time logs
vercel logs --follow
```

#### Performance Monitoring
```javascript
// Add to your HTML pages
<script defer src="/_vercel/analytics/script.js"></script>
```

### 8. Common Issues & Solutions

#### Issue: Function Timeout
**Solution**: Optimize processing or increase timeout
```json
{
  "functions": {
    "api/process-document.js": {
      "maxDuration": 60
    }
  }
}
```

#### Issue: Large File Uploads
**Solution**: Use streaming and temporary storage
```javascript
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const uploadPath = `/tmp/${Date.now()}-upload`;
    const writeStream = createWriteStream(uploadPath);
    await pipeline(req, writeStream);
    // Process file...
  }
}
```

#### Issue: Environment Variables Not Loading
**Solution**: Check Vercel dashboard and redeploy
```bash
vercel env ls
vercel env pull .env.local
```

### 9. Security Best Practices

#### API Rate Limiting
```javascript
const rateLimiter = new Map();

export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;
  
  if (!rateLimiter.has(ip)) {
    rateLimiter.set(ip, { count: 1, resetTime: now + windowMs });
    return handleRequest(req, res);
  }
  
  const userLimit = rateLimiter.get(ip);
  if (now > userLimit.resetTime) {
    userLimit.count = 1;
    userLimit.resetTime = now + windowMs;
    return handleRequest(req, res);
  }
  
  if (userLimit.count >= maxRequests) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  userLimit.count++;
  return handleRequest(req, res);
}
```

#### Input Sanitization
```javascript
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

function sanitizeInput(input) {
  return purify.sanitize(input);
}
```

### 10. Performance Optimization

#### Response Caching
```javascript
export default async function handler(req, res) {
  // Cache static responses for 1 hour
  res.setHeader('Cache-Control', 's-maxage=3600');
  
  // Your API logic here
}
```

#### Compression
```javascript
import compression from 'compression';

const compress = compression();

export default async function handler(req, res) {
  compress(req, res, () => {
    // Your API logic here
  });
}
```

This guide provides everything you need to successfully deploy your Strive & Fit application to Vercel with real Qwen AI capabilities.