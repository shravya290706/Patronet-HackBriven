import type {
  IAuthService,
  AuthSession,
  AuthUser,
  LoginCredentials,
  RegisterInput,
  AuthResult,
} from '../api/authService';

const DEMO_SESSION_KEY = 'patronet_demo_session_active';
const DEMO_USER_PROFILE_KEY = 'patronet_demo_user_profile';

// Predefined non-sensitive Stitch demo customer
export const PREDEFINED_DEMO_USER: AuthUser = {
  id: 'usr_demo_aarav',
  name: 'Aarav Mehta',
  email: 'aarav@mehta.in',
  phone: '+91 98201 44512',
  isDemoUser: true,
};

export class MockAuthAdapter implements IAuthService {
  private getStoredUser(): AuthUser {
    try {
      const raw = sessionStorage.getItem(DEMO_USER_PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.name === 'string') {
          return { ...PREDEFINED_DEMO_USER, ...parsed };
        }
      }
    } catch {
      // Ignore sessionStorage read issues
    }
    return { ...PREDEFINED_DEMO_USER };
  }

  async getCurrentSession(): Promise<AuthSession> {
    await new Promise((r) => setTimeout(r, 20));
    try {
      const isActive = sessionStorage.getItem(DEMO_SESSION_KEY) === 'true';
      if (isActive) {
        return {
          user: this.getStoredUser(),
          isAuthenticated: true,
          isDemoSession: true,
        };
      }
    } catch {
      // sessionStorage unavailable
    }
    return {
      user: null,
      isAuthenticated: false,
      isDemoSession: false,
    };
  }

  async startDemoSession(userOverride?: Partial<AuthUser>): Promise<AuthSession> {
    await new Promise((r) => setTimeout(r, 40));
    const user: AuthUser = {
      ...PREDEFINED_DEMO_USER,
      ...(userOverride || {}),
      isDemoUser: true,
    };
    try {
      sessionStorage.setItem(DEMO_SESSION_KEY, 'true');
      sessionStorage.setItem(DEMO_USER_PROFILE_KEY, JSON.stringify(user));
    } catch (err) {
      console.warn('SessionStorage error during demo session start:', err);
    }
    return {
      user,
      isAuthenticated: true,
      isDemoSession: true,
    };
  }

  async endSession(): Promise<void> {
    await new Promise((r) => setTimeout(r, 20));
    try {
      sessionStorage.removeItem(DEMO_SESSION_KEY);
      sessionStorage.removeItem(DEMO_USER_PROFILE_KEY);
    } catch (err) {
      console.warn('SessionStorage error during demo sign out:', err);
    }
  }

  validateLogin(credentials: LoginCredentials): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    const email = (credentials.email || '').trim();
    if (!email) {
      errors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
      errors.name = 'Please enter your full name.';
    } else if (name.length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    }

    const email = (input.email || '').trim();
    if (!email) {
      errors.email = 'Please enter a valid email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    const password = input.password || '';
    if (!password) {
      errors.password = 'Password must be at least 8 characters long.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  async simulateLogin(credentials: LoginCredentials): Promise<AuthResult> {
    await new Promise((r) => setTimeout(r, 150));
    const validation = this.validateLogin(credentials);
    if (!validation.isValid) {
      return {
        success: false,
        error: Object.values(validation.errors)[0] || 'Invalid credentials.',
      };
    }

    // In mock mode, we DO NOT store passwords or claim password authentication.
    // We sign in as the non-sensitive demo user or demo session with matching email.
    const session = await this.startDemoSession({
      email: credentials.email.trim(),
    });

    return {
      success: true,
      user: session.user || undefined,
      isDemoNotice: true,
    };
  }

  async simulateRegister(input: RegisterInput): Promise<AuthResult> {
    await new Promise((r) => setTimeout(r, 150));
    const validation = this.validateRegister(input);
    if (!validation.isValid) {
      return {
        success: false,
        error: Object.values(validation.errors)[0] || 'Registration validation failed.',
      };
    }

    // In mock mode, passwords are intentionally discarded and never stored.
    const session = await this.startDemoSession({
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone?.trim() || PREDEFINED_DEMO_USER.phone,
    });

    return {
      success: true,
      user: session.user || undefined,
      isDemoNotice: true,
    };
  }

  async updateProfile(updates: { name: string; phone?: string }): Promise<AuthUser> {
    await new Promise((r) => setTimeout(r, 50));
    const current = this.getStoredUser();
    const updated: AuthUser = {
      ...current,
      name: updates.name.trim() || current.name,
      phone: updates.phone?.trim() || current.phone,
    };
    try {
      sessionStorage.setItem(DEMO_USER_PROFILE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to update demo user profile:', err);
    }
    return updated;
  }
}
