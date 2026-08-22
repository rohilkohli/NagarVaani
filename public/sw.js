const CACHE_NAME = 'nagarvaani-v1';
const STATIC_ASSETS = [
  '/',
  '/citizen',
  '/manifest.json',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => 
      cache.addAll(STATIC_ASSETS)
    )
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME)
            .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network first, cache fallback
self.addEventListener('fetch', (event) => {
  // Don't cache API calls or Firebase
  if (event.request.url.includes('/api/') ||
      event.request.url.includes('firestore') ||
      event.request.url.includes('googleapis')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// Background sync for offline submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-submissions') {
    event.waitUntil(syncOfflineSubmissions());
  }
});

async function syncOfflineSubmissions() {
  // Read from IndexedDB queue and POST each one
  const db = await openDB();
  const queue = await getAllFromQueue(db);
  
  for (const item of queue) {
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data)
      });
      if (res.ok) {
        await deleteFromQueue(db, item.id);
      }
    } catch (e) {
      console.log('Will retry submission:', item.id);
    }
  }
}

// Minimal IndexedDB helpers
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('nagarvaani-offline', 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('queue', 
        { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = reject;
  });
}
function getAllFromQueue(db) {
  return new Promise((resolve) => {
    const tx = db.transaction('queue', 'readonly');
    tx.objectStore('queue').getAll().onsuccess = 
      (e) => resolve(e.target.result || []);
  });
}
function deleteFromQueue(db, id) {
  return new Promise((resolve) => {
    const tx = db.transaction('queue', 'readwrite');
    tx.objectStore('queue').delete(id).onsuccess = resolve;
  });
}
