import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DASHSCOPE_API_KEY = os.getenv('DASHSCOPE_API_KEY')
    QWEN_VL_MODEL = os.getenv('QWEN_VL_MODEL', 'qwen-vl-plus')
    QWEN_TEXT_MODEL = os.getenv('QWEN_TEXT_MODEL', 'qwen-max')
    
    @classmethod
    def validate(cls):
        if not cls.DASHSCOPE_API_KEY:
            raise ValueError("DASHSCOPE_API_KEY is required")
        return True