import React from 'react';

declare namespace JSX { interface IntrinsicElements { [elem: string]: any; } }

export interface ProgressBarProps {
  /** 0–100. */
  value?: number;
  variant?: 'primary' | 'success' | 'warning' | 'error';
  /** Color explícito (sobrescribe variant) — p.ej. un token de pipeline. */
  color?: string;
  label?: React.ReactNode;
  showValue?: boolean;
  style?: React.CSSProperties;
}

export function ProgressBar(props: ProgressBarProps): JSX.Element;
