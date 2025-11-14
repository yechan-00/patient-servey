// Firebase SDK 중 initailizeApp함수 가져오기 - Firebase 앱 인스턴스 생성,초기화 해주는 역할
// getFirestore 함수 - Firebase APP인스턴스 받아서 Firestore DB 인스턴스 반환
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase 설정 정보
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
// Firestore 데이터베이스 인스턴스 생성
const db = getFirestore(app);
// Firestore DB 인스턴스를 export하여 다른 모듈에서 사용할 수 있도록 함
export { db };
