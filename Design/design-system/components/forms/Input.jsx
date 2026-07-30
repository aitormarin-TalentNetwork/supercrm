import React from 'react';

/**
 * Input — campo de texto con label, hint y estado de error.
 */
export function Input({
  label,
  hint,
  error,
  leftIcon,
  size = 'md',
  type = 'text',
  disabled = false,
  required = false,
  id,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const autoId = React.useId ? React.useId() : 'in';
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
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {leftIcon && (
          <span style={{ position: 'absolute', left: 12, display: 'inline-flex', color: 'var(--color-neutral-400)', pointerEvents: 'none' }}>{leftIcon}</span>
        )}
        <input
          id={fieldId}
          type={type}
          disabled={disabled}
          aria-invalid={!!error}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: '100%',
            height: h,
            padding: leftIcon ? '0 12px 0 38px' : '0 12px',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: 'var(--color-text)',
            background: disabled ? 'var(--color-neutral-100)' : 'var(--color-surface)',
            border: `1px solid ${borderColor}`,
            borderRadius: 'var(--radius-md)',
            outline: 'none',
            boxShadow: focus && !error ? 'var(--focus-ring)' : 'none',
            transition: 'border-color .15s ease, box-shadow .15s ease',
            boxSizing: 'border-box',
          }}
          {...rest}
        />
      </div>
      {(error || hint) && (
        <div style={{ fontSize: 12, marginTop: 6, color: error ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
          {error || hint}
        </div>
      )}
    </div>
  );
}
