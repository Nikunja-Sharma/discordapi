import { useState, useEffect } from 'react';

const PlanSelector = ({ onPlanUpdate }) => {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [loading, setLoading] = useState(false);
    const [currentPlan, setCurrentPlan] = useState(null);

    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

    const plans = {
        basic: {
            name: 'Basic',
            monthly: 9.99,
            yearly: 99.99,
            features: [
                '10,000 tokens per month',
                'Basic bot configurations',
                'Email support',
                'Standard response time'
            ]
        },
        pro: {
            name: 'Pro',
            monthly: 19.99,
            yearly: 199.99,
            features: [
                '50,000 tokens per month',
                'Advanced bot configurations',
                'Priority support',
                'Custom integrations',
                'Analytics dashboard'
            ],
            popular: true
        },
        enterprise: {
            name: 'Enterprise',
            monthly: 49.99,
            yearly: 499.99,
            features: [
                'Unlimited tokens',
                'All bot configurations',
                '24/7 dedicated support',
                'Custom development',
                'Advanced analytics',
                'White-label options'
            ]
        }
    };

    useEffect(() => {
        fetchCurrentPlan();
    }, []);

    const fetchCurrentPlan = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/subscriptions/status`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setCurrentPlan(data.data || data);
            } else if (response.status === 401) {
                // User not authenticated - show demo state
                setCurrentPlan(null);
            }
        } catch (error) {
            console.error('Failed to fetch current plan:', error);
        }
    };

    const calculateSavings = (planKey) => {
        const plan = plans[planKey];
        const monthlyCost = plan.monthly * 12;
        const yearlyCost = plan.yearly;
        const savings = monthlyCost - yearlyCost;
        const percentage = Math.round((savings / monthlyCost) * 100);
        return { amount: savings, percentage };
    };

    const handlePlanSelect = async (planKey) => {
        setLoading(true);
        try {
            // For demo purposes, we'll use a mock payment method
            // In a real app, this would come from a payment form
            const paymentMethod = {
                type: 'stripe', // Valid enum value from Subscription model
                paymentId: 'pm_demo_' + Date.now(), // Demo payment method ID
                customerId: 'cus_demo_' + Date.now(),
                last4: '4242',
                brand: 'visa'
            };

            const response = await fetch(`${API_BASE}/api/subscriptions/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    planType: billingCycle, // Use billing cycle as plan type (monthly/yearly)
                    paymentMethod: paymentMethod,
                    selectedPlan: planKey // Include the selected plan tier for reference
                }),
            });

            if (response.ok) {
                const data = await response.json();
                // In a real app, redirect to payment URL
                // For demo, just show success message
                alert(`Successfully subscribed to ${planKey} plan (${billingCycle})!`);
                fetchCurrentPlan(); // Refresh current plan
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to create subscription');
            }
        } catch (error) {
            console.error('Subscription error:', error);
            alert(`Failed to process subscription: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const renderPlanCard = (planKey, plan) => {
        const isCurrentPlan = currentPlan?.planType === planKey;
        const savings = calculateSavings(planKey);
        const price = billingCycle === 'monthly' ? plan.monthly : plan.yearly;
        const priceLabel = billingCycle === 'monthly' ? '/month' : '/year';

        return (
            <div
                key={planKey}
                className={`relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-200 hover:scale-105 ${plan.popular
                    ? 'border-yellow-400 ring-2 ring-yellow-400/50'
                    : 'border-white/20 hover:border-white/40'
                    } ${isCurrentPlan ? 'ring-2 ring-green-400/50 border-green-400' : ''
                    }`}
            >
                {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-semibold">
                            Most Popular
                        </span>
                    </div>
                )}

                {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            Current Plan
                        </span>
                    </div>
                )}

                <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="text-white">
                        <span className="text-4xl font-bold">${price}</span>
                        <span className="text-white/70 ml-1">{priceLabel}</span>
                    </div>
                    {billingCycle === 'yearly' && (
                        <div className="mt-2">
                            <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-sm">
                                Save ${savings.amount} ({savings.percentage}%)
                            </span>
                        </div>
                    )}
                </div>

                <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-white/90">
                            <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {feature}
                        </li>
                    ))}
                </ul>

                <button
                    onClick={() => handlePlanSelect(planKey)}
                    disabled={loading || isCurrentPlan}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${isCurrentPlan
                        ? 'bg-gray-500 text-white cursor-not-allowed'
                        : plan.popular
                            ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {loading ? 'Processing...' : isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                </button>
            </div>
        );
    };

    return (
        <div className="text-white">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
                <p className="text-white/80 text-lg mb-6">
                    Select the perfect plan for your Discord bot needs
                </p>

                {/* Billing Toggle */}
                <div className="inline-flex bg-white/10 rounded-xl p-1 border border-white/20">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${billingCycle === 'monthly'
                            ? 'bg-white text-black'
                            : 'text-white/70 hover:text-white'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${billingCycle === 'yearly'
                            ? 'bg-white text-black'
                            : 'text-white/70 hover:text-white'
                            }`}
                    >
                        Yearly
                        <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                            Save up to 17%
                        </span>
                    </button>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {Object.entries(plans).map(([planKey, plan]) => renderPlanCard(planKey, plan))}
            </div>

            {/* Plan Comparison */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-2xl font-semibold mb-6 text-center">Plan Comparison</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/20">
                                <th className="pb-4 text-white/80">Features</th>
                                <th className="pb-4 text-center">Basic</th>
                                <th className="pb-4 text-center">Pro</th>
                                <th className="pb-4 text-center">Enterprise</th>
                            </tr>
                        </thead>
                        <tbody className="space-y-4">
                            <tr className="border-b border-white/10">
                                <td className="py-3 text-white/90">Monthly Token Limit</td>
                                <td className="py-3 text-center">10,000</td>
                                <td className="py-3 text-center">50,000</td>
                                <td className="py-3 text-center">Unlimited</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="py-3 text-white/90">Bot Configurations</td>
                                <td className="py-3 text-center">Basic</td>
                                <td className="py-3 text-center">Advanced</td>
                                <td className="py-3 text-center">All + Custom</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="py-3 text-white/90">Support Level</td>
                                <td className="py-3 text-center">Email</td>
                                <td className="py-3 text-center">Priority</td>
                                <td className="py-3 text-center">24/7 Dedicated</td>
                            </tr>
                            <tr className="border-b border-white/10">
                                <td className="py-3 text-white/90">Analytics</td>
                                <td className="py-3 text-center">❌</td>
                                <td className="py-3 text-center">✅</td>
                                <td className="py-3 text-center">Advanced</td>
                            </tr>
                            <tr>
                                <td className="py-3 text-white/90">Custom Development</td>
                                <td className="py-3 text-center">❌</td>
                                <td className="py-3 text-center">❌</td>
                                <td className="py-3 text-center">✅</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-8 text-center">
                <p className="text-white/70 mb-4">
                    Need help choosing? <a href="#" className="text-blue-400 hover:text-blue-300 underline">Contact our sales team</a>
                </p>
                <p className="text-sm text-white/60">
                    All plans include a 14-day free trial. Cancel anytime.
                </p>
            </div>
        </div>
    );
};

export default PlanSelector;