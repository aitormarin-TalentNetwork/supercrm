import React from 'react';

/**
 * Dialog — modal centrado con overlay. Controlado por `open`.
 */
export function Dialog({ open, onClose, title, description, children, footer, width = 480 }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,23,42,.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-4)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: width,
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-e3)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: 'var(--space-6)' }}>
          {title && <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--color-text)' }}>{title}</h2>}
          {description && <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--color-text-secondary)' }}>{description}</p>}
          {children && <div style={{ marginTop: title || description ? 'var(--space-5)' : 0 }}>{children}</div>}
        </div>
        {footer && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--color-border)', background: 'var(--color-neutral-50)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
