import React from 'react';

/**
 * Breadcrumb — ruta de navegación.
 */
export function Breadcrumb({ items = [], style, ...rest }) {
  return (
    <nav aria-label="Ruta" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, fontFamily: 'var(--font-sans)', fontSize: 13, ...style }} {...rest}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {it.href && !last ? (
              <a href={it.href} style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontWeight: 500 }}>{it.label}</a>
            ) : (
              <span style={{ color: last ? 'var(--color-text)' : 'var(--color-text-muted)', fontWeight: last ? 600 : 500 }}>{it.label}</span>
            )}
            {!last && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-neutral-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
