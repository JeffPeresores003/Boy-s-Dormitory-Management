import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import FormInput from '../../shared/FormInput';
import Loading from '../../shared/Loading';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setResetToken(res.data.resetToken);
      toast.success('Reset token generated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to process your request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 px-4">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-700/70 rounded-2xl shadow-2xl p-8">
        <h2 className="text-xl font-bold text-primary-200 text-center">Forgot Your Password?</h2>
        <p className="text-sm text-slate-400 text-center mt-1">Enter your email address to generate a reset token.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <FormInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary-700 text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 shadow-md"
          >
            {loading ? <Loading text="Generating..." /> : 'Generate Reset Token'}
          </button>
        </form>

        {resetToken && (
          <div className="mt-4 p-3 bg-green-900/20 border border-green-700/40 rounded-lg">
            <p className="text-xs text-green-300">Use this token on the <Link to="/reset-password" className="underline">Reset Password</Link> page:</p>
            <p className="text-xs font-mono mt-1 break-all text-green-100">{resetToken}</p>
          </div>
        )}

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-primary-400 hover:underline">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
