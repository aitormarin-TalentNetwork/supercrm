import React from 'react';

declare namespace JSX { interface IntrinsicElements { [elem: string]: any; } }

export interface AvatarProps {
  /** Nombre — genera iniciales y color estable. */
  name?: string;
  /** URL de imagen (opcional); si falta, muestra iniciales. */
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export function Avatar(props: AvatarProps): JSX.Element;
