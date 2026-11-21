import * as React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, startDemoSession, isAuthenticated } = useAuth();

  // Return to intended destination if specified, defaulting safely to /account
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/account';

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validation = authService.validateLogin({ email, password });
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result = await login({ email, password });
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setSubmitError(result.error || 'Invalid email or password.');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected login error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSignIn = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await startDemoSession();
      navigate(from, { replace: true });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to launch demo session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] grid grid-cols-1 lg:grid-cols-12 bg-pure-white text-on-pure-white">
      {/* Left Column: Minimal Black Editorial Panel */}
      <aside className="lg:col-span-6 bg-deep-black text-on-deep-black p-6 lg:p-12 xl:p-16 flex flex-col justify-between gap-8">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="font-headline text-xl font-bold tracking-tight text-on-deep-black"
          >
            PATRONET
          </Link>
          <Link
            to="/"
            className="font-label text-sm text-on-surface-dark-elevated hover:text-primary-orange transition-colors"
          >
            Back to store
          </Link>
        </div>

        <div className="hidden lg:flex my-auto flex-col gap-6 max-w-lg">
          <div className="rounded-sm overflow-hidden border border-outline-dark bg-surface-dark-elevated aspect-[16/10]">
            <img
              src="https://lh3.googleusercontent.com/aida/ALJJyrB1Neaw-vo6-82juA4qJyX5sXtojDpBQBWZ5IN_zVZYt3T9b9Yc3flfWncTFnYurWrkqiL2gOplUywN00Mc67jyJ1lUsivyKQ9WHmDVueOObcg8oDoEgUHxEOPAZDlgS44QghU0YoZajwZjp4s9l9IQcJBoOcBqNiaQz4LS42Y5xxbowqQX3Kl4NflipdAhjPbZZoAzk3_Q5uY5kFvMw7oYRJSd3w2nuFrLy6umQK2ctFAoa90IiG5eLr2eCbpaCA"
              alt="PATRONET workstation hardware setup"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="font-headline text-3xl font-bold text-on-deep-black text-balance">
              Your next upgrade starts here.
            </h2>
            <p className="font-body text-base text-on-surface-dark-elevated text-pretty">
              Sign in to manage your saved addresses, track active orders, and access your PATRONET hardware workspace.
            </p>
          </div>
        </div>

        <p className="hidden lg:block font-label text-xs text-on-surface-dark-elevated">
          © 2026 PATRONET. Precision electronics across India.
        </p>
      </aside>

      {/* Right Column: Login Form */}
      <main className="lg:col-span-6 bg-pure-white text-on-pure-white p-6 md:p-12 xl:p-16 flex items-center justify-center">
        <div className="w-full max-w-md flex flex-col gap-8">
          <div>
            <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-pure-white">
              Welcome back.
            </h1>
            <p className="font-body text-base text-muted-gray mt-1">
              Enter your email and password to sign in.
            </p>
          </div>

          {/* Demo Mode Notice */}
          <div className="p-4 rounded-sm bg-light-gray border border-outline-subtle flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-label text-xs font-bold uppercase tracking-wider text-accent-orange-text">
                Mock Mode Active
              </span>
              <span className="text-xs text-muted-gray">No real credentials stored</span>
            </div>
            <p className="font-body text-xs text-muted-gray">
              Real authentication is disconnected in mock mode. You can test form validation or click below to enter directly as our predefined demo customer (Aarav Mehta).
            </p>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDemoSignIn}
              className="mt-1 w-full py-2.5 px-4 rounded-sm bg-deep-black text-on-deep-black font-label text-sm font-semibold hover:bg-surface-dark-elevated transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>Continue as Demo Customer (Aarav Mehta)</span>
              <ArrowRight className="w-4 h-4 text-primary-orange" />
            </button>
          </div>

          {/* Submission Error Banner */}
          {submitError && (
            <div
              className="p-4 rounded-sm border border-primary-orange bg-primary-orange-tint flex items-start gap-3"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 text-accent-orange-text shrink-0 mt-0.5" />
              <p className="font-body text-sm text-on-pure-white">{submitError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="font-label text-sm font-semibold text-on-pure-white">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="aarav@mehta.in"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }
                }}
                className={`w-full px-3.5 py-3 rounded-sm border bg-pure-white font-body text-sm text-on-pure-white placeholder:text-muted-gray focus:outline-none ${
                  fieldErrors.email
                    ? 'border-red-600 focus:ring-1 focus:ring-red-600'
                    : 'border-outline-subtle focus:border-deep-black'
                }`}
              />
              {fieldErrors.email && (
                <span className="font-label text-xs text-accent-orange-text">{fieldErrors.email}</span>
              )}
            </div>

            {/* Password with Visibility Toggle */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="font-label text-sm font-semibold text-on-pure-white">
                  Password
                </label>
                <span className="text-xs text-muted-gray">Demo mode (not sent to server)</span>
              </div>
              <div className="relative flex items-center">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: '' }));
                    }
                  }}
                  className={`w-full pl-3.5 pr-11 py-3 rounded-sm border bg-pure-white font-body text-sm text-on-pure-white placeholder:text-muted-gray focus:outline-none ${
                    fieldErrors.password
                      ? 'border-red-600 focus:ring-1 focus:ring-red-600'
                      : 'border-outline-subtle focus:border-deep-black'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 inline-flex items-center justify-center w-8 h-8 text-muted-gray hover:text-on-pure-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <span className="font-label text-xs text-accent-orange-text">{fieldErrors.password}</span>
              )}
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-sm bg-primary-orange text-deep-black font-label text-sm font-bold hover:bg-primary-orange-hover disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Navigation to Registration */}
          <div className="pt-4 border-t border-outline-subtle text-center">
            <p className="font-body text-sm text-muted-gray">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-orange font-semibold hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
export default LoginPage;
