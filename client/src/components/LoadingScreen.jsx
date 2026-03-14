import { useTheme } from '../context/ThemeContext';

const LoadingScreen = ({
  fullScreen = true,
  title = 'Loading...',
  subtitle = 'Please wait while we prepare your data.',
}) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  return (
    <div className={fullScreen ? 'min-h-screen flex items-center justify-center px-4' : 'h-64 flex items-center justify-center'}>
      <div
        className={`loading-screen-card w-full max-w-md rounded-2xl border px-6 py-6 shadow-xl backdrop-blur-md ${
          dark ? 'bg-slate-900/85 border-slate-700 text-slate-100' : 'bg-white/95 border-slate-300 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="loading-orb-wrap">
            <span className="loading-orb-spin" />
            <img
              src="/Bisu.png"
              alt="BISU"
              className={`h-11 w-11 rounded-xl object-cover ring-2 ${dark ? 'ring-blue-400/60' : 'ring-blue-300'}`}
            />
          </div>
          <div>
            <p className="text-base font-semibold tracking-wide">{title}</p>
            <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{subtitle}</p>
          </div>
        </div>

        <div className={`loading-track mt-5 h-2 w-full overflow-hidden rounded-full ${dark ? 'bg-slate-800' : 'bg-slate-200'}`}>
          <div className={`loading-scan ${dark ? 'bg-primary-400' : 'bg-primary-600'}`} />
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="ml-1">Securing your workspace</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
