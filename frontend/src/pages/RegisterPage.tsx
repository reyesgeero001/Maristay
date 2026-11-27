import { Eye, EyeOff, ShieldCheck, UserPlus } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { errorMessage } from '../api/client';
import { guestsApi } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { AuthLayout, authCardClass } from '../components/AuthLayout';
import { Alert, Button, RequiredMark, inputClass } from '../components/ui';

/*
 * Same rules as the backend CreateGuestDto (src/guests/dto/create-guest.dto.ts
 * and src/common/dto/person-fields.ts). The browser check is only for quick
 * feedback: the API validates everything again.
 */
const NAME_REGEX = /^[\p{L}][\p{L} .'-]*$/u;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const PHONE_REGEX = /^\+?\d{7,15}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

type FieldName = 'firstName' | 'lastName' | 'email' | 'phoneNumber' | 'password' | 'confirmPassword';
type Form = Record<FieldName, string>;
const EMPTY: Form = { firstName: '', lastName: '', email: '', phoneNumber: '', password: '', confirmPassword: '' };

function validate(f: Form): Partial<Record<FieldName, string>> {
  const errors: Partial<Record<FieldName, string>> = {};
  const name = (value: string, what: string) => {
    const v = value.trim();
    if (!v) return `Enter your ${what}.`;
    if (v.length > 50) return `${what[0].toUpperCase()}${what.slice(1)} must be at most 50 characters.`;
    if (!NAME_REGEX.test(v)) return 'Use letters, spaces, periods, apostrophes and hyphens only.';
  };
  errors.firstName = name(f.firstName, 'first name');
  errors.lastName = name(f.lastName, 'last name');

  const email = f.email.trim();
  if (!email) errors.email = 'Enter your email address.';
  else if (!EMAIL_REGEX.test(email) || email.length > 100) errors.email = 'Enter a valid email address.';

  const phone = f.phoneNumber.replace(/[\s-]/g, '');
  if (!phone) errors.phoneNumber = 'Enter your phone number.';
  else if (!PHONE_REGEX.test(phone)) errors.phoneNumber = 'Use 7–15 digits, optionally starting with +.';

  if (!f.password) errors.password = 'Enter a password.';
  else if (!PASSWORD_REGEX.test(f.password))
    errors.password = 'Use 8–72 characters with at least one letter and one number.';

  if (!f.confirmPassword) errors.confirmPassword = 'Confirm your password.';
  else if (f.confirmPassword !== f.password) errors.confirmPassword = 'Passwords do not match.';

  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v)) as Partial<Record<FieldName, string>>;
}

/**
 * Public guest self-registration (POST /guests). The request has no role
 * field: the backend always creates a GUEST account and rejects unknown
 * properties, so staff accounts can only be created by a manager.
 */
export function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const set = (field: FieldName) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const email = form.email.trim().toLowerCase();
      await guestsApi.register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email,
        phoneNumber: form.phoneNumber.replace(/[\s-]/g, ''),
        password: form.password,
      });
      navigate('/login', { replace: true, state: { registered: email } });
    } catch (err) {
      setServerError(errorMessage(err));
      setBusy(false);
    }
  };

  /*
   * Each input has an explicit <label htmlFor>. The hint or error is linked
   * with aria-describedby and kept outside the label, so the input's
   * accessible name stays just "First name", "Password", etc.
   */
  const field = (
    name: FieldName,
    text: string,
    props: React.InputHTMLAttributes<HTMLInputElement>,
    opts: { hint?: string; reveal?: { shown: boolean; toggle: () => void } } = {},
  ): ReactNode => {
    const err = errors[name];
    const note = err ?? opts.hint;
    const { reveal } = opts;
    return (
      <div className="text-sm">
        {/* The marker sits outside <label> so the label text stays exactly "First name", "Password", … */}
        <div className="mb-1 flex items-baseline">
          <label htmlFor={`reg-${name}`} className="font-medium text-navy-800">
            {text}
          </label>
          <RequiredMark />
        </div>
        <div className="relative">
          <input
            id={`reg-${name}`}
            className={`${inputClass} ${reveal ? 'pr-10' : ''} ${err ? 'border-red-400' : ''}`}
            value={form[name]}
            onChange={set(name)}
            aria-invalid={err ? true : undefined}
            aria-describedby={note ? `reg-${name}-note` : undefined}
            disabled={busy}
            required
            {...props}
            type={reveal ? (reveal.shown ? 'text' : 'password') : props.type}
          />
          {reveal && (
            <button
              type="button"
              onClick={reveal.toggle}
              aria-label={`${reveal.shown ? 'Hide' : 'Show'} ${text.toLowerCase()}`}
              aria-pressed={reveal.shown}
              className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-3 text-slate-400 hover:text-navy-800"
            >
              {reveal.shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {note && (
          <span id={`reg-${name}-note`} className={`mt-1 block text-xs ${err ? 'text-red-600' : 'text-muted'}`}>
            {note}
          </span>
        )}
      </div>
    );
  };

  return (
    <AuthLayout wide>
      <form onSubmit={submit} className={authCardClass} noValidate>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">Guest sign-up</p>
        <h1 className="mb-1 font-serif text-3xl font-semibold text-navy-800">Create a guest account</h1>
        <p className="mb-4 text-sm text-muted">Book rooms, check in digitally and request services.</p>
        <p className="mb-5 flex items-start gap-2 rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-xs text-navy-800">
          <ShieldCheck className="mt-px h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" />
          <span>
            Public registration always creates a <strong>Guest</strong> account. Hotel staff accounts are created by a manager.
          </span>
        </p>
        {serverError && <Alert type="error">{serverError}</Alert>}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {field('firstName', 'First name', { autoComplete: 'given-name', maxLength: 50 })}
            {field('lastName', 'Last name', { autoComplete: 'family-name', maxLength: 50 })}
          </div>
          {field('email', 'Email address', { type: 'email', autoComplete: 'email', maxLength: 100 })}
          {field('phoneNumber', 'Phone number', { type: 'tel', autoComplete: 'tel', maxLength: 20 }, {
            hint: 'For example 09171234567 or +639171234567.',
          })}
          {field('password', 'Password', { autoComplete: 'new-password', maxLength: 72 }, {
            hint: '8–72 characters, at least one letter and one number.',
            reveal: { shown: showPassword, toggle: () => setShowPassword((v) => !v) },
          })}
          {field('confirmPassword', 'Confirm password', { autoComplete: 'new-password', maxLength: 72 }, {
            reveal: { shown: showConfirm, toggle: () => setShowConfirm((v) => !v) },
          })}
          <p className="text-xs text-muted">
            <RequiredMark /> Required field
          </p>
          <Button type="submit" busy={busy} className="w-full py-2.5">
            <UserPlus className="h-4 w-4" /> {busy ? 'Creating account…' : 'Sign up'}
          </Button>
        </div>
        <p className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-navy-800 underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-gold-700">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
