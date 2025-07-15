// Simple authentication helper for storing JWT and performing authenticated requests.

export const TOKEN_KEY_PREFIX = 'access_token_';
export const CURRENT_USER_KEY = 'current_user';

export function setToken(username: string, token: string) {
  localStorage.setItem(`${TOKEN_KEY_PREFIX}${username}`, token);
  localStorage.setItem(CURRENT_USER_KEY, username);
}

export function getToken(): string | null {
  const username = localStorage.getItem(CURRENT_USER_KEY);
  if (!username) {
    return null;
  }
  return localStorage.getItem(`${TOKEN_KEY_PREFIX}${username}`);
}

export function clearToken() {
  const username = localStorage.getItem(CURRENT_USER_KEY);
  if (username) {
    localStorage.removeItem(`${TOKEN_KEY_PREFIX}${username}`);
  }
  localStorage.removeItem(CURRENT_USER_KEY);
}

// Wrapper around fetch that adds Authorization header if token present
export async function authFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // When sending FormData, the browser must set the Content-Type header itself,
  // including the boundary. We must not set it manually.
  // This ensures that if any Content-Type was accidentally passed, it's removed.
  if (init.body instanceof FormData) {
    headers.delete('Content-Type');
  }

  return fetch(input, { ...init, headers });
} 