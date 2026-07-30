import React from 'react';

declare namespace JSX { interface IntrinsicElements { [elem: string]: any; } }

export interface RadioProps {
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: React.ReactNode;
  name?: string;
  value?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function Radio(props: RadioProps): JSX.Element;
