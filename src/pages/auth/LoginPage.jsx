import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { login } from '../../api/auth';
import AuthLayout from '../../components/AuthLayout';
import FormField from '../../components/FormField';
import SubmitButton from '../../components/SubmitButton';
import useAuth from '../../hooks/useAuth';

const initialForm = {
  userName: '',
  password: '',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, startSession } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard" />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await login(form);
      const { token, user } = response.data.data;

      if (!token || !user) {
        throw new Error('The login response did not contain a session.');
      }

      startSession(token, user);
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      const status = requestError.response?.status;
      setError(
        status
          ? `Login request failed with status ${status}.`
          : 'Unable to reach the server. Check your connection and try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <p className="text-sm font-semibold text-yellow-300">Welcome back</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          Sign in to your account
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Enter your administrator credentials to continue.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <FormField
          autoComplete="username"
          id="userName"
          label="Username"
          onChange={handleChange}
          placeholder="Enter your username"
          required
          value={form.userName}
        />
        <FormField
          autoComplete="current-password"
          id="password"
          label="Password"
          onChange={handleChange}
          placeholder="Enter your password"
          required
          type="password"
          value={form.password}
        />

        {error && (
          <div
            className="flex gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200"
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <SubmitButton isLoading={isLoading}>Sign in</SubmitButton>
      </form>

      <p className="mt-7 text-center text-sm text-slate-400">
        Need an administrator account?{' '}
        <Link className="font-semibold text-yellow-300 hover:text-yellow-200" to="/signup">
          Register
        </Link>
      </p>
    </AuthLayout>
  );
}
