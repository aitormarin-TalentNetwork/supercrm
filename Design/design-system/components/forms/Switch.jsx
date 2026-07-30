import React from 'react';

/**
 * Switch — interruptor on/off controlado.
 */
export function Switch({ checked = false, onChange, label, disabled = false, id, style, ...rest }) {
  const autoId = React.useId ? React.useId() : 'sw';
  const fieldId = id || autoId;
  return (
    <label htmlFor={fieldId} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...style }}>
      <span style={{
        position: 'relative',
        width: 40, height: 24, flex: 'none',
        borderRadius: 'var(--radius-pill)',
        background: checked ? 'var(--color-primary)' : 'var(--color-neutral-300)',
        transition: 'background .18s ease',
        display: 'inline-block',
      }}>
        <input
          id={fieldId}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', margin: 0, cursor: 'inherit' }}
          {...rest}
        />
        <span style={{
          position: 'absolute', top: 2, left: checked ? 18 : 2,
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          boxShadow: '0 1px 2px rgba(15,23,42,.25)',
          transition: 'left .18s ease',
        }} />
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}
