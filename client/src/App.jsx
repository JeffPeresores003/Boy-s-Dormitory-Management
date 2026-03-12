import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Auth pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminTenants from './pages/admin/Tenants';
import AdminRooms from './pages/admin/Rooms';
import AdminPayments from './pages/admin/Payments';
import AdminPaymentRecords from './pages/admin/PaymentRecords';
import AdminVisitors from './pages/admin/Visitors';
import AdminReports from './pages/admin/Reports';

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={user ? <Navigate to="/admin" /> : <Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="tenants" element={<AdminTenants />} />
        <Route path="rooms" element={<AdminRooms />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="payment-records" element={<AdminPaymentRecords />} />
        <Route path="visitors" element={<AdminVisitors />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default App;
