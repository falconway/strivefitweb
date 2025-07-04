#!/usr/bin/env python3

import sys
import json
import os
from pathlib import Path
import time

# Add the current directory to Python path
sys.path.append(str(Path(__file__).parent))

try:
    from qwen_ocr_service import QwenOCRService
    from qwen_translation_service import QwenTranslationService
    from utils import TextProcessor, performance_monitor
except ImportError as e:
    print(json.dumps({"error": f"Failed to import Qwen services: {str(e)}"}))
    sys.exit(1)

def process_document(file_path, document_id):
    """Process document with OCR and translation"""
    try:
        start_time = time.time()
        
        # Initialize services
        ocr_service = QwenOCRService()
        translation_service = QwenTranslationService()
        text_processor = TextProcessor()
        
        print(f"Starting processing for document: {document_id}", file=sys.stderr)
        
        # Step 1: OCR
        print("Step 1: Extracting text with OCR...", file=sys.stderr)
        ocr_start = time.time()
        extracted_text = ocr_service.extract_text(file_path)
        ocr_time = time.time() - ocr_start
        performance_monitor.log_ocr_time(ocr_time)
        
        # Clean the extracted text
        cleaned_text = text_processor.clean_ocr_text(extracted_text)
        
        print(f"OCR completed in {ocr_time:.2f}s", file=sys.stderr)
        
        # Step 2: Structure (create markdown)
        structured_md = f"""# Document: {document_id}

## Extracted Text (Original Language)

{cleaned_text}

---

*Processed on: {time.strftime('%Y-%m-%d %H:%M:%S')}*
*Processing time: {ocr_time:.2f} seconds*
"""
        
        # Step 3: Translate to English
        print("Step 3: Translating to English...", file=sys.stderr)
        translation_start = time.time()
        
        # Check if text is long and split if necessary
        text_chunks = text_processor.split_long_text(cleaned_text, max_length=1000)
        
        if len(text_chunks) > 1:
            print(f"Text split into {len(text_chunks)} chunks for translation", file=sys.stderr)
            translated_chunks = []
            for i, chunk in enumerate(text_chunks):
                print(f"Translating chunk {i+1}/{len(text_chunks)}", file=sys.stderr)
                translated_chunk = translation_service.translate(
                    chunk, 
                    source_lang="auto", 
                    target_lang="English"
                )
                translated_chunks.append(translated_chunk)
            
            translated_text = text_processor.merge_translations(translated_chunks)
        else:
            translated_text = translation_service.translate(
                cleaned_text, 
                source_lang="auto", 
                target_lang="English"
            )
        
        translation_time = time.time() - translation_start
        performance_monitor.log_translation_time(translation_time)
        
        print(f"Translation completed in {translation_time:.2f}s", file=sys.stderr)
        
        translated_md = f"""# Document: {document_id} (English Translation)

## Translated Text

{translated_text}

---

*Processed on: {time.strftime('%Y-%m-%d %H:%M:%S')}*
*Translation time: {translation_time:.2f} seconds*
"""
        
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
                "extracted_text": cleaned_text,
                "language_detected": "auto",
                "processing_time": ocr_time,
                "timestamp": time.strftime('%Y-%m-%d %H:%M:%S')
            }, f, ensure_ascii=False, indent=2)
        
        translated_json_path = base_path / f"{document_id}-translated.json"
        with open(translated_json_path, 'w', encoding='utf-8') as f:
            json.dump({
                "id": document_id,
                "translated_text": translated_text,
                "target_language": "English",
                "translation_time": translation_time,
                "timestamp": time.strftime('%Y-%m-%d %H:%M:%S')
            }, f, ensure_ascii=False, indent=2)
        
        total_time = time.time() - start_time
        performance_monitor.log_request(success=True)
        
        print(f"Total processing completed in {total_time:.2f}s", file=sys.stderr)
        
        return {
            "success": True,
            "extracted_text": cleaned_text,
            "translated_text": translated_text,
            "processing_time": {
                "ocr": ocr_time,
                "translation": translation_time,
                "total": total_time
            },
            "files_created": [
                str(ocr_md_path),
                str(translated_md_path),
                str(ocr_json_path),
                str(translated_json_path)
            ]
        }
        
    except Exception as e:
        performance_monitor.log_request(success=False)
        error_msg = str(e)
        print(f"Error processing document {document_id}: {error_msg}", file=sys.stderr)
        return {
            "success": False,
            "error": error_msg
        }

def main():
    """Main entry point for the bridge script"""
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: python qwen_bridge.py <file_path> <document_id>"}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    document_id = sys.argv[2]
    
    if not os.path.exists(file_path):
        print(json.dumps({"error": f"File not found: {file_path}"}))
        sys.exit(1)
    
    # Process the document
    result = process_document(file_path, document_id)
    
    # Output the result as JSON
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()