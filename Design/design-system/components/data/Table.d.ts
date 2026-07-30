import React from 'react';

declare namespace JSX { interface IntrinsicElements { [elem: string]: any; } }

export interface TableColumn {
  /** Clave en el objeto fila. */
  key: string;
  header: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Peso flex de la columna (default 1). */
  width?: number;
  /** Tipografía monoespaciada (importes, IDs, fechas). */
  mono?: boolean;
  /** Texto secundario. */
  muted?: boolean;
  /** Render personalizado de la celda. */
  render?: (value: any, row: any) => React.ReactNode;
}

export interface TableProps {
  columns: TableColumn[];
  rows: any[];
  /** Campo identificador único (default 'id'). */
  rowKey?: string;
  onRowClick?: (row: any) => void;
  /** Filas más compactas. */
  dense?: boolean;
  style?: React.CSSProperties;
}

export function Table(props: TableProps): JSX.Element;
