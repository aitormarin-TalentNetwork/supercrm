"use client";

import { useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/Button";

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg"];

// AIT-61: solo-owner (mismo criterio que stores.create/update y
// UsersSection) — cambiar el logo del negocio es una decisión de la
// dueña, no de quien gestiona una tienda concreta. La validación real de
// tipo/tamaño/contenido vive en el servidor (convex/storesLogo.ts) —
// aquí solo se filtra cuanto antes para no gastar una subida en un
// archivo que ya se sabe inválido en el cliente.
export function StoreLogoSection() {
  const store = useQuery(api.stores.getStoreInfo, {});
  const generateUploadUrl = useMutation(api.stores.generateLogoUploadUrl);
  const setLogo = useAction(api.storesLogo.setLogo);
  const removeLogo = useMutation(api.stores.removeLogo);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (store === undefined) return null;

  // Const en vez de function declaration: solo así TypeScript aplica el
  // "if (store === undefined) return null" de arriba dentro del cuerpo —
  // una function declaration está hoisted y TS no puede asumir que no se
  // llama antes de esa comprobación.
  const handleFileSelected = async (file: File) => {
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setError("El logo debe ser una imagen PNG o JPEG.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError("El logo no puede superar los 2MB.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("No se pudo subir el archivo.");
      const { storageId } = await response.json();
      await setLogo({ storeId: store.storeId, storageId });
    } catch {
      setError("No se ha podido guardar el logo. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await removeLogo({ storeId: store.storeId });
    } catch {
      setError("No se ha podido quitar el logo. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-[480px] overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-e1)]">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-neutral-100 text-text-secondary">
          {store.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- vista previa de un archivo subido por el usuario, no un asset del proyecto
            <img
              src={store.logoUrl}
              alt="Logo del negocio"
              className="h-full w-full rounded-md object-contain"
            />
          ) : (
            <ImageIcon size={16} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
            Logo del negocio
          </div>
          <div className="truncate text-sm font-semibold text-text">
            {store.logoUrl
              ? "Se usa en el PDF del presupuesto"
              : "Sin logo — el PDF usa el nombre de la tienda"}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void handleFileSelected(file);
          }}
        />
        {/* AIT-72: sin `size="sm"` (36px) — cae al `md` por defecto (44px,
            --tap-min), mismo fix ya aplicado en AIT-68/71. */}
        <Button
          variant="secondary"
          leftIcon={<Upload size={14} />}
          disabled={loading}
          onClick={() => fileInputRef.current?.click()}
        >
          {loading ? "Guardando…" : store.logoUrl ? "Cambiar" : "Subir"}
        </Button>
        {store.logoUrl && (
          // AIT-72: h-11 w-11 (44px, --tap-min) en vez de h-8 w-8 (32px) —
          // mismo patrón que "Editar"/"Desactivar" de Ajustes, hallado de
          // paso en este mismo fichero.
          <button
            type="button"
            aria-label="Quitar logo"
            onClick={handleRemove}
            disabled={loading}
            className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-md text-text-secondary hover:bg-error-subtle hover:text-error disabled:opacity-50"
          >
            <X size={15} />
          </button>
        )}
      </div>
      {error && (
        <p className="border-t border-border px-4 py-2.5 text-xs text-error">
          {error}
        </p>
      )}
    </section>
  );
}
