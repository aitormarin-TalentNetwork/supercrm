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
        {/* AIT-72: h-11 w-11 (44px, --tap-min) — antes el botón no tenía
            ninguna medida propia, así que su objetivo táctil era solo el
            icono (16×16, el más pequeño de la app). right-0 en vez de
            right-3: con el ancho ya en 44px, centra el icono en una
            posición muy similar a la de antes sin necesitar recalcular
            el padding-right del input. */}
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute right-0 inline-flex h-11 w-11 items-center justify-center text-neutral-400 hover:text-text-secondary"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <div className="mt-1.5 text-xs text-error">{error}</div>}
    </div>
  );
}
