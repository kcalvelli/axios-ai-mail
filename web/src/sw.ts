/**
 * Custom service worker with Workbox precaching + Web Push handling.
 *
 * Uses injectManifest strategy: vite-plugin-pwa injects the precache
 * manifest into self.__WB_MANIFEST at build time.
 */

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope

// ── Workbox precaching ──────────────────────────────────────────────
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// Activate immediately (mirrors skipWaiting + clientsClaim from generateSW)
self.skipWaiting()
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// ── Push notifications ──────────────────────────────────────────────

interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload: PushPayload
  try {
    payload = event.data.json() as PushPayload
  } catch {
    // Fallback for plain text push
    payload = { title: 'axiOS Mail', body: event.data.text() }
  }

  const options: NotificationOptions = {
    body: payload.body,
    icon: '/icon-192.png',
    badge: '/icon-monochrome.svg',
    tag: payload.tag || 'new-email',
    // Collapse duplicate notifications with the same tag
    renotify: true,
    data: { url: payload.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(payload.title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = (event.notification.data?.url as string) || '/'

  // Focus existing window if open, otherwise open a new one
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Try to find an existing window to focus
        for (const client of windowClients) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        // No existing window — open a new one
        return self.clients.openWindow(url)
      }),
  )
})
