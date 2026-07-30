import React from 'react';

declare namespace JSX { interface IntrinsicElements { [elem: string]: any; } }

export interface PaginationProps {
  page?: number;
  totalPages?: number;
  onChange?: (page: number) => void;
  style?: React.CSSProperties;
}

export function Pagination(props: PaginationProps): JSX.Element;
