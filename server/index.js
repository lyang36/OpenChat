const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const OpenAI = require('openai');
const litellm = require('litellm');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { PDFParse } = require('pdf-parse');
require('dotenv').config();

// Logging functionality
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function logMessage(chatId, role, content, fileName = null, apiDetails = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    chatId,
    role,
    content,
    fileName,
    ...(apiDetails && { apiDetails })
  };
  
  // Log to daily file
  const dateStr = new Date().toISOString().split('T')[0];
  const logFile = path.join(logsDir, `messages-${dateStr}.json`);
  
  let logs = [];
  if (fs.existsSync(logFile)) {
    try {
      const existingLogs = fs.readFileSync(logFile, 'utf8');
      logs = JSON.parse(existingLogs);
    } catch (error) {
      console.error('Error reading log file:', error);
    }
  }
  
  logs.push(logEntry);
  
  try {
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
}

// Enhanced logging function for API calls
function logApiCall(chatId, requestData, responseData, provider, model, error = null) {
  const timestamp = new Date().toISOString();
  const apiLogEntry = {
    timestamp,
    chatId,
    type: 'api_call',
    provider,
    model,
    request: {
      url: requestData.url || `${provider} API`,
      method: requestData.method || 'POST',
      headers: requestData.headers ? sanitizeHeaders(requestData.headers) : {},
      body: requestData.body || {}
    },
    response: responseData ? {
      status: responseData.status || 200,
      headers: responseData.headers ? sanitizeHeaders(responseData.headers) : {},
      body: responseData.body || {},
      usage: responseData.usage || null
    } : null,
    error: error ? {
      message: error.message,
      code: error.code || null,
      type: error.type || null
    } : null,
    duration_ms: requestData.duration_ms || null
  };
  
  // Log to daily API file
  const dateStr = new Date().toISOString().split('T')[0];
  const apiLogFile = path.join(logsDir, `api-calls-${dateStr}.json`);
  
  let apiLogs = [];
  if (fs.existsSync(apiLogFile)) {
    try {
      const existingLogs = fs.readFileSync(apiLogFile, 'utf8');
      apiLogs = JSON.parse(existingLogs);
    } catch (error) {
      console.error('Error reading API log file:', error);
    }
  }
  
  apiLogs.push(apiLogEntry);
  
  try {
    fs.writeFileSync(apiLogFile, JSON.stringify(apiLogs, null, 2));
  } catch (error) {
    console.error('Error writing to API log file:', error);
  }
}

// Sanitize headers to remove sensitive information
function sanitizeHeaders(headers) {
  const sanitized = { ...headers };
  // Remove or mask sensitive headers
  if (sanitized.authorization) sanitized.authorization = '[REDACTED]';
  if (sanitized.Authorization) sanitized.Authorization = '[REDACTED]';
  if (sanitized['x-api-key']) sanitized['x-api-key'] = '[REDACTED]';
  if (sanitized['X-API-Key']) sanitized['X-API-Key'] = '[REDACTED]';
  return sanitized;
}

const app = express();
const PORT = process.env.PORT || 12003;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow text files, images, and documents
    const allowedTypes = /\.(txt|pdf|doc|docx|jpg|jpeg|png|gif|csv|json|md)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'), false);
    }
  }
});

// Initialize SQLite database
const db = new sqlite3.Database('./chatgpt_clone.db');

