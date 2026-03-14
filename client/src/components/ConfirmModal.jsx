const ConfirmModal = ({ open, title, message, onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-slate-900/90 border border-slate-700/70 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 text-slate-100">
        <h3 className="text-lg font-semibold text-slate-100">{title || 'Confirm Action'}</h3>
        <p className="mt-2 text-sm text-slate-400">{message || 'Please confirm that you would like to continue.'}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-200 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
