// Firebase SDK 초기화/연동 전용 파일
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";

// 기존에 쓰던 Firebase 프로젝트 설정 (변경 금지)
const firebaseConfig = {
  apiKey: "AIzaSyBSixs1LpKDH_xruyZycJY1GoWQukzqhaw",
  authDomain: "patient-survey-2a22f.firebaseapp.com",
  projectId: "patient-survey-2a22f",
  storageBucket: "patient-survey-2a22f.appspot.com",
  messagingSenderId: "648040584716",
  appId: "1:648040584716:web:8df0e2e75aca652e030029",
  measurementId: "G-2PFNPKSN4K",
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firestore 인스턴스
const db = getFirestore(app);

// Auth 인스턴스 + 익명 로그인 보장(정석)
const auth = getAuth(app);

async function ensureAuth() {
  if (auth.currentUser) return auth.currentUser;
  await signInAnonymously(auth);
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          unsub();
          resolve(user);
        }
      },
      (err) => {
        unsub();
        reject(err);
      }
    );
  });
}

export { db, auth, ensureAuth };
