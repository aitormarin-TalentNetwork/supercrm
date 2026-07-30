import React from 'react';

declare namespace JSX { interface IntrinsicElements { [elem: string]: any; } }

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  rows?: number;
  required?: boolean;
  style?: React.CSSProperties;
}

export function Textarea(props: TextareaProps): JSX.Element;
