import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SurveySelectPage from "./pages/SurveySelectPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function PrivateRoute({ children, allowedRole }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/login" />;
  }

  return children;
}

// 루트 경로는 항상 로그인 페이지로 리디렉션
// (로그인 페이지에서 로그인 성공 시 적절한 페이지로 이동)
function RootRedirect() {
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/survey-select"
            element={
              <PrivateRoute allowedRole="patient">
                <SurveySelectPage />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
