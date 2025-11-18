// src/App.js
import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import GlobalStyle from "./styles/GlobalStyle";
import theme from "./styles/theme";
import Layout from "./components/Layout";

// 페이지 컴포넌트
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import MedicalStaffSignupPage from "./pages/MedicalStaffSignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import CommunityPage from "./pages/CommunityPage";
import WritePostPage from "./pages/WritePostPage";
import PostDetailPage from "./pages/PostDetailPage";
import SurveysPage from "./pages/SurveysPage";
import SurveyHistoryPage from "./pages/SurveyHistoryPage";
import BookmarksPage from "./pages/BookmarksPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";

// 보호된 라우트 컴포넌트
function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AuthProvider>
        <Router>
          <Routes>
            {/* 공개 경로 */}
            <Route
              path="/login"
              element={
                <Layout>
                  <LoginPage />
                </Layout>
              }
            />
            <Route
              path="/signup"
              element={
                <Layout>
                  <SignupPage />
                </Layout>
              }
            />
            <Route
              path="/signup/medical-staff"
              element={
                <Layout>
                  <MedicalStaffSignupPage />
                </Layout>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <Layout>
                  <ForgotPasswordPage />
                </Layout>
              }
            />

            {/* 보호된 경로 */}
            <Route
              path="/"
              element={
                <Layout>
                  <PrivateRoute>
                    <CommunityPage />
                  </PrivateRoute>
                </Layout>
              }
            />
            <Route
              path="/community"
              element={
                <Layout>
                  <PrivateRoute>
                    <CommunityPage />
                  </PrivateRoute>
                </Layout>
              }
            />
            <Route
              path="/community/:category"
              element={
                <Layout>
                  <PrivateRoute>
                    <CommunityPage />
                  </PrivateRoute>
                </Layout>
              }
            />
            <Route
              path="/community/write"
              element={
                <Layout>
                  <PrivateRoute>
                    <WritePostPage />
                  </PrivateRoute>
                </Layout>
              }
            />
            <Route
              path="/community/post/:postId"
              element={
                <Layout>
                  <PrivateRoute>
                    <PostDetailPage />
                  </PrivateRoute>
                </Layout>
              }
            />
            <Route
              path="/surveys"
              element={
                <Layout>
                  <SurveysPage />
                </Layout>
              }
            />
            <Route
              path="/survey-history"
              element={
                <Layout>
                  <PrivateRoute>
                    <SurveyHistoryPage />
                  </PrivateRoute>
                </Layout>
              }
            />
            <Route
              path="/bookmarks"
              element={
                <Layout>
                  <PrivateRoute>
                    <BookmarksPage />
                  </PrivateRoute>
                </Layout>
              }
            />
            <Route
              path="/notifications"
              element={
                <Layout>
                  <PrivateRoute>
                    <NotificationsPage />
                  </PrivateRoute>
                </Layout>
              }
            />
            <Route
              path="/profile"
              element={
                <Layout>
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                </Layout>
              }
            />
            <Route
              path="/admin"
              element={
                <Layout>
                  <PrivateRoute>
                    <AdminPage />
                  </PrivateRoute>
                </Layout>
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

export default App;
