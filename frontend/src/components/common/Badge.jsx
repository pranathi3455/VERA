import React from 'react';

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) {
  const variants = {
    neutral: 'bg-surface text-vera-secondary border-vera-border',
    success: 'bg-vera-success-bg text-[#557662] border-[#C8DEC0]',
    info: 'bg-secondary-bg text-[#53658C] border-vera-border',
    warning: 'bg-vera-warning-bg text-[#86754E] border-[#DFD5BD]',
    danger: 'bg-vera-danger-bg text-[#905B5B] border-[#DFC5C5]',
    purple: 'bg-vera-accent-soft text-[#4F5C95] border-[#CAD2EE]',
    accent: 'bg-vera-accent-soft text-[#4F5C95] border-[#CAD2EE]'
  };

  const dots = {
    neutral: 'bg-vera-muted',
    success: 'bg-[#789884]',
    info: 'bg-[#7587AD]',
    warning: 'bg-[#A9966B]',
    danger: 'bg-[#A87979]',
    purple: 'bg-[#6877B8]',
    accent: 'bg-[#6877B8]'
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium tracking-wide',
    md: 'text-xs px-2.5 py-1 font-medium'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variants[variant] || variants.neutral} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dots[variant] || dots.neutral}`} />}
      {children}
    </span>
  );
}
