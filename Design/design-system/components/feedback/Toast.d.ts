import React from 'react';

declare namespace JSX { interface IntrinsicElements { [elem: string]: any; } }

export interface ToastProps {
  variant?: 'success' | 'warning' | 'error' | 'info';
  title?: React.ReactNode;
  message?: React.ReactNode;
  onClose?: () => void;
  style?: React.CSSProperties;
}

export function Toast(props: ToastProps): JSX.Element;
