import React from 'react';

/**
 * ProgressBar — barra de progreso. `variant` o `color` explícito.
 */
export function ProgressBar({ value = 0, variant = 'primary', color, label, showValue = false, style, ...rest }) {
  const v = Math.max(0, Math.min(100, value));
  const colors = {
    primary: 'var(--color-primary)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    error: 'var(--color-error)',
  };
  const fill = color || colors[variant] || colors.primary;
  return (
    <div style={{ fontFamily: 'var(--font-sans)', ...style }} {...rest}>
      {(label || showValue) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12.5 }}>
          {label && <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</span>}
          {showValue && <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{v}%</span>}
        </div>
      )}
      <div style={{ height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--color-neutral-200)', overflow: 'hidden' }}>
        <div style={{ width: v + '%', height: '100%', borderRadius: 'var(--radius-pill)', background: fill, transition: 'width .3s ease' }} />
      </div>
    </div>
  );
}
