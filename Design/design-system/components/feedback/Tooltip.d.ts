import React from 'react';

declare namespace JSX { interface IntrinsicElements { [elem: string]: any; } }

export interface TooltipProps {
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Elemento que dispara el tooltip. */
  children: React.ReactNode;
}

export function Tooltip(props: TooltipProps): JSX.Element;
