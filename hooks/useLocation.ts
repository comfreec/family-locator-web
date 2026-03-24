'use client';
import { useState, useEffect, useRef } from 'react';
import { ref, set } from 'firebase/database';
import { db } from '../lib/firebase';

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

    // 현재 위치 즉시 가져오기
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        set(ref(db, `users/${uid}/location`), {
          latitude: loc.lat, longitude: loc.lng, timestamp: Date.now(),
        });
      },
      () => setError('위치 권한을 허용해주세요.')
    );

    // 위치 변화 감지
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        set(ref(db, `users/${uid}/location`), {
          latitude: loc.lat, longitude: loc.lng, timestamp: Date.now(),
        });
      },
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
