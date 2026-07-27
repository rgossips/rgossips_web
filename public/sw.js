// RGossips web-push service worker.
// Receives pushes from the send-push edge fn and shows a native notification;
// clicking it focuses/opens the deep link carried in the payload.
/* eslint-disable no-restricted-globals */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "RGossips", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "RGossips";
  const options = {
    body: data.body || "",
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: data.type || undefined, // collapse same-type notifications
    data: { link: data.link || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        // Focus an existing tab and route it to the link.
        if ("focus" in w) {
          w.focus();
          if ("navigate" in w && link) w.navigate(link).catch(() => {});
          return;
        }
      }
      return self.clients.openWindow(link);
    }),
  );
});

// Activate immediately on update so a new SW controls open pages.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
