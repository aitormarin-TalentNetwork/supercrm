import { InputHTMLAttributes, ReactNode, useId } from "react";

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  size?: "sm" | "md";
}

const heightClasses: Record<"sm" | "md", string> = {
  sm: "h-9",
  md: "h-11",
};

export function Input({
  label,
  hint,
  error,
  leftIcon,
  size = "md",
  required = false,
  id,
  className = "",
  ...rest
}: InputProps) {
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
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 inline-flex text-neutral-400">
            {leftIcon}
          </span>
        )}
        <input
          id={fieldId}
          aria-invalid={!!error}
          className={`w-full ${heightClasses[size]} ${leftIcon ? "pl-[38px] pr-3" : "px-3"} rounded-md border bg-surface font-sans text-sm text-text outline-none transition-[border-color,box-shadow] duration-150 disabled:bg-neutral-100 ${
            error
              ? "border-error"
              : "border-border focus:border-primary focus:ring-2 focus:ring-primary/35"
          } ${className}`}
          {...rest}
        />
      </div>
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
