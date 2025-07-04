# Deployment Guide: GitHub + Vercel

## Overview

Complete guide for deploying the Strive & Fit Telemedicine Document Management System to production using GitHub and Vercel. This setup provides a cost-effective, scalable solution for 1-100 users with real AI-powered OCR and translation capabilities.

## 🚀 Quick Start

### Prerequisites
- GitHub account
- Vercel account (free tier available)
- Alibaba Cloud DashScope API key ([Get one here](https://dashscope.console.aliyun.com/))
- Node.js 18+ and Python 3.9+ for local development

### 1-Minute Deployment
```bash
# 1. Clone and prepare
git clone https://github.com/yourusername/strivefit-website
cd strivefit-website

# 2. Install dependencies
npm install
cd backend && npm install

# 3. Deploy to Vercel (one command)
npx vercel
```

## 📋 Detailed Setup Guide

### Phase 1: Repository Preparation

#### 1.1 GitHub Repository Setup
```bash
# Initialize Git repository
git init
git add .
git commit -m "Initial commit: Strive & Fit medical document management system"

# Create GitHub repository and push
git branch -M main
git remote add origin https://github.com/yourusername/strivefit-website.git
git push -u origin main
```

#### 1.2 Project Structure Optimization
```
strivefit-website/
├── 📁 Frontend (Static Files)
│   ├── index.html              # Landing page
│   ├── login.html              # Authentication
│   ├── dashboard.html          # Main application
│   ├── styles.css              # Global styles
│   ├── js/
│   │   └── language-switcher.js
│   └── images/
├── 📁 API Routes (Vercel Functions)
│   └── api/
│       ├── authenticate.js     # User authentication
│       ├── upload-document.js  # File upload
│       ├── get-documents.js    # Document listing
│       ├── process-document.js # OCR & translation
│       └── view-document.js    # Document viewer
├── 📁 Backend Services
│   ├── services/
│   │   ├── qwen-ocr.py        # OCR service
│   │   ├── qwen-translate.py  # Translation service
│   │   └── file-handler.js    # File management
│   ├── data/
│   │   └── accounts.json      # User data
│   └── requirements.txt       # Python dependencies
├── 📄 Configuration
│   ├── vercel.json            # Vercel deployment config
│   ├── package.json           # Node.js dependencies
│   └── .env.example           # Environment template
└── 📚 Documentation
    ├── README.md
    ├── DEPLOYMENT.md          # This file
    └── SCALING.md             # Future scaling guide
```

### Phase 2: Vercel Configuration

#### 2.1 Create `vercel.json`
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

#### 2.2 Environment Variables Setup

**In Vercel Dashboard:**
1. Go to Project Settings → Environment Variables
2. Add the following variables:

```bash
# Required API Keys
DASHSCOPE_API_KEY=sk-your_dashscope_api_key_here

# Optional Qwen Model Configuration
QWEN_VL_MODEL=qwen-vl-plus
QWEN_TEXT_MODEL=qwen-max

# Node.js Environment
NODE_ENV=production
```

**Local Development (.env file):**
```bash
DASHSCOPE_API_KEY=sk-your_dashscope_api_key_here
QWEN_VL_MODEL=qwen-vl-plus
QWEN_TEXT_MODEL=qwen-max
NODE_ENV=development
```

### Phase 3: API Routes Migration

#### 3.1 Convert Express Routes to Vercel Functions

**Example: `api/authenticate.js`**
```javascript
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { dob, accountNumber } = req.body;
  
  if (!dob || !accountNumber) {
    return res.status(400).json({ error: 'Date of birth and account number are required' });
  }

  try {
    // Load accounts data
    const dataPath = path.join(process.cwd(), 'backend/data/accounts.json');
    const data = await fs.readFile(dataPath, 'utf8');
    const accounts = JSON.parse(data);
    
    const account = accounts[accountNumber];
    
    if (!account) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify credentials
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

#### 3.2 Python Integration for OCR/Translation

**Create `api/process-document.js`**
```javascript
import { spawn } from 'child_process';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { documentId, dob, accountNumber } = req.body;
  
  try {
    // Authenticate user first
    // ... authentication code ...
    
    // Execute Python OCR script
    const pythonScript = path.join(process.cwd(), 'backend/services/qwen-ocr.py');
    const pythonProcess = spawn('python3', [pythonScript, documentId]);
    
    let result = '';
    let error = '';
    
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        res.json({ success: true, message: 'Processing started', result });
      } else {
        res.status(500).json({ error: 'Processing failed', details: error });
      }
    });
    
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Phase 4: Frontend Updates

#### 4.1 Update API Endpoints
```javascript
// Update API base URL for production
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://your-app.vercel.app/api'
  : 'http://localhost:3000/api';
```

#### 4.2 Static Asset Optimization
```html
<!-- Optimize image loading -->
<link rel="preload" href="/images/logo.png" as="image">

<!-- Add service worker for caching -->
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
</script>
```

### Phase 5: Testing & Deployment

#### 5.1 Local Testing
```bash
# Install Vercel CLI
npm i -g vercel

# Run local development server
vercel dev

# Test all functionality:
# - Authentication
# - File upload
# - Document processing
# - Document viewing
```

#### 5.2 Production Deployment
```bash
# Deploy to production
vercel --prod

# Custom domain (optional)
vercel domains add yourdomain.com
```

