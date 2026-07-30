import React from 'react';

/**
 * Badge — etiqueta semántica corta (feedback genérico).
 * Para estados de CRM usa StatusBadge.
 */
export function Badge({ variant = 'neutral', dot = false, children, style, ...rest }) {
  const palette = {
    neutral: { bg: 'var(--color-neutral-100)', fg: 'var(--color-neutral-600)' },
    primary: { bg: 'var(--color-primary-subtle)', fg: 'var(--color-primary-hover)' },
    success: { bg: 'var(--color-success-subtle)', fg: '#15803D' },
    warning: { bg: 'var(--color-warning-subtle)', fg: '#B45309' },
    error: { bg: 'var(--color-error-subtle)', fg: '#B91C1C' },
    info: { bg: 'var(--color-info-subtle)', fg: '#0369A1' },
  };
  const p = palette[variant] || palette.neutral;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 9px',
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1.4,
        borderRadius: 'var(--radius-pill)',
        background: p.bg,
        color: p.fg,
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.fg }} />}
      {children}
    </span>
  );
}
