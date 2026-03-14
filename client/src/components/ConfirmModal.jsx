import { useTheme } from '../context/ThemeContext';

const ConfirmModal = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  if (!open) return null;

  const { theme } = useTheme();
  const dark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <div
        className={`max-w-md w-full mx-4 rounded-xl border p-6 shadow-2xl ${
          dark
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        <h3 className={`text-lg font-semibold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>
          {title || 'Confirm Action'}
        </h3>
        <p className={`mt-2 text-sm ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
          {message || 'Please confirm that you would like to continue.'}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              dark
                ? 'text-slate-100 bg-slate-800 hover:bg-slate-700'
                : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
