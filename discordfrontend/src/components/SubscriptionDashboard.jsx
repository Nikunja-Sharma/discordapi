import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import PlanSelector from './PlanSelector';
import ApiKeyManager from './ApiKeyManager';
import BotConfigSelector from './BotConfigSelector';
import UsageTracker from './UsageTracker';

const SubscriptionDashboard = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/subscriptions/status`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data.data || data);
      } else if (response.status === 401) {
        // User not authenticated - this is expected for demo
        setSubscriptionData(null);
      } else {
        throw new Error('Failed to fetch subscription data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'plans':
        return <PlanSelector onPlanUpdate={fetchSubscriptionData} />;
      case 'apikey':
        return <ApiKeyManager />;
      case 'botconfig':
        return <BotConfigSelector />;
      case 'usage':
        return <UsageTracker />;
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <div className="text-white">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold mb-2">Dashboard Overview</h2>
        <p className="text-white/80 text-lg">Manage your subscription, API keys, and bot configuration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-medium">Subscription Status</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium uppercase tracking-wide ${subscriptionData?.subscription?.status === 'active'
              ? 'bg-green-500 text-white'
              : 'bg-white/20 text-white/90'
              }`}>
              {subscriptionData?.subscription?.status || 'No Active Subscription'}
            </span>
          </div>
          <div>
            {subscriptionData?.subscription ? (
              <>
                <p className="text-white/80 mb-2"><strong>Plan:</strong> {subscriptionData.subscription.planType}</p>
                <p className="text-white/80 mb-2"><strong>Next Billing:</strong> {new Date(subscriptionData.subscription.endDate).toLocaleDateString()}</p>
                <p className="text-white/80 mb-2"><strong>Price:</strong> ${subscriptionData.subscription.pricePerMonth}/month</p>
                <p className="text-white/80"><strong>Days Remaining:</strong> {subscriptionData.subscription.daysRemaining} days</p>
              </>
            ) : (
              <p className="text-white/80">Subscribe to access premium features</p>
            )}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-medium">API Key Status</h3>
            <span className="px-3 py-1 rounded-full text-sm font-medium uppercase tracking-wide bg-white/20 text-white/90">
              Not Connected
            </span>
          </div>
          <div>
            <p className="text-white/80">Add your OpenAI API key to enable bot functionality</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-medium">Bot Configuration</h3>
            <span className="px-3 py-1 rounded-full text-sm font-medium uppercase tracking-wide bg-white/20 text-white/90">
              Not Selected
            </span>
          </div>
          <div>
            <p className="text-white/80">Choose a bot configuration to get started</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-2xl font-medium mb-5">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 hover:-translate-y-0.5"
            onClick={() => setActiveSection('plans')}
          >
            Manage Subscription
          </button>
          <button
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg border border-white/20 transition-all duration-200 hover:-translate-y-0.5"
            onClick={() => setActiveSection('apikey')}
          >
            Add API Key
          </button>
          <button
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg border border-white/20 transition-all duration-200 hover:-translate-y-0.5"
            onClick={() => setActiveSection('botconfig')}
          >
            Select Bot
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
        <p className="text-lg">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center text-white text-center">
        <h2 className="text-2xl font-semibold mb-4">Error Loading Dashboard</h2>
        <p className="mb-6">{error}</p>
        <button
          onClick={fetchSubscriptionData}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-5">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
        <div>
          <h1 className="text-white text-4xl font-semibold mb-2">Welcome back, {user?.name}</h1>
          <p className="text-white/80 text-xl">Manage your Discord bot subscription and settings</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        <nav className="lg:col-span-1 bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 h-fit">
          <ul className="space-y-2">
            <li>
              <button
                className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-all duration-200 ${activeSection === 'overview'
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                onClick={() => handleSectionChange('overview')}
              >
                <span className="text-xl">📊</span>
                Overview
              </button>
            </li>
            <li>
              <button
                className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-all duration-200 ${activeSection === 'plans'
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                onClick={() => handleSectionChange('plans')}
              >
                <span className="text-xl">💳</span>
                Subscription Plans
              </button>
            </li>
            <li>
              <button
                className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-all duration-200 ${activeSection === 'apikey'
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                onClick={() => handleSectionChange('apikey')}
              >
                <span className="text-xl">🔑</span>
                API Key Management
              </button>
            </li>
            <li>
              <button
                className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-all duration-200 ${activeSection === 'botconfig'
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                onClick={() => handleSectionChange('botconfig')}
              >
                <span className="text-xl">🤖</span>
                Bot Configuration
              </button>
            </li>
            <li>
              <button
                className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-all duration-200 ${activeSection === 'usage'
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                onClick={() => handleSectionChange('usage')}
              >
                <span className="text-xl">📈</span>
                Usage & Costs
              </button>
            </li>
          </ul>
        </nav>

        <main className="lg:col-span-3 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 min-h-[600px]">
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
};

export default SubscriptionDashboard;