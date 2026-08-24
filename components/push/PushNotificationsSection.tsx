"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { urlBase64ToUint8Array } from "@/lib/webPush";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

type Status = "checking" | "unsupported" | "denied" | "off" | "on";

// AIT-57: activar/desactivar los avisos push reales (Web Push) del
// navegador/dispositivo ACTUAL — no una preferencia de la cuenta en
// abstracto (cada dispositivo se suscribe por separado, docs/
// 02-modelo-de-datos.md no cambia: la fila vive en `pushSubscriptions`,
// no en `users`). Por eso vive en Ajustes junto al resto de "quién soy en
// este dispositivo", visible para cualquier rol — la campana in-app
// (convex/nextSteps.ts:getNotifications) ya es personal y genérica por
// rol, esto es solo la versión "con la app cerrada" de lo mismo.
export function PushNotificationsSection() {
  const subscribe = useMutation(api.pushSubscriptions.subscribe);
  const unsubscribe = useMutation(api.pushSubscriptions.unsubscribe);
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // AIT-57 (hallazgo de auditoría NO-GO ronda 1, "Mayor" #1): sube/reasigna
  // la suscripción del navegador en Convex — SIEMPRE que se detecta una
  // suscripción local, no solo la primera vez que se crea. Sin esto, dos
  // casos reales quedaban rotos: (a) `pushManager.subscribe()` tiene éxito
  // pero la mutation `subscribe` falla (red) — el navegador cree que está
  // "Activadas" pero Convex nunca se entera, así que nunca llega ningún
  // push; (b) dispositivo compartido: el usuario A activa, luego el
  // usuario B inicia sesión en el mismo navegador — sin volver a llamar a
  // `subscribe`, la fila de `pushSubscriptions` seguía apuntando a A, así
  // que B veía "Activadas" pero los avisos que llegaran a ese dispositivo
  // seguirían siendo los de A (fuga de datos entre usuarios). Al llamar a
  // esto también en el `useEffect` de montaje (no solo en `handleEnable`),
  // cualquier sesión nueva en un dispositivo con suscripción ya existente
  // la reasigna al usuario actual antes de mostrar "Activadas".
  const syncSubscription = useCallback(
    async (subscription: PushSubscription) => {
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Suscripción incompleta.");
      }
      await subscribe({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      });
    },
    [subscribe],
  );

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !VAPID_PUBLIC_KEY
      ) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const existing = await registration.pushManager.getSubscription();
        if (!existing) {
          if (!cancelled) setStatus("off");
          return;
        }
        try {
          await syncSubscription(existing);
          if (!cancelled) setStatus("on");
        } catch {
          if (!cancelled) {
            setStatus("off");
            setError(
              "Había una suscripción activa en este dispositivo pero no se ha podido confirmar en el servidor. Actívalas de nuevo.",
            );
          }
        }
      } catch {
        if (!cancelled) setStatus("unsupported");
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, [syncSubscription]);

  async function handleEnable() {
    if (loading || !VAPID_PUBLIC_KEY) return;
    setLoading(true);
    setError("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await syncSubscription(subscription);
      setStatus("on");
    } catch {
      setError(
        "No se han podido activar las notificaciones. Inténtalo de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        // Baja en Convex primero, luego en el navegador: si la mutation
        // fallara (red), la suscripción del navegador sigue viva y el
        // servidor todavía la conoce — mejor una fila de más (se limpia
        // sola en el próximo cron si acaba muerta) que una suscripción
        // activa en el navegador de la que Convex ya no sabe nada.
        await unsubscribe({ endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      setStatus("off");
    } catch {
      setError("No se han podido desactivar. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "checking") return null;

  return (
    <section className="mx-auto w-full max-w-[480px] overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-e1)]">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-neutral-100 text-text-secondary">
          {status === "on" ? <BellRing size={16} /> : <Bell size={16} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
            Notificaciones push
          </div>
          <div className="truncate text-sm font-semibold text-text">
            {status === "on" && "Activadas en este dispositivo"}
            {status === "off" && "Desactivadas en este dispositivo"}
            {status === "denied" && "Bloqueadas por el navegador"}
            {status === "unsupported" && "No disponibles en este navegador"}
          </div>
        </div>
        {status === "off" && (
          <Button size="sm" onClick={handleEnable} disabled={loading}>
            {loading ? "Activando…" : "Activar"}
          </Button>
        )}
        {status === "on" && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<BellOff size={14} />}
            onClick={handleDisable}
            disabled={loading}
          >
            {loading ? "…" : "Desactivar"}
          </Button>
        )}
      </div>
      {status === "denied" && (
        <p className="border-t border-border px-4 py-2.5 text-xs text-text-secondary">
          Las bloqueaste desde el navegador. Actívalas en los ajustes de
          notificaciones del sitio para poder usarlas.
        </p>
      )}
      {error && (
        <p className="border-t border-border px-4 py-2.5 text-xs text-error">
          {error}
        </p>
      )}
    </section>
  );
}
