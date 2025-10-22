# ChatGPT Clone

A full-featured ChatGPT-like platform built with React, Node.js, and OpenAI's API. This application provides a complete chat interface with persistent conversations, file uploads, and chat management capabilities.

## 🚀 Features

- **💬 Real-time Chat Interface**: Clean, modern UI similar to ChatGPT
- **💾 Persistent Conversations**: All chats are saved to SQLite database
- **📁 File Upload Support**: Upload and process various file types (text, images, documents)
- **🗂️ Chat Management**: Create, rename, and delete conversations
- **🔄 Message History**: Full conversation history with timestamps
- **🎨 Modern UI**: Built with Tailwind CSS for a responsive, clean design
- **🔌 Multi-Provider AI**: Support for OpenAI, Anthropic, Google, Azure, Cohere, and Hugging Face via LiteLLM
- **⚙️ Settings Management**: Configure API keys, models, temperature, and system messages
- **📝 Enhanced Logging**: Complete message and API call logging with detailed HTTP request/response data
- **🛡️ Error Handling**: Graceful fallbacks and comprehensive error management
- **🎭 Demo Mode**: Works without API keys for testing and demonstration purposes

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **SQLite** for data persistence
- **LiteLLM** for unified AI provider access (OpenAI, Anthropic, Google, Azure, Cohere, Hugging Face)
- **Multer** for file uploads
- **CORS** enabled for cross-origin requests

## 📋 Prerequisites

- Node.js (v16 or higher)
- OpenAI API key
- npm or yarn package manager

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chatgpt-clone
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the `server` directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=12003
   ```

4. **Build the React application**
   ```bash
   cd client
   npm run build
   ```

5. **Start the application**
   ```bash
   cd ../server
   npm start
   ```

## 🌐 Access the Application

The application will be accessible at `http://localhost:12003` when running locally, or at your deployment URL when deployed to a server.

## 📖 Usage Guide

### Creating a New Chat
1. Click the "New Chat" button in the sidebar
2. Start typing your message in the input field
3. Press Enter or click the send button

### File Uploads
1. Click the paperclip icon in the message input
2. Select a supported file type:
   - Text files (.txt, .md)
   - Documents (.pdf, .doc, .docx)
   - Images (.jpg, .jpeg, .png, .gif)
   - Data files (.csv, .json)
3. The file content will be included in your message to the AI

### Managing Chats
- **Rename**: Hover over a chat and click the edit icon
- **Delete**: Hover over a chat and click the trash icon
- **Switch**: Click on any chat in the sidebar to switch to it

### Settings Configuration
1. Click the "Settings" button in the sidebar
2. Configure your preferences:
   - **AI Provider**: Choose from OpenAI, Anthropic (Claude), Google (Gemini), Azure OpenAI, Cohere, or Hugging Face
   - **API Key**: Enter your provider's API key for full functionality
   - **Model**: Choose from provider-specific models (GPT-5, Claude 3, Gemini Pro, etc.)
   - **Temperature**: Adjust creativity (0 = focused, 2 = creative)
   - **Max Tokens**: Set response length limit (1-4000 for standard models, 1-128,000 for GPT-5)
   - **System Message**: Customize the AI's behavior and personality
3. Click "Save Settings" to apply changes

#### GPT-5 Specific Features
When GPT-5 is selected, the application provides enhanced parameter handling:
- **Updated Token Limits (October 2025)**:
  - **Input**: 272,000 tokens
  - **Output**: 128,000 tokens
  - **Total Context**: 400,000 tokens
- **Dynamic UI Limits**: Settings UI automatically adjusts max token input to 128,000 for GPT-5
- **Intelligent Parameter Mapping**: Temperature is mapped to reasoning effort levels
- **Automatic Fallback**: If GPT-5 specific parameters aren't available, falls back to standard parameters
- **Parameter Hints**: UI shows GPT-5-specific token limit specifications
- **max_completion_tokens**: Uses the correct parameter name for GPT-5 token limits

### Message Features
- **Timestamps**: Each message shows when it was sent
- **File Indicators**: Messages with files show the filename
- **Markdown Support**: AI responses support basic markdown formatting
- **Enhanced Logging**: All messages and API calls are automatically saved to daily log files with complete HTTP details

## 🎭 Demo Mode

The application includes a built-in demo mode that allows you to test the interface without requiring API keys:

- **Automatic Activation**: Demo mode activates when no API key is configured
- **Demo Responses**: The AI assistant provides informative demo responses explaining the multi-provider capabilities
- **Full UI Testing**: All interface features work normally (chat creation, file uploads, settings)
- **Easy Transition**: Simply add your API key in settings to switch to live AI responses

### Using Demo Mode
1. Leave the API key field empty in settings (default state)
2. Start chatting - you'll receive demo responses
3. Test all features: file uploads, chat management, settings
4. When ready, add your API key to enable real AI responses

## 📊 Enhanced Logging System

The application includes a comprehensive logging system that captures both conversations and detailed API interactions:

