import React from 'react';

/**
 * SidebarNav — navegación lateral vertical (escritorio).
 */
export function SidebarNav({ items = [], value, onChange, style, ...rest }) {
  const [hover, setHover] = React.useState(null);
  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, fontFamily: 'var(--font-sans)', ...style }} {...rest}>
      {items.map((it) => {
        const active = it.value === value;
        const hovered = hover === it.value;
        return (
          <button
            key={it.value}
            onClick={() => onChange && onChange(it.value)}
            onMouseEnter={() => setHover(it.value)}
            onMouseLeave={() => setHover(null)}
            aria-current={active ? 'page' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 11,
              width: '100%',
              padding: '9px 12px',
              minHeight: 44,
              fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: active ? 600 : 500,
              color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              background: active ? 'var(--color-primary-subtle)' : hovered ? 'var(--color-neutral-100)' : 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background .12s ease, color .12s ease',
            }}
          >
            <span style={{ display: 'inline-flex', flex: 'none', width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>{it.icon}</span>
            <span style={{ flex: 1 }}>{it.label}</span>
            {it.badge != null && (
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-on-primary)', background: 'var(--color-primary)', borderRadius: 'var(--radius-pill)', padding: '1px 7px', minWidth: 18, textAlign: 'center' }}>{it.badge}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
