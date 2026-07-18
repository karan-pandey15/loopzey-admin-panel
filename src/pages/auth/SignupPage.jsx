import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { registerAdmin } from '../../api/auth';
import AuthLayout from '../../components/AuthLayout';
import FormField from '../../components/FormField';
import SubmitButton from '../../components/SubmitButton';

const initialForm = {
  username: '',
  email: '',
  mobileNo: '',
  password: '',
};

export default function SignupPage() {
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSuccessful(false);
    setIsLoading(true);

    try {
      await registerAdmin(form);
      setForm(initialForm);
      setIsSuccessful(true);
    } catch (requestError) {
      const status = requestError.response?.status;
      setError(
        status
          ? `Registration request failed with status ${status}.`
          : 'Unable to reach the server. Check your connection and try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <p className="text-sm font-semibold text-yellow-300">Administrator access</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          Create an admin account
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Register an account for the Loopzey administration workspace.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField
          autoComplete="username"
          id="username"
          label="Username"
          onChange={handleChange}
          placeholder="Choose a username"
          required
          value={form.username}
        />
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
        <FormField
          autoComplete="tel"
          id="mobileNo"
          label="Mobile number"
          onChange={handleChange}
          placeholder="Enter your mobile number"
          required
          type="tel"
          value={form.mobileNo}
        />
        <FormField
          autoComplete="new-password"
          id="password"
          label="Password"
          onChange={handleChange}
          placeholder="Create a password"
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

        {isSuccessful && (
          <div
            className="flex gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200"
            role="status"
          >
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>Administrator registration request completed successfully.</span>
          </div>
        )}

        <div className="pt-1">
          <SubmitButton isLoading={isLoading}>Create account</SubmitButton>
        </div>
      </form>

      <p className="mt-7 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link className="font-semibold text-yellow-300 hover:text-yellow-200" to="/login">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