// Create tables
db.serialize(() => {
  // Chats table
  db.run(`CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Messages table
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    file_path TEXT,
    file_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
  )`);

  // Settings table
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert default settings if they don't exist
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('openai_api_key', ''),
    ('provider', 'openai'),
    ('model', 'gpt-5'),
    ('temperature', '0.7'),
    ('max_tokens', '32000'),
    ('system_message', 'You are a helpful assistant.')
  `);
});

// Routes

// Get all chats
app.get('/api/chats', (req, res) => {
  db.all(
    'SELECT * FROM chats ORDER BY updated_at DESC',
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Create new chat
app.post('/api/chats', (req, res) => {
  const chatId = uuidv4();
  const { title } = req.body;
  const chatTitle = title || 'New Chat';

  db.run(
    'INSERT INTO chats (id, title) VALUES (?, ?)',
    [chatId, chatTitle],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: chatId, title: chatTitle, created_at: new Date().toISOString() });
    }
  );
});

// Get chat messages
app.get('/api/chats/:chatId/messages', (req, res) => {
  const { chatId } = req.params;
  
  db.all(
    'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
    [chatId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Send message to OpenAI and save conversation
app.post('/api/chats/:chatId/messages', upload.single('file'), async (req, res) => {
  const { chatId } = req.params;
  const { message } = req.body;
  const file = req.file;

  try {
    // Save user message
    const userMessageId = uuidv4();
    let fileContent = '';
    
    if (file) {
      // Read file content for text files
      if (file.mimetype.startsWith('text/') || file.originalname.endsWith('.md')) {
        fileContent = fs.readFileSync(file.path, 'utf8');
      }
      // Extract text from PDF files
      else if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
        try {
          const dataBuffer = fs.readFileSync(file.path);
          // Convert Buffer to Uint8Array for pdf-parse
          const uint8Array = new Uint8Array(dataBuffer);
          const parser = new PDFParse({ data: uint8Array });
          const pdfData = await parser.getText();
          fileContent = `PDF Content (${pdfData.total} pages):\n${pdfData.text}`;
          
          // Log the extracted PDF content for debugging
          console.log(`PDF extracted content from ${file.originalname}:`, pdfData.text.substring(0, 500) + (pdfData.text.length > 500 ? '...' : ''));
        } catch (error) {
          console.error('Error parsing PDF:', error);
          fileContent = `[PDF file uploaded but could not be parsed: ${file.originalname}]`;
        }
      }
      // Handle image files with base64 encoding
      else if (file.mimetype.startsWith('image/')) {
        try {
          const dataBuffer = fs.readFileSync(file.path);
          const base64Image = dataBuffer.toString('base64');
          const imageFormat = file.mimetype.split('/')[1]; // jpeg, png, etc.
          const fullBase64Data = `data:image/${imageFormat};base64,${base64Image}`;
          
          // For GPT-5 models that support images, we'll use the full base64 data
          // For logging and other models, we'll use a truncated version
          fileContent = `[Image: ${file.originalname} (${file.mimetype}) - Base64 encoded: ${fullBase64Data}]`;
          
          // Log image upload for debugging
          console.log(`Image uploaded: ${file.originalname} (${file.mimetype}), size: ${dataBuffer.length} bytes, base64 length: ${base64Image.length}`);
        } catch (error) {
          console.error('Error processing image:', error);
          fileContent = `[Image file uploaded but could not be processed: ${file.originalname}]`;
        }
      }
      // Handle other file types
      else {
        fileContent = `[File uploaded: ${file.originalname} (${file.mimetype}) - Content extraction not supported for this file type]`;
      }
    }

    const userContent = file ? `${message}\n\nFile: ${file.originalname}\n${fileContent}` : message;

    db.run(
      'INSERT INTO messages (id, chat_id, role, content, file_path, file_name) VALUES (?, ?, ?, ?, ?, ?)',
      [userMessageId, chatId, 'user', message, file?.path, file?.originalname],
      (err) => {
        if (err) {
          console.error('Error saving user message:', err);
        } else {
          // Log user message with file content if present
          logMessage(chatId, 'user', userContent, file?.originalname);
        }
      }
    );

    // Get conversation history
    const messages = await new Promise((resolve, reject) => {
      db.all(
        'SELECT role, content FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
        [chatId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Get settings from database
    const settings = await new Promise((resolve, reject) => {
      db.all('SELECT key, value FROM settings', (err, rows) => {
        if (err) reject(err);
        else {
          const settingsObj = {};
          rows.forEach(row => {
            settingsObj[row.key] = row.value;
          });
          resolve(settingsObj);
        }
      });
    });

    // Use custom API key if provided, otherwise use environment variable
    // If settings.openai_api_key is explicitly set to empty string, don't use env variable
    const apiKey = settings.openai_api_key !== undefined ? settings.openai_api_key : process.env.OPENAI_API_KEY;
    
    // Debug logging (can be removed in production)
    // console.log('Debug - settings.openai_api_key:', settings.openai_api_key !== undefined ? `"${settings.openai_api_key}"` : 'UNDEFINED');
    // console.log('Debug - process.env.OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
    // console.log('Debug - final apiKey:', apiKey ? `"${apiKey.substring(0, 10)}..."` : 'EMPTY');
    
    let assistantMessage;
    
    if (!apiKey || apiKey.trim() === '' || apiKey === 'demo') {
      // Fallback response when no API key is available
      assistantMessage = "I'm a demo assistant. Please configure your AI provider API key in the settings to enable full functionality. You can use OpenAI, Anthropic (Claude), Google (Gemini), Azure OpenAI, Cohere, or Hugging Face models.";
    } else {
      try {
        // Set the appropriate environment variable based on provider
        const provider = settings.provider || 'openai';
        const originalEnvKey = process.env.OPENAI_API_KEY;
        
        // Temporarily set the environment variable for LiteLLM
        if (provider === 'openai') {
          process.env.OPENAI_API_KEY = apiKey;
        } else if (provider === 'anthropic') {
          process.env.ANTHROPIC_API_KEY = apiKey;
        } else if (provider === 'google') {
          process.env.GOOGLE_API_KEY = apiKey;
        } else if (provider === 'azure') {
          process.env.AZURE_API_KEY = apiKey;
        } else if (provider === 'cohere') {
          process.env.COHERE_API_KEY = apiKey;
        } else if (provider === 'huggingface') {
          process.env.HUGGINGFACE_API_KEY = apiKey;
        }

        const model = settings.model || "gpt-4";
        const isGPT5 = model.startsWith('gpt-5');
        
        let completion;
        
        if (isGPT5 && provider === 'openai') {
          // Use OpenAI SDK directly for GPT-5 models
          const OpenAI = require('openai');
          const openai = new OpenAI({ apiKey: apiKey });
          
          const startTime = Date.now();
          const temp = parseFloat(settings.temperature) || 0.7;
          let effort = "medium";
          if (temp <= 0.3) effort = "minimal";
          else if (temp <= 0.5) effort = "low";
          else if (temp <= 1.0) effort = "medium";
          else effort = "high";
          
          // Create conversation history with the current message including file content
          const conversationHistory = [
            { role: "system", content: settings.system_message || "You are a helpful assistant." },
            ...messages.slice(0, -1).map(msg => ({ role: msg.role, content: msg.content })),
            { role: "user", content: userContent }
          ];
          
          let requestMessages = conversationHistory;
          
          // Check if the current message contains an image and format for GPT-5 multimodal input
          if (file && file.mimetype.startsWith('image/')) {
            try {
              const dataBuffer = fs.readFileSync(file.path);
              const base64Image = dataBuffer.toString('base64');
              const imageFormat = file.mimetype.split('/')[1];
              
              // Format for GPT-5 multimodal input
              requestMessages = [
                { role: "system", content: settings.system_message || "You are a helpful assistant." },
                ...messages.slice(0, -1).map(msg => ({ role: msg.role, content: msg.content })),
                {
                  role: "user",
                  content: [
                    { type: "text", text: message },
                    { 
                      type: "image_url", 
                      image_url: {
                        url: `data:image/${imageFormat};base64,${base64Image}`
                      }
                    }
                  ]
                }
              ];
              console.log(`Formatted image for GPT-5 multimodal input: ${file.originalname}`);
            } catch (error) {
              console.error('Error formatting image for GPT-5:', error);
              // Fall back to text-only format
              requestMessages = conversationHistory;
            }
          }
          
          try {
            // Try GPT-5 specific parameters first
            const requestBody = {
              model: model,
              messages: requestMessages,
              max_completion_tokens: parseInt(settings.max_tokens) || 32000,
              reasoning: { effort: effort },
              text: { verbosity: "medium" }
            };
            
            completion = await openai.chat.completions.create(requestBody);
            
            const duration = Date.now() - startTime;
            
            // Log successful API call
            logApiCall(chatId, {
              url: 'https://api.openai.com/v1/chat/completions',
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': '[REDACTED]' },
              body: requestBody,
              duration_ms: duration
            }, {
              status: 200,
              body: {
                id: completion.id,
                object: completion.object,
                created: completion.created,
                model: completion.model,
                choices: completion.choices,
                usage: completion.usage
              },
              usage: completion.usage
            }, provider, model);
            
          } catch (error) {
            const duration = Date.now() - startTime;
            
            if (error.code === 'unknown_parameter') {
              // Fall back to standard parameters if GPT-5 specific ones aren't available yet
              const fallbackRequestBody = {
                model: model,
                messages: requestMessages,
                max_completion_tokens: parseInt(settings.max_tokens) || 32000
              };
              
              completion = await openai.chat.completions.create(fallbackRequestBody);
              
              const fallbackDuration = Date.now() - startTime;
              
              // Log fallback API call
              logApiCall(chatId, {
                url: 'https://api.openai.com/v1/chat/completions',
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': '[REDACTED]' },
                body: fallbackRequestBody,
                duration_ms: fallbackDuration
              }, {
                status: 200,
                body: {
                  id: completion.id,
                  object: completion.object,
                  created: completion.created,
                  model: completion.model,
                  choices: completion.choices,
                  usage: completion.usage
                },
                usage: completion.usage
              }, provider, model + ' (fallback)');
              
            } else {
              // Log failed API call
              logApiCall(chatId, {
                url: 'https://api.openai.com/v1/chat/completions',
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': '[REDACTED]' },
                body: {
                  model: model,
                  messages: requestMessages,
                  max_completion_tokens: parseInt(settings.max_tokens) || 32000,
                  reasoning: { effort: effort },
                  text: { verbosity: "medium" }
                },
                duration_ms: duration
              }, null, provider, model, error);
              
              throw error;
            }
          }
        } else {
          // Use LiteLLM for other models and providers
          const startTime = Date.now();
          
          // Create conversation history with the current message including file content
          const conversationHistory = [
            { role: "system", content: settings.system_message || "You are a helpful assistant." },
            ...messages.slice(0, -1).map(msg => ({ role: msg.role, content: msg.content })),
            { role: "user", content: userContent }
          ];
          
          let requestMessages = conversationHistory;
          
          // Check if the current message contains an image and format for multimodal input
          if (file && file.mimetype.startsWith('image/')) {
            try {
              const dataBuffer = fs.readFileSync(file.path);
              const base64Image = dataBuffer.toString('base64');
              const imageFormat = file.mimetype.split('/')[1];
              
              // Format for multimodal input (LiteLLM supports this format for compatible models)
              requestMessages = [
                { role: "system", content: settings.system_message || "You are a helpful assistant." },
                ...messages.slice(0, -1).map(msg => ({ role: msg.role, content: msg.content })),
                {
                  role: "user",
                  content: [
                    { type: "text", text: message },
                    { 
                      type: "image_url", 
                      image_url: {
                        url: `data:image/${imageFormat};base64,${base64Image}`
                      }
                    }
                  ]
                }
              ];
              console.log(`Formatted image for multimodal input: ${file.originalname}`);
            } catch (error) {
              console.error('Error formatting image for multimodal input:', error);
              // Fall back to text-only format
              requestMessages = conversationHistory;
            }
          }
          
          let completionParams = {
            model: model,
            messages: requestMessages,
            max_tokens: parseInt(settings.max_tokens) || (model === 'gpt-5' ? 32000 : 2000),
            temperature: parseFloat(settings.temperature) || 0.7
          };

          try {
            completion = await litellm.completion(completionParams);
            
            const duration = Date.now() - startTime;
            
            // Log successful LiteLLM API call
            logApiCall(chatId, {
              url: `${provider} API via LiteLLM`,
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': '[REDACTED]' },
              body: completionParams,
              duration_ms: duration
            }, {
              status: 200,
              body: {
                id: completion.id,
                object: completion.object,
                created: completion.created,
                model: completion.model,
                choices: completion.choices,
                usage: completion.usage
              },
              usage: completion.usage
            }, provider, model);
            
          } catch (error) {
            const duration = Date.now() - startTime;
            
            // Log failed LiteLLM API call
            logApiCall(chatId, {
              url: `${provider} API via LiteLLM`,
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': '[REDACTED]' },
              body: completionParams,
              duration_ms: duration
            }, null, provider, model, error);
            
            throw error;
          }
        }

        // Restore original environment variable
        if (provider === 'openai') {
          if (originalEnvKey) {
            process.env.OPENAI_API_KEY = originalEnvKey;
          } else {
            delete process.env.OPENAI_API_KEY;
          }
        }

        assistantMessage = completion.choices[0].message.content;
      } catch (error) {
        console.error('AI API error:', error);
        
        // Log the error if it wasn't already logged in the specific API call sections
        if (!error.logged) {
          logApiCall(chatId, {
            url: 'AI API',
            method: 'POST',
            body: { error: 'Outer catch block' },
            duration_ms: 0
          }, null, settings.provider || 'unknown', settings.model || 'unknown', error);
        }
        
        assistantMessage = "Sorry, there was an error with the AI service. Please check your API key and try again. Error: " + error.message;
      }
    }

    // Save assistant message
    const assistantMessageId = uuidv4();
    db.run(
      'INSERT INTO messages (id, chat_id, role, content) VALUES (?, ?, ?, ?)',
      [assistantMessageId, chatId, 'assistant', assistantMessage],
      (err) => {
        if (err) {
          console.error('Error saving assistant message:', err);
        } else {
          // Log assistant message
          logMessage(chatId, 'assistant', assistantMessage);
        }
      }
    );

    // Update chat timestamp
    db.run(
      'UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [chatId]
    );

    res.json({
      userMessage: {
        id: userMessageId,
        role: 'user',
        content: message,
        file_name: file?.originalname,
        created_at: new Date().toISOString()
      },
      assistantMessage: {
        id: assistantMessageId,
        role: 'assistant',
        content: assistantMessage,
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete chat
app.delete('/api/chats/:chatId', (req, res) => {
  const { chatId } = req.params;
  
  db.run('DELETE FROM chats WHERE id = ?', [chatId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Chat deleted successfully' });
  });
});

// Update chat title
app.put('/api/chats/:chatId', (req, res) => {
  const { chatId } = req.params;
  const { title } = req.body;
  
  db.run(
    'UPDATE chats SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [title, chatId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Chat title updated successfully' });
    }
  );
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Serve React app
app.use(express.static(path.join(__dirname, '../client/build')));

// Settings endpoints
app.get('/api/settings', (req, res) => {
  db.all('SELECT key, value FROM settings', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    
    res.json(settings);
  });
});

app.put('/api/settings', (req, res) => {
  const { settings } = req.body;
  
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Settings object is required' });
  }
  
  const updatePromises = Object.entries(settings).map(([key, value]) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [key, value],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  });
  
  Promise.all(updatePromises)
    .then(() => {
      res.json({ message: 'Settings updated successfully' });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access at: https://app-2-runtime-cpqhovvammucfkds-worker1.prod-runtime.app.kepilot.ai`);
});