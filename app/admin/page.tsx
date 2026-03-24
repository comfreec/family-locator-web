'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ref, onValue, remove, update, get } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { FamilyMember, Family } from '../../lib/types';

// 관리자 UID - 본인 UID로 교체하세요
const ADMIN_UID = 'REPLACE_WITH_YOUR_UID';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<FamilyMember[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [tab, setTab] = useState<'users' | 'families'>('users');
  const [adminUid, setAdminUid] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }

    // 관리자 UID 확인
    get(ref(db, 'admin/uid')).then((snap) => {
      const uid = snap.val();
      setAdminUid(uid || '');
      if (uid && uid !== user.uid) {
        alert('관리자 권한이 없습니다.');
        router.replace('/map');
      }
    });

    // 전체 사용자 목록
    onValue(ref(db, 'users'), (snap) => {
      const data = snap.val();
      if (!data) return;
      setUsers(Object.values(data));
    });

    // 전체 가족 그룹
    onValue(ref(db, 'families'), (snap) => {
      const data = snap.val();
      if (!data) return;
      setFamilies(Object.entries(data).map(([id, v]: any) => ({ id, ...v })));
    });
  }, [user, loading]);

  const setAsAdmin = async () => {
    if (!user) return;
    await update(ref(db, 'admin'), { uid: user.uid });
    setAdminUid(user.uid);
    alert('관리자로 등록됐습니다.');
  };

  const deleteUser = async (uid: string, familyId?: string) => {
    if (!confirm('이 사용자를 삭제하시겠습니까?')) return;
    await remove(ref(db, `users/${uid}`));
    if (familyId) {
      await update(ref(db, `families/${familyId}/members`), { [uid]: null });
    }
  };

  const deleteFamily = async (family: Family) => {
    if (!confirm(`"${family.name}" 그룹을 삭제하시겠습니까?`)) return;
    // 멤버들의 familyId 제거
    const memberIds = Object.keys(family.members || {});
    for (const uid of memberIds) {
      await update(ref(db, `users/${uid}`), { familyId: null });
    }
    await remove(ref(db, `families/${family.id}`));
    await remove(ref(db, `inviteCodes/${family.inviteCode}`));
  };

  const removeMemberFromFamily = async (uid: string, familyId: string) => {
    if (!confirm('이 멤버를 그룹에서 제거하시겠습니까?')) return;
    await update(ref(db, `families/${familyId}/members`), { [uid]: null });
    await update(ref(db, `users/${uid}`), { familyId: null });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-4xl animate-pulse">📍</div>
    </div>
  );

  // 관리자 미등록 상태
  if (!adminUid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">관리자 등록</h1>
          <p className="text-gray-500 text-sm mb-6">
            현재 로그인된 계정을 관리자로 등록합니다.<br />
            최초 1회만 가능합니다.
          </p>
          <p className="text-xs bg-gray-100 rounded-lg p-2 mb-4 text-gray-600 break-all">
            UID: {user?.uid}
          </p>
          <button
            onClick={setAsAdmin}
            className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold"
          >
            관리자로 등록하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔐</span>
          <span className="font-bold text-gray-800">관리자 페이지</span>
        </div>
        <button
          onClick={() => router.push('/map')}
          className="text-sm text-blue-500"
        >
          ← 앱으로 돌아가기
        </button>
      </header>

      {/* 탭 */}
      <div className="flex bg-white border-b">
        <button
          onClick={() => setTab('users')}
          className={`flex-1 py-3 text-sm font-semibold ${tab === 'users' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
        >
          👤 사용자 ({users.length})
        </button>
        <button
          onClick={() => setTab('families')}
          className={`flex-1 py-3 text-sm font-semibold ${tab === 'families' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
        >
          👨‍👩‍👧‍👦 가족 그룹 ({families.length})
        </button>
      </div>

      <div className="p-4 space-y-3 max-w-2xl mx-auto">
        {/* 사용자 목록 */}
        {tab === 'users' && users.map((u) => (
          <div key={u.uid} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
              style={{ backgroundColor: u.color || '#4A90E2' }}
            >
              {u.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 flex items-center gap-2">
                {u.name}
                {u.uid === user?.uid && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">나</span>}
                {u.uid === adminUid && <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">관리자</span>}
              </p>
              <p className="text-xs text-gray-400 truncate">{u.email}</p>
              <p className="text-xs text-gray-400">
                {u.familyId ? `그룹: ${families.find(f => f.id === u.familyId)?.name || u.familyId}` : '그룹 없음'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${u.isOnline ? 'bg-green-400' : 'bg-gray-300'}`} />
              {u.uid !== user?.uid && (
                <button
                  onClick={() => deleteUser(u.uid, u.familyId)}
                  className="text-xs text-red-400 border border-red-300 px-2 py-1 rounded-lg hover:bg-red-50"
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        ))}

        {/* 가족 그룹 목록 */}
        {tab === 'families' && families.map((f) => (
          <div key={f.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-gray-800">{f.name}</p>
                <p className="text-xs text-gray-400">초대 코드: <span className="font-mono font-bold">{f.inviteCode}</span></p>
              </div>
              <button
                onClick={() => deleteFamily(f)}
                className="text-xs text-red-400 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50"
              >
                그룹 삭제
              </button>
            </div>
            <div className="space-y-2">
              {Object.keys(f.members || {}).map((uid) => {
                const member = users.find((u) => u.uid === uid);
                return member ? (
                  <div key={uid} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: member.color || '#4A90E2' }}
                    >
                      {member.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700 flex-1">{member.name}</span>
                    <button
                      onClick={() => removeMemberFromFamily(uid, f.id)}
                      className="text-xs text-orange-400 border border-orange-300 px-2 py-0.5 rounded-lg hover:bg-orange-50"
                    >
                      내보내기
                    </button>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