#### 5.3 Health Checks
```bash
# Test API endpoints
curl https://your-app.vercel.app/api/health

# Test authentication
curl -X POST https://your-app.vercel.app/api/authenticate \
  -H "Content-Type: application/json" \
  -d '{"dob":"1990-01-01","accountNumber":"XX-XX-XX-XXXX-XX-XXXX"}'
```

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. **Build Failures**
```bash
# Check build logs
vercel logs

# Common fixes:
# - Ensure all dependencies in package.json
# - Check Node.js version compatibility
# - Verify file paths are correct
```

#### 2. **API Timeout Issues**
```javascript
// Increase timeout in vercel.json
"functions": {
  "api/*.js": {
    "maxDuration": 60
  }
}
```

#### 3. **Environment Variables Not Loading**
```bash
# Verify variables are set in Vercel dashboard
vercel env ls

# Pull environment variables locally
vercel env pull .env.local
```

#### 4. **Python Dependencies Issues**
```txt
# Ensure requirements.txt is in correct location
backend/requirements.txt

# Common Python packages for Vercel:
dashscope>=1.23.6
Pillow>=11.0.0
python-dotenv>=1.0.0
```

#### 5. **File Upload/Storage Issues**
```javascript
// Use temporary file storage for Vercel
import { tmpdir } from 'os';
import { join } from 'path';

const tempDir = tmpdir();
const uploadPath = join(tempDir, filename);
```

## 📊 Performance Optimization

### Frontend Optimization
```html
<!-- Minimize HTTP requests -->
<link rel="stylesheet" href="styles.min.css">
<script src="app.min.js" defer></script>

<!-- Enable compression -->
<meta http-equiv="Accept-Encoding" content="gzip, deflate, br">
```

### API Optimization
```javascript
// Enable response caching
export default async function handler(req, res) {
  // Cache static data for 1 hour
  res.setHeader('Cache-Control', 's-maxage=3600');
  
  // Your API logic here
}
```

### Database Optimization
```javascript
// Optimize JSON file operations
const accounts = JSON.parse(await fs.readFile(accountsPath, 'utf8'));

// Use in-memory caching for frequently accessed data
let accountsCache = null;
let cacheTime = 0;

if (Date.now() - cacheTime > 300000) { // 5 minutes
  accountsCache = await loadAccounts();
  cacheTime = Date.now();
}
```

## 📈 Monitoring & Analytics

### Built-in Vercel Analytics
```javascript
// Add to your HTML pages
<script defer src="/_vercel/analytics/script.js"></script>
```

### Custom Monitoring
```javascript
// Add basic error tracking
window.addEventListener('error', (event) => {
  fetch('/api/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      timestamp: new Date().toISOString()
    })
  });
});
```

## 🔒 Security Considerations

### API Security
```javascript
// Rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// CORS configuration
const allowedOrigins = [
  'https://your-app.vercel.app',
  'https://yourdomain.com'
];
```

### Data Protection
```javascript
// Sanitize user inputs
import DOMPurify from 'dompurify';

function sanitizeInput(input) {
  return DOMPurify.sanitize(input);
}

// Encrypt sensitive data
import crypto from 'crypto';

function encryptData(data, key) {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}
```

## 💰 Cost Estimation

### Vercel Pricing Tiers

#### **Hobby Plan (Free)**
- **Cost**: $0/month
- **Limits**: 
  - 100 GB-hours/month compute
  - 100 GB bandwidth/month
  - 10-second function timeout
- **Suitable for**: Development & testing

#### **Pro Plan ($20/month)**
- **Cost**: $20/month
- **Limits**:
  - 1000 GB-hours/month compute
  - 1000 GB bandwidth/month
  - 60-second function timeout
- **Suitable for**: Production (1-100 users)

#### **Enterprise Plan (Custom)**
- **Cost**: Custom pricing
- **Features**: SLA, advanced security, custom limits
- **Suitable for**: Large scale deployment

### Monthly Cost Breakdown (100 users)
```
Vercel Pro Plan:           $20
DashScope API (moderate):  $50-100
Domain name:               $12/year
SSL Certificate:           Free (included)
Total:                     $70-120/month
```

## 🚀 Go-Live Checklist

### Pre-Launch
- [ ] All environment variables configured
- [ ] API endpoints tested
- [ ] File upload/download working
- [ ] OCR/translation processing functional
- [ ] Multi-language support verified
- [ ] Mobile responsiveness checked
- [ ] Security headers configured
- [ ] Error handling implemented

### Launch Day
- [ ] Deploy to production
- [ ] Configure custom domain (if applicable)
- [ ] Set up monitoring
- [ ] Test user authentication flow
- [ ] Verify document processing pipeline
- [ ] Check multilingual functionality
- [ ] Test batch operations

### Post-Launch
- [ ] Monitor performance metrics
- [ ] Track error rates
- [ ] Gather user feedback
- [ ] Plan scaling strategy
- [ ] Document lessons learned

## 📞 Support & Resources

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [DashScope API Guide](https://help.aliyun.com/dashscope/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

### Community
- [Vercel Discord](https://discord.gg/vercel)
- [Alibaba Cloud Forums](https://www.alibabacloud.com/forum)

### Troubleshooting
- Check `vercel logs` for deployment issues
- Use Vercel's real-time monitoring dashboard
- Test API endpoints with Postman or curl
- Verify environment variables in Vercel dashboard

---

**🎉 Congratulations!** Your Strive & Fit medical document management system is now live on Vercel with real AI-powered OCR and translation capabilities.

**Next Steps**: Monitor usage, gather feedback, and refer to `SCALING.md` when ready to scale beyond 100 users.