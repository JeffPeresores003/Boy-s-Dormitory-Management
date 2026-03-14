import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();
const DASHBOARD_STATS_CACHE_KEY = 'admin_dashboard_stats_cache_v1';
const DASHBOARD_REVENUE_CACHE_KEY = 'admin_dashboard_revenue_cache_v1';
const DASHBOARD_TENANTS_CACHE_KEY = 'admin_dashboard_tenants_cache_v1';
const DASHBOARD_VISITORS_CACHE_KEY = 'admin_dashboard_visitors_cache_v1';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authTransition, setAuthTransition] = useState({
    loading: false,
    title: 'Loading...',
    subtitle: 'Please wait while we complete your request.',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      prefetchDashboardCache();
    } catch {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const prefetchDashboardCache = async () => {
    try {
      const [statsRes, revRes, tenRes, visRes] = await Promise.allSettled([
        api.get('/dashboard/stats'),
        api.get('/dashboard/analytics/monthly-revenue'),
        api.get('/dashboard/analytics/recent-tenants'),
        api.get('/dashboard/analytics/recent-visitors'),
      ]);

      if (statsRes.status === 'fulfilled') {
        sessionStorage.setItem(DASHBOARD_STATS_CACHE_KEY, JSON.stringify(statsRes.value.data));
      }
      if (revRes.status === 'fulfilled') {
        sessionStorage.setItem(DASHBOARD_REVENUE_CACHE_KEY, JSON.stringify(revRes.value.data));
      }
      if (tenRes.status === 'fulfilled') {
        sessionStorage.setItem(DASHBOARD_TENANTS_CACHE_KEY, JSON.stringify(tenRes.value.data));
      }
      if (visRes.status === 'fulfilled') {
        sessionStorage.setItem(DASHBOARD_VISITORS_CACHE_KEY, JSON.stringify(visRes.value.data));
      }
    } catch {
      // Prefetch is non-blocking; silently ignore failures.
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    prefetchDashboardCache();
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const startAuthTransition = (
    title = 'Loading...',
    subtitle = 'Please wait while we complete your request.'
  ) => {
    setAuthTransition({ loading: true, title, subtitle });
  };

  const stopAuthTransition = () => {
    setAuthTransition((prev) => ({ ...prev, loading: false }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        loadUser,
        authTransition,
        startAuthTransition,
        stopAuthTransition,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
