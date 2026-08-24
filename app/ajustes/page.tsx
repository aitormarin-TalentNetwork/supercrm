"use client";

import { useState, type FormEvent } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  Mail,
  Pencil,
  Plus,
  Power,
  Store,
  User,
  UserCog,
  Users,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { NavToggleButton } from "@/components/nav/NavToggleButton";
import { ROLE_LABEL } from "@/components/nav/navConfig";
import { PushNotificationsSection } from "@/components/push/PushNotificationsSection";
import { useSignOutAndUnlinkPush } from "@/components/push/useSignOutAndUnlinkPush";
import { StoreLogoSection } from "@/components/settings/StoreLogoSection";

type ManagedUser = {
  id: Id<"users">;
  name: string;
  email: string;
  role: "owner" | "storeManager" | "sales";
  storeId: Id<"stores">;
  storeName: string;
  active: boolean;
};

// AIT-50: pantalla nueva, sin mockup de referencia — decisiones de UI
// documentadas en el export para el auditor. Deliberadamente sobria (el
// brief pide explícitamente que no sea una pantalla de foco visual):
// una sola tarjeta de solo lectura + el botón de cerrar sesión que antes
// vivía suelto solo en Hoy. Nada editable — el brief excluye
// explícitamente "preferencias de perfil" de este alcance.
//
// AIT-52 (Post-MVP): añade la sección "Usuarios" debajo, visible solo
// para owner — sin mockup permanente (demo efímera del PM, ya aprobada),
// así que sigue el mismo criterio de sobriedad y reutiliza el patrón ya
// auditado de Catálogo (AIT-29/50): formulario de alta siempre visible +
// lista con edición inline por fila, en vez de un modal. La columna se
// ensancha solo para owner (720px, igual que Catálogo) porque la lista
// de usuarios necesita más ancho que la tarjeta de perfil; para
// sales/storeManager la pantalla queda exactamente igual que antes.
export default function AjustesPage() {
  const role = useQuery(api.users.getCurrentUserRole);
  const userInfo = useQuery(api.users.getCurrentUserInfo);
  const signOut = useSignOutAndUnlinkPush();

  const loading = role === undefined || userInfo === undefined;
  const canManageUsers = role === "owner";

  return (
    <div className="flex min-h-screen flex-col bg-bg font-sans text-text">
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-4">
          <NavToggleButton />
          <h1 className="m-0 text-[15px] font-bold">Ajustes</h1>
        </header>

        <div
          className={`mx-auto flex w-full flex-1 flex-col gap-4 px-4 pb-16 pt-[18px] ${
            canManageUsers ? "max-w-[720px]" : "max-w-[480px]"
          }`}
        >
          {loading ? (
            <p className="text-text-secondary">Cargando…</p>
          ) : (
            <>
              <section className="mx-auto w-full max-w-[480px] overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-e1)]">
                <InfoRow
                  icon={<User size={16} />}
                  label="Nombre"
                  value={userInfo.name || "—"}
                />
                <InfoRow
                  icon={<Mail size={16} />}
                  label="Email"
                  value={userInfo.email || "—"}
                />
                <InfoRow
                  icon={<UserCog size={16} />}
                  label="Rol"
                  value={role ? (ROLE_LABEL[role] ?? role) : "—"}
                />
                <InfoRow
                  icon={<Store size={16} />}
                  label="Tienda"
                  value={userInfo.storeName || "—"}
                  last
                />
              </section>

              {/* AIT-57: avisos push reales — sección propia, no una fila
                más de InfoRow (no es solo-lectura, tiene una acción). */}
              <PushNotificationsSection />

              {/* AIT-61: solo owner, mismo criterio que UsersSection. */}
              {canManageUsers && <StoreLogoSection />}

              {canManageUsers && <UsersSection />}

              <div className="mx-auto w-full max-w-[480px]">
                <Button variant="secondary" onClick={() => signOut()}>
                  Cerrar sesión
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 ${last ? "" : "border-b border-border"}`}
    >
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-neutral-100 text-text-secondary">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
          {label}
        </div>
        <div className="truncate text-sm font-semibold text-text">{value}</div>
      </div>
    </div>
  );
}

// Espejo del MIN_PASSWORD_LENGTH de convex/users.ts — validación en
// cliente antes de llamar a la action, mismo criterio que ya usa
// Catálogo con el precio (parseEuroAmount) antes de llamar a create.
const MIN_PASSWORD_LENGTH = 8;

const ASSIGNABLE_ROLES = ["sales", "storeManager"] as const;

// Los errores de una `action` (createUser) llegan al cliente envueltos en
// ruido de Convex Dev ("[Request ID: ...] Server Error Uncaught Error: ...
// at handler (...) Called by client") — a diferencia de una mutation
// normal, cuyo err.message ya llega limpio. En vez de parsear ese
// envoltorio (frágil, cambia entre dev/prod), se compara contra la lista
// cerrada de mensajes que createUser puede lanzar (convex/users.ts) — si
// coincide se muestra tal cual (útil, p.ej. distinguir email duplicado),
// si no, mensaje genérico. Nunca se muestra el mensaje crudo del servidor.
const KNOWN_CREATE_USER_ERRORS = [
  "El email es obligatorio.",
  "El nombre es obligatorio.",
  `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
  "Ya existe un usuario con ese email.",
  "La tienda indicada no existe.",
  "Solo la dueña puede crear usuarios.",
];

function describeCreateUserError(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    const known = KNOWN_CREATE_USER_ERRORS.find((msg) =>
      err.message.includes(msg),
    );
    if (known) return known;
  }
  return fallback;
}

function UsersSection() {
  const users = useQuery(api.users.listUsers);
  const stores = useQuery(api.stores.listStores);

  return (
    <section className="w-full overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-e1)]">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Users size={16} className="text-neutral-400" />
        <span className="text-sm font-bold text-text">
          Usuarios {users ? `(${users.length})` : ""}
        </span>
      </div>

      <div className="border-b border-border p-4">
        {stores === undefined ? (
          <p className="text-center text-sm text-text-secondary">Cargando…</p>
        ) : (
          <NewUserForm stores={stores} />
        )}
      </div>

      {users === undefined && (
        <p className="px-4 py-6 text-center text-sm text-text-secondary">
          Cargando…
        </p>
      )}
      {users?.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-text-secondary">
          Sin usuarios todavía.
        </p>
      )}
      {users?.map((user) => (
        <UserRow key={user.id} user={user} stores={stores ?? []} />
      ))}
    </section>
  );
}

function NewUserForm({
  stores,
}: {
  stores: { id: Id<"stores">; name: string }[];
}) {
  const createUser = useAction(api.users.createUser);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<(typeof ASSIGNABLE_ROLES)[number]>("sales");
  const [storeId, setStoreId] = useState<Id<"stores"> | "">(
    stores[0]?.id ?? "",
  );
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
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
    if (!email.trim()) {
      setEmailError("El email es obligatorio.");
      hasError = true;
    } else {
      setEmailError("");
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      );
      hasError = true;
    } else {
      setPasswordError("");
    }
    if (!storeId) {
      setFormError("Selecciona una tienda.");
      hasError = true;
    }
    if (hasError) return;

    setFormError("");
    setLoading(true);
    try {
      await createUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        storeId: storeId as Id<"stores">,
      });
      setName("");
      setEmail("");
      setPassword("");
      setRole("sales");
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo creando usuario:", err);
      }
      setFormError(
        describeCreateUserError(
          err,
          "No se ha podido crear el usuario. Inténtalo de nuevo.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {formError && (
        <div className="rounded-md bg-error-subtle p-3 text-sm text-error">
          {formError}
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[160px] flex-1">
          <Input
            label="Nombre"
            placeholder="p.ej. Ana López"
            error={nameError}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="min-w-[200px] flex-1">
          <Input
            label="Email"
            type="email"
            placeholder="ana@empresa.es"
            error={emailError}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1">
          <PasswordInput
            label="Contraseña provisional"
            error={passwordError}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="w-[170px]">
          <Select
            label="Rol"
            value={role}
            onChange={(e) =>
              setRole(e.target.value as (typeof ASSIGNABLE_ROLES)[number])
            }
          >
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-[170px]">
          <Select
            label="Tienda"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value as Id<"stores">)}
          >
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" leftIcon={<Plus size={16} />} disabled={loading}>
          {loading ? "Creando…" : "Crear usuario"}
        </Button>
      </div>
    </form>
  );
}

