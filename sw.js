const STATIC_CACHE_KEY = 'static.file-v4';

async function deleteCache(key) {
  await caches.delete(key);
}

async function cacheStatic(sourceFiles) {
  const cache = await caches.open(STATIC_CACHE_KEY);
  await cache.addAll(sourceFiles);
}

/**
 * @param {Request} request
 */
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE_KEY);

  try {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const fetchResponse = await fetch(request);
    if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
      return fetchResponse;
    }

    await cache.put(request, fetchResponse.clone());
    return fetchResponse;
  } catch (error) {
    console.error('Error in cacheFirst:', error);
    throw error;
  }
}

self.addEventListener('install', (installEvent) => {
  installEvent.waitUntil(
    cacheStatic([
      '/',
      '/index.html',
      '/css/style.css',
      '/images/main.png',
      '/icons/close.svg',
      '/icons/done.svg',
      '/icons/info.svg',
    ])
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(deleteCache(STATIC_CACHE_KEY));
});

self.addEventListener('fetch', (fetchEvent) => {
  const request = fetchEvent.request;
  fetchEvent.respondWith(cacheFirst(request));
});

self.addEventListener('install', (installEvent) => {
  installEvent.waitUntil(
    Promise.all([
      deleteOldCaches(),
      cacheStatic([
        '/',
        '/index.html',
        '/css/style.css',
        '/images/main.png',
        '/icons/close.svg',
        '/icons/done.svg',
        '/icons/info.svg',
      ]),
    ])
  );
});

async function deleteOldCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames
      .filter((name) => name.startsWith('static.file-') && name !== STATIC_CACHE_KEY)
      .map((name) => caches.delete(name))
  );
}