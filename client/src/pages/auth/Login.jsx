import { useState, useEffect, useRef } from 'react';
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
  const canvasRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('loginEmail', email);
  }, [email]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+=<>?@';
    const fontSize = 16;
    let animationId;
    let drops = [];

    const setup = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const columns = Math.max(1, Math.floor(canvas.width / fontSize));
      drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -40));
    };

    const draw = () => {
      // Semi-transparent fill keeps the trailing matrix effect.
      ctx.fillStyle = 'rgba(2, 6, 23, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;
      ctx.fillStyle = 'rgba(74, 222, 128, 0.95)';

      for (let i = 0; i < drops.length; i += 1) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i] += 1;
      }

      animationId = window.requestAnimationFrame(draw);
    };

    setup();
    draw();

    const handleResize = () => setup();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationId) {
        window.cancelAnimationFrame(animationId);
      }
    };
  }, []);

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
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-[#04160b] to-slate-900 px-4 overflow-hidden">
      <style>{`
        .matrix-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(ellipse at top, rgba(34, 197, 94, 0.18), rgba(2, 6, 23, 0.25) 44%, rgba(2, 6, 23, 0.55) 100%),
            linear-gradient(transparent 96%, rgba(34, 197, 94, 0.1) 100%);
          background-size: 100% 100%, 100% 5px;
        }
      `}</style>

      <canvas ref={canvasRef} className="absolute inset-0 z-0" aria-hidden="true" />
      <div className="matrix-overlay" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden" style={{background: 'linear-gradient(135deg, #e0f7fa 0%, #ffffff 100%)'}}>
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
