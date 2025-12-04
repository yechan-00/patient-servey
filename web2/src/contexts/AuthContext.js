// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

// 인증 컨텍스트 생성
const AuthContext = createContext();

// 컨텍스트 사용을 위한 훅
export function useAuth() {
  return useContext(AuthContext);
}

// 하드코딩된 계정 정보 (web5와 동일)
const HARDCODED_ACCOUNTS = {
  patient: {
    username: "patient",
    password: "patient123",
    role: "patient",
  },
  medical: {
    username: "medical",
    password: "medical123",
    role: "medical",
  },
};

// localStorage 키 상수
const STORAGE_KEY = "hardcoded_user";
const WEB5_STORAGE_KEY = "user"; // web5의 localStorage 키

// 인증 제공자 컴포넌트
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [hardcodedUser, setHardcodedUser] = useState(null);
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

  // 하드코딩된 계정 로그인
  function loginHardcoded(username, password) {
    if (
      username === HARDCODED_ACCOUNTS.patient.username &&
      password === HARDCODED_ACCOUNTS.patient.password
    ) {
      const userData = {
        username: HARDCODED_ACCOUNTS.patient.username,
        role: HARDCODED_ACCOUNTS.patient.role,
      };
      setHardcodedUser(userData);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      } catch (error) {
        console.error("localStorage 저장 실패:", error);
      }
      return { success: true, role: "patient" };
    }

    if (
      username === HARDCODED_ACCOUNTS.medical.username &&
      password === HARDCODED_ACCOUNTS.medical.password
    ) {
      const userData = {
        username: HARDCODED_ACCOUNTS.medical.username,
        role: HARDCODED_ACCOUNTS.medical.role,
      };
      setHardcodedUser(userData);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      } catch (error) {
        console.error("localStorage 저장 실패:", error);
      }
      return { success: true, role: "medical" };
    }

    return {
      success: false,
      error: "아이디 또는 비밀번호가 올바르지 않습니다.",
    };
  }

  // 로그아웃
  async function signOut() {
    // 하드코딩된 계정도 로그아웃
    setHardcodedUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      // web5의 localStorage도 삭제 (동기화)
      localStorage.removeItem(WEB5_STORAGE_KEY);
    } catch (error) {
      console.error("localStorage 삭제 실패:", error);
    }
    // Firebase 로그아웃
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
      await setDoc(
        doc(db, "socialWorkers", uid),
        {
          ...data,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // 로컬 상태 업데이트
      setSocialWorkerData((prevData) => ({ ...prevData, ...data }));
    } catch (error) {
      console.error("사회복지사 정보 업데이트 오류:", error);
      throw error;
    }
  }

  // localStorage에서 하드코딩된 사용자 정보 복원
  // web5의 localStorage("user")도 확인하여 medical 사용자 정보 동기화
  useEffect(() => {
    try {
      // web2의 localStorage 확인
      const savedUser = localStorage.getItem(STORAGE_KEY);
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && parsedUser.username && parsedUser.role) {
          setHardcodedUser(parsedUser);
          return; // web2의 localStorage에 있으면 그것을 사용
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      // web5의 localStorage 확인 (medical 사용자만)
      const web5User = localStorage.getItem(WEB5_STORAGE_KEY);
      if (web5User) {
        const parsedWeb5User = JSON.parse(web5User);
        if (
          parsedWeb5User &&
          parsedWeb5User.username &&
          parsedWeb5User.role === "medical"
        ) {
          // web5에서 medical로 로그인한 경우, web2의 localStorage에도 저장
          setHardcodedUser(parsedWeb5User);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedWeb5User));
          } catch (error) {
            console.error("localStorage 저장 실패:", error);
          }
        }
      }
    } catch (error) {
      console.error("사용자 정보 복원 실패:", error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

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
      // Firebase 인증 상태 확인 완료 후 로딩 종료
      // localStorage 확인은 이미 완료되었으므로 여기서 로딩 종료
      setLoading(false);
    });

    // 정리 함수
    return unsubscribe;
  }, []);

  // 컨텍스트 값
  // currentUser 또는 hardcodedUser가 있으면 인증된 것으로 간주
  const value = {
    currentUser:
      currentUser ||
      (hardcodedUser
        ? { uid: `hardcoded_${hardcodedUser.username}`, ...hardcodedUser }
        : null),
    hardcodedUser,
    socialWorkerData,
    loading,
    login,
    loginHardcoded,
    resetPassword,
    signOut,
    fetchSocialWorkerData,
    updateSocialWorkerData,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
