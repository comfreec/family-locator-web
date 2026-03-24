import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "REMOVED_FROM_HISTORY",
  authDomain: "location-87f14.firebaseapp.com",
  databaseURL: "https://location-87f14-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "location-87f14",
  storageBucket: "location-87f14.firebasestorage.app",
  messagingSenderId: "100803979998",
  appId: "1:100803979998:web:d98868cf32913d3f4a304f",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;
