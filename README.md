# Strive & Fit Medical Portal

A privacy-focused medical document management system with Mullvad-style authentication using Date of Birth + Random Account Numbers.

## Features

### 🔐 Privacy-First Authentication
- **No email/username required** - Uses Date of Birth + 16-digit account number
- **Mullvad VPN-style security** - Account numbers are randomly generated
- **Customer responsibility** - Users must securely store their credentials
- **Recovery through customer service only** - No automated password resets

### 🌍 Multilingual Support
- **English** - Primary language
- **Chinese (中文)** - Full translation support
- **Arabic (العربية)** - RTL layout support

### 📁 Document Management
- **Secure file upload** - PDF, JPEG, PNG, TIFF, DICOM formats
- **50MB file size limit** - Suitable for medical documents
- **Drag & drop interface** - User-friendly upload experience
- **Document download** - Secure file retrieval

### 🔒 Security Features
- **SHA-256 hashing** - All sensitive data is hashed
- **No email storage** - Enhanced privacy protection
- **Secure file storage** - Documents stored with encrypted paths
- **CORS protection** - Configured for secure API access

## System Architecture

```
Frontend (Static Files)
├── index.html          # Landing page with company info
├── login.html          # DOB + Account number authentication
├── dashboard.html      # Document management interface
├── styles.css          # Main styling
└── js/
    └── language-switcher.js  # Multilingual functionality

Backend (Node.js/Express)
├── server.js           # Main API server
├── package.json        # Dependencies
├── data/
│   └── accounts.json   # User accounts (JSON storage)
└── uploads/            # Uploaded documents
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Start the Backend Server
```bash
npm start
```
Server will run on `http://localhost:3000`

### 3. Serve Frontend Files
You can use any static file server. Options:

**Option A: Python HTTP Server**
```bash
# In the main project directory
python3 -m http.server 8080
```

**Option B: Node.js HTTP Server**
```bash
npm install -g http-server
http-server -p 8080
```

**Option C: Live Server (VS Code Extension)**
Use the Live Server extension in VS Code

### 4. Access the Application
- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:3000`

## Usage Instructions

### For New Users (Account Generation)
1. Visit `http://localhost:8080/login.html`
2. Click "Generate Account" 
3. Enter your date of birth
4. Click "Generate Account Number"
5. **IMPORTANT**: Save both your date of birth and the generated account number securely
6. Use these credentials to log in

### For Existing Users (Login)
1. Visit `http://localhost:8080/login.html`
2. Enter your date of birth
3. Enter your 16-digit account number (format: XXXX-XXXX-XXXX-XXXX)
4. Click "Access Records"

### Document Management
1. After login, you'll be redirected to the dashboard
2. Upload documents by:
   - Dragging and dropping files onto the upload area
   - Clicking "Browse Files" to select files
3. Download documents by clicking the "Download" button
4. Logout by clicking the "Logout" button

## API Endpoints

### Account Management
- `POST /api/generate-account` - Generate new account number
- `POST /api/authenticate` - Authenticate with DOB + account number

### Document Management  
- `POST /api/upload-document` - Upload medical document
- `POST /api/get-documents` - Get user's document list
- `POST /api/download-document/:id` - Download specific document

### Health Check
- `GET /api/health` - Server health status

## Security Considerations

### Data Protection
- All sensitive data (DOB, account combinations) are SHA-256 hashed
- Documents are stored with encrypted filenames
- No personally identifiable information in URLs or logs

### Authentication Security
- DOB acts as a secondary authentication factor
- Account numbers are cryptographically random
- No session tokens - authentication required for each request

### File Security
- Strict file type validation
- File size limits enforced
- Documents stored outside web root

## Customer Support Features

### Account Recovery
- No automated password reset available
- Customer service can access account data using internal tools
- Users must provide both DOB and account number for verification

### Data Export
- All user documents can be downloaded individually
- Account data stored in simple JSON format for easy migration

## Customization

### Adding New Languages
1. Update translations in `js/language-switcher.js` and page-specific scripts
2. Add new language option to dropdown menus
3. Test RTL languages by adding appropriate CSS classes

### Modifying File Limits
Update `server.js`:
```javascript
limits: {
    fileSize: 50 * 1024 * 1024 // Change this value
}
```

### Database Migration
The system currently uses JSON file storage. To upgrade to a database:
1. Replace file operations in `server.js` with database queries
2. Update account and document storage functions
3. Maintain the same API interface for frontend compatibility

## Development Notes

### File Structure
- Frontend uses vanilla JavaScript for simplicity
- Backend uses Express.js with minimal dependencies
- No complex build process required

### Scaling Considerations
- Current setup suitable for low-volume usage
- For higher volume, consider:
  - Database migration (PostgreSQL recommended)
  - File storage service (AWS S3, etc.)
  - Load balancing
  - CDN for static assets

### Security Enhancements
For production deployment:
- Implement HTTPS
- Add rate limiting
- Set up proper CORS policies
- Add input sanitization
- Implement audit logging

## License

MIT License - See LICENSE file for details

## Support

For technical support or questions about the system architecture, please contact the development team.