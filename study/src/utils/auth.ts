import { trackApiRequest, trackError } from './analytics';

const TOKEN_KEY_PREFIX = 'auth_token_';
const CURRENT_USER_KEY = 'current_user';

export function getToken(username?: string): string | null {
  if (username) {
    return localStorage.getItem(`${TOKEN_KEY_PREFIX}${username}`);
  }
  const currentUser = localStorage.getItem(CURRENT_USER_KEY);
  return currentUser ? localStorage.getItem(`${TOKEN_KEY_PREFIX}${currentUser}`) : null;
}

export function setToken(username: string, token: string) {
  localStorage.setItem(`${TOKEN_KEY_PREFIX}${username}`, token);
  localStorage.setItem(CURRENT_USER_KEY, username);
}

export function clearToken() {
  const currentUser = localStorage.getItem(CURRENT_USER_KEY);
  if (currentUser) {
    localStorage.removeItem(`${TOKEN_KEY_PREFIX}${currentUser}`);
  }
  localStorage.removeItem(CURRENT_USER_KEY);
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const startTime = Date.now();
  
  const headers = {
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  // Remove Content-Type for FormData requests to let browser set it correctly
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Extract endpoint from URL for analytics
    const urlObj = new URL(url, window.location.origin);
    const endpoint = urlObj.pathname;

    // Track API request
    trackApiRequest(
      endpoint,
      options.method || 'GET',
      response.status,
      responseTime
    );

    // Track errors
    if (!response.ok) {
      trackError('api_error', `${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    // Track network errors
    trackError('network_error', error instanceof Error ? error.message : 'Unknown network error');
    throw error;
  }
} 