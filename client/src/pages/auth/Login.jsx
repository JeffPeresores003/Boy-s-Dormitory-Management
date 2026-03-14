import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import FormInput from '../../shared/FormInput';
import Loading from '../../shared/Loading';
import WelcomeLoading from '../../shared/WelcomeLoading';

const AnimatedWelcome = () => (
  <div className="flex flex-col items-center justify-center h-full">
    <h2 className="text-5xl font-bold text-center animate-welcome-writing bg-gradient-to-r from-cyan-400 via-yellow-400 via-orange-400 via-pink-400 to-primary-600 bg-clip-text text-transparent" style={{fontFamily: 'cursive'}}>
      Welcome Admin
    </h2>
  </div>
);

const Login = () => {
  const [email, setEmail] = useState(() => localStorage.getItem('loginEmail') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('loginEmail', email);
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both your email address and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Signed in successfully.');
      navigate('/welcome');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 px-4 dark:bg-[#0a1627]">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden pop-bounce" style={{background: 'linear-gradient(135deg, #e0f7fa 0%, #ffffff 100%)'}}>
        {/* Left: Logo and Title with curve */}
        <div className="flex flex-col items-center justify-center md:w-1/2 w-full py-12 px-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-ee-[120px] rounded-se-[120px]">
          <img src="/Bisu.png" alt="BISU Logo" className="w-24 h-24 rounded-full mb-6 object-cover shadow-md border-4 border-white" />
          <h1 className="text-3xl font-bold text-white mb-2">Boy's Dormitory Management System</h1>
          <p className="text-lg text-white/80 mb-1">Bohol Island State University</p>
        </div>
        {/* Right: Login Form or Welcome Animation */}
        <div className="flex flex-col justify-center md:w-1/2 w-full py-12 px-8">
          {showWelcome ? (
            <WelcomeLoading />
          ) : (
            <>
              <h2 className="text-2xl font-bold text-center text-slate-700 mb-8">Login</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <FormInput
                  label={<span className="text-slate-700">Email</span>}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  placeholder="name@example.com"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <FormInput
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      icon={null}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-primary-400"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline">Forgot Password</Link>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-primary-600 to-primary-400 text-white font-semibold text-lg shadow-md hover:from-primary-700 hover:to-primary-500 transition-all"
                  disabled={loading}
                >
                  {loading ? <Loading text="Signing in..." /> : 'Login'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Add keyframes for writing animation in your global CSS:
// @keyframes welcome-writing {
//   0% { width: 0; }
//   100% { width: 100%; }
// }
// .animate-welcome-writing {
//   overflow: hidden;
//   white-space: nowrap;
//   animation: welcome-writing 1.2s steps(20) forwards;
// }

export default Login;
