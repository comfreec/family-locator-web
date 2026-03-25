'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '../../hooks/useAuth';
import { useFamily } from '../../hooks/useFamily';
import { useLocation } from '../../hooks/useLocation';

const Map = dynamic(() => import('../../components/Map'), { ssr: false });

export default function MapPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const { family, members, createFamily, joinFamily, leaveFamily } = useFamily(user?.uid ?? null);
  const { location, error: locError } = useLocation(user?.uid ?? null);

  const [tab, setTab] = useState<'map' | 'family'>('map');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  if (authLoading || !user) return (
    <div className="flex items-center justify-center h-screen bg-blue-50">
      <div className="text-4xl animate-pulse">📍</div>
    </div>
  );

  const handleCreate = async () => {
    if (!familyName.trim()) return;
    try {
      await createFamily(familyName.trim());
      setShowCreate(false);
      setFamilyName('');
    } catch (e: any) { setActionError(e.message); }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    try {
      await joinFamily(inviteCode.trim());
      setShowJoin(false);
      setInviteCode('');
    } catch (e: any) { setActionError(e.message); }
  };

  const handleShare = () => {
    if (!family) return;
    navigator.clipboard.writeText(
      `가족 위치 공유 앱 초대!\n그룹명: ${family.name}\n초대 코드: ${family.inviteCode}`
    );
    alert('초대 코드가 클립보드에 복사됐습니다!');
  };

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: '100dvh', overflow: 'hidden' }}>
      {/* 헤더 */}
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">📍</span>
          <span className="font-bold text-gray-800">
            {family ? family.name : '가족 위치 공유'}
          </span>
          {family && (
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
              {members.length}명
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin')}
            className="text-sm text-gray-400 hover:text-blue-500 transition"
          >
            🔐
          </button>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-red-500 transition"
          >
            로그아웃
          </button>
        </div>
      </header>

      {locError && (
        <div className="bg-red-500 text-white text-sm text-center py-2 px-4">
          ⚠️ {locError}
        </div>
      )}

      {/* 탭 */}
      <div className="flex bg-white border-b">
        <button
          onClick={() => setTab('map')}
          className={`flex-1 py-3 text-sm font-semibold transition ${tab === 'map' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
        >
          🗺️ 지도
        </button>
        <button
          onClick={() => setTab('family')}
          className={`flex-1 py-3 text-sm font-semibold transition ${tab === 'family' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
        >
          👨‍👩‍👧‍👦 가족
        </button>
      </div>

      {/* 지도 탭 */}
      {tab === 'map' && (
        <div className="relative" style={{ flex: '1 1 0', minHeight: 0, overflow: 'hidden' }}>
          {!family ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
              <div className="text-6xl">🏠</div>
              <p className="text-gray-600 text-center">가족 탭에서 그룹을 만들거나 참여하세요</p>
              <button onClick={() => setTab('family')} className="bg-blue-500 text-white px-6 py-2 rounded-xl font-semibold">
                가족 탭으로 이동
              </button>
            </div>
          ) : (
            <Map members={members} currentUid={user.uid} />
          )}
        </div>
      )}

      {/* 가족 탭 */}
      {tab === 'family' && (
        <div className="flex-1 overflow-y-auto p-4">
          {!family ? (
            <div className="flex flex-col items-center gap-4 pt-8">
              <div className="text-6xl">👨‍👩‍👧‍👦</div>
              <p className="text-gray-600 text-center">아직 가족 그룹이 없어요</p>
              <button
                onClick={() => setShowCreate(true)}
                className="w-full max-w-xs bg-blue-500 text-white py-3 rounded-xl font-semibold"
              >
                + 새 그룹 만들기
              </button>
              <button
                onClick={() => setShowJoin(true)}
                className="w-full max-w-xs border-2 border-blue-500 text-blue-500 py-3 rounded-xl font-semibold"
              >
                초대 코드로 참여하기
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 초대 코드 카드 */}
              <div className="bg-blue-500 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs mb-1">초대 코드</p>
                  <p className="text-white text-3xl font-bold tracking-widest">{family.inviteCode}</p>
                </div>
                <button
                  onClick={handleShare}
                  className="bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                >
                  복사 📋
                </button>
              </div>

              {/* 멤버 목록 */}
              <h2 className="font-bold text-gray-700">가족 구성원</h2>
              {members.map((member) => (
                <div key={member.uid} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl relative"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${member.isOnline ? 'bg-green-400' : 'bg-gray-300'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {member.name} {member.uid === user.uid && <span className="text-gray-400 text-sm font-normal">(나)</span>}
                    </p>
                    <p className="text-sm text-gray-500">
                      {member.location
                        ? `📍 ${getTimeAgo(member.location.timestamp)}`
                        : '📍 위치 없음'}
                    </p>
                  </div>
                  {member.isOnline && (
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-semibold">온라인</span>
                  )}
                </div>
              ))}

              <button
                onClick={() => { if (confirm('그룹에서 나가시겠습니까?')) leaveFamily(); }}
                className="w-full border border-red-400 text-red-400 py-3 rounded-xl font-semibold mt-4"
              >
                그룹 나가기
              </button>
            </div>
          )}
        </div>
      )}

      {/* 그룹 만들기 모달 */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-xl font-bold text-gray-800">새 가족 그룹 만들기</h2>
            <input
              type="text"
              placeholder="그룹 이름 (예: 우리 가족)"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-blue-50 border-none focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800"
            />
            {actionError && <p className="text-red-500 text-sm">{actionError}</p>}
            <button onClick={handleCreate} className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold">만들기</button>
            <button onClick={() => { setShowCreate(false); setActionError(''); }} className="w-full text-gray-400 py-2">취소</button>
          </div>
        </div>
      )}

      {/* 참여 모달 */}
      {showJoin && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-xl font-bold text-gray-800">초대 코드로 참여</h2>
            <input
              type="text"
              placeholder="초대 코드 6자리"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl bg-blue-50 border-none focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 text-center text-2xl tracking-widest font-bold"
            />
            {actionError && <p className="text-red-500 text-sm">{actionError}</p>}
            <button onClick={handleJoin} className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold">참여하기</button>
            <button onClick={() => { setShowJoin(false); setActionError(''); }} className="w-full text-gray-400 py-2">취소</button>
          </div>
        </div>
      )}
    </div>
  );
}

function getTimeAgo(timestamp: number) {
  const diff = Date.now() - timestamp;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  return `${Math.floor(min / 60)}시간 전`;
}
