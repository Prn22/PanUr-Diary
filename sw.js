// PanUr service worker — enables device (mobile status-bar) notifications
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

// 진짜 백그라운드 알림: GitHub Actions(서버)가 정해진 시각에 Web Push로 신호를 보내면
// 앱이 완전히 닫혀 있어도 브라우저가 이 서비스워커를 깨워서 알림을 띄워줌.
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) {
    data = { title: '파뉴땅 🌙', body: e.data ? e.data.text() : '' };
  }
  const title = data.title || '파뉴땅 🌙';
  const options = {
    body: data.body || '',
    icon: data.icon || 'heart-icon.png',   // 큰 아이콘: 십자수 하트 (앱 실행 중 알림과 동일)
    badge: data.badge || 'icon-192.png',   // 작은 상태바 아이콘
    tag: data.tag || undefined,
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// Tapping a notification focuses (or opens) the app
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
      for (const c of cs) { if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});
