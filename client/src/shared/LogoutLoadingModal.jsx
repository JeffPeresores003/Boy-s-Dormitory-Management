import React from 'react';

const LogoutLoadingModal = ({ open }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white border border-slate-300 rounded-xl shadow-2xl max-w-xs w-full mx-4 p-6 text-center">
        <span className="text-lg font-semibold text-primary-700 mb-4 block">Logging out</span>
        <div className="flex justify-center">
          <span className="dot-animation">.</span>
          <span className="dot-animation" style={{ animationDelay: '0.2s' }}>. </span>
          <span className="dot-animation" style={{ animationDelay: '0.4s' }}>. </span>
        </div>
      </div>
    </div>
  );
};

export default LogoutLoadingModal;
