import React from 'react';

const STAGE_COLORS = {
  nuevo: 'var(--pipeline-nuevo)',
  contactado: 'var(--pipeline-contactado)',
  propuesta: 'var(--pipeline-propuesta)',
  negociacion: 'var(--pipeline-negociacion)',
  ganado: 'var(--pipeline-ganado)',
  perdido: 'var(--pipeline-perdido)',
};

/**
 * KanbanColumn — columna del tablero de pipeline. Encabezado con color de etapa,
 * conteo y total; las tarjetas van como children.
 */
export function KanbanColumn({ stage, title, count, total, children, style, ...rest }) {
  const color = STAGE_COLORS[stage] || 'var(--color-neutral-500)';
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        width: 280, flex: 'none',
        background: 'var(--color-neutral-50)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        fontFamily: 'var(--font-sans)',
        maxHeight: '100%',
        ...style,
      }}
      {...rest}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flex: 'none' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{title}</span>
        {count != null && (
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-neutral-200)', borderRadius: 'var(--radius-pill)', padding: '1px 7px' }}>{count}</span>
        )}
        {total != null && (
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-secondary)' }}>{total}</span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 10, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}
