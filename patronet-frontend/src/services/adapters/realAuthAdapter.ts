import type {
  IAuthService,
  AuthSession,
  LoginCredentials,
  RegisterInput,
  AuthResult,
} from '../api/authService';

/**
 * RealAuthAdapter
 * Integration boundary for real backend authentication.
 * When FastAPI auth endpoints are ready, this handles POST /api/v1/auth/login, etc.
 */
export class RealAuthAdapter implements IAuthService {
  async getCurrentSession(): Promise<AuthSession> {
    throw new Error('RealAuthAdapter: Backend session endpoint not connected.');
  }

  async startDemoSession(): Promise<AuthSession> {
    throw new Error('RealAuthAdapter: Demo sessions only available in mock mode.');
  }

  async endSession(): Promise<void> {
    throw new Error('RealAuthAdapter: Backend logout endpoint not connected.');
  }

  validateLogin(_credentials: LoginCredentials) {
    return { isValid: true, errors: {} };
  }

  validateRegister(_input: RegisterInput) {
    return { isValid: true, errors: {} };
  }

  async simulateLogin(_credentials: LoginCredentials): Promise<AuthResult> {
    throw new Error('RealAuthAdapter: Backend login endpoint not connected.');
  }

  async simulateRegister(_input: RegisterInput): Promise<AuthResult> {
    throw new Error('RealAuthAdapter: Backend register endpoint not connected.');
  }
}
