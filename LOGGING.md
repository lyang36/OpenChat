# Enhanced Logging System Documentation

## Overview

The ChatGPT Clone platform now includes a comprehensive logging system that captures both user conversations and detailed API call information. This provides complete visibility into what's being sent to AI providers and what responses are received.

## Log File Types

### 1. Message Logs (`messages-YYYY-MM-DD.json`)
**Purpose**: Records all user and assistant messages in conversations
**Location**: `/server/logs/messages-YYYY-MM-DD.json`

**Format**:
```json
[
  {
    "timestamp": "2025-10-21T20:34:32.349Z",
    "chatId": "test-enhanced-logging",
    "role": "user",
    "content": "Test the enhanced API logging system with GPT-5!",
    "fileName": null
  },
  {
    "timestamp": "2025-10-21T20:34:32.357Z",
    "chatId": "test-enhanced-logging", 
    "role": "assistant",
    "content": "Response from AI...",
    "fileName": null
  }
]
```

### 2. API Call Logs (`api-calls-YYYY-MM-DD.json`)
**Purpose**: Records complete HTTP request/response details for all AI API calls
**Location**: `/server/logs/api-calls-YYYY-MM-DD.json`

**Format**:
```json
[
  {
    "timestamp": "2025-10-21T20:34:32.349Z",
    "chatId": "test-enhanced-logging",
    "type": "api_call",
    "provider": "openai",
    "model": "gpt-5 (fallback)",
    "request": {
      "url": "https://api.openai.com/v1/chat/completions",
      "method": "POST",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "[REDACTED]"
      },
      "body": {
        "model": "gpt-5",
        "messages": [...],
        "max_completion_tokens": 2000
      },
      "duration_ms": 30275
    },
    "response": {
      "status": 200,
      "headers": {},
      "body": {
        "id": "chatcmpl-CTDLOEpRQSi0wsmTRZScqFnVrkFrO",
        "object": "chat.completion",
        "created": 1761078842,
        "model": "gpt-5-2025-08-07",
        "choices": [...],
        "usage": {
          "prompt_tokens": 27,
          "completion_tokens": 2000,
          "total_tokens": 2027,
          "completion_tokens_details": {
            "reasoning_tokens": 2000
          }
        }
      },
      "usage": {...}
    },
    "error": null
  }
]
```

## Logged Information

### Request Details
- **URL**: The exact API endpoint called
- **Method**: HTTP method (typically POST)
- **Headers**: HTTP headers (sensitive headers are redacted)
- **Body**: Complete request payload including:
  - Model name
  - Messages array (system + conversation history)
  - Parameters (temperature, max_tokens, etc.)
  - Provider-specific parameters (GPT-5 reasoning, text settings)

### Response Details
- **Status**: HTTP status code
- **Headers**: Response headers (sensitive data redacted)
- **Body**: Complete API response including:
  - Response ID and metadata
  - Generated content
  - Token usage statistics
  - Model-specific details (reasoning tokens for GPT-5)

### Error Information
- **Error Message**: Detailed error description
- **Error Code**: API-specific error codes
- **Error Type**: Classification of error type

### Performance Metrics
- **Duration**: Request duration in milliseconds
- **Token Usage**: Detailed token consumption breakdown
- **Provider**: Which AI provider was used
- **Model**: Specific model version

## Security Features

### Data Sanitization
- **API Keys**: All authorization headers are automatically redacted as `[REDACTED]`
- **Sensitive Headers**: Common sensitive headers are masked
- **Content Preservation**: Message content is preserved for debugging while protecting credentials

### File Organization
- **Daily Rotation**: New log files created each day
- **Separate Concerns**: Message logs and API logs are kept separate
- **JSON Format**: Structured format for easy parsing and analysis

## Use Cases

### 1. Debugging API Issues
```bash
# Check recent API calls for errors
grep -A 10 -B 5 '"error":' logs/api-calls-2025-10-21.json

# Find slow API calls (>10 seconds)
grep -B 5 -A 5 '"duration_ms": [1-9][0-9][0-9][0-9][0-9]' logs/api-calls-2025-10-21.json
```

### 2. Monitoring Token Usage
```bash
# Extract token usage statistics
grep -o '"usage":{[^}]*}' logs/api-calls-2025-10-21.json
```

### 3. Analyzing Model Performance
```bash
# Compare different models
grep '"model":' logs/api-calls-2025-10-21.json | sort | uniq -c
```

### 4. Provider Comparison
```bash
# See which providers are being used
grep '"provider":' logs/api-calls-2025-10-21.json | sort | uniq -c
```

## GPT-5 Specific Logging

The system provides enhanced logging for GPT-5 calls, including:

### Fallback Mechanism Tracking
- **Initial Attempt**: Logs GPT-5 specific parameters (reasoning, text)
- **Fallback Attempt**: Logs standard parameters when GPT-5 specific ones fail
- **Model Annotation**: Adds "(fallback)" to model name when fallback is used

### GPT-5 Specific Metrics
- **Reasoning Tokens**: Tracks tokens used for reasoning (separate from completion tokens)
- **Parameter Mapping**: Shows how temperature is mapped to reasoning effort levels
- **Completion Token Details**: Detailed breakdown of token usage types

## Log File Management

### Automatic Creation
- Log directories and files are created automatically
- No manual setup required
- Graceful handling of missing directories

### File Naming Convention
- `messages-YYYY-MM-DD.json`: Daily message logs
- `api-calls-YYYY-MM-DD.json`: Daily API call logs
- UTC dates used for consistency

### Storage Considerations
- JSON format for structured data
- Human-readable formatting with proper indentation
- Efficient storage with minimal redundancy

## Integration with Application

### Automatic Logging
- All API calls are automatically logged
- No additional configuration required
- Works with all supported providers (OpenAI, Anthropic, Google, etc.)

### Error Handling
- Failed API calls are logged with error details
- Network timeouts and connection issues are captured
- Graceful degradation when logging fails

### Performance Impact
- Minimal performance overhead
- Asynchronous file operations
- Non-blocking logging operations

## Example Analysis Queries

### Find All GPT-5 Calls
```bash
grep -B 2 -A 20 '"model": "gpt-5' logs/api-calls-2025-10-21.json
```

### Check API Response Times
```bash
grep '"duration_ms":' logs/api-calls-2025-10-21.json | sed 's/.*"duration_ms": \([0-9]*\).*/\1/' | sort -n
```

### Count Successful vs Failed Calls
```bash
# Successful calls
grep '"error": null' logs/api-calls-2025-10-21.json | wc -l

# Failed calls  
grep -v '"error": null' logs/api-calls-2025-10-21.json | wc -l
```

### Extract All Error Messages
```bash
grep -A 3 '"error": {' logs/api-calls-2025-10-21.json
```

This enhanced logging system provides complete visibility into the AI API interactions, making debugging, monitoring, and optimization much more effective.