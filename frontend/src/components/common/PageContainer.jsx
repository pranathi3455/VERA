import React from 'react';

export default function PageContainer({
  children,
  maxWidth = 'max-w-7xl',
  className = '',
  ...props
}) {
  return (
    <div className={`w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 ${maxWidth} ${className}`} {...props}>
      {children}
    </div>
  );
}
