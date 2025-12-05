import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./LoginPage.css";

// 외부 URL 상수
const EXTERNAL_URLS = {
  DASHBOARD: "https://yechan-00.github.io/patient-servey/web2/#/",
};

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      if (!username.trim() || !password.trim()) {
        setError("아이디와 비밀번호를 모두 입력해주세요.");
        setLoading(false);
        return;
      }

      const result = login(username.trim(), password);

      if (result.success) {
        if (result.role === "patient") {
          navigate("/survey-select");
        } else if (result.role === "medical") {
          // 의료 관계자는 web2 대시보드로 이동
          window.location.href = EXTERNAL_URLS.DASHBOARD;
        }
      } else {
        setError(result.error || "로그인에 실패했습니다.");
        setLoading(false);
      }
    },
    [username, password, login, navigate]
  );

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">암 생존자 케어 시스템</h1>
          <p className="login-subtitle">로그인하여 서비스를 이용하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">아이디</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="login-info">
          <p className="info-text">
            <strong>환자용:</strong> patient / patient123
          </p>
          <p className="info-text">
            <strong>의료진용:</strong> medical / medical123
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
