'use client';
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { FamilyMember } from '../lib/types';

// Leaflet 기본 아이콘 fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function createMemberIcon(member: FamilyMember, isMe: boolean) {
  const initial = member.name.charAt(0).toUpperCase();
  const html = `
    <div style="
      width: 44px; height: 44px; border-radius: 50%;
      background: ${member.color}; border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: bold; color: white;
      position: relative;
    ">
      ${initial}
      ${isMe ? '<div style="position:absolute;bottom:1px;right:1px;width:10px;height:10px;border-radius:50%;background:#2ECC71;border:2px solid white;"></div>' : ''}
    </div>
    <div style="
      text-align:center; font-size:11px; font-weight:600;
      background:rgba(255,255,255,0.9); border-radius:8px;
      padding:1px 5px; margin-top:2px; color:#333;
    ">${isMe ? '나' : member.name}</div>
  `;
  return L.divIcon({ html, className: '', iconSize: [44, 60], iconAnchor: [22, 60] });
}

function getTimeAgo(timestamp: number) {
  const diff = Date.now() - timestamp;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  return `${Math.floor(min / 60)}시간 전`;
}

function FitBounds({ members }: { members: FamilyMember[] }) {
  const map = useMap();
  useEffect(() => {
    const withLoc = members.filter((m) => m.location);
    if (withLoc.length === 0) return;
    if (withLoc.length === 1) {
      map.setView([withLoc[0].location!.latitude, withLoc[0].location!.longitude], 15);
      return;
    }
    const bounds = L.latLngBounds(
      withLoc.map((m) => [m.location!.latitude, m.location!.longitude])
    );
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [members.length]);
  return null;
}

interface Props {
  members: FamilyMember[];
  currentUid: string;
}

export default function Map({ members, currentUid }: Props) {
  const center: [number, number] = [37.5665, 126.978];

  // 줌 버튼 클릭 시 포커스로 인한 레이아웃 리사이즈 방지
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.leaflet-control-zoom')) {
        e.preventDefault();
        (document.activeElement as HTMLElement)?.blur();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds members={members} />
      {members.map((member) =>
        member.location ? (
          <Marker
            key={member.uid}
            position={[member.location.latitude, member.location.longitude]}
            icon={createMemberIcon(member, member.uid === currentUid)}
          >
            <Popup>
              <div className="text-center p-1">
                <div className="font-bold text-gray-800">{member.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {getTimeAgo(member.location.timestamp)}
                </div>
                {member.isOnline && (
                  <div className="text-xs text-green-500 font-semibold mt-1">● 온라인</div>
                )}
              </div>
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  );
}
