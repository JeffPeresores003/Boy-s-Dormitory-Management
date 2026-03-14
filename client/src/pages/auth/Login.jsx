import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [formError, setFormError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const errorSummaryRef = useRef(null);

  const validate = () => {
    const nextErrors = { email: '', password: '' };
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      nextErrors.email = 'Enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = 'Enter a valid email format, such as name@example.com.';
    }

    if (!password) {
      nextErrors.password = 'Enter your password.';
    }

    return nextErrors;
  };

  const focusFirstInvalid = (nextErrors) => {
    if (nextErrors.email) {
      emailRef.current?.focus();
      return;
    }
    if (nextErrors.password) {
      passwordRef.current?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    setFormError('');

    if (nextErrors.email || nextErrors.password) {
      if (nextErrors.email && nextErrors.password) {
        errorSummaryRef.current?.focus();
      }
      focusFirstInvalid(nextErrors);
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Signed in successfully.');
      navigate('/admin');
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to sign in.';
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-white/50">
        <div className="text-center mb-8">
          <img src="/Bisu.png" alt="BISU Logo" className="w-20 h-20 rounded-full mx-auto mb-3 object-cover shadow-md ring-2 ring-primary-200" />
          <h1 className="text-2xl font-bold text-primary-800">BISU Boy&apos;s Dormitory</h1>
          <p className="text-sm text-gray-500 mt-1">Dormitory Management System</p>
          <p className="text-xs text-gray-400 mt-0.5">Bohol Island State University</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {(errors.email || errors.password) && (
            <div
              ref={errorSummaryRef}
              tabIndex={-1}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3"
              aria-labelledby="login-error-summary-title"
            >
              <p id="login-error-summary-title" className="text-sm font-semibold text-red-700">Please correct the highlighted fields.</p>
              <ul className="mt-2 space-y-1 text-sm text-red-700">
                {errors.email && (
                  <li>
                    <a
                      href="#login-email"
                      className="underline"
                      onClick={(event) => {
                        event.preventDefault();
                        emailRef.current?.focus();
                      }}
                    >
                      {errors.email}
                    </a>
                  </li>
                )}
                {errors.password && (
                  <li>
                    <a
                      href="#login-password"
                      className="underline"
                      onClick={(event) => {
                        event.preventDefault();
                        passwordRef.current?.focus();
                      }}
                    >
                      {errors.password}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}

          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              ref={emailRef}
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email || formError) {
                  setErrors((prev) => ({ ...prev, email: '' }));
                  setFormError('');
                }
              }}
              onBlur={() => {
                if (!errors.email) return;
                const nextErrors = validate();
                setErrors((prev) => ({ ...prev, email: nextErrors.email }));
              }}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="name@example.com"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'login-email-error' : 'login-email-caption'}
            />
            {errors.email ? (
              <p id="login-email-error" className="mt-1 text-sm text-red-600">{errors.email}</p>
            ) : (
              <p id="login-email-caption" className="mt-1 text-xs text-gray-500">Use the email address assigned to your dormitory account.</p>
            )}
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                ref={passwordRef}
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password || formError) {
                    setErrors((prev) => ({ ...prev, password: '' }));
                    setFormError('');
                  }
                }}
                onBlur={() => {
                  if (!errors.password) return;
                  const nextErrors = validate();
                  setErrors((prev) => ({ ...prev, password: nextErrors.password }));
                }}
                className={`w-full px-4 py-2.5 pr-11 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="••••••••"
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'login-password-error' : 'login-password-caption'}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-primary-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password ? (
              <p id="login-password-error" className="mt-1 text-sm text-red-600">{errors.password}</p>
            ) : (
              <p id="login-password-caption" className="mt-1 text-xs text-gray-500">Your password is case-sensitive.</p>
            )}
          </div>
          {formError && (
            <p className="-mt-1 text-sm font-medium text-red-600" role="alert">
              {formError}
            </p>
          )}
          <button
            type="submit"
            aria-busy={loading ? 'true' : 'false'}
            className="w-full py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-sm inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 rounded-full border-2 border-white/35 border-t-white animate-spin" aria-hidden="true" />
                Signing in...
              </>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline">
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
