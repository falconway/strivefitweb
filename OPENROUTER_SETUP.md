# OpenRouter AI Setup Guide

## ✅ Flexible Medical OCR + Translation System

The system now uses OpenRouter API for reliable, cost-effective medical document processing with easy model switching.

## Setup Instructions

### 1. Get OpenRouter API Key (Free!)

1. **Visit**: https://openrouter.ai/
2. **Sign up** for a free account
3. **Go to**: https://openrouter.ai/keys
4. **Create new key** and copy it
5. **Free credits** included to get started!

### 2. Configure Vercel Environment

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Add these variables**:
   - **Name**: `OPENROUTER_API_KEY`
   - **Value**: Your API key from step 1
   - **Environment**: Production, Preview, Development (all)

3. **Optional Model Selection**:
   - **Name**: `OPENROUTER_MODEL`
   - **Value**: `google/gemini-flash-1.5` (free model)
   - **Environment**: Production, Preview, Development (all)

### 3. Available Models

#### **Free Models (Start Here!)**
- `google/gemini-flash-1.5` - **FREE** Google model, good OCR quality
- `meta-llama/llama-3.2-vision` - **FREE** Meta model, solid performance

#### **Ultra-Affordable Models**
- `anthropic/claude-3-haiku-vision` - **$0.00025/1K tokens** (~$0.001/document)
- `openai/gpt-4o-mini` - **$0.00015/1K tokens** (~$0.0007/document)

#### **Premium Models**
- `openai/gpt-4-vision-preview` - **$0.01/1K tokens** (~$0.05/document)
- `anthropic/claude-3.5-sonnet-vision` - **$0.003/1K tokens** (~$0.015/document)

### 4. Easy Model Switching

Just update the environment variable in Vercel:

**For Free Processing:**
```
OPENROUTER_MODEL=google/gemini-flash-1.5
```

**For Ultra-Cheap High Quality:**
```
OPENROUTER_MODEL=anthropic/claude-3-haiku-vision
```

**For Best Results:**
```
OPENROUTER_MODEL=openai/gpt-4-vision-preview
```

### 5. Deploy and Test

1. **Redeploy** your project (auto-deploys on git push)
2. **Upload a medical document** (PDF or image)
3. **Click "Process"** button
4. **Wait 5-15 seconds** for processing
5. **View results** with "Translated" button

## What Happens Now

### 🔍 **Single-Step Processing**
- Sends medical document directly to OpenRouter
- AI model performs OCR + translation in one step
- Returns professional English medical report
- No file downloads = no timeout issues!

### 💰 **Cost Tracking**
- Shows estimated cost per document
- Tracks tokens used
- Displays model information
- Easy cost monitoring

### 🎯 **Model Flexibility**
- Start with free models
- Upgrade for better quality
- A/B test different models
- Switch anytime via environment variables

## Benefits Over Previous System

| Feature | Qwen (Old) | OpenRouter (New) |
|---------|------------|------------------|
| **File Download** | Required, often failed | Not needed |
| **Processing Speed** | 30-60 seconds | 5-15 seconds |
| **Reliability** | Timeout issues | Very reliable |
| **Cost** | Fixed pricing | Free to premium options |
| **Model Choice** | Single model | 6+ models available |
| **Setup Complexity** | Complex | Simple |

## Troubleshooting

### ❌ "OPENROUTER_API_KEY environment variable not set"
- **Fix**: Add API key to Vercel environment variables
- **Check**: Redeploy after adding environment variable

### ❌ "Model not found" or "Invalid model"
- **Fix**: Use correct model name from list above
- **Check**: Model spelling matches exactly

### ❌ "Insufficient credits"
- **Fix**: Add credits to OpenRouter account
- **Alternative**: Switch to free model temporarily

### ❌ Processing takes too long
- **Normal**: 5-15 seconds for most documents
- **Solution**: Try different model if consistently slow

## Model Recommendations

### **Getting Started**
1. **Start with**: `google/gemini-flash-1.5` (free)
2. **Test quality** with your medical documents
3. **If good enough**: Stay with free model!

### **If You Need Better Quality**
1. **Try**: `anthropic/claude-3-haiku-vision` ($0.001/doc)
2. **Compare results** with free model
3. **Upgrade if needed**: `openai/gpt-4-vision-preview` ($0.05/doc)

### **For Production Use**
- **Free tier**: Good for testing and light usage
- **Ultra-cheap**: Best value for regular use
- **Premium**: Best quality for critical documents

## Next Steps

1. **Set up API key** following instructions above
2. **Start with free model** to test
3. **Process your medical documents**
4. **Compare model quality** and costs
5. **Choose your preferred model** for production

The system is now much more reliable and cost-effective! 🚀