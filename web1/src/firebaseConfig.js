// Firebase SDK 중 initailizeApp함수 가져오기 - Firebase 앱 인스턴스 생성,초기화 해주는 역할
// getFirestore 함수 - Firebase APP인스턴스 받아서 Firestore DB 인스턴스 반환
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase 설정 정보
const firebaseConfig = {
  // 웹 클라이언트가 Firebase 서비스와 통신할 때 사용하는 API 키
  apiKey: "AizaSyDfLPqbboIEX9GTFBv4Eqmzk8FedV3Xgs",
  // Firebase 프로젝트의 인증 도메인 - OAuth 서비스에서 사용
  authDomain: "patient-survey-7591f.firebaseapp.com",
  // Firebase 프로젝트의 데이터베이스 URL
  projectId: "patient-survey-7591f",
  // Firebase 프로젝트의 스토리지 버킷 URL (이건 왜??)
  storageBucket: "patient-survey-7591f.appspot.com",
  // Firebase 프로젝트의 메시지 송신자 ID - Firebase 프로젝트 자체의 고유 ID라고 생각하면 됨
  messagingSenderId: "258029501503",
  // Firebase 프로젝트의 앱 ID
  appId: "1:258029501503:web:5dc80e6337fe177804c8a"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
// Firestore 데이터베이스 인스턴스 생성
const db = getFirestore(app);
// Firestore DB 인스턴스를 export하여 다른 모듈에서 사용할 수 있도록 함
export { db };