import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, X } from 'lucide-react';
import { chatApi } from '../api';
import { Settings as SettingsType } from '../types';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsComponent: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<SettingsType>({
    openai_api_key: '',
    provider: 'openai',
    model: 'gpt-4',
    temperature: '0.7',
    max_tokens: '2000',
    system_message: 'You are a helpful assistant.',
    ace_enabled: 'false',
    ace_model: 'gpt-4o-mini'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await chatApi.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setMessage('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await chatApi.updateSettings(settings);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: keyof SettingsType, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading settings...</p>
            </div>
          ) : (
            <>
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Provider
                </label>
                <select
                  value={settings.provider}
                  onChange={(e) => handleInputChange('provider', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="google">Google (Gemini)</option>
                  <option value="azure">Azure OpenAI</option>
                  <option value="cohere">Cohere</option>
                  <option value="huggingface">Hugging Face</option>
                </select>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={settings.openai_api_key}
                  onChange={(e) => handleInputChange('openai_api_key', e.target.value)}
                  placeholder="Enter your API key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to use server environment variable
                </p>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <select
                  value={settings.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {settings.provider === 'openai' && (
                    <>
                      <option value="gpt-5">GPT-5</option>
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="gpt-4o-mini">GPT-4o Mini</option>
                    </>
                  )}
                  {settings.provider === 'anthropic' && (
                    <>
                      <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                      <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                      <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                      <option value="claude-2.1">Claude 2.1</option>
                    </>
                  )}
                  {settings.provider === 'google' && (
                    <>
                      <option value="gemini-pro">Gemini Pro</option>
                      <option value="gemini-pro-vision">Gemini Pro Vision</option>
                    </>
                  )}
                  {settings.provider === 'azure' && (
                    <>
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-35-turbo">GPT-3.5 Turbo</option>
                    </>
                  )}
                  {settings.provider === 'cohere' && (
                    <>
                      <option value="command-r-plus">Command R+</option>
                      <option value="command-r">Command R</option>
                    </>
                  )}
                  {settings.provider === 'huggingface' && (
                    <>
                      <option value="mistralai/Mistral-7B-Instruct-v0.1">Mistral 7B</option>
                      <option value="meta-llama/Llama-2-7b-chat-hf">Llama 2 7B</option>
                    </>
                  )}
                </select>
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature: {settings.temperature}
                  {settings.model?.startsWith('gpt-5') && (
                    <span className="text-xs text-blue-600 ml-2">(mapped to reasoning effort)</span>
                  )}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => handleInputChange('temperature', e.target.value)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>More focused (0)</span>
                  <span>More creative (2)</span>
                </div>
                {settings.model?.startsWith('gpt-5') && (
                  <p className="text-xs text-blue-600 mt-1">
                    GPT-5: Temperature is mapped to reasoning effort (0-0.3: minimal, 0.3-0.5: low, 0.5-1.0: medium, 1.0+: high)
                  </p>
                )}
              </div>

              {/* Max Tokens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens
                  {settings.model?.startsWith('gpt-5') && (
                    <span className="text-xs text-blue-600 ml-2">(uses max_output_tokens)</span>
                  )}
                </label>
                <input
                  type="number"
                  min="1"
                  max={settings.model?.startsWith('gpt-5') ? "128000" : "4000"}
                  value={settings.max_tokens}
                  onChange={(e) => handleInputChange('max_tokens', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {settings.model?.startsWith('gpt-5') ? (
                    <>
                      Maximum output tokens (1-128,000). GPT-5 supports up to 128K output tokens with 400K total context length.
                      <br />
                      <span className="text-blue-600 font-medium">
                        Input limit: 272,000 tokens | Output limit: 128,000 tokens | Total context: 400,000 tokens
                      </span>
                    </>
                  ) : (
                    "Maximum number of tokens in the response (1-4000)"
                  )}
                </p>
                {settings.model?.startsWith('gpt-5') && (
                  <p className="text-xs text-blue-600 mt-1">
                    GPT-5: Uses max_output_tokens parameter instead of max_tokens
                  </p>
                )}
              </div>

              {/* GPT-5 Info */}
              {settings.model?.startsWith('gpt-5') && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">GPT-5 Parameter Notes</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Temperature is mapped to reasoning effort levels</li>
                    <li>• Max tokens uses max_output_tokens parameter</li>
                    <li>• Text verbosity is set to "medium" automatically</li>
                    <li>• Some standard parameters (top_p, logprobs) are not supported</li>
                  </ul>
                </div>
              )}

              {/* System Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Message
                </label>
                <textarea
                  value={settings.system_message}
                  onChange={(e) => handleInputChange('system_message', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="You are a helpful assistant."
                />
                <p className="text-xs text-gray-500 mt-1">
                  This message sets the behavior and personality of the AI assistant
                </p>
              </div>

              {/* ACE Settings */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  🧠 Agentic Context Engine (ACE)
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  ACE enables your AI to learn from conversations and improve over time. It analyzes what works and what doesn't, building a knowledge base of strategies.
                </p>
                
                {/* ACE Enable/Disable */}
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.ace_enabled === 'true'}
                      onChange={(e) => handleInputChange('ace_enabled', e.target.checked ? 'true' : 'false')}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Enable Agentic Context Engine
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    When enabled, the AI will learn from each conversation to improve future responses
                  </p>
                </div>

                {/* ACE Model Selection */}
                {settings.ace_enabled === 'true' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ACE Model
                    </label>
                    <select
                      value={settings.ace_model}
                      onChange={(e) => handleInputChange('ace_model', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="gpt-4o-mini">GPT-4o Mini (Recommended)</option>
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Model used for ACE's reflection and learning processes. GPT-4o Mini offers the best balance of performance and cost.
                    </p>
                  </div>
                )}

                {/* ACE Info */}
                {settings.ace_enabled === 'true' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">How ACE Works</h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• <strong>Generator:</strong> Creates responses using learned strategies</li>
                      <li>• <strong>Reflector:</strong> Analyzes what worked well and what didn't</li>
                      <li>• <strong>Curator:</strong> Updates the knowledge base with new insights</li>
                      <li>• <strong>Playbook:</strong> Stores learned strategies for future use</li>
                    </ul>
                    <p className="text-xs text-blue-600 mt-2 font-medium">
                      Each chat maintains its own learning context and improves independently.
                    </p>
                  </div>
                )}
              </div>

              {/* Message */}
              {message && (
                <div className={`p-3 rounded-md ${
                  message.includes('success') 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {message}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsComponent;