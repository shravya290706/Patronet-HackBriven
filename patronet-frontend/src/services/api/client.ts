/**
 * Centralized API Client using native fetch.
 * Designed to cleanly handle base URL, headers, JSON serialization, and error responses.
 */

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const AUTH_TOKEN_KEY = 'patronet_access_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

/**
 * Resolves the backend API base URL with environment variable precedence.
 * In local development (DEV mode), falls back to http://localhost:8000 for seamless local dev.
 * In production (PROD mode), strictly requires environment variable configuration
 * (VITE_API_BASE_URL or VITE_API_URL) to prevent broken or unintended client-side requests to localhost.
 */
export const getBaseUrl = (): string => {
  const envUrl = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'http://localhost:8000' : '')
  ).trim();

  if (!envUrl) {
    if (import.meta.env.PROD) {
      console.warn(
        'PATRONET API Notice: Neither VITE_API_BASE_URL nor VITE_API_URL is configured in production. ' +
        'Falling back to same-origin relative path "/api/v1". Please configure VITE_API_BASE_URL in your hosting platform.'
      );
    }
    return '/api/v1';
  }

  const cleanUrl = envUrl.replace(/\/+$/, '');
  return cleanUrl.endsWith('/api/v1') ? cleanUrl : `${cleanUrl}/api/v1`;
};

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...restOptions } = options;
  
  let url = `${getBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += `?${qs}`;
    }
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...restOptions,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  });

  if (!response.ok) {
    let errorData: unknown = null;
    try {
      errorData = await response.json();
    } catch {
      // response might be empty or non-JSON
    }

    let message = `HTTP Error ${response.status}: ${response.statusText}`;
    if (errorData && typeof errorData === 'object') {
      const rec = errorData as Record<string, unknown>;
      if (typeof rec.detail === 'string') {
        message = rec.detail;
      } else if (Array.isArray(rec.detail) && rec.detail.length > 0) {
        const first = rec.detail[0];
        if (first && typeof first === 'object' && 'msg' in first) {
          message = String(first.msg);
        }
      } else if (typeof rec.message === 'string') {
        message = rec.message;
      }
    }
      
    throw new ApiError(message, response.status, errorData);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
