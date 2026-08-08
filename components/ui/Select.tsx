import { SelectHTMLAttributes, useId } from "react";

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  size?: "sm" | "md";
}

const heightClasses: Record<"sm" | "md", string> = {
  sm: "h-9",
  md: "h-11",
};

export function Select({
  label,
  hint,
  error,
  size = "md",
  required = false,
  id,
  className = "",
  children,
  ...rest
}: SelectProps) {
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
      <div className="relative">
        <select
          id={fieldId}
          aria-invalid={!!error}
          className={`w-full ${heightClasses[size]} appearance-none rounded-md border bg-surface px-3 pr-9 font-sans text-sm text-text outline-none transition-[border-color,box-shadow] duration-150 disabled:bg-neutral-100 ${
            error
              ? "border-error"
              : "border-border focus:border-primary focus:ring-2 focus:ring-primary/35"
          } ${className}`}
          {...rest}
        >
          {children}
        </select>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {(error || hint) && (
        <div className={`mt-1.5 text-xs ${error ? "text-error" : "text-text-muted"}`}>
          {error || hint}
        </div>
      )}
    </div>
  );
}
