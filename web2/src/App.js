// src/App.js
import React, { useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "styled-components";
import GlobalStyle from "./styles/GlobalStyle";
import theme from "./styles/theme";

// 페이지 컴포넌트
import DashboardPage from "./pages/DashboardPage";
import PatientDetailPage from "./pages/patient-detail/PatientDetailPage";
import CounselingRecordPage from "./pages/CounselingRecordPage";
import ArchivedPatientsPage from "./pages/ArchivedPatientsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import PatientsListPage from "./pages/PatientsListPage";

// web5 로그인 페이지 URL 생성 함수
function getWeb5LoginUrl() {
  // 로컬 환경인지 확인
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "";

  if (isLocalhost) {
    // 로컬 환경: web5는 일반적으로 3000번 포트에서 실행
    // web2가 다른 포트에서 실행되더라도 web5는 3000번 포트로 가정
    return "http://localhost:3000/#/login";
  }

  // 프로덕션 환경
  return "https://yechan-00.github.io/patient-servey/web5/#/login";
}

// web5 로그인 페이지로 리디렉션하는 컴포넌트
function RedirectToWeb5Login() {
  useEffect(() => {
    window.location.href = getWeb5LoginUrl();
  }, []);
  return null;
}

function PrivateRoute({ children }) {
  const { currentUser, hardcodedUser, loading } = useAuth();

  // 로딩 중이면 대기
  if (loading) {
    return null; // 또는 로딩 스피너 표시
  }

  // 로그인되지 않은 경우 web5 로그인 페이지로 리디렉션
  // hardcodedUser도 확인 (web5의 localStorage에서 복원된 경우)
  if (!currentUser && !hardcodedUser) {
    window.location.href = getWeb5LoginUrl();
    return null;
  }

  return children;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AuthProvider>
        <Router>
          <Routes>
            {/* 공개 경로 */}
            <Route path="/login" element={<RedirectToWeb5Login />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* 보호 경로 */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/patients/:patientId"
              element={
                <PrivateRoute>
                  <PatientDetailPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/counseling-record/:requestId"
              element={
                <PrivateRoute>
                  <CounselingRecordPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/patients/archived"
              element={
                <PrivateRoute>
                  <ArchivedPatientsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/archived"
              element={
                <PrivateRoute>
                  <ArchivedPatientsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/patients-lite"
              element={
                <PrivateRoute>
                  <PatientsListPage />
                </PrivateRoute>
              }
            />

            {/* fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
