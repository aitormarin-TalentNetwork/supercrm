import React from 'react';

declare namespace JSX { interface IntrinsicElements { [elem: string]: any; } }

export interface DialogProps {
  open: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Cuerpo del modal (formularios, contenido). */
  children?: React.ReactNode;
  /** Acciones (normalmente botones). */
  footer?: React.ReactNode;
  width?: number;
}

export function Dialog(props: DialogProps): JSX.Element | null;
