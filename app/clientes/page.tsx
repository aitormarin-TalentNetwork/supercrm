"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Table, TableColumn } from "@/components/ui/Table";
import { NavToggleButton } from "@/components/nav/NavToggleButton";
import { QuickActions } from "@/components/nav/QuickActions";
import { formatPhone, normalizePhone } from "@/lib/phone";

type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  source: string;
  ownerName: string | null;
};

// AIT-58 (Post-MVP, gap encontrado en la auditoría de cierre del MVP): la
// Ficha de cliente (app/clientes/[id]) nunca tuvo desde dónde alcanzarse
// como listado completo — solo desde Pipeline/Detalle/Alta rápida. El PRD
// no pide esta pantalla como una de las 10 del MVP, se trackea como mejora
// de navegación, no como corrección de un requisito incumplido (ver el
// issue de Linear).
export default function ClientesPage() {
  const router = useRouter();
  const role = useQuery(api.users.getCurrentUserRole);
  const customers = useQuery(api.customers.list, {});
  const [search, setSearch] = useState("");

  // Comercial solo aporta información cuando el listado puede mezclar
  // clientes de varios comerciales (owner/storeManager) — para sales, la
  // query ya devuelve solo los suyos, así que la columna sería el mismo
  // nombre repetido en cada fila.
  const showOwnerColumn = role === "owner" || role === "storeManager";

  const visible = useMemo(() => {
    if (!customers) return [];
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    // AIT-80: los teléfonos se guardan normalizados, así que compararlos
    // contra la consulta en crudo dejaría de encontrarlos en cuanto el
    // usuario teclee un espacio o un guion ("600 123" no está en
    // "600123456").
    //
    // Pero la consulta NO se normaliza entera: este buscador filtra también
    // por nombre y email, y quitarle todo lo que no sea dígito a "Juan 600"
    // dejaría de encontrar a Juan. Cada campo compara contra la forma que le
    // corresponde.
    //
    // Solo se compara contra el teléfono si la consulta ENTERA parece un
    // teléfono (misma clase de caracteres que valida el alta), no si
    // simplemente contiene algún dígito. Con la regla laxa, buscar "Prueba
    // AIT35" extraía "35" y arrastraba a todos los clientes con un 35 en
    // cualquier posición del número — comprobado en el navegador. Antes de
    // AIT-80 eso no pasaba, porque la consulta se comparaba en crudo y
    // "prueba ait35" no está dentro de ningún teléfono.
    //
    // Al pasar por normalizePhone, el buscador hereda la regla del prefijo:
    // buscar "+34 600" encuentra al cliente guardado como "600123456".
    const phoneQuery = /^[\d\s+()-]+$/.test(search.trim())
      ? normalizePhone(search)
      : "";
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (phoneQuery !== "" && c.phone.includes(phoneQuery)) ||
        (c.email ?? "").toLowerCase().includes(q),
    );
  }, [customers, search]);

  const columns = useMemo<TableColumn<CustomerRow>[]>(() => {
    const base: TableColumn<CustomerRow>[] = [
      {
        key: "name",
        header: "Cliente",
        width: 2,
        minWidth: 180,
        render: (value, row) => (
          <span className="flex min-w-0 items-center gap-2.5">
            <Avatar name={row.name} size="xs" />
            <span className="min-w-0 truncate font-semibold">{String(value)}</span>
          </span>
        ),
      },
      {
        key: "phone",
        header: "Teléfono",
        mono: true,
        minWidth: 130,
        // AIT-80: el valor almacenado es canónico (dígitos), así que sin
        // esto la columna mostraría "600123456".
        render: (value) => formatPhone(String(value)),
      },
      {
        key: "email",
        header: "Email",
        muted: true,
        minWidth: 200,
        render: (value) => (
          <span className="block max-w-[260px] truncate">
            {(value as string | null) ?? "—"}
          </span>
        ),
      },
      {
        key: "source",
        header: "Origen",
        minWidth: 130,
        render: (value) => (
          <Badge variant="neutral" dot>
            {String(value)}
          </Badge>
        ),
      },
    ];
    if (showOwnerColumn) {
      base.push({
        key: "ownerName",
        header: "Comercial",
        muted: true,
        minWidth: 120,
        render: (value) => <span>{(value as string | null) ?? "—"}</span>,
      });
    }
    return base;
  }, [showOwnerColumn]);

  if (customers === undefined || role === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center bg-bg font-sans">
        <p className="text-text-secondary">Cargando…</p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg font-sans text-text">
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex-none border-b border-border bg-surface px-5 py-3.5">
          <div className="flex flex-wrap items-center gap-3.5">
            <NavToggleButton />
            <div className="min-w-0">
              <h1 className="m-0 text-[19px] font-bold tracking-tight">
                Clientes
              </h1>
              <p className="text-[12.5px] text-text-muted">
                {customers.length} cliente{customers.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="ml-auto flex flex-none items-center gap-2">
              <QuickActions />
            </div>
            <div className="w-full sm:w-[260px]">
              {/* AIT-71: sin `size="sm"` (36px) — cae al `md` por defecto
                  (44px, --tap-min), mismo fix ya aplicado en AIT-68. */}
              <Input
                leftIcon={<Search size={15} />}
                placeholder="Buscar por nombre, teléfono o email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-4 px-5 py-6">
          {visible.length === 0 ? (
            <p className="text-sm text-text-secondary">
              {customers.length === 0
                ? "Todavía no hay clientes registrados."
                : "Ningún cliente coincide con la búsqueda."}
            </p>
          ) : (
            <Table
              columns={columns}
              rows={visible}
              rowKey={(row) => row.id}
              onRowClick={(row) => router.push(`/clientes/${row.id}`)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
