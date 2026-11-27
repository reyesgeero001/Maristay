import { LogIn } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AuthLayout, authCardClass } from '../components/AuthLayout';
import { Alert, Button, Field, inputClass } from '../components/ui';

/** One login page for all four roles; the role comes from the API response. */
export function LoginPage() {
  const { user, login, sessionMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Set by RegisterPage after a successful sign-up.
  const registered = (location.state as { registered?: string } | null)?.registered;
  const [email, setEmail] = useState(registered ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (!password) return setError('Enter your password.');
    setBusy(true);
    try {
      await login(email.trim(), password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/login' ? from : '/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={submit} className={authCardClass} noValidate>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">Sign in</p>
        <h1 className="mb-1 font-serif text-3xl font-semibold text-navy-800">Welcome to MariStay</h1>
        <p className="mb-6 text-sm text-muted">Guests and hotel staff use the same login.</p>
        {registered && !error && (
          <Alert type="success">Your guest account has been created. Sign in to continue.</Alert>
        )}
        {sessionMessage && !error && !registered && <Alert type="info">{sessionMessage}</Alert>}
        {error && <Alert type="error">{error}</Alert>}
        <div className="space-y-4">
          <Field label="Email" required>
            <input
              className={inputClass}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Password" required>
            <input
              className={inputClass}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          <Button type="submit" busy={busy} className="w-full py-2.5">
            <LogIn className="h-4 w-4" /> Sign in
          </Button>
        </div>
        <p className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">
          New guest?{' '}
          <Link to="/register" className="font-medium text-navy-800 underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-gold-700">
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
