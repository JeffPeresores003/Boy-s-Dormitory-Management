const variants = {
  primary: 'text-white bg-primary-600 hover:bg-primary-700',
  success: 'text-white bg-emerald-500 hover:bg-emerald-600',
  info: 'text-white bg-blue-600 hover:bg-blue-700',
  danger: 'text-white bg-red-600 hover:bg-red-700',
  neutral: 'text-slate-100 bg-slate-800 hover:bg-slate-700',
};

const ActionButton = ({
  type = 'button',
  variant = 'primary',
  className = '',
  children,
  ...props
}) => {
  const variantClass = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default ActionButton;
