/*
  Lifepilot Portfolio 서비스워커
  - 역할: 앱의 핵심 파일(화면, 아이콘, 매니페스트)을 기기에 미리 저장해두어
    인터넷이 잠깐 끊겨도 앱이 흰 화면 없이 그대로 열리게 해줍니다.
  - 데이터(보유현황/입출금 등)는 이 캐시와 무관하게 계속 브라우저의 localStorage에만 저장됩니다.
*/
const CACHE_NAME = 'lifepilot-portfolio-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

// 앱을 처음 설치할 때, 핵심 파일들을 미리 캐시에 담아둔다.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// 새 버전의 서비스워커가 활성화되면, 이전 버전 캐시는 정리한다.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 요청이 들어오면: 저장된 캐시가 있으면 즉시 보여주고,
// 동시에 네트워크에서 최신 버전을 받아와 캐시를 갱신한다(오프라인이면 캐시만 사용).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
