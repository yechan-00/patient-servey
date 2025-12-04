import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useMemo,
  useEffect,
} from "react";

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// 하드코딩된 계정 정보 (컴포넌트 외부로 이동하여 재생성 방지)
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
const STORAGE_KEY = "user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // localStorage에서 사용자 정보 복원
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY);
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        // 유효성 검사
        if (parsedUser && parsedUser.username && parsedUser.role) {
          setUser(parsedUser);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("사용자 정보 복원 실패:", error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // 로그인 함수 (useCallback으로 메모이제이션)
  const login = useCallback((username, password) => {
    if (!username || !password) {
      return {
        success: false,
        error: "아이디와 비밀번호를 모두 입력해주세요.",
      };
    }

    // 환자 계정 확인
    if (
      username === HARDCODED_ACCOUNTS.patient.username &&
      password === HARDCODED_ACCOUNTS.patient.password
    ) {
      const userData = {
        username: HARDCODED_ACCOUNTS.patient.username,
        role: HARDCODED_ACCOUNTS.patient.role,
      };
      setUser(userData);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      } catch (error) {
        console.error("localStorage 저장 실패:", error);
      }
      return { success: true, role: "patient" };
    }

    // 의료 관계자 계정 확인
    if (
      username === HARDCODED_ACCOUNTS.medical.username &&
      password === HARDCODED_ACCOUNTS.medical.password
    ) {
      const userData = {
        username: HARDCODED_ACCOUNTS.medical.username,
        role: HARDCODED_ACCOUNTS.medical.role,
      };
      setUser(userData);
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
  }, []);

  // 로그아웃 함수 (useCallback으로 메모이제이션)
  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("localStorage 삭제 실패:", error);
    }
  }, []);

  // 컨텍스트 값 메모이제이션
  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isInitialized,
    }),
    [user, login, logout, isInitialized]
  );

  // 초기화 완료 전에는 로딩 표시하지 않고 그대로 렌더링
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
