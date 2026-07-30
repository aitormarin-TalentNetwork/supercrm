import React from 'react';

/**
 * Select — desplegable nativo estilizado (con caret).
 */
export function Select({ label, hint, error, size = 'md', disabled = false, required = false, children, id, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const autoId = React.useId ? React.useId() : 'sel';
  const fieldId = id || autoId;
  const heights = { sm: 36, md: 44 };
  const h = heights[size] || heights.md;
  const borderColor = error ? 'var(--color-error)' : focus ? 'var(--color-primary)' : 'var(--color-border)';
  return (
    <div style={{ fontFamily: 'var(--font-sans)', ...style }}>
      {label && (
        <label htmlFor={fieldId} style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
          {label}{required && <span style={{ color: 'var(--color-error)' }}> *</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <select
          id={fieldId}
          disabled={disabled}
          aria-invalid={!!error}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: '100%',
            height: h,
            padding: '0 36px 0 12px',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: 'var(--color-text)',
            background: disabled ? 'var(--color-neutral-100)' : 'var(--color-surface)',
            border: `1px solid ${borderColor}`,
            borderRadius: 'var(--radius-md)',
            outline: 'none',
            boxShadow: focus && !error ? 'var(--focus-ring)' : 'none',
            transition: 'border-color .15s ease, box-shadow .15s ease',
            appearance: 'none',
            WebkitAppearance: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            boxSizing: 'border-box',
          }}
          {...rest}
        >
          {children}
        </select>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-neutral-400)', pointerEvents: 'none' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {(error || hint) && (
        <div style={{ fontSize: 12, marginTop: 6, color: error ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
          {error || hint}
        </div>
      )}
    </div>
  );
}
