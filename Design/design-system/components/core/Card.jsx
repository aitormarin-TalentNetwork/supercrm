import React from 'react';

/**
 * Card — superficie contenedora. Elevación e1 por defecto.
 */
export function Card({ elevation = 'e1', padding = 'md', interactive = false, children, onClick, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const pads = { none: 0, sm: 'var(--space-4)', md: 'var(--space-6)', lg: 'var(--space-8)' };
  const shadows = { none: 'none', e1: 'var(--shadow-e1)', e2: 'var(--shadow-e2)', e3: 'var(--shadow-e3)' };
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: interactive && hover ? 'var(--shadow-e2)' : shadows[elevation],
        padding: pads[padding] != null ? pads[padding] : pads.md,
        cursor: interactive ? 'pointer' : 'default',
        transition: 'box-shadow .15s ease, border-color .15s ease',
        borderColor: interactive && hover ? 'var(--color-border-strong)' : 'var(--color-border)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
