import { useAuth } from '../context/AuthContext';
import { HiOutlineMenu, HiOutlineUser } from 'react-icons/hi';

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
      <button onClick={onMenuClick} className="md:hidden text-gray-600 hover:text-gray-900">
        <HiOutlineMenu className="w-6 h-6" />
      </button>

      <div className="hidden md:block">
        <h2 className="text-sm font-semibold text-gray-700">
          Bohol Island State University
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <HiOutlineUser className="w-5 h-5 text-gray-500" />
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700">{user?.name}</p>
          <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
