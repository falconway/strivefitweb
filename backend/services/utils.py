"""
Utility functions for OCR and translation optimization
"""

import time
import functools
import logging
from typing import List, Dict, Any
import re
from PIL import Image, ImageEnhance, ImageFilter

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def timer(func):
    """Decorator to measure function execution time"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        logger.info(f"{func.__name__} executed in {end_time - start_time:.2f} seconds")
        return result
    return wrapper

def retry_on_failure(max_retries=3, delay=1.0):
    """Decorator to retry function on failure"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise e
                    logger.warning(f"Attempt {attempt + 1} failed for {func.__name__}: {e}")
                    time.sleep(delay)
            return None
        return wrapper
    return decorator

class ImageProcessor:
    """Image preprocessing for better OCR accuracy"""
    
    @staticmethod
    def enhance_image(image_path: str) -> Image.Image:
        """Enhance image quality for better OCR results"""
        try:
            img = Image.open(image_path)
            
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Enhance contrast
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.2)
            
            # Enhance sharpness
            enhancer = ImageEnhance.Sharpness(img)
            img = enhancer.enhance(1.1)
            
            # Apply slight denoising
            img = img.filter(ImageFilter.MedianFilter(size=3))
            
            return img
            
        except Exception as e:
            logger.error(f"Image enhancement failed: {e}")
            return Image.open(image_path)

class TextProcessor:
    """Text processing utilities for better translation"""
    
    @staticmethod
    def clean_ocr_text(text: str) -> str:
        """Clean and format OCR extracted text"""
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Fix common OCR errors
        text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)  # Add space between words
        text = re.sub(r'(\d)([a-zA-Z])', r'\1 \2', text)  # Space between numbers and letters
        text = re.sub(r'([a-zA-Z])(\d)', r'\1 \2', text)  # Space between letters and numbers
        
        # Remove multiple consecutive punctuation marks
        text = re.sub(r'([.!?]){2,}', r'\1', text)
        
        return text.strip()
    
    @staticmethod
    def split_long_text(text: str, max_length: int = 1000) -> List[str]:
        """Split long text into smaller chunks for better translation"""
        if len(text) <= max_length:
            return [text]
        
        # Split by sentences first
        sentences = text.split('. ')
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            if len(current_chunk + sentence) <= max_length:
                current_chunk += sentence + ". "
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence + ". "
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    @staticmethod
    def merge_translations(translations: List[str]) -> str:
        """Merge translated text chunks"""
        return ' '.join(translations)

class PerformanceMonitor:
    """Monitor and optimize performance"""
    
    def __init__(self):
        self.metrics = {
            'ocr_times': [],
            'translation_times': [],
            'total_requests': 0,
            'failed_requests': 0
        }
    
    def log_ocr_time(self, duration: float):
        """Log OCR processing time"""
        self.metrics['ocr_times'].append(duration)
    
    def log_translation_time(self, duration: float):
        """Log translation processing time"""
        self.metrics['translation_times'].append(duration)
    
    def log_request(self, success: bool = True):
        """Log API request"""
        self.metrics['total_requests'] += 1
        if not success:
            self.metrics['failed_requests'] += 1
    
    def get_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        stats = {
            'total_requests': self.metrics['total_requests'],
            'failed_requests': self.metrics['failed_requests'],
            'success_rate': 1 - (self.metrics['failed_requests'] / max(self.metrics['total_requests'], 1))
        }
        
        if self.metrics['ocr_times']:
            stats['avg_ocr_time'] = sum(self.metrics['ocr_times']) / len(self.metrics['ocr_times'])
        
        if self.metrics['translation_times']:
            stats['avg_translation_time'] = sum(self.metrics['translation_times']) / len(self.metrics['translation_times'])
        
        return stats

# Global performance monitor instance
performance_monitor = PerformanceMonitor()