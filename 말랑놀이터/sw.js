// 말랑 놀이터: 한 번 열면 인터넷 없이도 열리도록 파일을 저장해 둡니다.
const CACHE = 'mallang-v14';
const FILES = ['./', './index.html', './config.js', './manifest.json', './icon.svg', './play2.js', './play3.js', './art.js', './pizzashop.js', './hub.js', './guide.js', './salon.js', './voice.js'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
    return res;
  }).catch(() => hit)));
});
