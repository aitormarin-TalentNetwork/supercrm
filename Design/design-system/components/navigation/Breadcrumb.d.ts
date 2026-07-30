import React from 'react';

declare namespace JSX { interface IntrinsicElements { [elem: string]: any; } }

export interface BreadcrumbItem {
  label: React.ReactNode;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  style?: React.CSSProperties;
}

export function Breadcrumb(props: BreadcrumbProps): JSX.Element;
