/* Service worker tối thiểu: giúp trình duyệt coi đây là app cài được.
   Chỉ xử lý file cùng tên miền (khung giao diện, biểu tượng). Mọi lời gọi tới Apps Script đi thẳng ra mạng, không bao giờ bị lưu lại. */
var V = 'vta-ts-v1';
var KHUNG = ['./', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return c.addAll(KHUNG); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;   // POST / Apps Script / Google Fonts: không đụng tới
  // mạng trước, lỗi mạng mới dùng bản đã lưu: luôn nhận bản mới nhất khi có mạng
  e.respondWith(fetch(r).then(function (res) {
    if (res && res.ok) { var cp = res.clone(); caches.open(V).then(function (c) { c.put(r, cp); }); }
    return res;
  }).catch(function () { return caches.match(r).then(function (m) { return m || caches.match('./'); }); }));
});