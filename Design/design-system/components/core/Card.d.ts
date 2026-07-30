import React from 'react';

declare namespace JSX { interface IntrinsicElements { [elem: string]: any; } }

export interface CardProps {
  elevation?: 'none' | 'e1' | 'e2' | 'e3';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Hover de elevación + cursor pointer. */
  interactive?: boolean;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

export function Card(props: CardProps): JSX.Element;
