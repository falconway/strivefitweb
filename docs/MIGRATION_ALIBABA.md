# Alibaba Cloud Migration Guide

## Overview
Detailed guide for migrating from Vercel to Alibaba Cloud infrastructure. This migration provides better performance, unlimited storage, and prepares for enterprise scaling.

## Migration Timeline: 4-6 Weeks

### Week 1: Infrastructure Setup
### Week 2: Database Migration  
### Week 3: Application Deployment
### Week 4: Testing & Go-Live

---

## Phase 1: Infrastructure Preparation

### 1.1 Alibaba Cloud Account Setup
```bash
# Create Alibaba Cloud account
# https://www.alibabacloud.com/

# Install Alibaba Cloud CLI
curl -O https://aliyuncli.alicdn.com/aliyun-cli-linux-latest-amd64.tgz
tar xzvf aliyun-cli-linux-latest-amd64.tgz
sudo cp aliyun /usr/local/bin

# Configure CLI
aliyun configure --profile default
```

### 1.2 VPC and Security Configuration
```bash
# Create VPC
aliyun ecs CreateVpc \
  --VpcName "strivefit-vpc" \
  --CidrBlock "10.0.0.0/16" \
  --Description "Strive & Fit main VPC"

# Create VSwitch
aliyun ecs CreateVSwitch \
  --VpcId "vpc-xxxxxxxx" \
  --VswitchName "strivefit-vswitch" \
  --CidrBlock "10.0.1.0/24" \
  --ZoneId "cn-hangzhou-b"

# Create Security Group
aliyun ecs CreateSecurityGroup \
  --SecurityGroupName "strivefit-sg" \
  --Description "Strive & Fit security group" \
  --VpcId "vpc-xxxxxxxx"
```

### 1.3 ECS Instance Setup
```bash
# Create ECS instance
aliyun ecs CreateInstance \
  --ImageId "ubuntu_20_04_x64_20G_alibase_20210420.vhd" \
  --InstanceType "ecs.c6.large" \
  --SecurityGroupId "sg-xxxxxxxx" \
  --VSwitchId "vsw-xxxxxxxx" \
  --InstanceName "strivefit-app" \
  --InternetMaxBandwidthOut 10

# Start instance
aliyun ecs StartInstance --InstanceId "i-xxxxxxxx"

# Allocate and associate Elastic IP
aliyun ecs AllocateEipAddress --InternetChargeType PayByTraffic
aliyun ecs AssociateEipAddress --InstanceId "i-xxxxxxxx" --AllocationId "eip-xxxxxxxx"
```

### 1.4 RDS Database Setup
```bash
# Create RDS PostgreSQL instance
aliyun rds CreateDBInstance \
  --Engine "PostgreSQL" \
  --EngineVersion "13.0" \
  --DBInstanceClass "pg.n2.small.1" \
  --DBInstanceStorage 100 \
  --DBInstanceStorageType "cloud_essd" \
  --PayType "Postpaid" \
  --SecurityIPList "10.0.1.0/24" \
  --DBInstanceDescription "Strive & Fit Database"

# Create database
aliyun rds CreateDatabase \
  --DBInstanceId "pgm-xxxxxxxx" \
  --DBName "strivefit" \
  --CharacterSetName "UTF8"

# Create database account
aliyun rds CreateAccount \
  --DBInstanceId "pgm-xxxxxxxx" \
  --AccountName "strivefit_user" \
  --AccountPassword "YourSecurePassword123!" \
  --AccountType "Normal"
```

### 1.5 OSS Storage Setup
```bash
# Create OSS buckets
aliyun oss mb oss://strivefit-uploads --region cn-hangzhou
aliyun oss mb oss://strivefit-processed --region cn-hangzhou
aliyun oss mb oss://strivefit-static --region cn-hangzhou

# Set bucket policies
cat > bucket-policy.json << EOF
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"Service": ["ecs.aliyuncs.com"]},
      "Action": ["oss:GetObject", "oss:PutObject"],
      "Resource": "acs:oss:*:*:strivefit-uploads/*"
    }
  ]
}
EOF

aliyun oss bucket-policy --method put oss://strivefit-uploads bucket-policy.json
```

---

## Phase 2: Database Migration

### 2.1 Export Data from Vercel
```bash
# Download accounts.json from Vercel deployment
curl https://your-app.vercel.app/api/export-data > accounts_backup.json

# Or manually download from project files
cp backend/data/accounts.json accounts_backup.json
```

