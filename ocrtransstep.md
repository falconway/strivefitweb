Implementation Plan: Qwen OCR & Translation Integration for Strive & Fit                                                                           │
     │                                                                                                                                                    │
     │ Project Analysis Summary                                                                                                                           │
     │                                                                                                                                                    │
     │ After analyzing the entire project structure, I found:                                                                                             │
     │                                                                                                                                                    │
     │ Current State:                                                                                                                                     │
     │                                                                                                                                                    │
     │ - Main Project: Complete telemedicine document management system with 3-panel dashboard, multilingual support (EN/CN/AR), authentication, file     │
     │ upload/management, and simulated processing pipeline                                                                                               │
     │ - Qwen Folder: Production-ready OCR & translation system using Alibaba Cloud's Qwen models with web interface, CLI tools, and robust error         │
     │ handling                                                                                                                                           │
     │                                                                                                                                                    │
     │ Integration Goal:                                                                                                                                  │
     │                                                                                                                                                    │
     │ Replace the simulated document processing in the main project with real Qwen OCR and translation capabilities for Vercel deployment.               │
     │                                                                                                                                                    │
     │ ---                                                                                                                                                │
     │ Implementation Plan                                                                                                                                │
     │                                                                                                                                                    │
     │ Phase 1: Dependency Integration & Setup (30 minutes)                                                                                               │
     │                                                                                                                                                    │
     │ 1.1 Copy Core Qwen Components to Main Project                                                                                                      │
     │                                                                                                                                                    │
     │ - Copy files from Qwen folder:                                                                                                                     │
     │   - src/ocr_service_fast.py → backend/services/                                                                                                    │
     │   - src/translation_service.py → backend/services/                                                                                                 │
     │   - src/config.py → backend/services/                                                                                                              │
     │   - src/utils.py → backend/services/                                                                                                               │
     │                                                                                                                                                    │
     │ 1.2 Update Backend Dependencies                                                                                                                    │
     │                                                                                                                                                    │
     │ - Add to backend/package.json:                                                                                                                     │
     │ "python-shell": "^5.0.0"  // For calling Python scripts from Node.js                                                                               │
     │ - Create backend/requirements.txt:                                                                                                                 │
     │ dashscope>=1.23.6                                                                                                                                  │
     │ Pillow>=11.0.0                                                                                                                                     │
     │ python-dotenv>=1.0.0                                                                                                                               │
     │ pdf2image>=1.17.0                                                                                                                                  │
     │                                                                                                                                                    │
     │ 1.3 Environment Configuration                                                                                                                      │
     │                                                                                                                                                    │
     │ - Create backend/.env.example:                                                                                                                     │
     │ DASHSCOPE_API_KEY=sk-your_api_key_here                                                                                                             │
     │ QWEN_VL_MODEL=qwen-vl-plus                                                                                                                         │
     │ QWEN_TEXT_MODEL=qwen-max                                                                                                                           │
     │                                                                                                                                                    │
     │ Phase 2: Backend Integration (45 minutes)                                                                                                          │
     │                                                                                                                                                    │
     │ 2.1 Create Python Bridge Service                                                                                                                   │
     │                                                                                                                                                    │
     │ - Create backend/services/qwen_bridge.py:                                                                                                          │
     │   - Wrapper functions for OCR and translation                                                                                                      │
     │   - Error handling and response formatting                                                                                                         │
     │   - File path management for Node.js integration                                                                                                   │
     │                                                                                                                                                    │
     │ 2.2 Update Express Server Routes                                                                                                                   │
     │                                                                                                                                                    │
     │ - Modify backend/server.js:                                                                                                                        │
     │   - Replace simulated processing in /api/documents/:documentId/process                                                                             │
     │   - Add Python shell execution for real OCR/translation                                                                                            │
     │   - Update file path handling for processed versions                                                                                               │
     │   - Maintain existing API contract for frontend compatibility                                                                                      │
     │                                                                                                                                                    │
     │ 2.3 Processing Pipeline Implementation                                                                                                             │
     │                                                                                                                                                    │
     │ - OCR Stage: Extract text from images/PDFs using Qwen VL                                                                                           │
     │ - Structuring Stage: Format OCR output into clean markdown                                                                                         │
     │ - Translation Stage: Translate to English using Qwen text model                                                                                    │
     │ - File Management: Save processed versions with proper naming                                                                                      │
     │                                                                                                                                                    │
     │ Phase 3: Vercel Deployment Optimization (30 minutes)                                                                                               │
     │                                                                                                                                                    │
     │ 3.1 Vercel Configuration                                                                                                                           │
     │                                                                                                                                                    │
     │ - Create vercel.json:                                                                                                                              │
     │ {                                                                                                                                                  │
     │   "version": 2,                                                                                                                                    │
     │   "builds": [                                                                                                                                      │
     │     { "src": "backend/server.js", "use": "@vercel/node" },                                                                                         │
     │     { "src": "backend/requirements.txt", "use": "@vercel/python" }                                                                                 │
     │   ],                                                                                                                                               │
     │   "routes": [                                                                                                                                      │
     │     { "src": "/api/(.*)", "dest": "/backend/server.js" },                                                                                          │
     │     { "src": "/(.*)", "dest": "/$1" }                                                                                                              │
     │   ],                                                                                                                                               │
     │   "env": {                                                                                                                                         │
     │     "DASHSCOPE_API_KEY": "@dashscope-api-key"                                                                                                      │
     │   }                                                                                                                                                │
     │ }                                                                                                                                                  │
     │                                                                                                                                                    │
     │ 3.2 Serverless Function Optimization                                                                                                               │
     │                                                                                                                                                    │
     │ - Optimize Python execution: Use lightweight imports                                                                                               │
     │ - File handling: Temporary file management for serverless                                                                                          │
     │ - Cold start optimization: Minimize initialization time                                                                                            │
     │                                                                                                                                                    │
     │ 3.3 Environment Variables Setup                                                                                                                    │
     │                                                                                                                                                    │
     │ - Configure Vercel environment variables for API keys                                                                                              │
     │ - Set up proper secret management                                                                                                                  │
     │                                                                                                                                                    │
     │ Phase 4: Frontend Integration Testing (15 minutes)                                                                                                 │
     │                                                                                                                                                    │
     │ 4.1 Update Processing Status Display                                                                                                               │
     │                                                                                                                                                    │
     │ - Ensure existing status indicators work with real processing                                                                                      │
     │ - Add proper error handling for API failures                                                                                                       │
     │ - Update timing expectations for real vs. simulated processing                                                                                     │
     │                                                                                                                                                    │
     │ 4.2 Document Viewer Updates                                                                                                                        │
     │                                                                                                                                                    │
     │ - Verify markdown rendering works with real Qwen output                                                                                            │
     │ - Test document switching between original/processed/translated                                                                                    │
     │ - Ensure UTF-8 support for Chinese characters                                                                                                      │
     │                                                                                                                                                    │
     │ ---                                                                                                                                                │
     │ Required Dependencies & Tools                                                                                                                      │
     │                                                                                                                                                    │
     │ Backend Dependencies (Node.js)                                                                                                                     │
     │                                                                                                                                                    │
     │ {                                                                                                                                                  │
     │   "python-shell": "^5.0.0",     // Execute Python from Node.js                                                                                     │
     │   "archiver": "^6.0.2",         // ZIP functionality (existing)                                                                                    │
     │   "body-parser": "^2.2.0",      // Request parsing (existing)                                                                                      │
     │   "cors": "^2.8.5",             // CORS handling (existing)                                                                                        │
     │   "express": "^4.21.2",         // Web framework (existing)                                                                                        │
     │   "multer": "^1.4.5-lts.1"      // File uploads (existing)                                                                                         │
     │ }                                                                                                                                                  │
     │                                                                                                                                                    │
     │ Python Dependencies                                                                                                                                │
     │                                                                                                                                                    │
     │ dashscope>=1.23.6           # Alibaba Cloud Qwen models                                                                                            │
     │ Pillow>=11.0.0              # Image processing                                                                                                     │
     │ python-dotenv>=1.0.0        # Environment variables                                                                                                │
     │ pdf2image>=1.17.0           # PDF to image conversion                                                                                              │
     │                                                                                                                                                    │
     │ External Services                                                                                                                                  │
     │                                                                                                                                                    │
     │ - Alibaba Cloud DashScope API: Required for Qwen model access                                                                                      │
     │ - API Key: User must provide valid DashScope API key                                                                                               │
     │                                                                                                                                                    │
     │ Vercel-Specific Requirements                                                                                                                       │
     │                                                                                                                                                    │
     │ - @vercel/node: Node.js runtime (automatic)                                                                                                        │
     │ - @vercel/python: Python runtime for serverless functions                                                                                          │
     │ - Environment Variables: Secure API key storage                                                                                                    │
     │                                                                                                                                                    │
     │ ---                                                                                                                                                │
     │ Deployment Strategy for Vercel                                                                                                                     │
     │                                                                                                                                                    │
     │ 1. Hybrid Architecture                                                                                                                             │
     │                                                                                                                                                    │
     │ - Frontend: Static files served by Vercel CDN                                                                                                      │
     │ - Backend API: Node.js serverless functions                                                                                                        │
     │ - Python Processing: Serverless Python functions called by Node.js                                                                                 │
     │                                                                                                                                                    │
     │ 2. File Management                                                                                                                                 │
     │                                                                                                                                                    │
     │ - Uploads: Store in temporary serverless storage                                                                                                   │
     │ - Processed Files: Save to persistent storage or return directly                                                                                   │
     │ - Cleanup: Automatic temporary file cleanup                                                                                                        │
     │                                                                                                                                                    │
     │ 3. Performance Considerations                                                                                                                      │
     │                                                                                                                                                    │
     │ - Cold Starts: Optimize Python imports and initialization                                                                                          │
     │ - Timeout Limits: Vercel has 60-second timeout for Pro, 10s for hobby                                                                              │
     │ - Memory Limits: 1GB for Pro, 512MB for hobby                                                                                                      │
     │ - Concurrent Processing: Handle multiple document processing requests                                                                              │
     │                                                                                                                                                    │
     │ 4. Fallback Strategy                                                                                                                               │
     │                                                                                                                                                    │
     │ - Network Issues: Retry logic for API calls                                                                                                        │
     │ - Processing Failures: Graceful error messages                                                                                                     │
     │ - Rate Limiting: Handle DashScope API limits                                                                                                       │
     │                                                                                                                                                    │
     │ ---                                                                                                                                                │
     │ Success Criteria                                                                                                                                   │
     │                                                                                                                                                    │
     │ 1. ✅ Real OCR Processing: Documents processed with actual Qwen VL model                                                                            │
     │ 2. ✅ Accurate Translation: Chinese medical documents translated to English                                                                         │
     │ 3. ✅ Vercel Deployment: Full system deployable on Vercel platform                                                                                  │
     │ 4. ✅ Existing UI Compatibility: No breaking changes to current dashboard                                                                           │
     │ 5. ✅ Error Handling: Robust error handling for API failures                                                                                        │
     │ 6. ✅ Performance: Processing times under Vercel limits                                                                                             │
     │ 7. ✅ Security: API keys properly secured in environment variables                                                                                  │
     │                                                                                                                                                    │
     │ ---                                                                                                                                                │
     │ Estimated Timeline: 2 hours total                                                                                                                  │
     │                                                                                                                                                    │
     │ - Phase 1: 30 minutes (file copying & dependency setup)                                                                                            │
     │ - Phase 2: 45 minutes (backend integration)                                                                                                        │
     │ - Phase 3: 30 minutes (Vercel configuration)                                                                                                       │
     │ - Phase 4: 15 minutes (testing & validation)   

     Backend Plan (Simulated Qwen Integration)


  The backend's sole responsibility is to simulate the Qwen OCR and Translation pipeline. It will not generate PDFs or handle any complex
  styling.


   1. Trigger Processing: The process will start when the frontend sends a request to a new endpoint: POST /api/documents/:documentId/process.


   2. Simulate Pipeline & Generate Files: Upon receiving the request, the backend will perform a simulated, multi-step process for the specified
      document:
       * Step 1: OCR & Structuring: After a short delay, it will generate two files in the backend/uploads/ directory:
           * [documentId]-ocr.md: A mock Markdown file representing the structured OCR output in the original language.
           * [documentId]-ocr.json: A mock JSON file for machine learning purposes.
       * Step 2: Translation: After another delay, it will generate two more files:
           * [documentId]-translated.md: A mock Markdown file containing the English translation.
           * [documentId]-translated.json: A mock JSON file of the English translation.


   3. Update Database: Throughout this process, the accounts.json file will be updated to track the status (processing, completed) and store the
      file paths for these four new generated files, linking them directly to the original document ID.


   4. Serve Files: The existing GET /api/view-document/:documentId/:version endpoint will be updated to serve the content of these new Markdown
      files when requested by the frontend.


  Frontend Plan (Displaying the Results)


  The frontend's job is to display the results generated by the backend in a simple and clear way.


   1. Initiate Processing: The "Process" button next to each document will trigger the POST /api/documents/:documentId/process backend endpoint.


   2. Display Translated Markdown: When you click on a document row, the viewer panel on the right will:
       * First, attempt to fetch and display the translated Markdown file ([documentId]-translated.md).
       * If that file doesn't exist (because the document hasn't been processed yet), it will fall back to showing a preview of the original 
         uploaded file.


   3. Viewer Buttons: The "Original," "Processed," and "Translated" buttons above the viewer will be fully functional:
       * Original: Shows a preview of the original file the user uploaded.
       * Processed: Fetches and displays the styled HTML from the OCR'd Markdown file ([documentId]-ocr.md).
       * Translated: Fetches and displays the styled HTML from the final translated Markdown file ([documentId]-translated.md).


  This plan is lightweight, Vercel-friendly, and focuses exclusively on generating the four data files on the backend and displaying the styled
  Markdown on the frontend.
