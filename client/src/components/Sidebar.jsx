import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome, HiOutlineUserGroup, HiOutlineOfficeBuilding, HiOutlineCash,
  HiOutlineClipboardList, HiOutlineCog, HiOutlineSpeakerphone, HiOutlineChartBar,
  HiOutlineX,
} from 'react-icons/hi';

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: HiOutlineHome, end: true },
  { to: '/admin/tenants', label: 'Tenants', icon: HiOutlineUserGroup },
  { to: '/admin/rooms', label: 'Rooms', icon: HiOutlineOfficeBuilding },
  { to: '/admin/payments', label: 'Payments', icon: HiOutlineCash },
  { to: '/admin/visitors', label: 'Visitors', icon: HiOutlineClipboardList },
  { to: '/admin/maintenance', label: 'Maintenance', icon: HiOutlineCog },
  { to: '/admin/announcements', label: 'Announcements', icon: HiOutlineSpeakerphone },
  { to: '/admin/reports', label: 'Reports', icon: HiOutlineChartBar },
];

const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth();
  const links = adminLinks;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-primary-800 text-white transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 bg-primary-900">
          <div className="flex items-center gap-3">
            <img src="/Bisu.png" alt="BISU" className="w-9 h-9 rounded-full object-cover ring-2 ring-primary-400" />
            <div>
              <h1 className="text-lg font-bold leading-tight">BISU Dormitory</h1>
              <p className="text-xs text-primary-300">Management System</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-white hover:text-primary-300">
            <HiOutlineX className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-4 px-2 space-y-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-700 text-white'
                    : 'text-primary-200 hover:bg-primary-700/50 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
