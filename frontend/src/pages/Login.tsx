import { useState } from 'react';
import type { AxiosError } from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/store/authStore';
import { getDashboardPath } from '@/utils/routes';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  function getLoginErrorMessage(loginError: unknown) {
    if (typeof loginError === 'object' && loginError !== null) {
      const axiosError = loginError as AxiosError;
      const responseData = axiosError.response?.data;

      if (
        typeof responseData === 'object' &&
        responseData !== null &&
        'detail' in (responseData as Record<string, unknown>) &&
        typeof (responseData as Record<string, unknown>).detail === 'string'
      ) {
        return (responseData as Record<string, string>).detail;
      }

      if (axiosError.response) {
        return `Sign-in failed with server error (${axiosError.response.status}).`;
      }
    }

    if (typeof loginError === 'object' && loginError !== null && 'request' in loginError) {
      return 'Unable to reach the server. Check the deployment configuration and try again.';
    }

    return 'Sign-in failed. Try again.';
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      navigate(getDashboardPath(user.role), { replace: true });
    } catch (loginError) {
      setError(getLoginErrorMessage(loginError));
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section
        className="relative hidden overflow-hidden bg-primary px-12 py-16 text-white lg:flex lg:flex-col lg:justify-between"
        style={{
          backgroundImage:
            'radial-gradient(circle at top right, rgba(255,255,255,0.10), transparent 35%), linear-gradient(135deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(45deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: 'auto, 28px 28px, 28px 28px',
        }}
      >
        <div>
          <div className="text-[36px] font-bold">Student Hub</div>
          <p className="mt-4 max-w-md text-lg text-surface/90">Your academic life, organized.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {['Students', 'Professors', 'Administrators'].map((role) => (
            <span key={role} className="rounded-full border border-white/25 px-4 py-2 text-sm font-medium">
              {role}
            </span>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center bg-white px-4 py-12">
        <div className="w-full max-w-md">
          <div className="app-card p-8">
            <h1 className="text-[28px]">Sign in</h1>
            <p className="mt-2 text-sm text-text-secondary">Use your Student Hub account credentials.</p>
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input w-full"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input w-full pr-12"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error ? <div className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div> : null}
              <button type="submit" className="btn-primary w-full justify-center" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
              <div className="flex items-center justify-between gap-3 text-sm text-text-secondary">
                <Link to="/register" className="font-medium text-primary-light">
                  Create student account
                </Link>
                <a href="#" className="font-medium text-primary-light">
                  Forgot password?
                </a>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
