import React, { useState, useEffect } from 'react';
import { trackPageView } from '../utils/analytics';

interface AnalyticsData {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  signUps: number;
  logins: number;
  subscriptionStats: {
    free: number;
    basic: number;
    premium: number;
  };
  topFeatures: Array<{
    name: string;
    usage: number;
  }>;
}

const AnalyticsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

  useEffect(() => {
    trackPageView('analytics_page');
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      // В реальном приложении здесь был бы API запрос
      // Пока используем моковые данные
      const mockData: AnalyticsData = {
        totalUsers: 1250,
        newUsers: 45,
        activeUsers: 320,
        signUps: 67,
        logins: 890,
        subscriptionStats: {
          free: 980,
          basic: 180,
          premium: 90
        },
        topFeatures: [
          { name: 'Chat', usage: 450 },
          { name: 'Notes', usage: 320 },
          { name: 'Audio Processing', usage: 280 },
          { name: 'File Upload', usage: 210 },
          { name: 'Video Processing', usage: 150 }
        ]
      };
      
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Track user engagement and platform usage</p>
          </div>

          {/* Time Range Selector */}
          <div className="mb-6">
            <div className="flex space-x-2">
              {[
                { value: '7d', label: 'Last 7 days' },
                { value: '30d', label: 'Last 30 days' },
                { value: '90d', label: 'Last 90 days' }
              ].map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    timeRange === range.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {analyticsData && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.totalUsers.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">New Users</p>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.newUsers}</p>
                      <p className="text-sm text-green-600">+12% from last period</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Users</p>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.activeUsers}</p>
                      <p className="text-sm text-blue-600">+8% from last period</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Sign-ups</p>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.signUps}</p>
                      <p className="text-sm text-green-600">+15% from last period</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Authentication Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication Activity</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Sign-ups</span>
                      <span className="font-semibold text-gray-900">{analyticsData.signUps}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Logins</span>
                      <span className="font-semibold text-gray-900">{analyticsData.logins}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Conversion Rate</span>
                      <span className="font-semibold text-green-600">
                        {((analyticsData.logins / analyticsData.signUps) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Distribution</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Free Plan</span>
                      <span className="font-semibold text-gray-900">{analyticsData.subscriptionStats.free}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Basic Plan</span>
                      <span className="font-semibold text-blue-600">{analyticsData.subscriptionStats.basic}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Premium Plan</span>
                      <span className="font-semibold text-purple-600">{analyticsData.subscriptionStats.premium}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Paid Conversion</span>
                      <span className="font-semibold text-green-600">
                        {(((analyticsData.subscriptionStats.basic + analyticsData.subscriptionStats.premium) / analyticsData.totalUsers) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Usage */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Features Usage</h3>
                <div className="space-y-3">
                  {analyticsData.topFeatures.map((feature, index) => (
                    <div key={feature.name} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{feature.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{feature.usage.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage; 