import * as React from 'react';
import { authService } from '@/services';
import type { AuthUser, AuthSession, LoginCredentials, RegisterInput, AuthResult } from '@/services/api/authService';

interface AuthContextValue {
  session: AuthSession;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isDemoSession: boolean;
  loading: boolean;
  error: string | null;
  startDemoSession: (override?: Partial<AuthUser>) => Promise<void>;
  endSession: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  updateProfile: (updates: { name: string; phone?: string }) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = React.useState<AuthSession>({
    user: null,
    isAuthenticated: false,
    isDemoSession: false,
  });
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    async function initSession() {
      try {
        setLoading(true);
        const current = await authService.getCurrentSession();
        if (active) {
          setSession(current);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to retrieve session');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    initSession();
    return () => {
      active = false;
    };
  }, []);

  const startDemoSession = React.useCallback(async (override?: Partial<AuthUser>) => {
    try {
      setLoading(true);
      setError(null);
      const newSession = await authService.startDemoSession(override);
      setSession(newSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start demo session');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const endSession = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await authService.endSession();
      setSession({
        user: null,
        isAuthenticated: false,
        isDemoSession: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = React.useCallback(async (credentials: LoginCredentials) => {
    setError(null);
    const result = await authService.simulateLogin(credentials);
    if (result.success && result.user) {
      setSession({
        user: result.user,
        isAuthenticated: true,
        isDemoSession: true,
      });
    } else if (result.error) {
      setError(result.error);
    }
    return result;
  }, []);

  const register = React.useCallback(async (input: RegisterInput) => {
    setError(null);
    const result = await authService.simulateRegister(input);
    if (result.success && result.user) {
      setSession({
        user: result.user,
        isAuthenticated: true,
        isDemoSession: true,
      });
    } else if (result.error) {
      setError(result.error);
    }
    return result;
  }, []);

  const updateProfile = React.useCallback(async (updates: { name: string; phone?: string }) => {
    if (authService.updateProfile) {
      const updatedUser = await authService.updateProfile(updates);
      setSession((prev) => ({
        ...prev,
        user: updatedUser,
      }));
    }
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      session,
      user: session.user,
      isAuthenticated: session.isAuthenticated,
      isDemoSession: session.isDemoSession,
      loading,
      error,
      startDemoSession,
      endSession,
      login,
      register,
      updateProfile,
    }),
    [session, loading, error, startDemoSession, endSession, login, register, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
