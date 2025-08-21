// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import GlobalStyle from './styles/GlobalStyle';
import theme from './styles/theme';

// 페이지 컴포넌트 임포트
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import PatientDetailPage from './pages/PatientDetailPage';
import CounselingRecordPage from './pages/CounselingRecordPage';
import ProfilePage from './pages/ProfilePage';

// 인증 필요한 라우트를 위한 컴포넌트
function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  
  // 로그인 상태만 확인 (승인 확인 제거)
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AuthProvider>
        <Router>
          <Routes>
            {/* 공개 라우트 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* 인증 필요 라우트 */}
            <Route path="/" element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            } />
            
            <Route path="/patients/:patientId" element={
              <PrivateRoute>
                <PatientDetailPage />
              </PrivateRoute>
            } />
            
            <Route path="/counseling-record/:requestId" element={
              <PrivateRoute>
                <CounselingRecordPage />
              </PrivateRoute>
            } />
            
            <Route path="/profile" element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            } />
            
            {/* 없는 경로는 대시보드로 리디렉션 */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;