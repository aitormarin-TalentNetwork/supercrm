import React from 'react';

/**
 * Radio — opción única controlada con label opcional.
 */
export function Radio({ checked = false, onChange, label, name, value, disabled = false, id, style, ...rest }) {
  const autoId = React.useId ? React.useId() : 'rd';
  const fieldId = id || autoId;
  return (
    <label htmlFor={fieldId} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...style }}>
      <span style={{
        position: 'relative',
        width: 20, height: 20, flex: 'none',
        borderRadius: '50%',
        border: `1.5px solid ${checked ? 'var(--color-primary)' : 'var(--color-border-strong)'}`,
        background: 'var(--color-surface)',
        transition: 'border-color .15s ease',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <input
          id={fieldId}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', margin: 0, cursor: 'inherit' }}
          {...rest}
        />
        {checked && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-primary)' }} />}
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}
