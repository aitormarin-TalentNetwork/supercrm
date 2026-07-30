import React from 'react';

/**
 * Tooltip — etiqueta flotante al pasar el ratón / foco.
 */
export function Tooltip({ content, placement = 'top', children }) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8 },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8 },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 8 },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 8 },
  };
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          role="tooltip"
          style={{
            position: 'absolute', zIndex: 900,
            ...pos[placement],
            background: 'var(--color-neutral-900)',
            color: '#fff',
            fontFamily: 'var(--font-sans)',
            fontSize: 12, fontWeight: 500, lineHeight: 1.3,
            padding: '6px 9px',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-e2)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
