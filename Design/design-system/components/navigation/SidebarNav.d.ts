import React from 'react';

declare namespace JSX { interface IntrinsicElements { [elem: string]: any; } }

export interface SidebarNavItem {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** Contador / badge opcional. */
  badge?: number | string;
}

export interface SidebarNavProps {
  items: SidebarNavItem[];
  value?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
}

export function SidebarNav(props: SidebarNavProps): JSX.Element;