function UserRow({
  user,
  stores,
}: {
  user: ManagedUser;
  stores: { id: Id<"stores">; name: string }[];
}) {
  const updateUser = useMutation(api.users.updateUser);
  // AIT-52 (loop2): setUserActive pasó de mutation a action para poder
  // invalidar sesiones (invalidateSessions necesita ActionCtx).
  const setUserActive = useAction(api.users.setUserActive);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<(typeof ASSIGNABLE_ROLES)[number]>(
    user.role === "owner" ? "sales" : user.role,
  );
  const [storeId, setStoreId] = useState<Id<"stores">>(user.storeId);
  const [nameError, setNameError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rowError, setRowError] = useState("");

  // La propia dueña nunca se administra desde aquí (updateUser/
  // setUserActive lo rechazan en el backend) — sin acciones en su fila.
  const isOwnerRow = user.role === "owner";

  function startEdit() {
    setName(user.name);
    setRole(user.role === "owner" ? "sales" : user.role);
    setStoreId(user.storeId);
    setNameError("");
    setRowError("");
    setEditing(true);
  }

  async function handleSave() {
    if (loading) return;
    if (!name.trim()) {
      setNameError("El nombre es obligatorio.");
      return;
    }
    setNameError("");
    setLoading(true);
    try {
      await updateUser({
        userId: user.id,
        name: name.trim(),
        role,
        storeId,
      });
      setEditing(false);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo actualizando usuario:", err);
      }
      setRowError("No se ha podido guardar. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive() {
    if (loading) return;
    setLoading(true);
    setRowError("");
    try {
      await setUserActive({ userId: user.id, active: !user.active });
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Fallo cambiando estado del usuario:", err);
      }
      setRowError("No se ha podido cambiar el estado. Inténtalo de nuevo.");
    } finally {
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
          <div className="min-w-[160px] flex-1">
            <Input
              label="Nombre"
              error={nameError}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="w-[170px]">
            <Select
              label="Rol"
              value={role}
              onChange={(e) =>
                setRole(e.target.value as (typeof ASSIGNABLE_ROLES)[number])
              }
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-[170px]">
            <Select
              label="Tienda"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value as Id<"stores">)}
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </Select>
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
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-text">
            {user.name || "—"}
          </span>
          <Badge variant={user.active ? "success" : "neutral"}>
            {user.active ? "Activo" : "Desactivado"}
          </Badge>
        </div>
        <div className="truncate text-xs text-text-muted">
          {user.email} · {ROLE_LABEL[user.role] ?? user.role} · {user.storeName}
        </div>
        {rowError && <p className="mt-1 text-xs text-error">{rowError}</p>}
      </div>
      {!isOwnerRow && (
        <>
          <button
            type="button"
            aria-label={`Editar ${user.name}`}
            onClick={startEdit}
            disabled={loading}
            className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-md text-text-secondary hover:bg-neutral-100 disabled:opacity-50"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            aria-label={
              user.active ? `Desactivar ${user.name}` : `Reactivar ${user.name}`
            }
            onClick={handleToggleActive}
            disabled={loading}
            className={`inline-flex h-8 w-8 flex-none items-center justify-center rounded-md disabled:opacity-50 ${
              user.active
                ? "text-text-secondary hover:bg-error-subtle hover:text-error"
                : "text-text-secondary hover:bg-[var(--color-success-subtle)] hover:text-[#15803D]"
            }`}
          >
            <Power size={15} />
          </button>
        </>
      )}
    </div>
  );
}
