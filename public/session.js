const TOKEN_KEY = "qinshiji-session-token";

export function getSessionToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setSessionToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearSessionToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getAuthHeaders(extraHeaders = {}) {
  const token = getSessionToken();
  return token
    ? {
        ...extraHeaders,
        Authorization: `Bearer ${token}`
      }
    : extraHeaders;
}

export async function authFetch(url, options = {}) {
  const headers = getAuthHeaders(options.headers || {});
  return fetch(url, {
    ...options,
    headers
  });
}

export async function fetchCurrentUser() {
  const token = getSessionToken();
  if (!token) {
    return null;
  }

  const response = await authFetch("/api/v1/auth/me");
  if (!response.ok) {
    clearSessionToken();
    return null;
  }

  const data = await response.json();
  return data.user;
}
