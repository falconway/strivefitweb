import dashscope
import base64
import json
import time
import os
from PIL import Image
import io
from .config import Config

class QwenOCRService:
    def __init__(self):
        Config.validate()
        dashscope.api_key = Config.DASHSCOPE_API_KEY
        self.model = 'qwen-vl-plus'  # Use faster model by default
        self.backup_model = 'qwen-vl-max'  # Fallback to more accurate model
        self.max_retries = 2
        self.timeout = 30
        
        # Image optimization settings
        self.max_image_size = (1920, 1080)  # Max resolution
        self.max_file_size = 5 * 1024 * 1024  # 5MB max
        self.jpeg_quality = 85
    
    def optimize_image(self, image_path):
        """Optimize image for faster processing"""
        try:
            print(f"  Optimizing image: {os.path.basename(image_path)}")
            
            with Image.open(image_path) as img:
                # Get original size and file size
                original_size = img.size
                original_file_size = os.path.getsize(image_path)
                
                print(f"  Original: {original_size[0]}x{original_size[1]}, {original_file_size/1024/1024:.1f}MB")
                
                # Convert to RGB if needed
                if img.mode in ('RGBA', 'P', 'LA'):
                    img = img.convert('RGB')
                
                # Resize if too large
                if img.size[0] > self.max_image_size[0] or img.size[1] > self.max_image_size[1]:
                    print(f"  Resizing to fit {self.max_image_size}")
                    img.thumbnail(self.max_image_size, Image.Resampling.LANCZOS)
                
                # Save optimized version
                optimized_path = "/tmp/optimized_image.jpg"
                img.save(optimized_path, "JPEG", quality=self.jpeg_quality, optimize=True)
                
                new_file_size = os.path.getsize(optimized_path)
                print(f"  Optimized: {img.size[0]}x{img.size[1]}, {new_file_size/1024/1024:.1f}MB")
                
                return optimized_path
                
        except Exception as e:
            print(f"  Warning: Image optimization failed: {e}")
            return image_path
    
    def extract_text_with_retry(self, image_path, prompt="Extract all text from this image"):
        """Extract text with retry logic and fallbacks"""
        
        # Optimize image first
        optimized_path = self.optimize_image(image_path)
        
        # Try with fast model first
        models_to_try = [self.model, self.backup_model]
        
        for model_idx, model in enumerate(models_to_try):
            print(f"  Trying model: {model}")
            
            for attempt in range(self.max_retries):
                try:
                    print(f"    Attempt {attempt + 1}/{self.max_retries}")
                    
                    start_time = time.time()
                    
                    # Try base64 method (often more reliable)
                    with open(optimized_path, 'rb') as f:
                        image_base64 = base64.b64encode(f.read()).decode('utf-8')
                    
                    messages = [
                        {
                            "role": "user",
                            "content": [
                                {"text": prompt},
                                {"image": f"data:image/jpeg;base64,{image_base64}"}
                            ]
                        }
                    ]
                    
                    response = dashscope.MultiModalConversation.call(
                        model=model,
                        messages=messages,
                        max_tokens=2000,
                        temperature=0.1
                    )
                    
                    elapsed = time.time() - start_time
                    print(f"    API call took {elapsed:.2f} seconds")
                    
                    if response.status_code == 200:
                        content = response.output.choices[0].message.content
                        
                        # Handle different response formats
                        if isinstance(content, list):
                            text_content = ""
                            for item in content:
                                if isinstance(item, dict) and 'text' in item:
                                    text_content += item['text'] + " "
                            return text_content.strip() if text_content else str(content)
                        else:
                            return str(content)
                    
                    else:
                        print(f"    API error: {response.status_code} - {response.message}")
                        
                        # If rate limited, wait longer
                        if response.status_code == 429:
                            wait_time = 10 * (attempt + 1)
                            print(f"    Rate limited, waiting {wait_time}s...")
                            time.sleep(wait_time)
                        
                except Exception as e:
                    print(f"    Error: {str(e)}")
                    
                    # If connection error, wait before retry
                    if "connection" in str(e).lower() or "timeout" in str(e).lower():
                        wait_time = 5 * (attempt + 1)
                        print(f"    Connection issue, waiting {wait_time}s...")
                        time.sleep(wait_time)
            
            print(f"  Model {model} failed after {self.max_retries} attempts")
        
        raise Exception(f"OCR failed with all models after multiple attempts")
    
    def extract_text(self, image_path=None, pil_image=None, prompt="Extract all text from this image accurately, maintaining the original structure and formatting."):
        """Main OCR method with optimizations"""
        if pil_image:
            # Save PIL image temporarily
            temp_path = "/tmp/temp_ocr_image.png"
            pil_image.save(temp_path)
            image_path = temp_path
        
        if not image_path:
            raise ValueError("Either image_path or pil_image must be provided")
        
        if not os.path.exists(image_path):
            raise ValueError(f"Image file not found: {image_path}")
        
        print(f"Processing: {os.path.basename(image_path)}")
        return self.extract_text_with_retry(image_path, prompt)
    
    def extract_structured_data(self, image_path=None, pil_image=None, output_format="json"):
        """Extract structured data from documents"""
        structured_prompt = f"""
        Extract all information from this document and return it in {output_format} format.
        Include all text, numbers, dates, and preserve the document structure.
        For tables, maintain row and column relationships.
        For forms, identify field names and their corresponding values.
        """
        
        return self.extract_text(image_path, pil_image, structured_prompt)