### 2.2 PostgreSQL Schema Creation
```sql
-- Connect to PostgreSQL database
psql -h pgm-xxxxxxxx.postgresql.rds.aliyuncs.com -U strivefit_user -d strivefit

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number VARCHAR(25) UNIQUE NOT NULL,
    dob_hash VARCHAR(64) NOT NULL,
    combined_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_name TEXT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    mimetype VARCHAR(100),
    size BIGINT,
    description TEXT,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    processing_status JSONB DEFAULT '{}',
    processed_versions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_account_number ON users(account_number);
CREATE INDEX idx_users_combined_hash ON users(combined_hash);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_filename ON documents(filename);
CREATE INDEX idx_documents_upload_date ON documents(upload_date DESC);
CREATE INDEX idx_documents_processed ON documents(processed);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2.3 Data Migration Script
```python
# migrate_data.py
import json
import psycopg2
from datetime import datetime
import uuid

def migrate_accounts(json_file, db_config):
    """Migrate accounts from JSON to PostgreSQL"""
    
    # Connect to database
    conn = psycopg2.connect(**db_config)
    cur = conn.cursor()
    
    # Load JSON data
    with open(json_file, 'r', encoding='utf-8') as f:
        accounts = json.load(f)
    
    # Migrate each account
    for account_number, account_data in accounts.items():
        try:
            # Insert user
            user_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO users (id, account_number, dob_hash, combined_hash, created_at)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (account_number) DO NOTHING
            """, (
                user_id,
                account_number,
                account_data['dobHash'],
                account_data['combinedHash'],
                datetime.fromisoformat(account_data['createdAt'].replace('Z', '+00:00'))
            ))
            
            # Insert documents
            for doc in account_data.get('documents', []):
                cur.execute("""
                    INSERT INTO documents (
                        id, user_id, original_name, filename, mimetype, 
                        size, description, upload_date, processed, 
                        processing_status, processed_versions
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    doc['id'],
                    user_id,
                    doc['originalName'],
                    doc['filename'],
                    doc['mimetype'],
                    doc['size'],
                    doc.get('description', ''),
                    datetime.fromisoformat(doc['uploadDate'].replace('Z', '+00:00')),
                    doc.get('processed', False),
                    json.dumps(doc.get('processingStatus', {})),
                    json.dumps(doc.get('processedVersions', {}))
                ))
            
            print(f"Migrated account: {account_number}")
            
        except Exception as e:
            print(f"Error migrating account {account_number}: {e}")
            conn.rollback()
            continue
    
    # Commit changes
    conn.commit()
    cur.close()
    conn.close()
    print("Migration completed!")

if __name__ == "__main__":
    db_config = {
        'host': 'pgm-xxxxxxxx.postgresql.rds.aliyuncs.com',
        'database': 'strivefit',
        'user': 'strivefit_user',
        'password': 'YourSecurePassword123!',
        'port': 5432
    }
    
    migrate_accounts('accounts_backup.json', db_config)
```

### 2.4 File Migration to OSS
```bash
# Install OSS utilities
pip install oss2

# Migrate uploaded files
python migrate_files.py
```

```python
# migrate_files.py
import os
import oss2
from pathlib import Path

def migrate_files_to_oss():
    """Migrate files from local storage to OSS"""
    
    # OSS configuration
    auth = oss2.Auth('your-access-key', 'your-secret-key')
    bucket = oss2.Bucket(auth, 'https://oss-cn-hangzhou.aliyuncs.com', 'strivefit-uploads')
    
    # Local files directory
    uploads_dir = Path('backend/uploads')
    
    if not uploads_dir.exists():
        print("Uploads directory not found")
        return
    
    # Upload each file
    for file_path in uploads_dir.iterdir():
        if file_path.is_file():
            try:
                # Upload to OSS
                with open(file_path, 'rb') as f:
                    bucket.put_object(file_path.name, f)
                
                print(f"Uploaded: {file_path.name}")
                
            except Exception as e:
                print(f"Error uploading {file_path.name}: {e}")
    
    print("File migration completed!")

if __name__ == "__main__":
    migrate_files_to_oss()
```

---

## Phase 3: Application Deployment

### 3.1 ECS Server Setup
```bash
# Connect to ECS instance
ssh root@your-ecs-ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install Python
apt install -y python3 python3-pip

# Install PM2 for process management
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install PostgreSQL client
apt install -y postgresql-client
```

### 3.2 Application Code Deployment
```bash
# Clone repository
git clone https://github.com/yourusername/strivefit-website.git
cd strivefit-website

# Install dependencies
npm install
cd backend && npm install && cd ..

# Install Python dependencies
pip3 install -r backend/requirements.txt

