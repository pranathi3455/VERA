import React from 'react';

export default function LoadingState({
  message = 'Loading analysis data...',
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      <div className="relative w-10 h-10 mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-vera-border" />
        <div className="absolute inset-0 rounded-full border-2 border-vera-accent border-t-transparent animate-spin" />
      </div>
      <p className="text-sm font-medium text-vera-primary">{message}</p>
      <p className="text-xs text-vera-muted mt-1">Deterministic verification pipeline active</p>
    </div>
  );
}