### Log Files
- **Message Logs**: `server/logs/messages-YYYY-MM-DD.json` - All user and assistant messages
- **API Call Logs**: `server/logs/api-calls-YYYY-MM-DD.json` - Complete HTTP request/response details

### What's Logged
- **Complete API Requests**: URL, headers, request body, parameters
- **Full API Responses**: Status codes, response headers, complete response body
- **Performance Metrics**: Request duration, token usage, model information
- **Error Details**: Comprehensive error information for failed calls
- **Security**: API keys and sensitive headers are automatically redacted

### GPT-5 Specific Logging
- **Parameter Fallback Tracking**: Logs both GPT-5 specific attempts and standard fallbacks
- **Reasoning Token Usage**: Detailed breakdown of reasoning vs completion tokens
- **Model Annotations**: Clear indication when fallback parameters are used

For detailed logging documentation, see [LOGGING.md](LOGGING.md).

## 🔌 API Endpoints

### Chat Management
- `GET /api/chats` - Get all chats
- `POST /api/chats` - Create new chat
- `PUT /api/chats/:id` - Update chat title
- `DELETE /api/chats/:id` - Delete chat

### Messages
- `GET /api/chats/:id/messages` - Get chat messages
- `POST /api/chats/:id/messages` - Send message (supports file upload)

### Settings
- `GET /api/settings` - Get current settings
- `PUT /api/settings` - Update settings

### Utility
- `GET /api/health` - Health check endpoint

## 📁 Project Structure

```
chatgpt-clone/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── types.ts        # TypeScript interfaces
│   │   ├── api.ts          # API client
│   │   └── App.tsx         # Main app component
│   └── build/              # Production build
├── server/                 # Node.js backend
│   ├── index.js            # Main server file
│   ├── uploads/            # File upload directory
│   ├── logs/               # Message log files (JSON)
│   └── chatgpt_clone.db    # SQLite database
└── README.md
```

## 🗄️ Database Schema

### Chats Table
- `id` (TEXT PRIMARY KEY)
- `title` (TEXT)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### Messages Table
- `id` (TEXT PRIMARY KEY)
- `chat_id` (TEXT, Foreign Key)
- `role` (TEXT: 'user' or 'assistant')
- `content` (TEXT)
- `file_path` (TEXT, optional)
- `file_name` (TEXT, optional)
- `created_at` (DATETIME)

### Settings Table
- `id` (INTEGER PRIMARY KEY)
- `key` (TEXT UNIQUE)
- `value` (TEXT)
- `updated_at` (DATETIME)

## 📝 Message Logging

All conversations are automatically logged to JSON files for record-keeping:

- **Location**: `server/logs/messages-YYYY-MM-DD.json`
- **Format**: Daily JSON files with structured message data
- **Content**: Includes timestamp, chat ID, role, content, and file information
- **Privacy**: Logs are stored locally on your server

### Log File Structure
```json
[
  {
    "timestamp": "2025-10-21T19:43:03.149Z",
    "chatId": "8c6c6851-e6aa-404c-858b-3a3b24b1c315",
    "role": "user",
    "content": "Hello, this is a test message!",
    "fileName": null
  },
  {
    "timestamp": "2025-10-21T19:43:23.510Z",
    "chatId": "8c6c6851-e6aa-404c-858b-3a3b24b1c315",
    "role": "assistant",
    "content": "Hello! How can I help you today?",
    "fileName": null
  }
]
```

## 🔒 Security Features

- CORS enabled for secure cross-origin requests
- File type validation for uploads
- File size limits (10MB max)
- SQL injection protection with parameterized queries
- Environment variable protection for API keys

## 🚀 Deployment

The application is configured to run in production mode with:
- Static file serving for the React build
- Environment-specific configurations
- Production-optimized builds
- Error handling and logging

### Current Deployment Status

✅ **Application Features**:
- **Status**: Fully functional with GPT-5 support and intelligent parameter handling
- **GPT-5 Integration**: ✅ Successfully integrated with October 2025 token limits (128K output, 400K total)
- **Features**: All features working including chat management, file uploads, settings, and enhanced API logging
- **Multi-Provider Support**: LiteLLM integration ready for OpenAI, Anthropic, Google, Azure, Cohere, and Hugging Face
- **Demo Mode**: Available when API key is empty

### Deployment Features
- ✅ React frontend built and optimized
- ✅ Node.js backend with Express server
- ✅ SQLite database with settings and chat management
- ✅ LiteLLM integration for multi-provider AI access
- ✅ File upload functionality
- ✅ Message logging system
- ✅ Demo mode for testing without API keys
- ✅ Comprehensive error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **OpenAI API Errors**
   - Verify your API key is correct
   - Check your OpenAI account has sufficient credits
   - Ensure the API key has proper permissions

2. **File Upload Issues**
   - Check file size (max 10MB)
   - Verify file type is supported
   - Ensure uploads directory has write permissions

3. **Database Issues**
   - SQLite database is created automatically
   - Check file permissions in the server directory

### Support

For issues and questions, please check the troubleshooting section above or create an issue in the repository.