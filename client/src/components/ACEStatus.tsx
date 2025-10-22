import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, BookOpen, Trash2, Eye, EyeOff } from 'lucide-react';
import { chatApi } from '../api';
import { ACEStats, ACEStrategy } from '../types';

interface ACEStatusProps {
  chatId: string | null;
  aceEnabled: boolean;
  aceStats?: {
    reflection: string | null;
    learned_strategies: number;
    playbook_size: number;
    context_comparison?: {
      ace_context_length: number;
      regular_context_length: number;
      reduction_percentage: number;
      tokens_saved: number;
    };
  };
}

const ACEStatus: React.FC<ACEStatusProps> = ({ chatId, aceEnabled, aceStats }) => {
  const [expanded, setExpanded] = useState(false);
  const [playbookStats, setPlaybookStats] = useState<ACEStats | null>(null);
  const [strategies, setStrategies] = useState<ACEStrategy[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (aceEnabled && chatId && expanded) {
      loadACEData();
    }
  }, [aceEnabled, chatId, expanded]);

  const loadACEData = async () => {
    if (!chatId) return;
    
    setLoading(true);
    try {
      const [statsResponse, strategiesResponse] = await Promise.all([
        chatApi.getACEStats(chatId),
        chatApi.getACEStrategies(chatId, 5)
      ]);
      
      setPlaybookStats(statsResponse);
      setStrategies(strategiesResponse.strategies || []);
    } catch (error) {
      console.error('Failed to load ACE data:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearPlaybook = async () => {
    if (!chatId) return;
    
    if (!window.confirm('Are you sure you want to clear all learned strategies for this chat? This action cannot be undone.')) {
      return;
    }

    try {
      await chatApi.clearACEPlaybook(chatId);
      setPlaybookStats(null);
      setStrategies([]);
      alert('ACE playbook cleared successfully!');
    } catch (error) {
      console.error('Failed to clear ACE playbook:', error);
      alert('Failed to clear ACE playbook');
    }
  };

  if (!aceEnabled) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            ACE Active
          </span>
          {aceStats && (
            <div className="flex items-center gap-3 text-xs text-blue-600">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {aceStats.playbook_size} strategies
              </span>
              {aceStats.learned_strategies > 0 && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +{aceStats.learned_strategies} learned
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-blue-600 hover:text-blue-800 p-1"
            title={expanded ? "Hide details" : "Show details"}
          >
            {expanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {aceStats?.reflection && (
        <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-700">
          <strong>Latest Reflection:</strong> {aceStats.reflection}
        </div>
      )}

      {aceStats?.context_comparison && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
          <div className="flex items-center justify-between">
            <span className="text-green-700 font-medium">Context Efficiency:</span>
            <div className="flex items-center gap-3 text-green-600">
              <span className="font-bold">
                -{aceStats.context_comparison.reduction_percentage}%
              </span>
              <span className="text-xs">
                ({aceStats.context_comparison.tokens_saved} tokens saved)
              </span>
            </div>
          </div>
          <div className="mt-1 text-xs text-green-600">
            ACE: {aceStats.context_comparison.ace_context_length} tokens vs Regular: {aceStats.context_comparison.regular_context_length} tokens
          </div>
        </div>
      )}

      {expanded && (
        <div className="mt-3 border-t border-blue-200 pt-3">
          {loading ? (
            <div className="text-center py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <>
              {playbookStats?.stats && (
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {playbookStats.stats.helpful_strategies}
                    </div>
                    <div className="text-xs text-gray-600">Helpful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">
                      {playbookStats.stats.harmful_strategies}
                    </div>
                    <div className="text-xs text-gray-600">To Avoid</div>
                  </div>
                </div>
              )}

              {strategies.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Recent Strategies:</h4>
                  <div className="space-y-1">
                    {strategies.map((strategy, index) => (
                      <div
                        key={index}
                        className={`text-xs p-2 rounded ${
                          strategy.type === 'helpful'
                            ? 'bg-green-100 text-green-800'
                            : strategy.type === 'harmful'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {strategy.content}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={clearPlaybook}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear Playbook
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ACEStatus;