import dashscope
import json
from config import Config

class QwenTranslationService:
    def __init__(self):
        Config.validate()
        dashscope.api_key = Config.DASHSCOPE_API_KEY
        self.model = Config.QWEN_TEXT_MODEL
    
    def translate(self, text, source_lang="auto", target_lang="English", preserve_formatting=True):
        """Translate text using Qwen model with high accuracy"""
        try:
            formatting_instruction = ""
            if preserve_formatting:
                formatting_instruction = "Preserve the original formatting, line breaks, and structure of the text. "
            
            prompt = f"""
            {formatting_instruction}Translate the following text from {source_lang} to {target_lang}.
            Provide an accurate, natural, and contextually appropriate translation.
            Maintain the original meaning and tone.
            
            Text to translate:
            {text}
            
            Translation:
            """
            
            messages = [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            response = dashscope.Generation.call(
                model=self.model,
                messages=messages,
                max_tokens=2000,
                temperature=0.1,
                top_p=0.9
            )
            
            if response.status_code == 200:
                # Handle different response formats
                if hasattr(response, 'output') and response.output:
                    if hasattr(response.output, 'choices') and response.output.choices:
                        if hasattr(response.output.choices[0], 'message'):
                            return response.output.choices[0].message.content.strip()
                        elif hasattr(response.output.choices[0], 'text'):
                            return response.output.choices[0].text.strip()
                    elif hasattr(response.output, 'text'):
                        return response.output.text.strip()
                
                # Fallback - return the whole response as string
                return str(response.output).strip()
            else:
                error_msg = getattr(response, 'message', 'Unknown error')
                raise Exception(f"API request failed: {response.status_code}, {error_msg}")
                
        except Exception as e:
            raise Exception(f"Translation failed: {str(e)}")
    
    def batch_translate(self, texts, source_lang="auto", target_lang="English"):
        """Translate multiple texts efficiently"""
        translations = []
        for text in texts:
            try:
                translation = self.translate(text, source_lang, target_lang)
                translations.append(translation)
            except Exception as e:
                translations.append(f"Error: {str(e)}")
        return translations
    
    def detect_language(self, text):
        """Detect the language of the input text"""
        try:
            prompt = f"""
            Detect the language of the following text and respond with only the language name in English:
            
            {text[:500]}
            
            Language:
            """
            
            messages = [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            response = dashscope.Generation.call(
                model=self.model,
                messages=messages,
                max_tokens=50,
                temperature=0.1
            )
            
            if response.status_code == 200:
                # Handle different response formats
                if hasattr(response, 'output') and response.output:
                    if hasattr(response.output, 'choices') and response.output.choices:
                        if hasattr(response.output.choices[0], 'message'):
                            return response.output.choices[0].message.content.strip()
                        elif hasattr(response.output.choices[0], 'text'):
                            return response.output.choices[0].text.strip()
                    elif hasattr(response.output, 'text'):
                        return response.output.text.strip()
                
                return str(response.output).strip()
            else:
                return "Unknown"
                
        except Exception:
            return "Unknown"