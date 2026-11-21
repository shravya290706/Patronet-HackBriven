import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, startDemoSession, isAuthenticated } = useAuth();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/account', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validation = authService.validateRegister({ name, email, password });
    const errors = { ...validation.errors };

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result = await register({ name, email, phone, password });
      if (result.success) {
        navigate('/account', { replace: true });
      } else {
        setSubmitError(result.error || 'Failed to complete demo registration.');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSignIn = async () => {
    setIsSubmitting(true);
    try {
      await startDemoSession();
      navigate('/account', { replace: true });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to launch demo session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] grid grid-cols-1 lg:grid-cols-12 bg-pure-white text-on-pure-white">
      {/* Left Column: Editorial Brand Panel */}
      <aside className="lg:col-span-6 bg-deep-black text-on-deep-black p-6 lg:p-12 xl:p-16 flex flex-col justify-between gap-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="font-headline text-xl font-bold tracking-tight text-on-deep-black">
            PATRONET
          </Link>
          <Link to="/" className="font-label text-sm text-on-surface-dark-elevated hover:text-primary-orange transition-colors">
            Back to store
          </Link>
        </div>

        <div className="hidden lg:flex my-auto flex-col gap-6 max-w-lg">
          <div className="rounded-sm overflow-hidden border border-outline-dark bg-surface-dark-elevated aspect-[16/10]">
            <img
              src="https://lh3.googleusercontent.com/aida/ALJJyrDCh-B-ofs66ox8sUeVIqGZPPT9cj3FGzttB3ML3AMb7tdxlNhnJVnKac0lOyF6scTxTeH8KxPs7qyhKMKG6wuLPQb-Wniyhs36vpyswx-xeoAaZ7VOKhleK6AlZibc-YR1dvOM1Xz-lPZNXMpUWG5_B1DtrWoaOdmYnqVF8Ets9_deAafF0VjnB5kqxaOu6iXQpivQP2uazQrLDbB_Qnxd7rvD0v9nzd0EI0tRxFyE77mughKrhNmb9Lx9pFaK3xkr"
              alt="PATRONET precision hardware lineup"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="font-headline text-3xl font-bold text-on-deep-black text-balance">
              Your next upgrade starts here.
            </h2>
            <p className="font-body text-base text-on-surface-dark-elevated text-pretty">
              Create a PATRONET account for faster checkout, saved delivery addresses, and direct order history access.
            </p>
          </div>
        </div>

        <p className="hidden lg:block font-label text-xs text-on-surface-dark-elevated">
          © 2026 PATRONET. Precision electronics across India.
        </p>
      </aside>

      {/* Right Column: Registration Form */}
      <main className="lg:col-span-6 bg-pure-white text-on-pure-white p-6 md:p-12 xl:p-16 flex items-center justify-center">
        <div className="w-full max-w-md flex flex-col gap-6">
          <div>
            <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-pure-white">
              Create your account.
            </h1>
            <p className="font-body text-base text-muted-gray mt-1">
              Fill in your details to get started.
            </p>
          </div>

          {/* Demo Mode Notice */}
          <div className="p-4 rounded-sm bg-light-gray border border-outline-subtle flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-label text-xs font-bold uppercase tracking-wider text-accent-orange-text">
                Mock Mode Active
              </span>
              <span className="text-xs text-muted-gray">No passwords stored</span>
            </div>
            <p className="font-body text-xs text-muted-gray">
              Mock registration validates your inputs and starts a demo session with your name/email. Passwords are never sent or saved.
            </p>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDemoSignIn}
              className="mt-1 w-full py-2 px-3 rounded-sm border border-outline-subtle bg-pure-white text-on-pure-white font-label text-xs font-semibold hover:border-deep-black transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <span>Quick Demo Session (Aarav Mehta)</span>
              <ArrowRight className="w-3.5 h-3.5 text-primary-orange" />
            </button>
          </div>

          {/* Submission Error Banner */}
          {submitError && (
            <div className="p-4 rounded-sm border border-primary-orange bg-primary-orange-tint flex items-start gap-3" role="alert">
              <AlertCircle className="w-5 h-5 text-accent-orange-text shrink-0 mt-0.5" />
              <p className="font-body text-sm text-on-pure-white">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-name" className="font-label text-sm font-semibold text-on-pure-white">
                Full name
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                placeholder="Aarav Mehta"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                }}
                className={`w-full px-3.5 py-2.5 rounded-sm border bg-pure-white font-body text-sm text-on-pure-white placeholder:text-muted-gray focus:outline-none ${
                  fieldErrors.name ? 'border-red-600 focus:ring-1 focus:ring-red-600' : 'border-outline-subtle focus:border-deep-black'
                }`}
              />
              {fieldErrors.name && (
                <span className="font-label text-xs text-accent-orange-text">{fieldErrors.name}</span>
              )}
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-email" className="font-label text-sm font-semibold text-on-pure-white">
                Email address
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="aarav@mehta.in"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                }}
                className={`w-full px-3.5 py-2.5 rounded-sm border bg-pure-white font-body text-sm text-on-pure-white placeholder:text-muted-gray focus:outline-none ${
                  fieldErrors.email ? 'border-red-600 focus:ring-1 focus:ring-red-600' : 'border-outline-subtle focus:border-deep-black'
                }`}
              />
              {fieldErrors.email && (
                <span className="font-label text-xs text-accent-orange-text">{fieldErrors.email}</span>
              )}
            </div>

            {/* Phone (Optional) */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-phone" className="font-label text-sm font-semibold text-on-pure-white">
                Phone number <span className="text-muted-gray font-normal">(optional)</span>
              </label>
              <input
                id="reg-phone"
                type="tel"
                placeholder="+91 98201 44512"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-sm border border-outline-subtle bg-pure-white font-body text-sm text-on-pure-white placeholder:text-muted-gray focus:outline-none focus:border-deep-black"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-password" className="font-label text-sm font-semibold text-on-pure-white">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  className={`w-full pl-3.5 pr-11 py-2.5 rounded-sm border bg-pure-white font-body text-sm text-on-pure-white placeholder:text-muted-gray focus:outline-none ${
                    fieldErrors.password ? 'border-red-600 focus:ring-1 focus:ring-red-600' : 'border-outline-subtle focus:border-deep-black'
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

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-confirm" className="font-label text-sm font-semibold text-on-pure-white">
                Confirm password
              </label>
              <div className="relative flex items-center">
                <input
                  id="reg-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                  className={`w-full pl-3.5 pr-11 py-2.5 rounded-sm border bg-pure-white font-body text-sm text-on-pure-white placeholder:text-muted-gray focus:outline-none ${
                    fieldErrors.confirmPassword ? 'border-red-600 focus:ring-1 focus:ring-red-600' : 'border-outline-subtle focus:border-deep-black'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 inline-flex items-center justify-center w-8 h-8 text-muted-gray hover:text-on-pure-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <span className="font-label text-xs text-accent-orange-text">{fieldErrors.confirmPassword}</span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full py-3.5 px-6 rounded-sm bg-primary-orange text-deep-black font-label text-sm font-bold hover:bg-primary-orange-hover disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          {/* Navigation to Login */}
          <div className="pt-4 border-t border-outline-subtle text-center">
            <p className="font-body text-sm text-muted-gray">
              Already registered?{' '}
              <Link to="/login" className="text-primary-orange font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
export default RegisterPage;
