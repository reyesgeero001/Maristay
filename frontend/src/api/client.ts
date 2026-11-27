import axios, { AxiosError } from 'axios';

/**
 * Centralized HTTP client for the MariStay REST API.
 *  - Base URL comes from VITE_API_BASE_URL (see .env.example).
 *  - Every request carries the JWT as "Authorization: Bearer <token>".
 *  - A 401 on an authenticated request means the token is missing, invalid or
 *    expired, so the session is cleared and the user is sent back to login.
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

const TOKEN_KEY = 'maristay.token';

// sessionStorage: the token is dropped when the browser tab is closed.
export const tokenStore = {
  get: (): string | null => sessionStorage.getItem(TOKEN_KEY),
  set: (token: string) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};

export const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized: (() => void) | null = null;
/** Registered by AuthProvider: called when the API rejects the current token. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isLogin = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLogin && tokenStore.get()) {
      tokenStore.clear();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/** Backend error body (AllExceptionsFilter): { statusCode, error, message, path, timestamp }. */
interface ApiErrorBody {
  statusCode?: number;
  message?: string | string[];
}

/** Turns any API error into a readable message for the UI. */
export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiErrorBody | undefined;
    const status = err.response?.status;
    const detail = Array.isArray(body?.message) ? body!.message.join('; ') : body?.message;
    if (!err.response) return 'Cannot reach the MariStay API. Is the backend running?';
    switch (status) {
      case 400:
        return `Invalid input: ${detail ?? 'please check the form'}`;
      case 401:
        return detail ?? 'Your session has expired. Please log in again.';
      case 403:
        return `Not allowed: ${detail ?? 'your role cannot perform this action'}`;
      case 404:
        return `Not found: ${detail ?? 'the record does not exist'}`;
      case 409:
        return `Conflict: ${detail ?? 'the action conflicts with the current state'}`;
      case 429:
        return 'Too many attempts. Please wait a minute and try again.';
      default:
        return detail ?? `Request failed (HTTP ${status})`;
    }
  }
  return err instanceof Error ? err.message : 'Unexpected error';
}
