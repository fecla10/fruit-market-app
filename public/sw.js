const CACHE_NAME = 'fruit-market-v1.0.0'
const RUNTIME_CACHE = 'runtime-cache-v1'
const STATIC_CACHE = 'static-cache-v1'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/dashboard/overview',
  '/manifest.json',
  '/offline.html',
  '/_next/static/css/app.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// API endpoints to cache
const CACHE_API_ROUTES = [
  '/api/fruits',
  '/api/prices',
  '/api/analytics'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && 
                     cacheName !== RUNTIME_CACHE && 
                     cacheName !== STATIC_CACHE
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  event.respondWith(handleFetch(request))
})

async function handleFetch(request) {
  const url = new URL(request.url)
  
  try {
    // Strategy 1: Cache First for static assets
    if (isStaticAsset(url.pathname)) {
      return await cacheFirst(request)
    }
    
    // Strategy 2: Network First for API routes
    if (isAPIRoute(url.pathname)) {
      return await networkFirst(request)
    }
    
    // Strategy 3: Stale While Revalidate for pages
    if (isPageRequest(request)) {
      return await staleWhileRevalidate(request)
    }
    
    // Default: Network only
    return await fetch(request)
    
  } catch (error) {
    console.error('[SW] Fetch failed:', error)
    return await handleFetchError(request, error)
  }
}

// Cache First Strategy - for static assets
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  const networkResponse = await fetch(request)
  
  if (networkResponse.status === 200) {
    const cache = await caches.open(STATIC_CACHE)
    cache.put(request, networkResponse.clone())
  }
  
  return networkResponse
}

// Network First Strategy - for API routes
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone())
      
      // Set expiry for API cache (5 minutes)
      setTimeout(() => {
        cache.delete(request)
      }, 5 * 60 * 1000)
    }
    
    return networkResponse
    
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url)
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw error
  }
}

// Stale While Revalidate Strategy - for pages
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cachedResponse = await cache.match(request)
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  })
  
  return cachedResponse || fetchPromise
}

// Error handling
async function handleFetchError(request, error) {
  console.error('[SW] Request failed:', request.url, error)
  
  // Try to return cached version
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  // Return offline page for navigation requests
  if (isPageRequest(request)) {
    const offlinePage = await caches.match('/offline.html')
    if (offlinePage) {
      return offlinePage
    }
  }
  
  // Return generic offline response
  return new Response(
    JSON.stringify({
      success: false,
      error: 'You are offline. Please check your internet connection.',
      offline: true
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}

// Helper functions
function isStaticAsset(pathname) {
  return pathname.startsWith('/_next/static/') ||
         pathname.startsWith('/icons/') ||
         pathname.startsWith('/images/') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.jpeg') ||
         pathname.endsWith('.gif') ||
         pathname.endsWith('.webp') ||
         pathname.endsWith('.avif') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.woff') ||
         pathname.endsWith('.woff2') ||
         pathname === '/manifest.json'
}

function isAPIRoute(pathname) {
  return pathname.startsWith('/api/') ||
         CACHE_API_ROUTES.some(route => pathname.startsWith(route))
}

function isPageRequest(request) {
  return request.mode === 'navigate' ||
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'))
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  console.log('[SW] Performing background sync...')
  
  try {
    // Sync offline actions from IndexedDB
    const offlineActions = await getOfflineActions()
    
    for (const action of offlineActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        })
        
        // Remove from offline storage after successful sync
        await removeOfflineAction(action.id)
        
      } catch (error) {
        console.error('[SW] Failed to sync action:', error)
      }
    }
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')
  
  const options = {
    body: 'You have new price alerts!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'View Dashboard',
        icon: '/icons/action-explore.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/action-close.png'
      }
    ]
  }
  
  if (event.data) {
    try {
      const payload = event.data.json()
      options.body = payload.body || options.body
      options.data = { ...options.data, ...payload.data }
    } catch (error) {
      console.error('[SW] Failed to parse push payload:', error)
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('Fruit Market Tracker', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard/overview')
    )
  }
})

// Notification close handler
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed')
  // Track notification dismissal analytics if needed
})

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.payload)
      })
    )
  }
})

// Placeholder functions for offline storage (would use IndexedDB)
async function getOfflineActions() {
  // Implementation would use IndexedDB to store offline actions
  return []
}

async function removeOfflineAction(id) {
  // Implementation would remove action from IndexedDB
  console.log('[SW] Removing offline action:', id)
}

console.log('[SW] Service Worker loaded successfully')