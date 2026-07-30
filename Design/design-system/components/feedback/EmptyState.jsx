import React from 'react';

/**
 * EmptyState — estado vacío con icono, título, descripción y acción.
 */
export function EmptyState({ icon, title, description, action, style, ...rest }) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        padding: 'var(--space-12) var(--space-6)',
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
      {...rest}
    >
      {icon && (
        <span style={{ width: 52, height: 52, borderRadius: 'var(--radius-lg)', background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
          {icon}
        </span>
      )}
      {title && <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{title}</div>}
      {description && <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--color-text-muted)', maxWidth: 320 }}>{description}</p>}
      {action && <div style={{ marginTop: 'var(--space-5)' }}>{action}</div>}
    </div>
  );
}
