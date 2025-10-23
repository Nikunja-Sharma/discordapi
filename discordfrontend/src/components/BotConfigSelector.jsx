import { useState, useEffect } from 'react';

const BotConfigSelector = () => {
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

  const botConfigs = {
    assistant: {
      name: 'General Assistant',
      description: 'A helpful AI assistant for general questions and tasks',
      features: [
        'Answers general questions',
        'Helps with basic tasks',
        'Friendly conversational tone',
        'Multi-language support'
      ],
      personality: 'Helpful and friendly',
      responseStyle: 'Conversational',
      specialties: ['General knowledge', 'Task assistance', 'Casual chat'],
      icon: '🤖',
      tier: 'basic'
    },
    moderator: {
      name: 'Server Moderator',
      description: 'Advanced moderation with automated rule enforcement',
      features: [
        'Automated content filtering',
        'User behavior analysis',
        'Warning and timeout system',
        'Detailed moderation logs',
        'Custom rule configuration'
      ],
      personality: 'Professional and fair',
      responseStyle: 'Authoritative but respectful',
      specialties: ['Content moderation', 'User management', 'Rule enforcement'],
      icon: '🛡️',
      tier: 'pro'
    },
    gaming: {
      name: 'Gaming Companion',
      description: 'Specialized bot for gaming communities and game assistance',
      features: [
        'Game statistics lookup',
        'Tournament organization',
        'Team formation assistance',
        'Gaming news updates',
        'Strategy tips and guides'
      ],
      personality: 'Enthusiastic and competitive',
      responseStyle: 'Energetic and engaging',
      specialties: ['Game stats', 'Tournament management', 'Gaming community'],
      icon: '🎮',
      tier: 'pro'
    }
  };

  useEffect(() => {
    fetchCurrentConfig();
  }, []);

  const fetchCurrentConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/bots/current`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentConfig(data.data?.selectedBotId || data.configType);
      } else if (response.status === 401) {
        // User not authenticated - show demo state
        setCurrentConfig(null);
      }
    } catch (error) {
      console.error('Failed to fetch current config:', error);
    } finally {
      setLoading(false);
    }
  };  const
 handleConfigSelect = async (configKey) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/api/bots/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ botId: configKey }),
      });

      if (response.ok) {
        setSuccess('Bot configuration updated successfully!');
        setCurrentConfig(configKey);
        setSelectedConfig(null);
        setPreviewMode(false);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update bot configuration');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (configKey) => {
    setSelectedConfig(configKey);
    setPreviewMode(true);
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'basic': return 'text-green-400 bg-green-400/20';
      case 'pro': return 'text-blue-400 bg-blue-400/20';
      case 'enterprise': return 'text-purple-400 bg-purple-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const renderConfigCard = (configKey, config) => {
    const isCurrentConfig = currentConfig === configKey;
    const isSelected = selectedConfig === configKey;

    return (
      <div
        key={configKey}
        className={`bg-white/10 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-200 hover:scale-105 cursor-pointer ${
          isCurrentConfig 
            ? 'border-green-400 ring-2 ring-green-400/50' 
            : isSelected
            ? 'border-blue-400 ring-2 ring-blue-400/50'
            : 'border-white/20 hover:border-white/40'
        }`}
        onClick={() => !isCurrentConfig && handlePreview(configKey)}
      >
        {isCurrentConfig && (
          <div className="absolute -top-3 right-4">
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Active
            </span>
          </div>
        )}

        <div className="text-center mb-6">
          <div className="text-6xl mb-4">{config.icon}</div>
          <h3 className="text-2xl font-bold text-white mb-2">{config.name}</h3>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getTierColor(config.tier)}`}>
            {config.tier.toUpperCase()}
          </div>
        </div>

        <p className="text-white/80 text-center mb-6">{config.description}</p>

        <div className="space-y-4 mb-6">
          <div>
            <h4 className="text-white font-medium mb-2">Key Features:</h4>
            <ul className="space-y-2">
              {config.features.slice(0, 3).map((feature, index) => (
                <li key={index} className="flex items-center text-white/80 text-sm">
                  <svg className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
              {config.features.length > 3 && (
                <li className="text-white/60 text-sm ml-6">
                  +{config.features.length - 3} more features
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="flex gap-2">
          {!isCurrentConfig && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreview(configKey);
                }}
                className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg border border-white/20 transition-colors"
              >
                Preview
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfigSelect(configKey);
                }}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Selecting...' : 'Select'}
              </button>
            </>
          )}
          {isCurrentConfig && (
            <button
              disabled
              className="w-full py-2 px-4 bg-gray-500 text-white font-medium rounded-lg cursor-not-allowed"
            >
              Currently Active
            </button>
          )}
        </div>
      </div>
    );
  }; 
 return (
    <div className="text-white">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4">Bot Configuration</h2>
        <p className="text-white/80 text-lg">
          Choose the perfect bot personality and features for your Discord server
        </p>
      </div>

      {/* Current Configuration Status */}
      {currentConfig && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{botConfigs[currentConfig]?.icon}</div>
            <div>
              <h3 className="text-xl font-semibold">Current Configuration</h3>
              <p className="text-white/80">{botConfigs[currentConfig]?.name}</p>
              <div className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getTierColor(botConfigs[currentConfig]?.tier)}`}>
                {botConfigs[currentConfig]?.tier.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
          <p className="text-green-300">{success}</p>
        </div>
      )}

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Object.entries(botConfigs).map(([configKey, config]) => renderConfigCard(configKey, config))}
      </div>

      {/* Preview Modal */}
      {previewMode && selectedConfig && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="text-5xl">{botConfigs[selectedConfig].icon}</div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{botConfigs[selectedConfig].name}</h3>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getTierColor(botConfigs[selectedConfig].tier)}`}>
                    {botConfigs[selectedConfig].tier.toUpperCase()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreviewMode(false)}
                className="text-white/60 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Description</h4>
                <p className="text-white/80">{botConfigs[selectedConfig].description}</p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">All Features</h4>
                <ul className="space-y-2">
                  {botConfigs[selectedConfig].features.map((feature, index) => (
                    <li key={index} className="flex items-center text-white/80">
                      <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Personality</h4>
                  <p className="text-white/80">{botConfigs[selectedConfig].personality}</p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Response Style</h4>
                  <p className="text-white/80">{botConfigs[selectedConfig].responseStyle}</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Specialties</h4>
                <div className="flex flex-wrap gap-2">
                  {botConfigs[selectedConfig].specialties.map((specialty, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setPreviewMode(false)}
                className="flex-1 py-3 px-6 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg border border-white/20 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleConfigSelect(selectedConfig)}
                disabled={loading || currentConfig === selectedConfig}
                className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Selecting...' : currentConfig === selectedConfig ? 'Currently Active' : 'Select This Config'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Comparison */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-2xl font-semibold mb-6 text-center">Configuration Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/20">
                <th className="pb-4 text-white/80">Feature</th>
                <th className="pb-4 text-center">Assistant</th>
                <th className="pb-4 text-center">Moderator</th>
                <th className="pb-4 text-center">Gaming</th>
              </tr>
            </thead>
            <tbody className="space-y-4">
              <tr className="border-b border-white/10">
                <td className="py-3 text-white/90">Content Filtering</td>
                <td className="py-3 text-center">Basic</td>
                <td className="py-3 text-center">Advanced</td>
                <td className="py-3 text-center">Gaming-focused</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 text-white/90">User Management</td>
                <td className="py-3 text-center">❌</td>
                <td className="py-3 text-center">✅</td>
                <td className="py-3 text-center">Team-based</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 text-white/90">Specialized Knowledge</td>
                <td className="py-3 text-center">General</td>
                <td className="py-3 text-center">Moderation</td>
                <td className="py-3 text-center">Gaming</td>
              </tr>
              <tr>
                <td className="py-3 text-white/90">Tier Required</td>
                <td className="py-3 text-center">Basic+</td>
                <td className="py-3 text-center">Pro+</td>
                <td className="py-3 text-center">Pro+</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BotConfigSelector;