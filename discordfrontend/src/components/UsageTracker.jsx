import { useState, useEffect } from 'react';

const UsageTracker = () => {
    const [usageData, setUsageData] = useState(null);
    const [timeRange, setTimeRange] = useState('30d');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

    useEffect(() => {
        fetchUsageData();
    }, [timeRange]);

    const fetchUsageData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/api/usage/stats?range=${timeRange}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setUsageData(data.data || data);
            } else if (response.status === 401) {
                // User not authenticated - show demo state with mock data
                setUsageData({
                    currentPeriod: {
                        tokensUsed: 0,
                        tokenLimit: 10000,
                        totalCost: 0
                    },
                    averages: {
                        dailyCost: 0,
                        dailyTokens: 0
                    },
                    dailyUsage: [],
                    costBreakdown: {}
                });
            } else {
                throw new Error('Failed to fetch usage data');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        }).format(amount);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US').format(num);
    };

    const calculateProjectedCost = () => {
        if (!usageData?.dailyUsage?.length) return 0;

        const recentDays = usageData.dailyUsage.slice(-7);
        const avgDailyCost = recentDays.reduce((sum, day) => sum + day.cost, 0) / recentDays.length;
        return avgDailyCost * 30; // Project for 30 days
    };

    const getUsagePercentage = () => {
        if (!usageData?.currentPeriod) return 0;
        const { tokensUsed, tokenLimit } = usageData.currentPeriod;
        if (tokenLimit === -1) return 0; // Unlimited
        return Math.min((tokensUsed / tokenLimit) * 100, 100);
    };

    const renderUsageChart = () => {
        if (!usageData?.dailyUsage?.length) return null;

        const maxTokens = Math.max(...usageData.dailyUsage.map(d => d.tokens));

        return (
            <div className="space-y-2">
                {usageData.dailyUsage.slice(-14).map((day, index) => {
                    const height = maxTokens > 0 ? (day.tokens / maxTokens) * 100 : 0;
                    return (
                        <div key={index} className="flex items-center gap-3">
                            <span className="text-sm text-white/70 w-16">
                                {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <div className="flex-1 bg-white/10 rounded-full h-6 relative overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${height}%` }}
                                />
                                <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                                    {formatNumber(day.tokens)} tokens
                                </span>
                            </div>
                            <span className="text-sm text-white/70 w-16 text-right">
                                {formatCurrency(day.cost)}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (loading) {
    return (
        <div className="text-white flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4 mx-auto"></div>
                <p>Loading usage data...</p>
            </div>
        </div>
    );
}

if (error) {
    return (
        <div className="text-white text-center min-h-[400px] flex items-center justify-center">
            <div>
                <h3 className="text-xl font-semibold mb-2">Error Loading Usage Data</h3>
                <p className="text-white/70 mb-4">{error}</p>
                <button
                    onClick={fetchUsageData}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                    Retry
                </button>
            </div>
        </div>
    );
}

const usagePercentage = getUsagePercentage();
const projectedCost = calculateProjectedCost();

return (
    <div className="text-white">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-3xl font-bold mb-2">Usage & Costs</h2>
                <p className="text-white/80 text-lg">
                    Track your token usage and monitor costs in real-time
                </p>
            </div>

            <div className="flex bg-white/10 rounded-lg p-1 border border-white/20">
                {[
                    { value: '7d', label: '7 Days' },
                    { value: '30d', label: '30 Days' },
                    { value: '90d', label: '90 Days' }
                ].map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setTimeRange(option.value)}
                        className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${timeRange === option.value
                            ? 'bg-white text-black'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Current Period Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium">Tokens Used</h3>
                    <span className="text-2xl">🔢</span>
                </div>
                <div className="text-3xl font-bold mb-1">
                    {formatNumber(usageData?.currentPeriod?.tokensUsed || 0)}
                </div>
                <p className="text-white/70 text-sm">
                    {usageData?.currentPeriod?.tokenLimit === -1
                        ? 'Unlimited plan'
                        : `of ${formatNumber(usageData?.currentPeriod?.tokenLimit || 0)} limit`
                    }
                </p>
                {usageData?.currentPeriod?.tokenLimit !== -1 && (
                    <div className="mt-3">
                        <div className="bg-white/20 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-300 ${usagePercentage > 80 ? 'bg-red-500' : usagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                style={{ width: `${usagePercentage}%` }}
                            />
                        </div>
                        <p className="text-xs text-white/60 mt-1">{usagePercentage.toFixed(1)}% used</p>
                    </div>
                )}
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium">Current Cost</h3>
                    <span className="text-2xl">💰</span>
                </div>
                <div className="text-3xl font-bold mb-1">
                    {formatCurrency(usageData?.currentPeriod?.totalCost || 0)}
                </div>
                <p className="text-white/70 text-sm">This billing period</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium">Projected Cost</h3>
                    <span className="text-2xl">📊</span>
                </div>
                <div className="text-3xl font-bold mb-1">
                    {formatCurrency(projectedCost)}
                </div>
                <p className="text-white/70 text-sm">Next 30 days</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium">Avg. Daily</h3>
                    <span className="text-2xl">📈</span>
                </div>
                <div className="text-3xl font-bold mb-1">
                    {formatCurrency(usageData?.averages?.dailyCost || 0)}
                </div>
                <p className="text-white/70 text-sm">
                    {formatNumber(usageData?.averages?.dailyTokens || 0)} tokens
                </p>
            </div>
        </div>

        {/* Usage History Chart */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Daily Usage History</h3>
                <div className="flex items-center gap-4 text-sm text-white/70">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
                        <span>Token Usage</span>
                    </div>
                </div>
            </div>

            {usageData?.dailyUsage?.length > 0 ? (
                <div className="space-y-4">
                    {renderUsageChart()}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-white/70">No usage data available for the selected period</p>
                </div>
            )}
        </div>

        {/* Cost Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold mb-4">Cost Breakdown</h3>
                <div className="space-y-4">
                    {usageData?.costBreakdown ? (
                        Object.entries(usageData.costBreakdown).map(([category, cost]) => (
                            <div key={category} className="flex justify-between items-center">
                                <span className="text-white/80 capitalize">{category.replace(/([A-Z])/g, ' $1')}</span>
                                <span className="font-medium">{formatCurrency(cost)}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-white/70">No cost breakdown available</p>
                    )}
                </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold mb-4">Usage Tips</h3>
                <div className="space-y-3 text-white/80">
                    <div className="flex items-start gap-3">
                        <span className="text-green-400 mt-1">💡</span>
                        <p className="text-sm">Monitor your daily usage to avoid unexpected costs</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-blue-400 mt-1">⚡</span>
                        <p className="text-sm">Optimize bot responses to reduce token consumption</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-purple-400 mt-1">📊</span>
                        <p className="text-sm">Set up usage alerts to stay within budget</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-yellow-400 mt-1">🎯</span>
                        <p className="text-sm">Consider upgrading for better rates on higher usage</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Usage Alerts */}
        {usagePercentage > 80 && (
            <div className="mt-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <span className="text-red-400 text-xl">⚠️</span>
                    <div>
                        <h4 className="text-red-300 font-medium mb-1">High Usage Alert</h4>
                        <p className="text-red-200/80 text-sm">
                            You've used {usagePercentage.toFixed(1)}% of your monthly token limit.
                            Consider upgrading your plan or optimizing usage to avoid service interruption.
                        </p>
                    </div>
                </div>
            </div>
        )}
    </div>
);
};

export default UsageTracker;