# Create environment file
cat > backend/.env << EOF
NODE_ENV=production
DATABASE_URL=postgresql://strivefit_user:YourSecurePassword123!@pgm-xxxxxxxx.postgresql.rds.aliyuncs.com:5432/strivefit
DASHSCOPE_API_KEY=sk-your_actual_api_key_here
OSS_ACCESS_KEY=your-access-key
OSS_SECRET_KEY=your-secret-key
OSS_BUCKET_UPLOADS=strivefit-uploads
OSS_BUCKET_PROCESSED=strivefit-processed
OSS_REGION=oss-cn-hangzhou
EOF

# Set permissions
chmod 600 backend/.env
```

### 3.3 Database Integration
```javascript
// backend/services/database.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

class DatabaseService {
  async authenticate(dob, accountNumber) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE account_number = $1',
        [accountNumber]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const user = result.rows[0];
      const crypto = require('crypto');
      const combinedHash = crypto.createHash('sha256').update(dob + accountNumber).digest('hex');
      
      if (combinedHash === user.combined_hash) {
        return user;
      }
      
      return null;
    } finally {
      client.release();
    }
  }
  
  async getUserDocuments(userId) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM documents WHERE user_id = $1 ORDER BY upload_date DESC',
        [userId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }
  
  async createDocument(userId, documentData) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO documents (user_id, original_name, filename, mimetype, size, description)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        userId,
        documentData.originalName,
        documentData.filename,
        documentData.mimetype,
        documentData.size,
        documentData.description || ''
      ]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}

module.exports = new DatabaseService();
```

### 3.4 OSS Integration
```javascript
// backend/services/oss.js
const OSS = require('ali-oss');

const client = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY,
  accessKeySecret: process.env.OSS_SECRET_KEY,
  bucket: process.env.OSS_BUCKET_UPLOADS
});

class OSSService {
  async uploadFile(filename, fileBuffer) {
    try {
      const result = await client.put(filename, fileBuffer);
      return result;
    } catch (error) {
      throw new Error(`OSS upload failed: ${error.message}`);
    }
  }
  
  async downloadFile(filename) {
    try {
      const result = await client.get(filename);
      return result.content;
    } catch (error) {
      throw new Error(`OSS download failed: ${error.message}`);
    }
  }
  
  async deleteFile(filename) {
    try {
      await client.delete(filename);
      return true;
    } catch (error) {
      throw new Error(`OSS delete failed: ${error.message}`);
    }
  }
  
  async getSignedUrl(filename, expires = 3600) {
    try {
      const url = client.signatureUrl(filename, { expires });
      return url;
    } catch (error) {
      throw new Error(`OSS signed URL failed: ${error.message}`);
    }
  }
}

