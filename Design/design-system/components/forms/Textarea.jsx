import React from 'react';

/**
 * Textarea — campo multilínea con label, hint y error.
 */
export function Textarea({ label, hint, error, rows = 4, disabled = false, required = false, id, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const autoId = React.useId ? React.useId() : 'ta';
  const fieldId = id || autoId;
  const borderColor = error ? 'var(--color-error)' : focus ? 'var(--color-primary)' : 'var(--color-border)';
  return (
    <div style={{ fontFamily: 'var(--font-sans)', ...style }}>
      {label && (
        <label htmlFor={fieldId} style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
          {label}{required && <span style={{ color: 'var(--color-error)' }}> *</span>}
        </label>
      )}
      <textarea
        id={fieldId}
        rows={rows}
        disabled={disabled}
        aria-invalid={!!error}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          lineHeight: 1.5,
          color: 'var(--color-text)',
          background: disabled ? 'var(--color-neutral-100)' : 'var(--color-surface)',
          border: `1px solid ${borderColor}`,
          borderRadius: 'var(--radius-md)',
          outline: 'none',
          resize: 'vertical',
          boxShadow: focus && !error ? 'var(--focus-ring)' : 'none',
          transition: 'border-color .15s ease, box-shadow .15s ease',
          boxSizing: 'border-box',
        }}
        {...rest}
      />
      {(error || hint) && (
        <div style={{ fontSize: 12, marginTop: 6, color: error ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
          {error || hint}
        </div>
      )}
    </div>
  );
}
