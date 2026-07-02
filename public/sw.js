// 怎么回 - Service Worker
// 策略：静态资源离线缓存，页面和 API 走网络优先

const CACHE = "zmh-v1"

const STATIC_EXT = /\.(js|css|svg|png|jpg|ico|woff2?)$/

self.addEventListener("install", (e) => {
  self.skipWaiting()
})

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url)

  // API 请求走网络，不缓存
  if (url.pathname.startsWith("/api/")) {
    return
  }

  // 静态资源走缓存优先
  if (STATIC_EXT.test(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        const fetched = fetch(e.request).then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then((c) => c.put(e.request, clone))
          }
          return res
        })
        return cached || fetched
      })
    )
    return
  }

  // 页面走网络优先，离线时回退缓存
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request))
  )
})