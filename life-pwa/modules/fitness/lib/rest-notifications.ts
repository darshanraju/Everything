/**
 * Bridge page rest timer → service worker local notifications.
 * SW is only active in production PWA builds.
 */

export async function ensureRestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return false;
  }
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

export function armRestNotification(
  endsAt: number,
  opts?: { durationSec?: number; url?: string }
): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
    return;
  }
  void navigator.serviceWorker.ready
    .then((reg) => {
      reg.active?.postMessage({
        type: "REST_ARM",
        endsAt,
        durationSec: opts?.durationSec,
        url: opts?.url ?? window.location.pathname,
      });
    })
    .catch(() => {
      /* SW not available (dev) */
    });
}

export function cancelRestNotification(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.ready
    .then((reg) => {
      reg.active?.postMessage({ type: "REST_CANCEL" });
    })
    .catch(() => {
      /* ignore */
    });
}

/** Foreground/system notification when timer ends (if permission granted). */
export function notifyRestDoneForeground(durationSec?: number): void {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return;
  }
  if (Notification.permission !== "granted") return;
  try {
    // Prefer SW so it works consistently when partially backgrounded
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready.then((reg) => {
        void reg.showNotification("Rest done", {
          body:
            durationSec != null
              ? `Rest finished (${durationSec}s). Back to work.`
              : "Rest finished. Back to work.",
          icon: "/icons/icon-192.png",
          tag: "life-rest-timer",
          // Extended options (vibrate/renotify) — not in all TS DOM libs
          ...({
            renotify: true,
            vibrate: [200, 100, 200, 100, 400],
          } as NotificationOptions),
          data: { url: window.location.pathname },
        });
      });
      return;
    }
    new Notification("Rest done", {
      body: "Rest finished. Back to work.",
      tag: "life-rest-timer",
    });
  } catch {
    /* ignore */
  }
}
