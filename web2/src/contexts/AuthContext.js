// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

// 인증 컨텍스트 생성
const AuthContext = createContext();

// 컨텍스트 사용을 위한 훅
export function useAuth() {
  return useContext(AuthContext);
}

// 인증 제공자 컴포넌트
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [socialWorkerData, setSocialWorkerData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 이메일/비밀번호로 로그인
  async function login(email, password) {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  }

  // 비밀번호 재설정 이메일 전송
  async function resetPassword(email) {
    try {
      return await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  }

  // 로그아웃
  async function signOut() {
    return firebaseSignOut(auth);
  }

  // 사회복지사 정보 가져오기
  async function fetchSocialWorkerData(uid) {
    try {
      const docRef = doc(db, "socialWorkers", uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSocialWorkerData(data);
        return data;
      } else {
        setSocialWorkerData(null);
        throw new Error("사회복지사 정보를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("사회복지사 정보 가져오기 오류:", error);
      throw error;
    }
  }

  // 사회복지사 정보 업데이트
  async function updateSocialWorkerData(uid, data) {
    try {
      await setDoc(doc(db, "socialWorkers", uid), {
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      // 로컬 상태 업데이트
      setSocialWorkerData(prevData => ({...prevData, ...data}));
    } catch (error) {
      console.error("사회복지사 정보 업데이트 오류:", error);
      throw error;
    }
  }

  // 인증 상태 변경 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          await fetchSocialWorkerData(user.uid);
        } catch (error) {
          console.error("사용자 데이터 로드 실패:", error);
        }
      } else {
        setSocialWorkerData(null);
      }
      setLoading(false);
    });

    // 정리 함수
    return unsubscribe;
  }, []);

  // 컨텍스트 값
  const value = {
    currentUser,
    socialWorkerData,
    login,
    resetPassword,
    signOut,
    fetchSocialWorkerData,
    updateSocialWorkerData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}