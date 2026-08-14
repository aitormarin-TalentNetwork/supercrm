"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AppSidebar } from "@/components/nav/AppSidebar";
import { BottomTabBar } from "@/components/nav/BottomTabBar";
import { formatCurrency, parseEuroAmount } from "@/lib/format";

type Product = { id: Id<"products">; name: string; price: number };

// Catálogo de productos (AIT-29, Post-MVP). Administración (alta/edición/
// borrado) reservada estrictamente a owner — sales Y storeManager lo ven
// en solo lectura (AIT-50 NO-GO ronda 1, mayor #2: las mutations
// create/update/remove exigen requireOwner en convex/products.ts, no
// isStoreWideRole — storeManager NO administra el catálogo, a
// diferencia de otras pantallas donde sí tiene el mismo alcance que
// owner. `canManageProducts` (solo owner) es deliberadamente distinto
// de `isStoreWide` (owner/storeManager, usado solo para decidir qué
// shell de navegación mostrar) — mezclarlos fue precisamente el bug de
// la ronda anterior. El guard de aquí sigue siendo solo de UX: `list`
// ya usaba requireUser (cualquier autenticado), así que sales/
// storeManager podían leer los datos desde siempre, solo no tenían
// forma de llegar a la pantalla (sales) o veían controles que les
// habrían fallado al usarlos (storeManager).
export default function CatalogoPage() {
  const role = useQuery(api.users.getCurrentUserRole);
  const products = useQuery(api.products.list);
  const isStoreWide = role === "owner" || role === "storeManager";
  const canManageProducts = role === "owner";

  if (role === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center bg-bg font-sans">
        <p className="text-text-secondary">Cargando…</p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg font-sans text-text lg:flex-row">
      {isStoreWide && <AppSidebar />}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-4">
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold text-text">
              Catálogo de productos
            </h1>
            <p className="text-[12px] text-text-muted">
              Para construir presupuestos por líneas
            </p>
          </div>
        </header>

        <div
          className={`mx-auto flex w-full max-w-[720px] flex-col gap-4 px-4 pt-[18px] ${
            isStoreWide ? "pb-16" : "pb-28"
          }`}
        >
          {canManageProducts && <NewProductForm />}

          <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-e1)]">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Package size={16} className="text-neutral-400" />
              <span className="text-sm font-bold text-text">
                Productos {products ? `(${products.length})` : ""}
              </span>
            </div>

            {products === undefined && (
              <p className="px-4 py-6 text-center text-sm text-text-secondary">
                Cargando…
              </p>
            )}
            {products?.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-text-secondary">
                Sin productos todavía
                {canManageProducts ? " — añade el primero arriba." : "."}
              </p>
            )}
            {products?.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                readOnly={!canManageProducts}
              />
            ))}
          </section>
        </div>
      </main>

      {!isStoreWide && <BottomTabBar />}
    </div>
  );
}

function NewProductForm() {
  const create = useMutation(api.products.create);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    let hasError = false;
    if (!name.trim()) {
      setNameError("El nombre es obligatorio.");
      hasError = true;
    } else {
      setNameError("");
    }
    const parsedPrice = parseEuroAmount(price);
    if (parsedPrice === null || parsedPrice === undefined) {
      setPriceError("Introduce un precio como 19,90 o 19.90.");
      hasError = true;
    } else {
      setPriceError("");
    }
    if (hasError) return;

    setFormError("");
    setLoading(true);
    try {
      await create({ name: name.trim(), price: parsedPrice as number });
      setName("");
      setPrice("");
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo creando producto:", err);
      }
      setFormError("No se ha podido añadir el producto. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-e1)]">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        {formError && (
          <div className="w-full rounded-md bg-error-subtle p-3 text-sm text-error">
            {formError}
          </div>
        )}
        <div className="min-w-[180px] flex-1">
          <Input
            label="Nombre del producto"
            placeholder="p.ej. Rediseño web"
            error={nameError}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="w-[140px]">
          <Input
            label="Precio (€)"
            placeholder="0,00"
            error={priceError}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <Button type="submit" leftIcon={<Plus size={16} />} disabled={loading}>
          {loading ? "Añadiendo…" : "Añadir"}
        </Button>
      </form>
    </section>
  );
}

function ProductRow({
  product,
  readOnly,
}: {
  product: Product;
  readOnly: boolean;
}) {
  const update = useMutation(api.products.update);
  const remove = useMutation(api.products.remove);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price).replace(".", ","));
  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rowError, setRowError] = useState("");

  function startEdit() {
    setName(product.name);
    setPrice(String(product.price).replace(".", ","));
    setNameError("");
    setPriceError("");
    setRowError("");
    setEditing(true);
  }

  async function handleSave() {
    if (loading) return;
    let hasError = false;
    if (!name.trim()) {
      setNameError("El nombre es obligatorio.");
      hasError = true;
    } else {
      setNameError("");
    }
    const parsedPrice = parseEuroAmount(price);
    if (parsedPrice === null || parsedPrice === undefined) {
      setPriceError("Precio no válido.");
      hasError = true;
    } else {
      setPriceError("");
    }
    if (hasError) return;

    setLoading(true);
    try {
      await update({
        productId: product.id,
        name: name.trim(),
        price: parsedPrice as number,
      });
      setEditing(false);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo actualizando producto:", err);
      }
      setRowError("No se ha podido guardar. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (loading) return;
    setLoading(true);
    setRowError("");
    try {
      await remove({ productId: product.id });
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo eliminando producto:", err);
      }
      setRowError("No se ha podido eliminar. Inténtalo de nuevo.");
      setLoading(false);
    }
  }

  if (editing) {
    return (
      <div className="border-t border-border p-4">
        {rowError && (
          <div className="mb-2.5 rounded-md bg-error-subtle p-2.5 text-sm text-error">
            {rowError}
          </div>
        )}
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px] flex-1">
            <Input
              label="Nombre"
              error={nameError}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="w-[140px]">
            <Input
              label="Precio (€)"
              error={priceError}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={handleSave} disabled={loading}>
            {loading ? "Guardando…" : "Guardar"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditing(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 border-t border-border px-4 py-3">
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text">
        {product.name}
      </span>
      <span className="flex-none font-mono text-sm font-semibold text-text">
        {formatCurrency(product.price)}
      </span>
      {!readOnly && (
        <>
          <button
            type="button"
            aria-label={`Editar ${product.name}`}
            onClick={startEdit}
            disabled={loading}
            className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-md text-text-secondary hover:bg-neutral-100 disabled:opacity-50"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            aria-label={`Eliminar ${product.name}`}
            onClick={handleDelete}
            disabled={loading}
            className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-md text-text-secondary hover:bg-error-subtle hover:text-error disabled:opacity-50"
          >
            <Trash2 size={15} />
          </button>
        </>
      )}
      {rowError && <p className="w-full text-xs text-error">{rowError}</p>}
    </div>
  );
}
