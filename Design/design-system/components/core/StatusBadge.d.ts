import React from 'react';

declare namespace JSX { interface IntrinsicElements { [elem: string]: any; } }

export interface StatusBadgeProps {
  /** Familia de estado del CRM. */
  kind: 'pipeline' | 'quote' | 'task' | 'risk';
  /**
   * Valor dentro de la familia:
   * pipeline: nuevo | contactado | propuesta | negociacion | ganado | perdido
   * quote: borrador | enviado | aceptado | rechazado | vencido
   * task: pendiente | encurso | hecha | vencida
   * risk: low | medium | high
   */
  value: string;
  /** Sobrescribe la etiqueta por defecto. */
  label?: string;
  /** Muestra el punto de color (default true). */
  dot?: boolean;
  style?: React.CSSProperties;
}

export function StatusBadge(props: StatusBadgeProps): JSX.Element;
