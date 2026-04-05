import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import ConfirmModal from './ConfirmModal';
import LogoutLoadingModal from '../shared/LogoutLoadingModal';
import {
  HiOutlineHome, HiOutlineUserGroup, HiOutlineOfficeBuilding, HiOutlineCash,
  HiOutlineClipboardList, HiOutlineChartBar, HiOutlineX, HiOutlineViewList, HiOutlineLogout, HiOutlineClock, HiOutlineAcademicCap,
} from 'react-icons/hi';

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: HiOutlineHome, end: true },
  { to: '/admin/tenants', label: 'Tenants', icon: HiOutlineUserGroup },
  { to: '/admin/rooms', label: 'Rooms', icon: HiOutlineOfficeBuilding },
  { to: '/admin/payments', label: 'Billings', icon: HiOutlineCash },
  { to: '/admin/payment-records', label: 'Payment Records', icon: HiOutlineViewList },
  { to: '/admin/tenant-remarks', label: 'Tenant Remarks', icon: HiOutlineAcademicCap },
  { to: '/admin/visitors', label: 'Visitors', icon: HiOutlineClipboardList },
  { to: '/admin/history', label: 'History', icon: HiOutlineClock },
  { to: '/admin/reports', label: 'Reports', icon: HiOutlineChartBar },
];

const Sidebar = ({ open, onClose, showConfirm, setShowConfirm, showLoading, setShowLoading }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = adminLinks;

  const handleLogoutClick = () => {
    setShowConfirm(true);
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 p-4 transform transition-transform duration-200 ease-in-out flex flex-col
        md:relative md:translate-x-0 md:pl-5 md:pr-3 md:py-5
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full rounded-2xl border border-slate-700/55 bg-slate-900/70 backdrop-blur-xl shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700/40">
            <div className="flex items-center gap-3">
              <img src="/Bisu.png" alt="BISU" className="w-9 h-9 rounded-xl object-cover ring-2 ring-blue-400/70" />
              <div>
                <h1 className="text-sm tracking-[0.12em] text-slate-300 font-semibold">ADMIN PANEL</h1>
                <p className="text-[11px] text-slate-500">BISU Dormitory</p>
              </div>
            </div>
            <button onClick={onClose} className="md:hidden text-slate-300 hover:text-white">
              <HiOutlineX className="w-6 h-6" />
            </button>
          </div>

          <nav className="mt-4 px-3 space-y-1.5 flex-1">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-500/18 text-blue-100 border border-blue-300/25 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-slate-100 border border-transparent'
                  }`
                }
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 group-hover:bg-slate-700/80">
                  <Icon className="w-4.5 h-4.5" />
                </span>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Removed Admin section from sidebar navigation bar as requested */}

          <div className="px-3 pb-4">
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-red-500/15 hover:text-red-300 border border-slate-700/60 transition-colors"
            >
              <HiOutlineLogout className="w-5 h-5" />
              Logout
            </button>
            {/* Modals are now rendered in Layout for global centering */}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
