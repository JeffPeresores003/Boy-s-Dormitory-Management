import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-700/55 bg-slate-900/70 px-6 py-5 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 shrink-0">
              <span className="absolute inset-0 rounded-full border-2 border-blue-400/30" />
              <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-400 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">Verifying Access</p>
              <p className="text-xs text-slate-400">Checking your account permissions.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  return children;
};

export default ProtectedRoute;
