// Shared form input component for consistent styling
import React from 'react';

const FormInput = ({ label, type = 'text', value, onChange, placeholder, required, icon, ...props }) => (
  <div>
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-slate-50 text-gray-900 placeholder-gray-400 text-sm outline-none`}
        {...props}
      />
    </div>
  </div>
);

export default FormInput;
