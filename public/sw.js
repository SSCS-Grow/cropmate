self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { data = { title: "Besked", body: event.data?.text() }; }
  const title = data.title || "CropMate";
  const options = {
    body: data.body || "",
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    data: data.url ? { url: data.url } : {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
fetch("/api/push/test", { method: "POST" })
  .then(r => r.json())
  .then(console.log);
