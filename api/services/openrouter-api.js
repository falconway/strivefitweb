/**
 * OpenRouter API Service for Medical OCR + Translation
 * Supports multiple vision models with easy swapping
 */

import { put } from '@vercel/blob';

export class OpenRouterAPI {
    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.baseUrl = 'https://openrouter.ai/api/v1';
        
        // Auto-fallback model chain: Only FREE models
        this.modelChain = [
            'google/gemini-flash-1.5',        // Free
            'qwen/qwen-2.5-vl-72b-instruct'   // Free - Qwen2.5-VL-72B-Instruct
        ];
        
        if (!this.apiKey) {
            const error = 'OPENROUTER_API_KEY environment variable not set';
            console.error('❌', error);
            throw new Error(error);
        }
        
        console.log('✅ OpenRouter API initialized');
        console.log('🎯 Auto-model selection enabled');
        console.log('🔄 Model chain:', this.modelChain.join(' → '));
    }

    /**
     * Model configurations with costs and capabilities
     */
    getModelConfig() {
        return {
            // Free Models
            'google/gemini-flash-1.5': {
                name: 'Gemini Flash 1.5',
                cost: 0.00,
                tier: 'free',
                maxTokens: 2048,
                timeout: 20000, // Shorter timeout for faster fallback
                description: 'Free Google model, good OCR quality'
            },
            'qwen/qwen-2.5-vl-72b-instruct': {
                name: 'Qwen2.5-VL-72B-Instruct',
                cost: 0.00,
                tier: 'free',
                maxTokens: 4096,
                timeout: 25000, // Slightly longer for larger model
                description: 'Free Qwen model, excellent for Chinese medical documents'
            },
            
            // Ultra-Affordable Models
            'anthropic/claude-3-haiku-vision': {
                name: 'Claude 3 Haiku Vision',
                cost: 0.00025,
                tier: 'ultra-cheap',
                maxTokens: 4096,
                timeout: 30000, // Reliable model, slightly longer timeout
                description: 'Very affordable, excellent medical accuracy'
            },
            'openai/gpt-4o-mini': {
                name: 'GPT-4o Mini',
                cost: 0.00015,
                tier: 'ultra-cheap',
                maxTokens: 4096,
                timeout: 30000, // Reliable model, slightly longer timeout
                description: 'Cheapest OpenAI model, great quality'
            },
            
            // Premium Models
            'openai/gpt-4-vision-preview': {
                name: 'GPT-4 Vision Preview',
                cost: 0.01,
                tier: 'premium',
                maxTokens: 4096,
                timeout: 45000, // Premium model, longer timeout
                description: 'Best medical OCR accuracy, professional translation'
            },
            'anthropic/claude-3.5-sonnet-vision': {
                name: 'Claude 3.5 Sonnet Vision',
                cost: 0.003,
                tier: 'premium',
                maxTokens: 4096,
                timeout: 45000, // Premium model, longer timeout
                description: 'Excellent medical document analysis'
            }
        };
    }

    /**
     * Get optimized prompt for medical OCR + translation
     */
    getMedicalPrompt(modelName) {
        const basePrompt = `You are a professional medical document analyst. Please analyze this medical document and provide a complete English translation.

TASK:
1. Extract ALL text from this medical document using OCR
2. Translate the content to professional English
3. Preserve medical terminology and document structure
4. Include patient information, test results, diagnoses, and recommendations

FORMAT your response as a structured medical report in English:

# Medical Report Translation

## Patient Information
[Extract and translate patient details]

## Document Details
- Original Document: [document name/type]
- Date: [if visible]
- Hospital/Clinic: [if visible]

## Medical Content
[Complete English translation of all medical content]

## Test Results
[Any lab results, imaging findings, etc.]

## Diagnosis/Findings
[Medical diagnoses or findings]

## Recommendations
[Treatment recommendations or follow-up instructions]

---
*Professional medical translation - preserve all clinical details*`;

        // Model-specific optimizations
        const modelOptimizations = {
            'google/gemini-flash-1.5': basePrompt + '\n\nPlease be thorough and accurate in your OCR extraction.',
            'qwen/qwen-2.5-vl-72b-instruct': basePrompt + '\n\nAs a specialized Chinese model, please provide the most accurate OCR extraction and professional English translation for this Chinese medical document. Focus on preserving medical terminology and clinical accuracy.',
            'meta-llama/llama-3.2-vision': basePrompt + '\n\nExtract text carefully and translate professionally.',
            'anthropic/claude-3-haiku-vision': basePrompt + '\n\nFocus on medical accuracy and professional terminology.',
            'openai/gpt-4-vision-preview': basePrompt + '\n\nProvide the most accurate medical translation possible.',
            'anthropic/claude-3.5-sonnet-vision': basePrompt + '\n\nAnalyze thoroughly and provide comprehensive medical translation.'
        };

        return modelOptimizations[modelName] || basePrompt;
    }

    /**
     * Process medical document with automatic model selection
     */
    async processDocument(document, blobUrl) {
        const startTime = Date.now();
        
        try {
            console.log(`🔄 Starting OpenRouter processing for: ${document.originalName}`);
            console.log(`📥 Blob URL: ${blobUrl}`);
            console.log(`🎯 Auto-trying models: ${this.modelChain.join(' → ')}`);
            
            let result = null;
            let modelTried = 0;
            
            // Try each model in the chain until one succeeds
            for (const modelName of this.modelChain) {
                modelTried++;
                console.log(`🔄 Attempt ${modelTried}/${this.modelChain.length}: Trying ${modelName}`);
                
                result = await this.processWithModel(modelName, document, blobUrl);
                
                if (result.success) {
                    console.log(`✅ Success with ${modelName} on attempt ${modelTried}`);
                    break;
                } else {
                    console.log(`❌ Failed with ${modelName}: ${result.error}`);
                    
                    // If not the last model, continue to next
                    if (modelTried < this.modelChain.length) {
                        console.log(`🔄 Trying next model...`);
                        continue;
                    }
                }
            }
            
            const totalTime = Date.now() - startTime;
            
            if (result && result.success) {
                console.log(`✅ OpenRouter processing completed in ${totalTime}ms`);
                return {
                    ...result,
                    processing_time: {
                        total: totalTime,
                        ocr_translation: result.processing_time || totalTime
                    },
                    attempts: modelTried
                };
            } else {
                console.error(`❌ All ${this.modelChain.length} models failed`);
                return {
                    success: false,
                    error: `All models failed. Last error: ${result?.error || 'Unknown error'}`,
                    processing_time: {
                        total: totalTime
                    },
                    attempts: modelTried
                };
            }
            
        } catch (error) {
            console.error('❌ OpenRouter processing error:', error);
            return {
                success: false,
                error: error.message,
                processing_time: {
                    total: Date.now() - startTime
                }
            };
        }
    }

    /**
     * Process with specific model
     */
    async processWithModel(modelName, document, blobUrl) {
        const config = this.getModelConfig()[modelName];
        if (!config) {
            throw new Error(`Unknown model: ${modelName}`);
        }

        const startTime = Date.now();
        
        try {
            console.log(`🎯 Processing with ${config.name} (${config.tier}) - Cost: $${config.cost}/1K tokens`);
            
            const payload = {
                model: modelName,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: this.getMedicalPrompt(modelName)
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: blobUrl
                                }
                            }
                        ]
                    }
                ],
                max_tokens: config.maxTokens,
                temperature: 0.1
            };

            console.log('📤 Sending request to OpenRouter API...');
            
            // Create timeout controller
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://strivefit.com',
                    'X-Title': 'Strive & Fit Medical OCR'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('📥 Received response from OpenRouter');

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid response format from OpenRouter API');
            }

            const translatedText = data.choices[0].message.content;
            const processingTime = Date.now() - startTime;
            
            // Calculate estimated cost
            const tokensUsed = data.usage?.total_tokens || 2000;
            const estimatedCost = (tokensUsed / 1000) * config.cost;
            
            console.log(`✅ ${config.name} processing completed`);
            console.log(`📊 Tokens used: ${tokensUsed}, Estimated cost: $${estimatedCost.toFixed(4)}`);

            return {
                success: true,
                translated_text: translatedText,
                model_used: modelName,
                model_name: config.name,
                processing_time: processingTime,
                tokens_used: tokensUsed,
                estimated_cost: estimatedCost,
                tier: config.tier
            };

        } catch (error) {
            console.error(`❌ ${config.name} processing error:`, error.message);
            return {
                success: false,
                error: error.message,
                model_used: modelName,
                model_name: config.name
            };
        }
    }

    /**
     * Generate markdown file with results
     */
    async generateMarkdownFile(document, processResult) {
        try {
            const markdown = this.createTranslationMarkdown(document, processResult);
            const blob = await put(`processed/${document.id}-translated.md`, markdown, {
                access: 'public',
                contentType: 'text/markdown'
            });
            
            console.log('📄 Generated translation markdown file');
            return blob.url;
            
        } catch (error) {
            console.error('❌ Error generating markdown file:', error);
            return null;
        }
    }

    /**
     * Create translation markdown with model info
     */
    createTranslationMarkdown(document, result) {
        const config = this.getModelConfig()[result.model_used];
        
        return `# Medical Report Translation - ${document.originalName}

**Document ID:** ${document.id}  
**Translation Date:** ${new Date().toLocaleString()}  
**AI Model:** ${result.model_name}  
**Model Tier:** ${result.tier}  
**Processing Time:** ${result.processing_time}ms  
**Tokens Used:** ${result.tokens_used}  
**Estimated Cost:** $${result.estimated_cost.toFixed(4)}

## Translation Results

${result.translated_text}

## Processing Details

- **Service:** OpenRouter API
- **Model:** ${result.model_used}
- **Tier:** ${result.tier} (${config.description})
- **Cost per 1K tokens:** $${config.cost}
- **Processing Time:** ${result.processing_time}ms

---

*Professional medical translation powered by ${result.model_name}*  
*Processed via OpenRouter API for reliable, cost-effective AI services*`;
    }
}

export default OpenRouterAPI;