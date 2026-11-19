/* Service worker: giúp trình duyệt coi đây là app cài được.
   Chỉ xử lý file cùng tên miền. Mọi lời gọi tới Apps Script đi thẳng ra mạng. */
var V = 'vta-ts-v1';
var KHUNG = [
  './',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(V).then(function (cache) {
      // Nạp từng file độc lập: nếu 1 file bị lỗi/404 thì vẫn tiếp tục nạp các file còn lại
      var promises = KHUNG.map(function (url) {
        return cache.add(url).catch(function (err) {
          console.warn('[SW] Không thể cache file:', url, err);
        });
      });
      return Promise.all(promises);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(
        ks.filter(function (k) { return k !== V; }).map(function (k) {
          return caches.delete(k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  
  // POST / Apps Script / Google Fonts / Cross-origin: không can thiệp
  if (r.method !== 'GET' || u.origin !== location.origin) return;

  // Chiến lược Network-First: ưu tiên mạng, mất mạng mới dùng cache
  e.respondWith(
    fetch(r).then(function (res) {
      if (res && res.ok) {
        var cp = res.clone();
        caches.open(V).then(function (c) {
          c.put(r, cp);
        });
      }
      return res;
    }).catch(function () {
      return caches.match(r).then(function (m) {
        return m || caches.match('./');
      });
    })
  );
});
