import React from 'react';

/**
 * Tabs — pestañas de navegación. Controlado por `value`.
 */
export function Tabs({ items = [], value, onChange, style, ...rest }) {
  return (
    <div role="tablist" style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--color-border)', fontFamily: 'var(--font-sans)', ...style }} {...rest}>
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange && onChange(it.value)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '10px 14px',
              fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
              color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${active ? 'var(--color-primary)' : 'transparent'}`,
              marginBottom: -1,
              cursor: 'pointer',
              transition: 'color .15s ease, border-color .15s ease',
            }}
          >
            {it.icon}
            {it.label}
            {it.count != null && (
              <span style={{ fontSize: 11, fontWeight: 600, color: active ? 'var(--color-primary-hover)' : 'var(--color-text-muted)', background: active ? 'var(--color-primary-subtle)' : 'var(--color-neutral-100)', borderRadius: 'var(--radius-pill)', padding: '1px 7px' }}>{it.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
