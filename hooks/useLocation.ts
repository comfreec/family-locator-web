'use client';
import { useState, useEffect, useRef } from 'react';
import { ref, set } from 'firebase/database';
import { db } from '../lib/firebase';

// IndexedDB에 uid 저장 (SW에서 접근용)
function saveToIndexedDB(uid: string) {
  const req = indexedDB.open('family-locator', 1);
  req.onupgradeneeded = (e: any) => {
    e.target.result.createObjectStore('data');
  };
  req.onsuccess = (e: any) => {
    const idb = e.target.result;
    const tx = idb.transaction('data', 'readwrite');
    tx.objectStore('data').put({ uid }, 'current');
  };
}

async function registerSW(uid: string) {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');

    // SW로부터 위치 요청 받으면 응답
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'REQUEST_LOCATION') {
        navigator.geolocation.getCurrentPosition((pos) => {
          reg.active?.postMessage({
            type: 'LOCATION_UPDATE',
            uid,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        });
      }
    });

    // Periodic Background Sync 등록 (지원하는 브라우저만)
    if ('periodicSync' in reg) {
      try {
        const status = await navigator.permissions.query({ name: 'periodic-background-sync' as PermissionName });
        if (status.state === 'granted') {
          await (reg as any).periodicSync.register('location-sync', { minInterval: 5 * 60 * 1000 }); // 5분
        }
      } catch {}
    }
  } catch (e) {
    console.error('SW registration failed:', e);
  }
}

export function useLocation(uid: string | null) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchRef = useRef<number | null>(null);

  useEffect(() => {
    if (!uid) return;
    if (!navigator.geolocation) {
      setError('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    saveToIndexedDB(uid);
    registerSW(uid);

    const updateLocation = (pos: GeolocationPosition) => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setLocation(loc);
      set(ref(db, `users/${uid}/location`), {
        latitude: loc.lat, longitude: loc.lng, timestamp: Date.now(),
      });
    };

    navigator.geolocation.getCurrentPosition(updateLocation, () =>
      setError('위치 권한을 허용해주세요.')
    );

    watchRef.current = navigator.geolocation.watchPosition(
      updateLocation,
      () => setError('위치 권한을 허용해주세요.'),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, [uid]);

  return { location, error };
}
