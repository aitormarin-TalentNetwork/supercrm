import React from 'react';

declare namespace JSX { interface IntrinsicElements { [elem: string]: any; } }

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function Checkbox(props: CheckboxProps): JSX.Element;
