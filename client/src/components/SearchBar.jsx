import { HiOutlineSearch } from 'react-icons/hi';

const SearchBar = ({ value, onChange, placeholder }) => {
  return (
    <div className="relative">
      <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Search...'}
        className="w-full pl-11 pr-4 py-2.5 bg-slate-900/70 border border-slate-700/70 rounded-xl text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-primary-500/35 focus:border-primary-500/70 text-sm outline-none shadow-sm"
      />
    </div>
  );
};

export default SearchBar;
