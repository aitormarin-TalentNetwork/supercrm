import React from 'react';

declare namespace JSX { interface IntrinsicElements { [elem: string]: any; } }

export interface ButtonProps {
  /** Jerarquía visual. Solo un `primary` por vista. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Alto: sm=36, md=44 (≥44 en móvil), lg=52. */
  size?: 'sm' | 'md' | 'lg';
  /** Icono a la izquierda del texto (ReactNode, p.ej. <i data-lucide>). */
  leftIcon?: React.ReactNode;
  /** Icono a la derecha del texto. */
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  /** Ocupa el 100% del ancho disponible. */
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

export function Button(props: ButtonProps): JSX.Element;
