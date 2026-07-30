import React from 'react';

/**
 * Pagination — navegación de páginas compacta.
 */
export function Pagination({ page = 1, totalPages = 1, onChange, style, ...rest }) {
  const go = (p) => { if (p >= 1 && p <= totalPages && onChange) onChange(p); };
  const pages = [];
  const range = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - range && i <= page + range)) pages.push(i);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }

  const btn = (content, opts = {}) => {
    const { active, disabled, onClick, label } = opts;
    return (
      <button
        key={label}
        onClick={onClick}
        disabled={disabled}
        aria-label={typeof content === 'string' ? undefined : label}
        style={{
          minWidth: 34, height: 34, padding: '0 8px',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
          color: active ? 'var(--color-on-primary)' : 'var(--color-text-secondary)',
          background: active ? 'var(--color-primary)' : 'transparent',
          border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {content}
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-sans)', ...style }} {...rest}>
      {btn('‹', { disabled: page <= 1, onClick: () => go(page - 1), label: 'prev' })}
      {pages.map((p, i) =>
        p === '…'
          ? <span key={'e' + i} style={{ color: 'var(--color-neutral-400)', padding: '0 2px' }}>…</span>
          : btn(p, { active: p === page, onClick: () => go(p), label: 'p' + p })
      )}
      {btn('›', { disabled: page >= totalPages, onClick: () => go(page + 1), label: 'next' })}
    </div>
  );
}
