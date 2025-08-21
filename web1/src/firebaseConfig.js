// Firebase SDK 중 initailizeApp함수 가져오기 - Firebase 앱 인스턴스 생성,초기화 해주는 역할
// getFirestore 함수 - Firebase APP인스턴스 받아서 Firestore DB 인스턴스 반환
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase 설정 정보
const firebaseConfig = {
  // 웹 클라이언트가 Firebase 서비스와 통신할 때 사용하는 API 키
  apiKey: "AIzaSyB0wQ7P_gAZUDyM1LfxgMxRciExa6l59JY",
  // Firebase 프로젝트의 인증 도메인 - OAuth 서비스에서 사용
  authDomain: "goodai-cancer.firebaseapp.com",
  // Firebase 프로젝트의 데이터베이스 URL
  projectId: "goodai-cancer",
  // Firebase 프로젝트의 스토리지 버킷 URL (이건 왜??)
  storageBucket: "goodai-cancer.firebasestorage.app",
  // Firebase 프로젝트의 메시지 송신자 ID - Firebase 프로젝트 자체의 고유 ID라고 생각하면 됨
  messagingSenderId: "947424761858",
  // Firebase 프로젝트의 앱 ID
  appId: "1:947424761858:web:7b64ad66b04e8af3c2af1b"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
// Firestore 데이터베이스 인스턴스 생성
const db = getFirestore(app);
// Firestore DB 인스턴스를 export하여 다른 모듈에서 사용할 수 있도록 함
export { db };