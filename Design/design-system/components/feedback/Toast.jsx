import React from 'react';

/**
 * Toast — notificación efímera (presentacional).
 */
export function Toast({ variant = 'info', title, message, onClose, style, ...rest }) {
  const palette = {
    success: { fg: 'var(--color-success)', bg: 'var(--color-success-subtle)', icon: 'M20 6 9 17l-5-5' },
    warning: { fg: 'var(--color-warning)', bg: 'var(--color-warning-subtle)', icon: 'M12 9v4m0 4h.01' },
    error: { fg: 'var(--color-error)', bg: 'var(--color-error-subtle)', icon: 'M18 6 6 18M6 6l12 12' },
    info: { fg: 'var(--color-info)', bg: 'var(--color-info-subtle)', icon: 'M12 16v-4m0-4h.01' },
  };
  const p = palette[variant] || palette.info;
  return (
    <div
      role="status"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        width: 360, maxWidth: '100%',
        padding: '12px 14px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-e2)',
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
      {...rest}
    >
      <span style={{ width: 28, height: 28, flex: 'none', borderRadius: 'var(--radius-md)', background: p.bg, color: p.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={p.icon} /></svg>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{title}</div>}
        {message && <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--color-text-secondary)', marginTop: title ? 2 : 0 }}>{message}</div>}
      </div>
      {onClose && (
        <button onClick={onClose} aria-label="Cerrar" style={{ flex: 'none', border: 'none', background: 'transparent', color: 'var(--color-neutral-400)', cursor: 'pointer', padding: 2, lineHeight: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  );
}
