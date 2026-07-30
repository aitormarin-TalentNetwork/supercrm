import React from 'react';

declare namespace JSX { interface IntrinsicElements { [elem: string]: any; } }

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  /** Texto de ayuda bajo el campo. */
  hint?: string;
  /** Mensaje de error (sustituye al hint y colorea el borde). */
  error?: string;
  leftIcon?: React.ReactNode;
  size?: 'sm' | 'md';
  required?: boolean;
  style?: React.CSSProperties;
}

export function Input(props: InputProps): JSX.Element;
