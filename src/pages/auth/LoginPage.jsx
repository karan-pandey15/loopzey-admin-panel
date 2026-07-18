import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { login, sendLoginOtp, verifyLoginOtp } from '../../api/auth';
import AuthLayout from '../../components/AuthLayout';
import FormField from '../../components/FormField';
import SubmitButton from '../../components/SubmitButton';
import useAuth from '../../hooks/useAuth';

const initialForm = {
  email: '',
  otp: '',
  password: '',
};

function requestErrorMessage(error, fallback) {
  return (
    error.response?.data?.responseMessage ||
    error.response?.data?.message ||
    error.response?.data?.title ||
    (error.response?.status ? `${fallback} (status ${error.response.status}).` : fallback)
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, startSession } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard" />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      if (step === 'email') {
        const email = form.email.trim().toLowerCase();
        await sendLoginOtp(email);
        setForm((current) => ({ ...current, email }));
        setStep('otp');
        setMessage(`A verification code was sent to ${email}.`);
        return;
      }

      if (step === 'otp') {
        const otp = form.otp.trim();
        if (otp.length < 4) {
          setError('Enter the complete verification code.');
          return;
        }

        await verifyLoginOtp({ email: form.email, otp });
        setStep('password');
        setMessage('Email verified. Enter your password to continue.');
        return;
      }

      const response = await login({
        userName: form.email,
        password: form.password,
      });
      const payload = response.data?.data ?? response.data;
      const { token, user } = payload || {};

      if (!token || !user) {
        throw new Error('The login response did not contain a session.');
      }

      startSession(token, user);
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(
        requestErrorMessage(
          requestError,
          step === 'email'
            ? 'Unable to send the verification code'
            : step === 'otp'
              ? 'The verification code could not be verified'
              : 'Unable to sign in',
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function resendOtp() {
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      await sendLoginOtp(form.email);
      setMessage(`A new verification code was sent to ${form.email}.`);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Unable to resend the verification code'));
    } finally {
      setIsLoading(false);
    }
  }

  function changeEmail() {
    setStep('email');
    setForm((current) => ({ ...current, otp: '', password: '' }));
    setError('');
    setMessage('');
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <p className="text-sm font-semibold text-yellow-300">Welcome back</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          Sign in to your account
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Verify your email before entering your administrator password.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2" aria-label="Login progress">
        {[
          { id: 'email', label: 'Email', icon: Mail },
          { id: 'otp', label: 'Verify', icon: ShieldCheck },
          { id: 'password', label: 'Password', icon: KeyRound },
        ].map(({ icon: Icon, id, label }, index) => {
          const activeIndex = ['email', 'otp', 'password'].indexOf(step);
          const isComplete = index < activeIndex;
          const isActive = id === step;

          return (
            <div
              className={`rounded-xl border px-2 py-3 text-center transition ${
                isActive
                  ? 'border-yellow-400 bg-yellow-400/10 text-yellow-700 dark:text-yellow-300'
                  : isComplete
                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 text-slate-400 dark:border-slate-700'
              }`}
              key={id}
            >
              {isComplete ? (
                <CheckCircle2 className="mx-auto size-4" />
              ) : (
                <Icon className="mx-auto size-4" />
              )}
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide">
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {step === 'email' ? (
          <FormField
            autoComplete="email"
            id="email"
            label="Email address"
            onChange={handleChange}
            placeholder="admin@example.com"
            required
            type="email"
            value={form.email}
          />
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400">Signing in as</p>
              <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                {form.email}
              </p>
            </div>
            <button
              className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-yellow-700 hover:bg-yellow-400/10 dark:text-yellow-300"
              disabled={isLoading}
              onClick={changeEmail}
              type="button"
            >
              Change
            </button>
          </div>
        )}

        {step === 'otp' && (
          <>
            <FormField
              autoComplete="one-time-code"
              id="otp"
              label="Verification code"
              onChange={handleChange}
              placeholder="Enter the OTP from your email"
              required
              value={form.otp}
            />
            <div className="-mt-2 text-right">
              <button
                className="min-h-10 px-1 text-xs font-semibold text-yellow-700 hover:text-yellow-600 disabled:opacity-50 dark:text-yellow-300"
                disabled={isLoading}
                onClick={resendOtp}
                type="button"
              >
                Resend verification code
              </button>
            </div>
          </>
        )}

        {step === 'password' && (
          <FormField
            autoComplete="current-password"
            id="password"
            label="Password"
            onChange={handleChange}
            placeholder="Enter your administrator password"
            required
            type="password"
            value={form.password}
          />
        )}

        {error && (
          <div
            className="flex gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200"
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div
            className="flex gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-700 dark:text-emerald-200"
            role="status"
          >
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <SubmitButton isLoading={isLoading}>
          {step === 'email'
            ? 'Send verification code'
            : step === 'otp'
              ? 'Verify code'
              : 'Sign in'}
        </SubmitButton>
      </form>

      <p className="mt-7 text-center text-sm text-slate-400">
        Need an administrator account?{' '}
        <Link
          className="inline-flex min-h-11 items-center px-1 font-semibold text-yellow-600 hover:text-yellow-500 dark:text-yellow-300 dark:hover:text-yellow-200"
          to="/signup"
        >
          Register
        </Link>
      </p>
    </AuthLayout>
  );
}
