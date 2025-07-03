# Strive & Fit Telemedicine Medical Document Management System

## Project Overview

A privacy-focused telemedicine platform with a medical document management system that serves global patients in 3 languages (English, Chinese, Arabic). The system uses a Mullvad VPN-style authentication approach with Date of Birth + random account numbers for enhanced privacy.

## Current System Architecture

### Authentication System
- **Mullvad-style Privacy Authentication**: Uses Date of Birth + random account numbers.
- **Security**: SHA-256 hashing with combined DOB+account validation.
- **No Personal Data Storage**: Only hashes are stored, no reversible personal information.

### File Management & Viewing
- **Upload**: Drag-and-drop and file browser with progress indicators.
- **Document List**: Excel-like table view with sorting, filtering, and batch selection.
- **Document Viewer**: In-app preview for images, PDFs, and other document types.
- **Batch Operations**: Bulk download (ZIP), delete, and processing.

### Backend (Node.js/Express)
- **File Storage**: Multer with secure filename generation.
- **Data Storage**: JSON file-based storage (`data/accounts.json`).
- **APIs**: RESTful endpoints for authentication, CRUD, batch operations, and document viewing.
- **Dependencies**: `express`, `cors`, `multer`, `archiver`, `body-parser`.

### Frontend
- **Layout**: Single-column layout with document list and viewer panel.
- **Multilingual**: English, Chinese (simplified), Arabic with RTL support via `js/language-switcher.js`.
- **Real-time Feedback**: Upload progress, status messages, and interactive UI elements.

## Current Implementation Status

### ✅ Completed Features
- Mullvad-style authentication system.
- Multilingual support (EN/CN/AR).
- File upload with drag-and-drop and progress dialog.
- Excel-like document table with sorting, searching, and batch actions.
- In-app document viewer for multiple file types (PDF, images, etc.).
- Full CRUD and batch operations (download, delete, process) for documents.
- Simulated document processing pipeline on the backend.

### 🔄 In Progress
- **Qwen LLM Integration**: Implementing the backend logic to integrate with the Qwen LLM for OCR and translation.

### 📋 Next Steps: Qwen LLM Integration

#### 1. Backend API Development (Simulated)
-   **Enhance Data Model**: Update `accounts.json` to store paths to OCR and translated files (`-ocr.md`, `-ocr.json`, `-translated.md`, `-translated.json`).
-   **Create Processing Endpoint**: Implement `POST /api/documents/:documentId/process` to:
    -   Trigger a simulated, multi-step pipeline (OCR -> Translate).
    -   Generate mock Markdown and JSON files for each step.
    -   Update the document's status in `accounts.json` as the pipeline progresses.
-   **Update Viewer Endpoint**: Modify `GET /api/view-document/:documentId/:version` to serve the newly generated mock files.

#### 2. Frontend Integration
-   **Connect "Process" Button**: Wire the "Process" button to the new backend endpoint.
-   **Enhance Viewer**: Update the document viewer to prioritize showing the translated Markdown file, falling back to the original if the translation is not yet available.

## Future Development Notes
-   Replace simulated Qwen LLM calls with actual API calls.
-   Implement a robust background job queue for handling long-running OCR and translation tasks.
-   Consider adding a caching layer to store processed results and avoid redundant API calls.
