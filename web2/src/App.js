// src/App.js
import React from "react";
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
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import PatientsListPage from "./pages/PatientsListPage";

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AuthProvider>
        <Router basename="/patient-servey/web2">
          <Routes>
            {/* 공개 경로 */}
            <Route path="/login" element={<LoginPage />} />
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
