import React from 'react';

declare namespace JSX { interface IntrinsicElements { [elem: string]: any; } }

export interface TabItem {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** Contador opcional (p.ej. nº de elementos). */
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
}

export function Tabs(props: TabsProps): JSX.Element;
