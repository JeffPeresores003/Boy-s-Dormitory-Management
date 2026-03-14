import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useTheme } from '../context/ThemeContext';
import ConfirmModal from './ConfirmModal';
import LogoutLoadingModal from '../shared/LogoutLoadingModal';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  // Pass modal controls to Sidebar
  return (
    <div className={`admin-theme theme-${theme} flex h-screen overflow-hidden text-slate-100`}>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        showConfirm={showConfirm}
        setShowConfirm={setShowConfirm}
        showLoading={showLoading}
        setShowLoading={setShowLoading}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7">
          <Outlet />
        </main>
      </div>
      <ConfirmModal
        open={showConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        onConfirm={() => {
          setShowConfirm(false);
          setShowLoading(true);
          setTimeout(() => {
            setShowLoading(false);
            // Remove token and user state before redirect
            localStorage.removeItem('token');
            window.location.replace('/login');
          }, 1200);
        }}
        onCancel={() => setShowConfirm(false)}
      />
      <LogoutLoadingModal open={showLoading} />
    </div>
  );
};

export default Layout;
