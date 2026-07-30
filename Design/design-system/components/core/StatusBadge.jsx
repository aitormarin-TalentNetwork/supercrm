import React from 'react';

const MAPS = {
  pipeline: {
    nuevo:       { label: 'Nuevo',       bg: '#F1F5F9', fg: '#475569', dot: '#64748B' },
    contactado:  { label: 'Contactado',  bg: '#ECFEFF', fg: '#0E7490', dot: '#0891B2' },
    propuesta:   { label: 'Propuesta',   bg: '#EEF2FF', fg: '#4F46E5', dot: '#6366F1' },
    negociacion: { label: 'Negociación', bg: '#FEF3C7', fg: '#B45309', dot: '#D97706' },
    ganado:      { label: 'Ganado',      bg: '#DCFCE7', fg: '#15803D', dot: '#16A34A' },
    perdido:     { label: 'Perdido',     bg: '#FEE2E2', fg: '#B91C1C', dot: '#DC2626' },
  },
  quote: {
    borrador:  { label: 'Borrador',  bg: '#F1F5F9', fg: '#475569', dot: '#64748B' },
    enviado:   { label: 'Enviado',   bg: '#E0F2FE', fg: '#0369A1', dot: '#0284C7' },
    aceptado:  { label: 'Aceptado',  bg: '#DCFCE7', fg: '#15803D', dot: '#16A34A' },
    rechazado: { label: 'Rechazado', bg: '#FEE2E2', fg: '#B91C1C', dot: '#DC2626' },
    vencido:   { label: 'Vencido',   bg: '#FEF3C7', fg: '#B45309', dot: '#D97706' },
  },
  task: {
    pendiente: { label: 'Pendiente', bg: '#F1F5F9', fg: '#475569', dot: '#64748B' },
    encurso:   { label: 'En curso',  bg: '#EFF4FF', fg: '#1D4ED8', dot: '#2563EB' },
    hecha:     { label: 'Hecha',     bg: '#DCFCE7', fg: '#15803D', dot: '#16A34A' },
    vencida:   { label: 'Vencida',   bg: '#FEE2E2', fg: '#B91C1C', dot: '#DC2626' },
  },
  risk: {
    low:    { label: 'Riesgo bajo',  bg: '#DCFCE7', fg: '#15803D', dot: '#16A34A' },
    medium: { label: 'Riesgo medio', bg: '#FEF3C7', fg: '#B45309', dot: '#D97706' },
    high:   { label: 'Riesgo alto',  bg: '#FEE2E2', fg: '#B91C1C', dot: '#DC2626' },
  },
};

/**
 * StatusBadge — chip de estado del CRM. Mapea (kind, value) a color y etiqueta
 * según los tokens de pipeline / presupuesto / tarea / riesgo.
 */
export function StatusBadge({ kind, value, label, dot = true, style, ...rest }) {
  const m = (MAPS[kind] && MAPS[kind][value]) || { label: value, bg: 'var(--color-neutral-100)', fg: 'var(--color-neutral-600)', dot: 'var(--color-neutral-500)' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '3px 10px',
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.4,
        borderRadius: 'var(--radius-pill)',
        background: m.bg,
        color: m.fg,
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {dot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.dot, flex: 'none' }} />}
      {label || m.label}
    </span>
  );
}
