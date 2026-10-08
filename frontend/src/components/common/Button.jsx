import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vera-accent/40 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-vera-accent hover:bg-vera-accent-hover text-white shadow-vera-sm focus:ring-vera-accent',
    secondary: 'bg-surface-elevated hover:bg-surface text-vera-primary border border-vera-border shadow-vera-sm focus:ring-vera-accent',
    outline: 'border border-vera-border text-vera-secondary hover:bg-secondary-bg hover:text-vera-primary focus:ring-vera-accent',
    ghost: 'text-vera-secondary hover:text-vera-primary hover:bg-secondary-bg focus:ring-vera-accent',
    danger: 'bg-vera-danger hover:bg-[#976A6A] text-white shadow-vera-sm focus:ring-vera-danger',
    accent: 'bg-vera-accent-secondary hover:bg-[#797EB8] text-white shadow-vera-sm focus:ring-vera-accent-secondary'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-sm px-5 py-2.5 gap-2.5 font-semibold'
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
}
