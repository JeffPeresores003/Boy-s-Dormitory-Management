const AdminPageHeader = ({ title, subtitle, actions, className = '' }) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 rounded-2xl border border-slate-700/50 bg-slate-900/45 px-5 py-4 ${className}`}>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
};

export default AdminPageHeader;
