const FIREBASE_DB_URL = 'https://location-87f14-default-rtdb.asia-southeast1.firebasedatabase.app';

// Periodic Background Sync 등록
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'location-sync') {
    event.waitUntil(syncLocation());
  }
});

// 일반 Background Sync (오프라인 복구용)
self.addEventListener('sync', (event) => {
  if (event.tag === 'location-sync') {
    event.waitUntil(syncLocation());
  }
});

// 메인 스레드에서 위치 데이터 받아서 Firebase에 저장
self.addEventListener('message', async (event) => {
  if (event.data?.type === 'LOCATION_UPDATE') {
    const { uid, lat, lng } = event.data;
    await pushLocation(uid, lat, lng);
  }
});

async function syncLocation() {
  // IndexedDB에서 마지막 저장된 uid와 위치 가져오기
  const data = await getStoredData();
  if (!data?.uid) return;

  // Geolocation API는 SW에서 직접 못 씀 - 클라이언트에 요청
  const clients = await self.clients.matchAll({ type: 'window' });
  if (clients.length > 0) {
    clients[0].postMessage({ type: 'REQUEST_LOCATION' });
  }
}

async function pushLocation(uid, lat, lng) {
  try {
    await fetch(`${FIREBASE_DB_URL}/users/${uid}/location.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lng, timestamp: Date.now() }),
    });
  } catch (e) {
    console.error('SW location push failed:', e);
  }
}

async function getStoredData() {
  return new Promise((resolve) => {
    const req = indexedDB.open('family-locator', 1);
    req.onsuccess = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('data')) return resolve(null);
      const tx = db.transaction('data', 'readonly');
      const store = tx.objectStore('data');
      const getReq = store.get('current');
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => resolve(null);
    };
    req.onerror = () => resolve(null);
  });
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
