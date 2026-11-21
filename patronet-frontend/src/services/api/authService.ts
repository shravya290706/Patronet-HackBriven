export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isDemoUser: boolean;
}

export interface AuthSession {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isDemoSession: boolean;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone?: string;
  password?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  isDemoNotice?: boolean;
}

export interface IAuthService {
  getCurrentSession(): Promise<AuthSession>;
  startDemoSession(userOverride?: Partial<AuthUser>): Promise<AuthSession>;
  endSession(): Promise<void>;
  validateLogin(credentials: LoginCredentials): { isValid: boolean; errors: Record<string, string> };
  validateRegister(input: RegisterInput): { isValid: boolean; errors: Record<string, string> };
  simulateLogin(credentials: LoginCredentials): Promise<AuthResult>;
  simulateRegister(input: RegisterInput): Promise<AuthResult>;
  updateProfile?(updates: { name: string; phone?: string }): Promise<AuthUser>;
}
