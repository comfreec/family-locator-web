'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) router.replace('/map');
    else router.replace('/login');
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center h-screen bg-blue-50">
      <div className="text-4xl animate-pulse">📍</div>
    </div>
  );
}
