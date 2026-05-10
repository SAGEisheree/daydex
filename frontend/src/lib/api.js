const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
const TOKEN_STORAGE_KEY = "daydex_token";


export function getApiBaseUrl() {
  return API_BASE_URL;
}


export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}


export function setStoredToken(token) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}


export function clearStoredToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}


export async function apiRequest(path, { method = "GET", token, body } = {}) {
  const headers = {};

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    const networkError = new Error("Unable to reach the server. Please try again.");
    networkError.cause = error;
    networkError.isNetworkError = true;
    throw networkError;
  }

  if (!response.ok) {
    let message = "Request failed";

    try {
      const errorData = await response.json();
      message = errorData.detail ?? errorData.message ?? message;
    } catch {
      message = response.statusText || message;
    }

    const requestError = new Error(message);
    requestError.status = response.status;
    throw requestError;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
