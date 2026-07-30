import React from 'react';

/**
 * Table — tabla de datos densa. `columns` describe cabeceras y celdas.
 */
export function Table({ columns = [], rows = [], rowKey = 'id', onRowClick, dense = false, style, ...rest }) {
  const [hovered, setHovered] = React.useState(null);
  const padY = dense ? 8 : 12;
  const align = (a) => (a === 'right' ? 'flex-end' : a === 'center' ? 'center' : 'flex-start');

  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: 'var(--color-surface)',
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
      {...rest}
    >
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: `9px 16px`, background: 'var(--color-neutral-50)', borderBottom: '1px solid var(--color-border)' }}>
        {columns.map((c) => (
          <div key={c.key} style={{ flex: c.width || 1, minWidth: 0, display: 'flex', justifyContent: align(c.align), fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
            {c.header}
          </div>
        ))}
      </div>
      {/* Filas */}
      {rows.map((row, i) => {
        const key = row[rowKey] != null ? row[rowKey] : i;
        return (
          <div
            key={key}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            onMouseEnter={() => setHovered(key)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: `${padY}px 16px`,
              minHeight: 44,
              borderBottom: i < rows.length - 1 ? '1px solid var(--color-neutral-100)' : 'none',
              background: hovered === key ? 'var(--color-neutral-100)' : 'transparent',
              cursor: onRowClick ? 'pointer' : 'default',
              transition: 'background .12s ease',
              fontSize: 14, color: 'var(--color-text)',
            }}
          >
            {columns.map((c) => (
              <div key={c.key} style={{ flex: c.width || 1, minWidth: 0, display: 'flex', justifyContent: align(c.align), alignItems: 'center', fontFamily: c.mono ? 'var(--font-mono)' : 'inherit', fontSize: c.mono ? 13 : 14, color: c.muted ? 'var(--color-text-secondary)' : 'inherit', overflow: 'hidden' }}>
                {c.render ? c.render(row[c.key], row) : row[c.key]}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
