// Analytics utility functions for Google Analytics 4
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Check if gtag is available
const isGtagAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

// Generic event tracking
export const trackEvent = (
  eventName: string,
  parameters?: Record<string, any>
): void => {
  if (!isGtagAvailable()) {
    console.warn('Google Analytics not available');
    return;
  }

  try {
    window.gtag('event', eventName, parameters);
    console.log('Analytics event tracked:', eventName, parameters);
  } catch (error) {
    console.error('Failed to track analytics event:', error);
  }
};

// User registration tracking
export const trackRegistration = (method: 'email' | 'google'): void => {
  trackEvent('sign_up', { method });
};

// Login tracking
export const trackLogin = (method: 'email' | 'google'): void => {
  trackEvent('login', { method });
};

// API request tracking
export const trackApiRequest = (
  endpoint: string,
  method: string,
  status?: number,
  responseTime?: number
): void => {
  trackEvent('api_request', {
    endpoint,
    method,
    status,
    response_time: responseTime,
  });
};

// Note creation tracking
export const trackNoteCreated = (source: 'chat' | 'manual' | 'ai_generated'): void => {
  trackEvent('note_created', { source });
};

// Chat message tracking
export const trackChatMessage = (chatType: 'regular' | 'book' | 'audio'): void => {
  trackEvent('chat_message_sent', { chat_type: chatType });
};

// File upload tracking
export const trackFileUpload = (fileType: string, fileSize?: number): void => {
  trackEvent('file_uploaded', {
    file_type: fileType,
    file_size: fileSize,
  });
};

// Document processing tracking
export const trackDocumentProcessed = (documentType: string, pages?: number): void => {
  trackEvent('document_processed', {
    document_type: documentType,
    pages,
  });
};

// Page view tracking
export const trackPageView = (pageName: string): void => {
  trackEvent('page_view', { page_name: pageName });
};

// User action tracking
export const trackUserAction = (
  action: string,
  category?: string,
  label?: string,
  value?: number
): void => {
  trackEvent('user_action', {
    action,
    category,
    label,
    value,
  });
};

// Set user properties
export const setUserProperties = (properties: Record<string, any>): void => {
  if (!isGtagAvailable()) {
    console.warn('Google Analytics not available');
    return;
  }

  try {
    const measurementId = import.meta.env.VITE_GOOGLE_MEASUREMENT_ID;
    if (!measurementId) {
      console.warn('VITE_GOOGLE_MEASUREMENT_ID not found in environment variables');
      return;
    }
    
    window.gtag('config', measurementId, {
      custom_map: properties,
    });
  } catch (error) {
    console.error('Failed to set user properties:', error);
  }
};

// Track user engagement
export const trackEngagement = (engagementType: string, duration?: number): void => {
  trackEvent('user_engagement', {
    engagement_type: engagementType,
    duration,
  });
};

// Track errors
export const trackError = (errorType: string, errorMessage: string): void => {
  trackEvent('error', {
    error_type: errorType,
    error_message: errorMessage,
  });
};

// Track feature usage
export const trackFeatureUsage = (featureName: string, action?: string): void => {
  trackEvent('feature_used', {
    feature_name: featureName,
    action,
  });
}; 