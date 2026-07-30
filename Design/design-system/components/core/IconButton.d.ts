import React from 'react';

declare namespace JSX { interface IntrinsicElements { [elem: string]: any; } }

export interface IconButtonProps {
  variant?: 'ghost' | 'outline' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  /** Obligatorio para accesibilidad. */
  'aria-label': string;
  /** El icono (ReactNode). */
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

export function IconButton(props: IconButtonProps): JSX.Element;
