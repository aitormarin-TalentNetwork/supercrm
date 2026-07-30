import React from 'react';

declare namespace JSX { interface IntrinsicElements { [elem: string]: any; } }

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Acción principal (p.ej. un Button). */
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

export function EmptyState(props: EmptyStateProps): JSX.Element;
