# Strive & Fit Telemedicine Medical Document Management System

## Project Overview

A privacy-focused telemedicine platform with a medical document management system that serves global patients in 3 languages (English, Chinese, Arabic). The system uses a Mullvad VPN-style authentication approach with Date of Birth + random account numbers for enhanced privacy.

## Current System Architecture

### Authentication System
- **Mullvad-style Privacy Authentication**: Uses Date of Birth + random account numbers (format: XX-XX-XX-XXXX-XX-XXXX)
- **Security**: SHA-256 hashing with combined DOB+account validation
- **No Personal Data Storage**: Only hashes are stored, no reversible personal information

### File Management
- **Upload Support**: PDF, images, Office docs (Word, Excel, PowerPoint), text, CSV, markdown, archives
- **UTF-8 Support**: Full Chinese character support for filenames and content
- **File Size Limit**: 50MB per file
- **Batch Operations**: Bulk download (ZIP) and delete with selection interface

### Backend (Node.js/Express)
- **File Storage**: Multer with secure filename generation
- **Data Storage**: JSON file-based storage (accounts.json)
- **APIs**: RESTful endpoints for authentication, upload, download, batch operations
- **Dependencies**: express, cors, multer, archiver (for ZIP creation)

### Frontend
- **Multilingual**: English, Chinese (simplified), Arabic with RTL support
- **Responsive Design**: Mobile-friendly interface
- **Batch Operations**: Checkbox selection with "Select All" functionality
- **Real-time Feedback**: Upload progress, status messages

## Current File Structure

```
strivefit website/
├── backend/
│   ├── server.js              # Main API server
│   ├── package.json           # Node.js dependencies
│   ├── data/
│   │   └── accounts.json      # User accounts and document metadata
│   └── uploads/               # Physical file storage
├── dashboard.html             # Main document management interface
├── login.html                 # Authentication page
├── index.html                 # Landing page
├── styles.css                 # Global styles
├── js/
│   └── language-switcher.js   # Multilingual support
└── images/                    # Static assets
```

## Planned UI Redesign

### New Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                    Top 1/3 - Document Management                │
├──────────────────┬──────────────────────────────────────────────┤
│                  │                                              │
│   Left Column    │              Right 2/3                      │
│   Patient Info   │          Document Viewer                    │
│                  │                                              │
│   - Basic Info   │   - PDF Viewer                              │
│   - Demographics │   - Markdown Renderer                       │
│   - Medical ID   │   - Table/CSV Display                       │
│   - Language     │   - Image Viewer                            │
│                  │   - Processing Status                       │
│                  │                                              │
├──────────────────┴──────────────────────────────────────────────┤
│                    Bottom 2/3 - Document Display                │
└─────────────────────────────────────────────────────────────────┘
```

### Document Processing Pipeline

#### Phase 1: OCR Processing
- **Input**: Scanned documents (PDF, images)
- **Process**: Extract text using OCR API
- **Output**: Raw text data
- **Status**: Track OCR progress and accuracy

#### Phase 2: Content Structuring
- **Input**: Raw OCR text
- **Process**: LLM-based content analysis and structuring
- **Output**: 
  - Markdown format (human-readable)
  - JSON format (machine-readable)
- **Status**: Track parsing and structuring progress

#### Phase 3: Translation
- **Input**: Structured content (markdown/JSON)
- **Process**: LLM-based translation to English
- **Features**: 
  - Preserve medical terminology
  - Maintain document structure
  - Keep original formatting
- **Output**: Translated versions in markdown and JSON

## Document Processing Status System

### Status Types
```javascript
{
  "id": "document-uuid",
  "originalName": "20241007 血脂，肝功，肾功.pdf",
  "processingStatus": {
    "ocr": {
      "status": "completed|processing|pending|failed",
      "progress": 85,
      "startTime": "2025-07-02T17:07:57.223Z",
      "completedTime": "2025-07-02T17:08:15.445Z",
      "error": null
    },
    "structuring": {
      "status": "processing",
      "progress": 45,
      "startTime": "2025-07-02T17:08:15.445Z",
      "completedTime": null,
      "error": null
    },
    "translation": {
      "status": "pending",
      "progress": 0,
      "startTime": null,
      "completedTime": null,
      "error": null
    }
  },
  "processedVersions": {
    "ocrText": "path/to/ocr-text.txt",
    "markdownOriginal": "path/to/structured.md",
    "jsonOriginal": "path/to/structured.json",
    "markdownEnglish": "path/to/translated.md",
    "jsonEnglish": "path/to/translated.json"
  }
}
```

## API Endpoints to Implement

### Document Processing
```javascript
// Start OCR processing
POST /api/process-document/:documentId/ocr

