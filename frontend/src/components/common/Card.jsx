import React from 'react';

export default function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  highlight = false,
  ...props
}) {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  const highlightClass = highlight
    ? 'border-[#B8C2E8] bg-surface-elevated shadow-vera-md ring-1 ring-vera-accent/20'
    : 'border-vera-border bg-surface-elevated shadow-vera-sm';

  const hoverClass = hover
    ? 'hover:border-[#C3C9DD] hover:shadow-vera-md transition-all duration-200'
    : '';

  return (
    <div
      className={`rounded-2xl border ${highlightClass} ${paddings[padding] || paddings.md} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
