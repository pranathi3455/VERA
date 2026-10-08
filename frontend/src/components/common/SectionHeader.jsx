import React from 'react';

export default function SectionHeader({
  title,
  subtitle,
  badge,
  action,
  className = ''
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-vera-border ${className}`}>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-vera-primary">{title}</h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-vera-secondary mt-1 max-w-2xl leading-relaxed">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2.5">{action}</div>}
    </div>
  );
}
