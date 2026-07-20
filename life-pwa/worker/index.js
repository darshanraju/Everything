/**
 * Custom SW logic merged into next-pwa Workbox SW (prod).
 * Arms a local notification when rest timer ends while the app is backgrounded.
 */
/* eslint-disable no-restricted-globals */

/** @type {ReturnType<typeof setTimeout> | null} */
let restTimeoutId = null;
/** @type {number | null} */
let armedEndsAt = null;

function clearRestTimer() {
  if (restTimeoutId != null) {
    clearTimeout(restTimeoutId);
    restTimeoutId = null;
  }
  armedEndsAt = null;
}

/**
 * @param {number} endsAt
 * @param {string} [url]
 * @param {number} [durationSec]
 */
function armRestTimer(endsAt, url, durationSec) {
  clearRestTimer();
  const delay = Math.max(0, Math.min(endsAt - Date.now(), 600_000));
  armedEndsAt = endsAt;

  restTimeoutId = setTimeout(async () => {
    restTimeoutId = null;
    const tagEnds = armedEndsAt;
    armedEndsAt = null;
    try {
      const reg = /** @type {ServiceWorkerGlobalScope} */ (self).registration;
      await reg.showNotification("Rest done", {
        body:
          durationSec != null
            ? `Rest finished (${durationSec}s). Back to work.`
            : "Rest finished. Back to work.",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: "life-rest-timer",
        renotify: true,
        vibrate: [200, 100, 200, 100, 400],
        requireInteraction: false,
        data: { url: url || "/fitness", endsAt: tagEnds },
      });
    } catch (e) {
      console.error("[rest-timer-sw] showNotification failed", e);
    }
  }, delay);
}

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;

  if (data.type === "REST_CANCEL") {
    clearRestTimer();
    return;
  }

  if (data.type === "REST_ARM" && typeof data.endsAt === "number") {
    armRestTimer(
      data.endsAt,
      typeof data.url === "string" ? data.url : undefined,
      typeof data.durationSec === "number" ? data.durationSec : undefined
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/fitness";

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of all) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client && targetUrl) {
            try {
              await client.navigate(targetUrl);
            } catch {
              /* ignore */
            }
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});
