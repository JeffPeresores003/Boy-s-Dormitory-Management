const SectionLoader = ({
  title = 'Loading...',
  subtitle = 'Please wait while we fetch the latest data.',
  compact = false,
}) => {
  return (
    <div className={`w-full rounded-2xl border border-slate-700/55 bg-slate-900/70 backdrop-blur-xl shadow-xl ${compact ? 'p-4' : 'p-6'} `}>
      <div className="flex items-center gap-3">
        <div className="relative h-9 w-9 shrink-0">
          <span className="absolute inset-0 rounded-full border-2 border-blue-400/35" />
          <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-400 animate-spin" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100">{title}</p>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div className="h-full w-1/3 rounded-full bg-blue-500 animate-pulse" />
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-slate-400">
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse [animation-delay:140ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse [animation-delay:280ms]" />
      </div>
    </div>
  );
};

export default SectionLoader;
