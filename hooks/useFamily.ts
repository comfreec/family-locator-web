'use client';
import { useState, useEffect } from 'react';
import { ref, onValue, set, get, push, update } from 'firebase/database';
import { db } from '../lib/firebase';
import { FamilyMember, Family } from '../lib/types';

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function useFamily(uid: string | null) {
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }

    const userRef = ref(db, `users/${uid}/familyId`);
    const unsubUser = onValue(userRef, (snap) => {
      const familyId = snap.val();
      if (!familyId) { setFamily(null); setMembers([]); setLoading(false); return; }

      const familyRef = ref(db, `families/${familyId}`);
      const unsubFamily = onValue(familyRef, (fSnap) => {
        const data = fSnap.val();
        if (!data) return;
        setFamily({ id: familyId, ...data });

        const memberIds = Object.keys(data.members || {});
        if (memberIds.length === 0) { setMembers([]); setLoading(false); return; }

        const memberList: FamilyMember[] = [];
        memberIds.forEach((memberId) => {
          onValue(ref(db, `users/${memberId}`), (mSnap) => {
            const mData = mSnap.val();
            if (mData) {
              const idx = memberList.findIndex((m) => m.uid === memberId);
              if (idx >= 0) memberList[idx] = mData;
              else memberList.push(mData);
              setMembers([...memberList]);
            }
            setLoading(false);
          });
        });
      });
      return () => unsubFamily();
    });
    return () => unsubUser();
  }, [uid]);

  const createFamily = async (name: string) => {
    if (!uid) return;
    const inviteCode = generateCode();
    const newRef = push(ref(db, 'families'));
    const familyId = newRef.key!;
    await set(newRef, { name, createdBy: uid, inviteCode, members: { [uid]: true } });
    await update(ref(db, `users/${uid}`), { familyId });
    await set(ref(db, `inviteCodes/${inviteCode}`), familyId);
  };

  const joinFamily = async (code: string) => {
    if (!uid) return;
    const snap = await get(ref(db, `inviteCodes/${code.toUpperCase()}`));
    if (!snap.exists()) throw new Error('유효하지 않은 초대 코드입니다.');
    const familyId = snap.val();
    await update(ref(db, `families/${familyId}/members`), { [uid]: true });
    await update(ref(db, `users/${uid}`), { familyId });
  };

  const leaveFamily = async () => {
    if (!uid || !family) return;
    await update(ref(db, `families/${family.id}/members`), { [uid]: null });
    await update(ref(db, `users/${uid}`), { familyId: null });
  };

  return { family, members, loading, createFamily, joinFamily, leaveFamily };
}
