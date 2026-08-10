import { TextareaHTMLAttributes, useId } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Textarea({
  label,
  hint,
  error,
  required = false,
  rows = 4,
  id,
  className = "",
  ...rest
}: TextareaProps) {
  const autoId = useId();
  const fieldId = id || autoId;

  return (
    <div className="font-sans">
      {label && (
        <label
          htmlFor={fieldId}
          className="mb-1.5 block text-[13px] font-semibold text-text-secondary"
        >
          {label}
          {required && <span className="text-error"> *</span>}
        </label>
      )}
      <textarea
        id={fieldId}
        rows={rows}
        aria-invalid={!!error}
        className={`w-full resize-y rounded-md border bg-surface px-3 py-2.5 font-sans text-sm text-text outline-none transition-[border-color,box-shadow] duration-150 disabled:bg-neutral-100 ${
          error
            ? "border-error"
            : "border-border focus:border-primary focus:ring-2 focus:ring-primary/35"
        } ${className}`}
        {...rest}
      />
      {(error || hint) && (
        <div
          className={`mt-1.5 text-xs ${error ? "text-error" : "text-text-muted"}`}
        >
          {error || hint}
        </div>
      )}
    </div>
  );
}
