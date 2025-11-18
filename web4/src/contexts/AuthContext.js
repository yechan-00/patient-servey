// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { isAdminEmail } from "../config/adminConfig";

// 인증 컨텍스트 생성
const AuthContext = createContext();

// 컨텍스트 사용을 위한 훅
export function useAuth() {
  return useContext(AuthContext);
}

// 인증 제공자 컴포넌트
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 회원가입
  async function signup(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // 사용자 프로필 업데이트
      if (displayName) {
        await updateProfile(userCredential.user, {
          displayName: displayName,
        });
      }

      // Firestore에 사용자 프로필 저장
      await setDoc(doc(db, "community_users", userCredential.user.uid), {
        email: email,
        displayName: displayName || email.split("@")[0],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        role: "member", // 일반 회원
      });

      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  // 의료 종사자 회원가입
  async function medicalStaffSignup(email, password, displayName, licenseInfo) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // 사용자 프로필 업데이트
      if (displayName) {
        await updateProfile(userCredential.user, {
          displayName: displayName,
        });
      }

      // Firestore에 사용자 프로필 저장 (의료 종사자, 승인 대기 상태)
      await setDoc(doc(db, "community_users", userCredential.user.uid), {
        email: email,
        displayName: displayName || email.split("@")[0],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        role: "medical_staff",
        medicalStaffStatus: "pending", // pending, approved, rejected
        licenseType: licenseInfo.licenseType,
        licenseNumber: licenseInfo.licenseNumber,
        institution: licenseInfo.institution,
        licenseUrl: licenseInfo.licenseUrl,
      });

      // socialWorkers 컬렉션에도 저장 (승인 대기 상태)
      await setDoc(doc(db, "socialWorkers", userCredential.user.uid), {
        email: email,
        displayName: displayName || email.split("@")[0],
        licenseType: licenseInfo.licenseType,
        licenseNumber: licenseInfo.licenseNumber,
        institution: licenseInfo.institution,
        licenseUrl: licenseInfo.licenseUrl,
        status: "pending", // pending, approved, rejected
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return userCredential;
    } catch (error) {
      throw error;
    }
  }

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

  // 사용자 프로필 가져오기
  async function fetchUserProfile(uid) {
    try {
      // 먼저 community_users에서 확인
      const communityUserRef = doc(db, "community_users", uid);
      const communityUserSnap = await getDoc(communityUserRef);

      // socialWorkers 컬렉션에서 의료 종사자 확인
      const socialWorkerRef = doc(db, "socialWorkers", uid);
      const socialWorkerSnap = await getDoc(socialWorkerRef);

      const isMedicalStaff = socialWorkerSnap.exists();
      const userEmail = auth.currentUser?.email || "";
      const isAdmin = isAdminEmail(userEmail);

      if (communityUserSnap.exists()) {
        const data = communityUserSnap.data();
        // 역할 우선순위: admin > medical_staff > member
        let role = data.role || "member";
        if (isAdmin) {
          role = "admin";
        } else if (isMedicalStaff) {
          role = "medical_staff";
        }

        // 의료 종사자 여부 및 관리자 여부 업데이트
        const updatedData = {
          ...data,
          isMedicalStaff: isMedicalStaff,
          isAdmin: isAdmin,
          role: role,
        };

        // 의료 종사자 정보가 변경되었으면 업데이트
        if (data.isMedicalStaff !== isMedicalStaff) {
          await setDoc(communityUserRef, updatedData, { merge: true });
        }

        setUserProfile(updatedData);
        return updatedData;
      } else {
        // 프로필이 없으면 기본 프로필 생성
        const userEmail = auth.currentUser?.email || "";
        const isAdmin = isAdminEmail(userEmail);
        let role = "member";
        if (isAdmin) {
          role = "admin";
        } else if (isMedicalStaff) {
          role = "medical_staff";
        }

        const defaultProfile = {
          email: userEmail,
          displayName:
            auth.currentUser?.displayName ||
            auth.currentUser?.email?.split("@")[0] ||
            "사용자",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          role: role,
          isMedicalStaff: isMedicalStaff,
          isAdmin: isAdmin,
        };
        await setDoc(communityUserRef, defaultProfile);
        setUserProfile(defaultProfile);
        return defaultProfile;
      }
    } catch (error) {
      console.error("사용자 프로필 가져오기 오류:", error);
      throw error;
    }
  }

  // 사용자 프로필 업데이트
  async function updateUserProfile(uid, data) {
    try {
      await setDoc(
        doc(db, "community_users", uid),
        {
          ...data,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 로컬 상태 업데이트
      setUserProfile((prevData) => ({ ...prevData, ...data }));
    } catch (error) {
      console.error("사용자 프로필 업데이트 오류:", error);
      throw error;
    }
  }

  // 인증 상태 변경 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          await fetchUserProfile(user.uid);
        } catch (error) {
          console.error("사용자 데이터 로드 실패:", error);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    // 정리 함수
    return unsubscribe;
  }, []);

  // 컨텍스트 값
  const value = {
    currentUser,
    userProfile,
    signup,
    medicalStaffSignup,
    login,
    resetPassword,
    signOut,
    fetchUserProfile,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