// Start content structuring
POST /api/process-document/:documentId/structure

// Start translation
POST /api/process-document/:documentId/translate

// Get processing status
GET /api/process-document/:documentId/status

// Get processed versions
GET /api/process-document/:documentId/versions
```

### Document Viewing
```javascript
// Get document for viewing (original or processed)
GET /api/view-document/:documentId/:version
// versions: original, ocr, markdown, json, translated-md, translated-json
```

## UI Components to Implement

### 1. Patient Information Panel (Left Column)
```javascript
const PatientInfo = {
  // Basic demographics
  accountNumber: "XX-XX-XX-XXXX-XX-XXXX",
  registrationDate: "2025-07-02",
  preferredLanguage: "Chinese",
  
  // Document statistics
  totalDocuments: 25,
  processedDocuments: 18,
  pendingProcessing: 7,
  
  // Recent activity
  lastUpload: "2025-07-02T17:07:57.232Z",
  lastProcessing: "2025-07-02T17:08:15.445Z"
}
```

### 2. Document List with Processing Status (Top 1/3)
```html
<div class="document-item">
  <div class="document-info">
    <h4>20241007 血脂，肝功，肾功.pdf</h4>
    <div class="processing-status">
      <div class="status-step completed">OCR ✓</div>
      <div class="status-step processing">Structuring... 45%</div>
      <div class="status-step pending">Translation</div>
    </div>
  </div>
  <div class="document-actions">
    <button onclick="viewDocument(id, 'original')">View Original</button>
    <button onclick="viewDocument(id, 'markdown')">View Structured</button>
    <button onclick="viewDocument(id, 'translated')">View English</button>
  </div>
</div>
```

### 3. Document Viewer (Right 2/3)
```javascript
const DocumentViewer = {
  // PDF rendering
  renderPDF: (documentId) => {},
  
  // Markdown rendering
  renderMarkdown: (content) => {},
  
  // Table/CSV display
  renderTable: (jsonData) => {},
  
  // Image viewing
  renderImage: (documentId) => {},
  
  // Side-by-side comparison
  renderComparison: (original, processed) => {}
}
```

## Implementation Phases

### Phase 1: UI Redesign (Current Priority)
1. ✅ Create new dashboard layout with 3-panel design
2. ✅ Implement patient information panel
3. ✅ Redesign document list with status indicators
4. ✅ Create document viewer component
5. ✅ Update responsive design for new layout

### Phase 2: Document Processing Backend
1. Integrate OCR API (Azure Computer Vision, Google Vision, or Tesseract)
2. Implement LLM integration for content structuring
3. Add translation pipeline with medical terminology preservation
4. Create processing status tracking system
5. Implement processed document storage

### Phase 3: Advanced Features
1. Side-by-side document comparison
2. Medical terminology glossary
3. Processing queue management
4. Batch processing operations
5. Advanced search and filtering

## Development Guidelines

### Code Style
- Use existing naming conventions and file structure
- Maintain UTF-8 support throughout
- Follow existing translation pattern for all new UI elements
- Keep security-first approach with DOB+account authentication

### Testing Scenarios
1. **Multilingual Support**: Test all new features in English, Chinese, and Arabic
2. **File Types**: Ensure processing works with PDF, images, and text files
3. **Processing Pipeline**: Test each stage of OCR → Structuring → Translation
4. **Error Handling**: Handle processing failures gracefully
5. **Performance**: Monitor processing times and optimize for large documents

### Security Considerations
- Maintain existing authentication system
- Ensure processed documents are only accessible to document owner
- Implement proper error handling to avoid information leakage
- Add rate limiting for processing operations

## Current Implementation Status

### ✅ Completed Features
- Mullvad-style authentication system
- Multilingual support (EN/CN/AR)
- File upload with UTF-8 support
- Batch operations (download ZIP, bulk delete)
- Document management CRUD operations
- Responsive design

### 🔄 In Progress
- UI redesign for 3-panel layout
- Document viewer implementation

### 📋 Planned Features
- OCR integration
- LLM-based content structuring
- Medical document translation
- Processing status tracking
- Advanced document viewer

## Notes for Future Development

1. **OCR Accuracy**: Consider multiple OCR providers for medical documents
2. **Translation Quality**: Fine-tune LLM prompts for medical terminology
3. **Processing Queue**: Implement background job processing for large files
4. **Caching**: Cache processed results to avoid reprocessing
5. **Backup**: Implement backup strategy for processed documents
6. **Analytics**: Track processing success rates and user engagement

This system is designed to evolve from a simple document storage solution into a comprehensive medical document processing and translation platform while maintaining the privacy-focused approach and multilingual accessibility.