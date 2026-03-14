import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/LoadingScreen';

const Layout = lazy(() => import('./components/Layout'));

// Auth pages
const Login = lazy(() => import('./pages/auth/Login'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminTenants = lazy(() => import('./pages/admin/Tenants'));
const AdminRooms = lazy(() => import('./pages/admin/Rooms'));
const AdminPayments = lazy(() => import('./pages/admin/Payments'));
const AdminPaymentRecords = lazy(() => import('./pages/admin/PaymentRecords'));
const AdminVisitors = lazy(() => import('./pages/admin/Visitors'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));

const AnimatedLoader = ({ title = 'Loading...', subtitle = 'Please wait.' }) => (
  <div className="min-h-screen flex items-center justify-center px-4">
    <div className="w-full max-w-sm rounded-2xl border border-slate-700/55 bg-slate-900/70 px-6 py-5 shadow-xl backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="relative h-9 w-9 shrink-0">
          <span className="absolute inset-0 rounded-full border-2 border-blue-400/30" />
          <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-400 animate-spin" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100">{title}</p>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <span className="block h-full w-1/3 rounded-full bg-blue-500 animate-pulse" />
      </div>
    </div>
  </div>
);

const RouteFallback = () => (
  <AnimatedLoader title="Opening Page" subtitle="Preparing the selected module..." />
);

const withSuspense = (element) => (
  <Suspense fallback={<RouteFallback />}>
    {element}
  </Suspense>
);

const App = () => {
  const { user, loading, authTransition } = useAuth();

  if (authTransition.loading) {
    return (
      <LoadingScreen
        title={authTransition.title}
        subtitle={authTransition.subtitle}
      />
    );
  }

  if (loading) {
    return <AnimatedLoader title="Loading Application" subtitle="Checking your session and permissions." />;
  }

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={user ? <Navigate to="/admin" /> : withSuspense(<Login />)} />
      <Route path="/forgot-password" element={withSuspense(<ForgotPassword />)} />
      <Route path="/reset-password/:token" element={withSuspense(<ResetPassword />)} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute>{withSuspense(<Layout />)}</ProtectedRoute>}>
        <Route index element={withSuspense(<AdminDashboard />)} />
        <Route path="tenants" element={withSuspense(<AdminTenants />)} />
        <Route path="rooms" element={withSuspense(<AdminRooms />)} />
        <Route path="payments" element={withSuspense(<AdminPayments />)} />
        <Route path="payment-records" element={withSuspense(<AdminPaymentRecords />)} />
        <Route path="visitors" element={withSuspense(<AdminVisitors />)} />
        <Route path="reports" element={withSuspense(<AdminReports />)} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default App;
