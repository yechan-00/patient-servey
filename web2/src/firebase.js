// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyB0wQ7P_gAZUDyM1LfxgMxRciExa6l59JY",
    authDomain: "goodai-cancer.firebaseapp.com",
    projectId: "goodai-cancer",
    storageBucket: "goodai-cancer.firebasestorage.app",
    messagingSenderId: "947424761858",
    appId: "1:947424761858:web:7b64ad66b04e8af3c2af1b"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// 필요한 Firebase 서비스 내보내기
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;