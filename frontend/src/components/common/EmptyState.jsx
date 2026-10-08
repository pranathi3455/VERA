import React from 'react';
import Card from './Card';
import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <Card className={`text-center py-12 px-6 border-dashed border-vera-border bg-surface ${className}`}>
      {Icon && (
        <div className="w-12 h-12 mx-auto rounded-2xl bg-vera-accent-soft/60 border border-vera-accent/20 flex items-center justify-center text-vera-accent mb-4">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-base font-semibold text-vera-primary mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-vera-secondary max-w-sm mx-auto mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}