module.exports = new OSSService();
```

### 3.5 Updated Express Server
```javascript
// backend/server.js (updated for Alibaba Cloud)
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const DatabaseService = require('./services/database');
const OSSService = require('./services/oss');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Configure multer for memory storage (files go to OSS)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Authentication endpoint
app.post('/api/authenticate', async (req, res) => {
  try {
    const { dob, accountNumber } = req.body;
    
    if (!dob || !accountNumber) {
      return res.status(400).json({ error: 'DOB and account number required' });
    }
    
    const user = await DatabaseService.authenticate(dob, accountNumber);
    
    if (user) {
      res.json({ 
        success: true, 
        message: 'Authentication successful',
        accountNumber: user.account_number
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
    
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload document endpoint
app.post('/api/upload-document', upload.single('document'), async (req, res) => {
  try {
    const { dob, accountNumber, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Authenticate user
    const user = await DatabaseService.authenticate(dob, accountNumber);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate unique filename
    const crypto = require('crypto');
    const fileExtension = path.extname(req.file.originalname);
    const filename = crypto.randomBytes(16).toString('hex') + fileExtension;
    
    // Upload to OSS
    await OSSService.uploadFile(filename, req.file.buffer);
    
    // Save document record
    const document = await DatabaseService.createDocument(user.id, {
      originalName: req.file.originalname,
      filename: filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      description: description
    });
    
    res.json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        id: document.id,
        originalName: document.original_name,
        uploadDate: document.upload_date
      }
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get documents endpoint
app.post('/api/get-documents', async (req, res) => {
  try {
    const { dob, accountNumber } = req.body;
    
    const user = await DatabaseService.authenticate(dob, accountNumber);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const documents = await DatabaseService.getUserDocuments(user.id);
    
    res.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc.id,
        originalName: doc.original_name,
        uploadDate: doc.upload_date,
        size: doc.size,
        processed: doc.processed,
        processingStatus: doc.processing_status
      }))
    });
    
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
});

app.listen(PORT, () => {
  console.log(`🏥 Strive & Fit server running on port ${PORT}`);
});
```

### 3.6 Nginx Configuration
```nginx
# /etc/nginx/sites-available/strivefit
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL configuration (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    }
    
    # Static files
    location / {
        root /var/www/strivefit;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

### 3.7 Process Management with PM2
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'strivefit-api',
    script: './backend/server.js',
    cwd: '/root/strivefit-website',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Phase 4: Testing & Go-Live

### 4.1 Health Checks
```bash
# Test database connection
psql -h pgm-xxxxxxxx.postgresql.rds.aliyuncs.com -U strivefit_user -d strivefit -c "SELECT COUNT(*) FROM users;"

# Test OSS connectivity
curl -I https://strivefit-uploads.oss-cn-hangzhou.aliyuncs.com

# Test application endpoints
curl https://your-domain.com/api/health

# Test authentication
curl -X POST https://your-domain.com/api/authenticate \
  -H "Content-Type: application/json" \
  -d '{"dob":"1990-01-01","accountNumber":"XX-XX-XX-XXXX-XX-XXXX"}'
```

### 4.2 Performance Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Create test script
cat > load-test.yml << EOF
config:
  target: 'https://your-domain.com'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "API Load Test"
    requests:
      - get:
          url: "/api/health"
      - post:
          url: "/api/authenticate"
          json:
            dob: "1990-01-01"
            accountNumber: "XX-XX-XX-XXXX-XX-XXXX"
EOF

# Run load test
artillery run load-test.yml
```

### 4.3 Security Testing
```bash
# Install security scanner
npm install -g nsp

# Scan for vulnerabilities
nsp check

# Test SSL configuration
curl -I https://your-domain.com

# Test security headers
curl -I https://your-domain.com | grep -i "x-frame-options\|x-content-type-options\|x-xss-protection"
```

### 4.4 DNS Cutover
```bash
# Update DNS records
# A record: your-domain.com -> your-ecs-ip
# CNAME: www.your-domain.com -> your-domain.com

# Verify DNS propagation
nslookup your-domain.com
dig your-domain.com
```

### 4.5 Monitoring Setup
```bash
# Install monitoring agent
wget http://cloudmonitor-agent.oss-cn-hangzhou.aliyuncs.com/release/cloudmonitor-agent-latest.linux.amd64.tar.gz
tar -zxvf cloudmonitor-agent-latest.linux.amd64.tar.gz
cd cloudmonitor-agent-latest.linux.amd64
sudo bash install.sh
```

---

## Post-Migration Checklist

### ✅ Functionality Verification
- [ ] User authentication working
- [ ] File upload/download working  
- [ ] Document processing (OCR/translation) working
- [ ] Multi-language support working
- [ ] Batch operations working
- [ ] Mobile responsiveness maintained

### ✅ Performance Verification  
- [ ] Page load times < 3 seconds
- [ ] API response times < 500ms
- [ ] File upload handling large files (50MB+)
- [ ] Database queries optimized
- [ ] CDN caching working

### ✅ Security Verification
- [ ] SSL certificate installed and working
- [ ] Security headers configured
- [ ] Database access restricted
- [ ] OSS bucket permissions correct
- [ ] API rate limiting active

### ✅ Monitoring Setup
- [ ] CloudMonitor agent installed
- [ ] Application logs configured
- [ ] Database monitoring active
- [ ] Alert rules configured
- [ ] Backup procedures tested

## Cost Optimization Tips

### 1. Right-sizing Resources
```bash
# Monitor resource usage
top
htop
df -h

# Adjust ECS instance type if needed
aliyun ecs ModifyInstanceAttribute --InstanceId i-xxxxxxxx --InstanceType ecs.c6.xlarge
```

### 2. Database Optimization
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM documents WHERE user_id = 'uuid';

-- Create additional indexes if needed
CREATE INDEX CONCURRENTLY idx_documents_processing_status ON documents USING GIN(processing_status);
```

### 3. Storage Optimization
```bash
# Set OSS lifecycle rules
aliyun oss lifecycle --method put oss://strivefit-uploads lifecycle.xml

# Enable OSS compression
aliyun oss bucket-compression --method put oss://strivefit-uploads --compression-type gzip
```

## Rollback Plan

### Emergency Rollback to Vercel
```bash
# 1. Switch DNS back to Vercel
# 2. Verify Vercel deployment still active
# 3. Test all functionality
# 4. Communicate status to users

# Quick DNS switch
# A record: your-domain.com -> vercel-ip
```

### Data Recovery
```bash
# Export current data from Alibaba Cloud
pg_dump -h pgm-xxxxxxxx.postgresql.rds.aliyuncs.com -U strivefit_user strivefit > backup_$(date +%Y%m%d).sql

# Download files from OSS
ossutil cp oss://strivefit-uploads/ ./backup_files/ -r
```

This comprehensive migration guide ensures a smooth transition from Vercel to Alibaba Cloud with improved performance, scalability, and enterprise features.