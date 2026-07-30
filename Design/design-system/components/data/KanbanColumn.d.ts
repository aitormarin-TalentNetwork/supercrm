import React from 'react';

declare namespace JSX { interface IntrinsicElements { [elem: string]: any; } }

export interface KanbanColumnProps {
  /** Etapa del pipeline — colorea el encabezado. */
  stage?: 'nuevo' | 'contactado' | 'propuesta' | 'negociacion' | 'ganado' | 'perdido';
  title: React.ReactNode;
  /** Nº de tratos en la columna. */
  count?: number;
  /** Total monetario (texto ya formateado, p.ej. "€42.300"). */
  total?: React.ReactNode;
  /** Tarjetas de trato. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function KanbanColumn(props: KanbanColumnProps): JSX.Element;
