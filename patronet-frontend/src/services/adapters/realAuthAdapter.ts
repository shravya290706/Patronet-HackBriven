import type {
  IAuthService,
  AuthSession,
  AuthUser,
  LoginCredentials,
  RegisterInput,
  AuthResult,
} from '../api/authService';
import { apiClient, ApiError, clearAuthToken, getAuthToken, setAuthToken } from '../api/client';

export interface BackendCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface BackendTokenResponse {
  access_token: string;
  token_type: string;
  customer: BackendCustomer;
}

function mapCustomerToAuthUser(customer: BackendCustomer, isDemo = false): AuthUser {
  return {
    id: String(customer.id),
    name: customer.name,
    email: customer.email,
    phone: customer.phone || undefined,
    isDemoUser: isDemo,
  };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * RealAuthAdapter
 * Real integration adapter connecting frontend auth flows to FastAPI backend endpoints:
 * - POST /api/v1/auth/register
 * - POST /api/v1/auth/login
 * - GET  /api/v1/auth/me
 */
export class RealAuthAdapter implements IAuthService {
  /**
   * Verify and restore current authenticated customer from persisted JWT token.
   */
  async getCurrentSession(): Promise<AuthSession> {
    const token = getAuthToken();
    if (!token) {
      return {
        user: null,
        isAuthenticated: false,
        isDemoSession: false,
      };
    }

    try {
      const customer = await apiClient<BackendCustomer>('/auth/me');
      if (customer && customer.id && customer.email) {
        return {
          user: mapCustomerToAuthUser(customer, false),
          isAuthenticated: true,
          isDemoSession: false,
        };
      }
    } catch (err) {
      // Clear invalid or expired token
      clearAuthToken();
    }

    return {
      user: null,
      isAuthenticated: false,
      isDemoSession: false,
    };
  }

  /**
   * Optional fallback demo session for non-authenticated testing.
   */
  async startDemoSession(userOverride?: Partial<AuthUser>): Promise<AuthSession> {
    const user: AuthUser = {
      id: 'demo-customer-uuid',
      name: 'Demo Customer',
      email: 'demo@patronet.com',
      phone: '+91 98765 43210',
      isDemoUser: true,
      ...(userOverride || {}),
    };
    return {
      user,
      isAuthenticated: true,
      isDemoSession: true,
    };
  }

  /**
   * Log out current user, clearing persisted credentials.
   */
  async endSession(): Promise<void> {
    clearAuthToken();
  }

  validateLogin(credentials: LoginCredentials): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    const email = (credentials.email || '').trim();
    if (!email) {
      errors.email = 'Please enter your email address.';
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    const password = credentials.password || '';
    if (!password) {
      errors.password = 'Please enter your password.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  validateRegister(input: RegisterInput): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    const name = (input.name || '').trim();
    if (!name) {
      errors.name = 'Full name is required.';
    } else if (name.length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    const email = (input.email || '').trim();
    if (!email) {
      errors.email = 'Please enter your email address.';
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    const password = input.password || '';
    if (!password) {
      errors.password = 'Please enter a password.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Authenticate customer credentials via POST /api/v1/auth/login.
   */
  async simulateLogin(credentials: LoginCredentials): Promise<AuthResult> {
    const validation = this.validateLogin(credentials);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0] || 'Invalid login details.';
      return { success: false, error: firstError };
    }

    try {
      const response = await apiClient<BackendTokenResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email.trim().toLowerCase(),
          password: credentials.password || '',
        }),
      });

      if (response?.access_token && response?.customer) {
        setAuthToken(response.access_token);
        const user = mapCustomerToAuthUser(response.customer, false);
        return { success: true, user };
      }

      return { success: false, error: 'Login failed: unexpected response format.' };
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : (err instanceof Error ? err.message : 'Login failed.');
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Register new customer account via POST /api/v1/auth/register.
   */
  async simulateRegister(input: RegisterInput): Promise<AuthResult> {
    const validation = this.validateRegister(input);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0] || 'Invalid registration details.';
      return { success: false, error: firstError };
    }

    try {
      const response = await apiClient<BackendTokenResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
          password: input.password || '',
          phone: input.phone?.trim() || null,
        }),
      });

      if (response?.access_token && response?.customer) {
        setAuthToken(response.access_token);
        const user = mapCustomerToAuthUser(response.customer, false);
        return { success: true, user };
      }

      return { success: false, error: 'Registration failed: unexpected response format.' };
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : (err instanceof Error ? err.message : 'Registration failed.');
      return { success: false, error: errorMessage };
    }
  }
}
