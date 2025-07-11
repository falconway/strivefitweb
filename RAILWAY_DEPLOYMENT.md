# Railway Deployment Guide

This guide explains how to deploy the Strive & Fit medical document management system to Railway.

## Overview

The system has been migrated from Vercel to Railway to handle long-running OCR and translation processes. Railway provides:
- Persistent storage for files and database
- No timeout limits for long-running processes
- Better accessibility for Chinese clients
- Express.js server instead of serverless functions

## Prerequisites

1. Railway account (sign up at https://railway.app)
2. OpenRouter API key (get from https://openrouter.ai/keys)
3. Git repository with your code

## Deployment Steps

### 1. Create Railway Project

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### 2. Configure Environment Variables

In your Railway project dashboard, go to Variables and add:

```
OPENROUTER_API_KEY=your_openrouter_api_key_here
NODE_ENV=production
```

### 3. Configure Persistent Storage

Railway will automatically create a persistent volume based on the `railway.toml` configuration.

### 4. Deploy

Railway will automatically deploy your application. The deployment process:
1. Installs dependencies with `npm install`
2. Starts the server with `npm start`
3. Creates persistent storage at `/app/storage`

## File Structure

```
/app/
├── server.js                 # Main Express server
├── api/
│   ├── services/
│   │   ├── railway-storage.js     # Railway storage service
│   │   └── openrouter-api.js      # OpenRouter API integration
│   ├── railway-data-store.js      # Data store wrapper
│   └── storage/
│       └── [...file].js           # File serving endpoint
├── storage/                       # Persistent storage (Railway volume)
│   ├── accounts.json             # Account database
│   ├── uploads/                  # Uploaded files
│   │   └── [account]/           # Files per account
│   └── processed/               # Processed files
│       └── [account]/           # Processed files per account
├── dashboard.html               # Frontend dashboard
├── login.html                   # Login page
└── styles.css                   # Styling
```

## Key Changes from Vercel

1. **Server Architecture**: Express.js server instead of serverless functions
2. **File Storage**: Railway persistent volumes instead of Vercel Blob
3. **Database**: JSON file storage instead of external database
4. **Processing**: Asynchronous background processing without timeout limits
5. **File Serving**: Direct file serving from storage instead of blob URLs

## API Endpoints

- `POST /api/auth` - Authentication
- `GET /api/documents/:accountNumber` - Get documents for account
- `POST /api/upload/:accountNumber` - Upload files
- `POST /api/documents/:documentId/process` - Process document
- `GET /api/view-document/:documentId/:version` - View document
- `DELETE /api/documents/:documentId` - Delete document
- `GET /api/storage/:type/:account/:filename` - Serve files

## Monitoring

Railway provides built-in monitoring:
- Application logs
- Resource usage
- Uptime monitoring
- Performance metrics

## Scaling

Railway auto-scales based on traffic. For high-traffic scenarios:
- Monitor resource usage in Railway dashboard
- Consider upgrading to higher-tier plans
- Add Redis for caching if needed

## Chinese Client Access

Railway's infrastructure is designed to be accessible from China, providing better connectivity than Vercel for Chinese clients.

## Troubleshooting

1. **Storage Issues**: Check Railway volume configuration
2. **API Errors**: Check logs in Railway dashboard
3. **File Upload Issues**: Verify file size limits and storage space
4. **Processing Timeouts**: Railway allows longer processing times than Vercel

## Support

For Railway-specific issues:
- Railway Documentation: https://docs.railway.app
- Railway Discord: https://railway.app/discord

For application issues:
- Check server logs in Railway dashboard
- Verify OpenRouter API key and credits
- Check storage volume usage