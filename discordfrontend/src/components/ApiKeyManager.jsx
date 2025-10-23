import { useState, useEffect } from 'react';

const ApiKeyManager = () => {
  const [apiKey, setApiKey] = useState('');
  const [currentApiKey, setCurrentApiKey] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

  useEffect(() => {
    fetchApiKeyStatus();
  }, []);

  const fetchApiKeyStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/apikeys/status`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentApiKey(data.data?.apiKey || data.apiKey);
        setConnectionStatus(data.data?.status || data.status || 'disconnected');
      } else if (response.status === 401) {
        // User not authenticated - show demo state
        setCurrentApiKey(null);
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Failed to fetch API key status:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateApiKey = async (key) => {
    try {
      setValidating(true);
      const response = await fetch(`${API_BASE}/api/apikeys/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ apiKey: key }),
      });

      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    } finally {
      setValidating(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      setError('Invalid API key format. OpenAI API keys start with "sk-"');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // First validate the key
      const isValid = await validateApiKey(apiKey);
      
      if (!isValid) {
        setError('Invalid API key. Please check your key and try again.');
        setLoading(false);
        return;
      }

      // Save the key
      const response = await fetch(`${API_BASE}/api/apikeys/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ apiKey: apiKey }),
      });

      if (response.ok) {
        setSuccess('API key saved successfully!');
        setApiKey('');
        fetchApiKeyStatus();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to save API key');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveApiKey = async () => {
    if (!confirm('Are you sure you want to remove your API key? This will disable bot functionality.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/apikeys/remove`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setSuccess('API key removed successfully');
        setCurrentApiKey(null);
        setConnectionStatus('disconnected');
      } else {
        setError('Failed to remove API key');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!currentApiKey) {
      setError('No API key configured');
      return;
    }

    setValidating(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/api/apikeys/test`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Connection test successful!');
        setConnectionStatus('connected');
      } else {
        setError(data.message || 'Connection test failed');
        setConnectionStatus('error');
      }
    } catch (error) {
      setError('Network error during connection test');
      setConnectionStatus('error');
    } finally {
      setValidating(false);
    }
  };

  const maskApiKey = (key) => {
    if (!key) return '';
    return key.substring(0, 7) + '...' + key.substring(key.length - 4);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'validating': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return '✅';
      case 'error': return '❌';
      case 'validating': return '⏳';
      default: return '⚪';
    }
  };

  return (
    <div className="text-white">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4">API Key Management</h2>
        <p className="text-white/80 text-lg">
          Securely manage your OpenAI API key to enable bot functionality
        </p>
      </div>

      {/* Current Status */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Connection Status</h3>
          <div className={`flex items-center gap-2 ${getStatusColor(connectionStatus)}`}>
            <span className="text-lg">{getStatusIcon(connectionStatus)}</span>
            <span className="font-medium capitalize">
              {validating ? 'Validating...' : connectionStatus}
            </span>
          </div>
        </div>

        {currentApiKey ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
              <div>
                <p className="text-sm text-white/70 mb-1">Current API Key</p>
                <p className="font-mono text-lg">
                  {showKey ? currentApiKey : maskApiKey(currentApiKey)}
                </p>
              </div>
              <button
                onClick={() => setShowKey(!showKey)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
              >
                {showKey ? '👁️‍🗨️ Hide' : '👁️ Show'}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleTestConnection}
                disabled={validating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                {validating ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                onClick={handleRemoveApiKey}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                Remove Key
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🔑</div>
            <p className="text-white/70 mb-4">No API key configured</p>
            <p className="text-sm text-white/60">
              Add your OpenAI API key below to enable bot functionality
            </p>
          </div>
        )}
      </div>

      {/* Add/Update API Key */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
        <h3 className="text-xl font-semibold mb-4">
          {currentApiKey ? 'Update API Key' : 'Add API Key'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              OpenAI API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80"
              >
                {showKey ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
            <p className="text-xs text-white/60 mt-2">
              Your API key is encrypted and stored securely. We never log or share your key.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
              <p className="text-green-300 text-sm">{success}</p>
            </div>
          )}

          <button
            onClick={handleSaveApiKey}
            disabled={loading || validating || !apiKey.trim()}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {loading ? 'Saving...' : validating ? 'Validating...' : 'Save API Key'}
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4">How to get your OpenAI API Key</h3>
        <div className="space-y-3 text-white/80">
          <div className="flex items-start gap-3">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
            <p>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">OpenAI API Keys page</a></p>
          </div>
          <div className="flex items-start gap-3">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
            <p>Click "Create new secret key" and give it a name</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
            <p>Copy the generated key (starts with "sk-") and paste it above</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</span>
            <p>Make sure you have billing set up in your OpenAI account</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-yellow-400 text-lg">⚠️</span>
            <div>
              <p className="text-yellow-300 font-medium mb-1">Security Notice</p>
              <p className="text-yellow-200/80 text-sm">
                Never share your API key with anyone. Keep it secure and rotate it regularly.
                If you suspect your key has been compromised, revoke it immediately from your OpenAI dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManager;