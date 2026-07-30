import React from 'react';

/**
 * Checkbox — casilla controlada con label opcional.
 */
export function Checkbox({ checked = false, onChange, label, disabled = false, id, style, ...rest }) {
  const autoId = React.useId ? React.useId() : 'cb';
  const fieldId = id || autoId;
  return (
    <label htmlFor={fieldId} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...style }}>
      <span style={{
        position: 'relative',
        width: 20, height: 20, flex: 'none',
        borderRadius: 'var(--radius-sm)',
        border: `1.5px solid ${checked ? 'var(--color-primary)' : 'var(--color-border-strong)'}`,
        background: checked ? 'var(--color-primary)' : 'var(--color-surface)',
        transition: 'background .15s ease, border-color .15s ease',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <input
          id={fieldId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', margin: 0, cursor: 'inherit' }}
          {...rest}
        />
        {checked && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}
