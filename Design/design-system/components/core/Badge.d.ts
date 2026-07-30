import React from 'react';

declare namespace JSX { interface IntrinsicElements { [elem: string]: any; } }

export interface BadgeProps {
  variant?: 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  /** Muestra un punto de color a la izquierda. */
  dot?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Badge(props: BadgeProps): JSX.Element;
