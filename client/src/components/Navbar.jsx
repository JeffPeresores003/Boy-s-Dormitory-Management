import { useAuth } from '../context/AuthContext';
import { HiOutlineMenu, HiOutlineSearch, HiOutlineUser } from 'react-icons/hi';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const now = new Date().toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <header className="h-16 md:h-[74px] px-4 md:px-7 flex items-center justify-between gap-3">
      <button onClick={onMenuClick} className="md:hidden text-slate-200 hover:text-white">
        <HiOutlineMenu className="w-6 h-6" />
      </button>

      <div className="hidden md:block min-w-[280px]">
        <h2 className="text-sm font-semibold text-slate-200">{now}</h2>
      </div>

      <div className="hidden lg:flex flex-1 max-w-md">
        <div className="relative w-full">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-slate-900/65 border border-slate-700/70 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-400/50"
            readOnly
          />
        </div>
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/65 text-slate-200 hover:bg-slate-800/80 transition-colors"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <FaSun className="w-4 h-4" /> : <FaMoon className="w-4 h-4" />}
      </button>

      <div className="flex items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-900/65 px-3 py-2">
        <HiOutlineUser className="w-5 h-5 text-slate-300" />
        <div className="text-right leading-tight">
          <p className="text-sm font-medium text-slate-100">{user?.name}</p>
          <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
