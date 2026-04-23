import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { getPublicMajors } from '@/api/public';
import { Spinner } from '@/components/common/Spinner';
import { useApiQuery } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';
import { getDashboardPath } from '@/utils/routes';

export function RegisterPage() {
  const navigate = useNavigate();
  const registerStudent = useAuthStore((state) => state.registerStudent);
  const isLoading = useAuthStore((state) => state.isLoading);
  const majorsQuery = useApiQuery(['public-majors'], getPublicMajors);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [majorId, setMajorId] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const user = await registerStudent({
        full_name: fullName,
        email,
        major_id: majorId,
        password,
        password_confirmation: passwordConfirmation,
      });
      navigate(getDashboardPath(user.role), { replace: true });
    } catch (registrationError) {
      const detail =
        typeof registrationError === 'object' &&
        registrationError !== null &&
        'response' in registrationError &&
        typeof registrationError.response === 'object' &&
        registrationError.response !== null &&
        'data' in registrationError.response &&
        typeof registrationError.response.data === 'object' &&
        registrationError.response.data !== null &&
        'detail' in registrationError.response.data &&
        typeof registrationError.response.data.detail === 'string'
          ? registrationError.response.data.detail
          : 'Registration failed.';
      setError(detail);
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
          <p className="mt-4 max-w-md text-lg text-surface/90">Create your student account and start using the platform.</p>
        </div>
        <div className="space-y-3 text-sm text-surface/85">
          <p>New public registrations are always created as student accounts.</p>
          <p>Professor accounts are created from the admin panel only.</p>
        </div>
      </section>

      <section className="flex items-center justify-center bg-white px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="app-card p-8">
            <h1 className="text-[28px]">Create student account</h1>
            <p className="mt-2 text-sm text-text-secondary">Choose your major. Your student profile will be created automatically.</p>

            {majorsQuery.isLoading ? (
              <div className="mt-8">
                <Spinner label="Loading majors..." />
              </div>
            ) : (
              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-primary" htmlFor="full_name">
                    Full name
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    className="form-input w-full"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-text-primary" htmlFor="register_email">
                    Email
                  </label>
                  <input
                    id="register_email"
                    type="email"
                    className="form-input w-full"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-text-primary" htmlFor="major_id">
                    Major
                  </label>
                  <select
                    id="major_id"
                    className="form-input w-full"
                    value={majorId}
                    onChange={(event) => setMajorId(event.target.value)}
                    required
                  >
                    <option value="">Select your major</option>
                    {majorsQuery.data?.map((major) => (
                      <option key={major.id} value={major.id}>
                        {major.code} - {major.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-text-primary" htmlFor="register_password">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="register_password"
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

                <div>
                  <label className="mb-2 block text-sm font-medium text-text-primary" htmlFor="register_password_confirmation">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="register_password_confirmation"
                      type={showPasswordConfirmation ? 'text' : 'password'}
                      className="form-input w-full pr-12"
                      value={passwordConfirmation}
                      onChange={(event) => setPasswordConfirmation(event.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
                      onClick={() => setShowPasswordConfirmation((value) => !value)}
                    >
                      {showPasswordConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error ? <div className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div> : null}

                <button type="submit" className="btn-primary w-full justify-center" disabled={isLoading || majorsQuery.isLoading}>
                  {isLoading ? 'Creating account...' : 'Create student account'}
                </button>

                <div className="text-sm text-text-secondary">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-primary-light">
                    Sign in
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
