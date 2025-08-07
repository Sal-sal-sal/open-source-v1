import React from 'react';
import SubscriptionPlans from '../components/SubscriptionPlans';
import { trackPageView } from '../utils/analytics';
import { useEffect } from 'react';

const SubscriptionPage: React.FC = () => {
  useEffect(() => {
    trackPageView('subscription_page');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Unlock the full potential of LearnTug with our flexible subscription plans. 
              Start with our free plan and upgrade as you grow.
            </p>
          </div>

          {/* Features Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Processing</h3>
              <p className="text-gray-600">Get priority processing for all your AI interactions</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unlimited Access</h3>
              <p className="text-gray-600">No limits on notes, chats, and file uploads</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Features</h3>
              <p className="text-gray-600">Access to premium AI features and analytics</p>
            </div>
          </div>

          {/* Subscription Plans */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <SubscriptionPlans />
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Can I cancel my subscription anytime?
                  </h3>
                  <p className="text-gray-600">
                    Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    What happens if I exceed my plan limits?
                  </h3>
                  <p className="text-gray-600">
                    You'll receive a notification when approaching limits. Upgrade to continue using the service without restrictions.
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Can I upgrade or downgrade my plan?
                  </h3>
                  <p className="text-gray-600">
                    Yes, you can change your plan at any time. Upgrades take effect immediately, downgrades at the next billing cycle.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Is there a free trial?
                  </h3>
                  <p className="text-gray-600">
                    We offer a free plan with basic features. Try it out and upgrade when you need more capabilities.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Need Help?</h3>
              <p className="text-blue-100 mb-6">
                Our support team is here to help you choose the right plan and answer any questions.
              </p>
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage; 