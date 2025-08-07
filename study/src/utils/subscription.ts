import { authFetch } from './auth';

export interface SubscriptionPlan {
  plan_type: string;
  name: string;
  price: number;
  features: string[];
  limits: Record<string, any>;
}

export interface SubscriptionResponse {
  id: string;
  user_id: string;
  plan_type: string;
  status: string;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionCreate {
  plan_type: string;
}

// Get available subscription plans
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const response = await authFetch('/api/subscription/plans');
    if (!response.ok) {
      throw new Error('Failed to fetch subscription plans');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }
};

// Get current user's subscription
export const getCurrentSubscription = async (): Promise<SubscriptionResponse> => {
  try {
    const response = await authFetch('/api/subscription/current');
    if (!response.ok) {
      throw new Error('Failed to fetch current subscription');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    throw error;
  }
};

// Create a new subscription
export const createSubscription = async (planType: string): Promise<SubscriptionResponse> => {
  try {
    const response = await authFetch('/api/subscription/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan_type: planType }),
    });
    if (!response.ok) {
      throw new Error('Failed to create subscription');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

// Cancel current subscription
export const cancelSubscription = async (): Promise<void> => {
  try {
    const response = await authFetch('/api/subscription/cancel', {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
};

// Upgrade subscription
export const upgradeSubscription = async (planType: string): Promise<any> => {
  try {
    const response = await authFetch('/api/subscription/upgrade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan_type: planType }),
    });
    if (!response.ok) {
      throw new Error('Failed to upgrade subscription');
    }
    return await response.json();
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    throw error;
  }
};

// Check subscription limits
export const checkSubscriptionLimits = async (feature: string): Promise<any> => {
  try {
    const response = await authFetch(`/api/subscription/check-limits?feature=${feature}`);
    if (!response.ok) {
      throw new Error('Failed to check subscription limits');
    }
    return await response.json();
  } catch (error) {
    console.error('Error checking subscription limits:', error);
    throw error;
  }
};

// Helper function to check if user can perform an action
export const canPerformAction = async (action: string): Promise<boolean> => {
  try {
    const limits = await checkSubscriptionLimits(action);
    return limits.can_perform;
  } catch (error) {
    console.error('Error checking if user can perform action:', error);
    return false;
  }
};

// Get plan display name
export const getPlanDisplayName = (planType: string): string => {
  const planNames: Record<string, string> = {
    free: 'Free Plan',
    basic: 'Basic Plan',
    premium: 'Premium Plan',
  };
  return planNames[planType] || planType;
};

// Get plan price display
export const getPlanPriceDisplay = (price: number): string => {
  if (price === 0) {
    return 'Free';
  }
  return `$${price}/month`;
}; 