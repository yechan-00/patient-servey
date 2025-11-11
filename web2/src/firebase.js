// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase 설정
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

// 필요한 Firebase 서비스 내보내기
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  localCache: memoryLocalCache(),
});
export const storage = getStorage(app);

export default app;
