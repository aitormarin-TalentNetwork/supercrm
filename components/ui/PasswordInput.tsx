"use client";

import { InputHTMLAttributes, useId, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  label?: string;
  error?: string;
}

export function PasswordInput({
  label = "Contraseña",
  error,
  required = false,
  id,
  className = "",
  ...rest
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const fieldId = id || autoId;

  return (
    <div className="font-sans">
      <label
        htmlFor={fieldId}
        className="mb-1.5 block text-[13px] font-semibold text-text-secondary"
      >
        {label}
        {required && <span className="text-error"> *</span>}
      </label>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3 inline-flex text-neutral-400">
          <Lock size={16} />
        </span>
        <input
          id={fieldId}
          type={visible ? "text" : "password"}
          aria-invalid={!!error}
          className={`h-11 w-full rounded-md border bg-surface py-0 pl-[38px] pr-10 font-sans text-sm text-text outline-none transition-[border-color,box-shadow] duration-150 disabled:bg-neutral-100 ${
            error
              ? "border-error"
              : "border-border focus:border-primary focus:ring-2 focus:ring-primary/35"
          } ${className}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute right-3 inline-flex text-neutral-400 hover:text-text-secondary"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <div className="mt-1.5 text-xs text-error">{error}</div>}
    </div>
  );
}
