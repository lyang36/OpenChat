const OpenAI = require('openai');

/**
 * Simple token counting approximation
 * More accurate would be to use tiktoken, but this gives a good estimate
 */
function estimateTokenCount(text) {
  if (!text) return 0;
  // Rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

/**
 * Calculate token count for messages array
 */
function calculateMessagesTokenCount(messages) {
  return messages.reduce((total, msg) => {
    return total + estimateTokenCount(msg.content) + 4; // +4 for role and formatting
  }, 0);
}

/**
 * Simple strategy representation
 */
class Strategy {
  constructor(content, type = 'neutral', score = 0.5) {
    this.content = content;
    this.type = type; // 'helpful', 'harmful', 'neutral'
    this.score = score;
    this.created_at = new Date().toISOString();
  }
}

/**
 * Simple playbook implementation
 */
class Playbook {
  constructor() {
    this.strategies = [];
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  addStrategy(strategy) {
    this.strategies.push(strategy);
    this.updated_at = new Date().toISOString();
  }

  getStrategies() {
    return this.strategies;
  }

  getStats() {
    const helpful = this.strategies.filter(s => s.type === 'helpful').length;
    const harmful = this.strategies.filter(s => s.type === 'harmful').length;
    const neutral = this.strategies.filter(s => s.type === 'neutral').length;

    return {
      total_strategies: this.strategies.length,
      helpful_strategies: helpful,
      harmful_strategies: harmful,
      neutral_strategies: neutral,
      last_updated: this.updated_at
    };
  }

  toData() {
    return {
      strategies: this.strategies,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  static fromData(data) {
    const playbook = new Playbook();
    playbook.strategies = data.strategies || [];
    playbook.created_at = data.created_at || new Date().toISOString();
    playbook.updated_at = data.updated_at || new Date().toISOString();
    return playbook;
  }
}

/**
 * ACE Manager - Simplified implementation of Agentic Context Engine
 */
class ACEManager {
  constructor(apiKey, model = 'gpt-4o-mini', logApiCall = null) {
    this.apiKey = apiKey;
    this.model = model;
    this.llmClient = null;
    this.playbooks = new Map(); // chatId -> Playbook
    this.initialized = false;
    this.logApiCall = logApiCall; // Function to log API calls
  }

  /**
   * Initialize the ACE Manager
   */
  initialize() {
    try {
      this.llmClient = new OpenAI({ apiKey: this.apiKey });
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize ACE Manager:', error);
      return false;
    }
  }

  /**
   * Generate response using ACE
   * @param {string} chatId - Chat identifier
   * @param {string} userMessage - User's message
   * @param {Array} conversationHistory - Previous messages
   * @returns {Object} Generation result
   */
  /**
   * Main ACE context enhancement method
   */
  async enhanceContextWithACE(chatId, userMessage, conversationHistory = []) {
    if (!this.initialized) {
      return { success: false, error: 'ACE Manager not initialized' };
    }

    try {
      // Get or create playbook for this chat
      let playbook = this.playbooks.get(chatId);
      if (!playbook) {
        playbook = new Playbook();
        this.playbooks.set(chatId, playbook);
      }

      // Generate enhanced context using learned strategies
      const contextEnhancement = this.generateEnhancedContext(userMessage, conversationHistory, playbook);

      return {
        success: true,
        enhancedSystemMessage: contextEnhancement.enhancedSystemMessage,
        contextComparison: contextEnhancement.contextComparison,
        strategiesUsed: contextEnhancement.strategiesUsed,
        playbook: playbook // Return playbook for later reflection
      };
    } catch (error) {
      console.error('ACE context enhancement error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reflect on response and learn from it (called after main model generates response)
   */
  async reflectAndLearn(chatId, userMessage, response, conversationHistory = []) {
    if (!this.initialized) {
      return { success: false, error: 'ACE Manager not initialized' };
    }

    try {
      // Get playbook for this chat
      let playbook = this.playbooks.get(chatId);
      if (!playbook) {
        playbook = new Playbook();
        this.playbooks.set(chatId, playbook);
      }

      // Step 1: Reflect on the response quality
      const reflection = await this.reflectOnResponse(userMessage, response, conversationHistory, chatId);
      
      // Step 2: Learn new strategies based on reflection
      const learnedStrategies = await this.learnStrategies(userMessage, response, reflection, playbook);

      return {
        success: true,
        reflection: reflection.summary,
        learned_strategies: learnedStrategies,
        playbook_size: playbook.getStrategies().length
      };
    } catch (error) {
      console.error('ACE reflection error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate context length comparison between ACE and regular approach
   */
  calculateContextComparison(userMessage, conversationHistory, playbook) {
    const strategies = playbook.getStrategies();
    const helpfulStrategies = strategies.filter(s => s.type === 'helpful').slice(0, 5);
    
    // Calculate regular context (full conversation history)
    const systemMessage = "You are a helpful assistant.";
    const regularMessages = [
      { role: "system", content: systemMessage },
      ...conversationHistory.map(msg => ({ role: msg.role, content: msg.content })),
      { role: "user", content: userMessage }
    ];
    const regularContextLength = calculateMessagesTokenCount(regularMessages);

    // Calculate ACE context (system + strategies + recent context)
    let aceSystemMessage = systemMessage;
    if (helpfulStrategies.length > 0) {
      const strategiesText = helpfulStrategies.map(s => s.content).join('\n- ');
      aceSystemMessage += `\n\nBased on previous successful interactions, consider these strategies:\n- ${strategiesText}`;
    }

    // For ACE, we can use a shorter conversation history since strategies capture learned patterns
    const recentHistory = conversationHistory.slice(-6); // Last 6 messages instead of full history
    const aceMessages = [
      { role: "system", content: aceSystemMessage },
      ...recentHistory.map(msg => ({ role: msg.role, content: msg.content })),
      { role: "user", content: userMessage }
    ];
    const aceContextLength = calculateMessagesTokenCount(aceMessages);

    // Calculate savings
    const tokensSaved = Math.max(0, regularContextLength - aceContextLength);
    const reductionPercentage = regularContextLength > 0 
      ? Math.round((tokensSaved / regularContextLength) * 100) 
      : 0;

    return {
      ace_context_length: aceContextLength,
      regular_context_length: regularContextLength,
      reduction_percentage: reductionPercentage,
      tokens_saved: tokensSaved
    };
  }

  /**
   * Generate enhanced context/system message using learned strategies
   */
  generateEnhancedContext(userMessage, conversationHistory, playbook) {
    const strategies = playbook.getStrategies();
    const helpfulStrategies = strategies.filter(s => s.type === 'helpful').slice(0, 5);
    
    let baseSystemMessage = "You are a helpful assistant.";
    
    if (helpfulStrategies.length > 0) {
      const strategiesText = helpfulStrategies.map(s => s.content).join('\n- ');
      baseSystemMessage += `\n\nBased on previous successful interactions, consider these strategies:\n- ${strategiesText}`;
    }

    // Calculate context comparison for efficiency metrics
    const contextComparison = this.calculateContextComparison(userMessage, conversationHistory, playbook);

    return {
      enhancedSystemMessage: baseSystemMessage,
      contextComparison: contextComparison,
      strategiesUsed: helpfulStrategies.length
    };
  }

  /**
   * Reflect on response quality
   */
  async reflectOnResponse(userMessage, response, conversationHistory, chatId = null) {
    const reflectionPrompt = `
Analyze this conversation exchange:

User: ${userMessage}
Assistant: ${response}

Evaluate the assistant's response on:
1. Helpfulness (0-10)
2. Clarity (0-10) 
3. Relevance (0-10)
4. Completeness (0-10)

Provide a brief analysis of what worked well and what could be improved.
Format your response as JSON with fields: helpfulness, clarity, relevance, completeness, summary.
`;

    const requestData = {
      url: 'https://api.openai.com/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: {
        model: this.model,
        messages: [{ role: "user", content: reflectionPrompt }],
        max_tokens: 500,
        temperature: 0.3
      }
    };

    const startTime = Date.now();

    try {
      const completion = await this.llmClient.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: reflectionPrompt }],
        max_tokens: 500,
        temperature: 0.3
      });

      const duration = Date.now() - startTime;
      requestData.duration_ms = duration;

      // Log successful API call
      if (this.logApiCall && chatId) {
        this.logApiCall(chatId, requestData, {
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
        }, 'openai', `${this.model} (ACE-Reflection)`);
      }

      const reflectionText = completion.choices[0].message.content;
      
      // Try to parse as JSON, fallback to text analysis
      try {
        return JSON.parse(reflectionText);
      } catch {
        return {
          helpfulness: 7,
          clarity: 7,
          relevance: 7,
          completeness: 7,
          summary: reflectionText
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      requestData.duration_ms = duration;

      // Log failed API call
      if (this.logApiCall && chatId) {
        this.logApiCall(chatId, requestData, null, 'openai', `${this.model} (ACE-Reflection)`, error);
      }

      console.error('Reflection error:', error);
      return {
        helpfulness: 5,
        clarity: 5,
        relevance: 5,
        completeness: 5,
        summary: "Unable to analyze response quality"
      };
    }
  }

  /**
   * Learn new strategies from the interaction
   */
  async learnStrategies(userMessage, response, reflection, playbook) {
    const avgScore = (reflection.helpfulness + reflection.clarity + reflection.relevance + reflection.completeness) / 4;
    
    console.log(`🧠 ACE Learning: avgScore=${avgScore}, helpfulness=${reflection.helpfulness}, clarity=${reflection.clarity}, relevance=${reflection.relevance}, completeness=${reflection.completeness}`);
    
    let learnedCount = 0;

    // If response was good (score >= 7), extract helpful strategies
    if (avgScore >= 7) {
      console.log(`✅ Score >= 7, learning strategies...`);
      const strategyPrompt = `
Based on this successful interaction:

User: ${userMessage}
Assistant: ${response}
Quality Score: ${avgScore}/10

Extract 1-2 specific strategies that made this response effective. 
Each strategy should be a concise, actionable principle.
Format as a simple list, one strategy per line.
`;

      try {
        const completion = await this.llmClient.chat.completions.create({
          model: this.model,
          messages: [{ role: "user", content: strategyPrompt }],
          max_tokens: 200,
          temperature: 0.3
        });

        const strategiesText = completion.choices[0].message.content;
        const strategies = strategiesText.split('\n')
          .filter(line => line.trim().length > 10)
          .slice(0, 2);

        for (const strategyText of strategies) {
          const strategy = new Strategy(strategyText.trim(), 'helpful', avgScore / 10);
          playbook.addStrategy(strategy);
          learnedCount++;
        }
      } catch (error) {
        console.error('Strategy learning error:', error);
      }
    } else {
      console.log(`❌ Score < 7 (${avgScore}), not learning strategies`);
    }

    // If response was poor (score < 4), learn what to avoid
    if (avgScore < 4) {
      console.log(`⚠️ Score < 4, learning what to avoid...`);
      const avoidPrompt = `
Based on this problematic interaction:

User: ${userMessage}
Assistant: ${response}
Quality Score: ${avgScore}/10
Issues: ${reflection.summary}

Identify 1 specific thing to avoid in future responses.
Be concise and actionable.
`;

      try {
        const completion = await this.llmClient.chat.completions.create({
          model: this.model,
          messages: [{ role: "user", content: avoidPrompt }],
          max_tokens: 100,
          temperature: 0.3
        });

        const avoidText = completion.choices[0].message.content.trim();
        if (avoidText.length > 10) {
          const strategy = new Strategy(avoidText, 'harmful', avgScore / 10);
          playbook.addStrategy(strategy);
          learnedCount++;
        }
      } catch (error) {
        console.error('Avoidance learning error:', error);
      }
    }

    return learnedCount;
  }

  /**
   * Load playbook from data
   * @param {string} chatId - Chat identifier
   * @param {Object} playbookData - Serialized playbook data
   */
  loadPlaybook(chatId, playbookData) {
    try {
      const playbook = Playbook.fromData(playbookData);
      this.playbooks.set(chatId, playbook);
      return true;
    } catch (error) {
      console.error('Failed to load playbook:', error);
      return false;
    }
  }

  /**
   * Save playbook to data
   * @param {string} chatId - Chat identifier
   * @returns {Object} Serialized playbook data
   */
  savePlaybook(chatId) {
    const playbook = this.playbooks.get(chatId);
    if (playbook) {
      return playbook.toData();
    }
    return null;
  }

  /**
   * Get playbook statistics
   * @param {string} chatId - Chat identifier
   * @returns {Object} Statistics
   */
  getPlaybookStats(chatId) {
    const playbook = this.playbooks.get(chatId);
    if (!playbook) {
      return {
        total_strategies: 0,
        helpful_strategies: 0,
        harmful_strategies: 0,
        neutral_strategies: 0,
        last_updated: null
      };
    }

    return playbook.getStats();
  }

  /**
   * Get learned strategies
   * @param {string} chatId - Chat identifier
   * @param {number} limit - Maximum number of strategies to return
   * @returns {Array} List of strategies
   */
  getLearnedStrategies(chatId, limit = 10) {
    const playbook = this.playbooks.get(chatId);
    if (!playbook) {
      return [];
    }

    return playbook.getStrategies().slice(0, limit);
  }

  /**
   * Clear playbook for a chat
   * @param {string} chatId - Chat identifier
   */
  clearPlaybook(chatId) {
    this.playbooks.delete(chatId);
  }
}

module.exports = { ACEManager };