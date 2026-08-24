// AIT-57: Service Worker de Web Push — solo dos responsabilidades:
// mostrar el aviso cuando llega un `push` del servidor, y abrir/enfocar
// la app en la oportunidad correspondiente al tocarlo. No cachea nada
// (no es un service worker de PWA offline-first, fuera de alcance de
// esta tarea) — sin `fetch` handler, cada petición sigue yendo a red
// directamente, igual que sin él.

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "SuperCRM", body: event.data.text() };
  }
  const title = payload.title || "SuperCRM";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      icon: "/favicon.ico",
      data: { url: payload.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.endsWith(url) && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});
