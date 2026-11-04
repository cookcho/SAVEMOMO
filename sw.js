/* SAVE MOMO — 서비스 워커
   목표: (1) 한 번 열었으면 인터넷이 없어도 실행된다  (2) 인터넷이 있으면 최신본을 가져온다 */
const CACHE = 'savemomo-v17';
const FILES = [
  './', './index.html', './manifest.webmanifest', './lib/matter.min.js',
  './icon-192.png', './icon-512.png', './icon-mask-512.png', './apple-touch-icon.png', './favicon.png',
  './assets/momo_sit.png', './assets/momo_body.png', './assets/momo_happy.png', './assets/momo_surprised.png',
  './assets/momo_neutral.png', './assets/momo_angry.png', './assets/momo_sleepy.png', './assets/momo_heart.png',
  './fonts/jua-sub.woff2'
];
const NET_TIMEOUT = 4000; // 신호가 약할 때 무한정 기다리지 않음

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // 하나가 실패해도 나머지는 저장되도록 개별 저장
    await Promise.all(FILES.map(async f => {
      try { const r = await fetch(f, { cache: 'reload' }); if (r && r.ok) await c.put(f, r); } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function fromCache(req){
  return (await caches.match(req)) || (await caches.match('./index.html')) || (await caches.match('./'));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isDoc = req.mode === 'navigate' || req.destination === 'document';

  if (isDoc){
    // 게임 화면: 네트워크 우선(시간 제한), 실패하면 캐시
    e.respondWith((async () => {
      try {
        const res = await Promise.race([
          fetch(req.url, { cache: 'no-cache' }), // 브라우저 HTTP 캐시를 건너뛰고 서버에 최신본 확인
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), NET_TIMEOUT))
        ]);
        if (res && res.ok){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy)).catch(() => {});
          return res;
        }
        return (await fromCache(req)) || res;
      } catch (_){
        const hit = await fromCache(req);
        if (hit) return hit;
        return new Response('<h1>오프라인</h1><p>처음 한 번은 인터넷에 연결된 상태로 열어야 합니다.</p>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
    })());
    return;
  }

  // 그 외(이미지·글꼴·물리 엔진): 캐시에 있으면 바로 쓰고, 뒤에서 최신본으로 바꿔 둠
  // (같은 이름의 그림을 새로 올려도 다음 실행 때 반영됨)
  e.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit){
      e.waitUntil(fetch(req, { cache: 'no-cache' }).then(res => { if (res && res.ok) return caches.open(CACHE).then(c => c.put(req, res)); }).catch(() => {}));
      return hit;
    }
    try {
      const res = await fetch(req);
      if (res && res.ok){
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    } catch (_){
      return (await caches.match(req)) || Response.error();
    }
  })());
});
