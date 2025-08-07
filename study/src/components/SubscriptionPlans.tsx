import React, { useState, useEffect } from 'react';
import { 
  getSubscriptionPlans, 
  getCurrentSubscription, 
  createSubscription, 
  upgradeSubscription,
  cancelSubscription,
  type SubscriptionPlan,
  type SubscriptionResponse,
  getPlanDisplayName,
  getPlanPriceDisplay
} from '../utils/subscription';
import { 
  trackSubscriptionStarted, 
  trackSubscriptionUpgraded, 
  trackSubscriptionCancelled 
} from '../utils/analytics';

interface SubscriptionPlansProps {
  onSubscriptionChange?: (subscription: SubscriptionResponse) => void;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onSubscriptionChange }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, subscriptionData] = await Promise.all([
        getSubscriptionPlans(),
        getCurrentSubscription()
      ]);
      setPlans(plansData);
      setCurrentSubscription(subscriptionData);
    } catch (error) {
      setError('Failed to load subscription data');
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planType: string) => {
    try {
      setActionLoading(planType);
      setError(null);

      let result;
      if (currentSubscription && currentSubscription.plan_type !== 'free') {
        // Upgrade existing subscription
        result = await upgradeSubscription(planType);
        trackSubscriptionUpgraded(currentSubscription.plan_type, planType);
      } else {
        // Create new subscription
        result = await createSubscription(planType);
        trackSubscriptionStarted(planType);
      }

      // Reload data
      await loadData();
      
      if (onSubscriptionChange) {
        onSubscriptionChange(result.subscription || result);
      }

    } catch (error) {
      setError('Failed to update subscription');
      console.error('Error updating subscription:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading('cancel');
      setError(null);

      await cancelSubscription();
      trackSubscriptionCancelled(currentSubscription?.plan_type || 'unknown');

      // Reload data
      await loadData();

    } catch (error) {
      setError('Failed to cancel subscription');
      console.error('Error cancelling subscription:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const isCurrentPlan = (planType: string) => {
    return currentSubscription?.plan_type === planType;
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'free':
        return 'border-gray-300 bg-gray-50';
      case 'basic':
        return 'border-blue-500 bg-blue-50';
      case 'premium':
        return 'border-purple-500 bg-purple-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Current Subscription Status */}
      {currentSubscription && currentSubscription.plan_type !== 'free' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800">
            Current Plan: {getPlanDisplayName(currentSubscription.plan_type)}
          </h3>
          <p className="text-green-600">
            Status: {currentSubscription.status}
            {currentSubscription.end_date && (
              <span> • Expires: {new Date(currentSubscription.end_date).toLocaleDateString()}</span>
            )}
          </p>
          <button
            onClick={handleCancel}
            disabled={actionLoading === 'cancel'}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Subscription'}
          </button>
        </div>
      )}

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.plan_type}
            className={`border-2 rounded-lg p-6 ${getPlanColor(plan.plan_type)} ${
              isCurrentPlan(plan.plan_type) ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900">
                  {getPlanPriceDisplay(plan.price)}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              {isCurrentPlan(plan.plan_type) ? (
                <div className="text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Current Plan
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.plan_type)}
                  disabled={actionLoading === plan.plan_type}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === plan.plan_type ? 'Processing...' : 
                   currentSubscription && currentSubscription.plan_type !== 'free' ? 'Upgrade' : 'Subscribe'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPlans; 