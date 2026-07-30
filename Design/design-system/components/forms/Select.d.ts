import React from 'react';

declare namespace JSX { interface IntrinsicElements { [elem: string]: any; } }

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  size?: 'sm' | 'md';
  required?: boolean;
  /** <option> nativas. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Select(props: SelectProps): JSX.Element;
