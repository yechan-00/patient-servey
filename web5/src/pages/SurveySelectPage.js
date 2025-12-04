import React, { useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import "./SurveySelectPage.css";

// 외부 URL 상수
const EXTERNAL_URLS = {
  SURVEY1: "https://yechan-00.github.io/patient-servey/web1/#/",
  SURVEY2: "https://yechan-00.github.io/patient-servey/web3/#/",
  COMMUNITY: "https://yechan-00.github.io/patient-servey/web4/#/",
};

function SurveySelectPage() {
  const { logout } = useAuth();

  const handleSurveySelect = useCallback((surveyType) => {
    const url =
      surveyType === "survey1"
        ? EXTERNAL_URLS.SURVEY1
        : surveyType === "survey2"
        ? EXTERNAL_URLS.SURVEY2
        : null;

    if (url) {
      window.location.href = url;
    }
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    // web5의 로그인 페이지로 이동 (현재 도메인 기준)
    window.location.href =
      window.location.origin + window.location.pathname + "#/login";
  }, [logout]);

  const handleCommunityClick = useCallback(() => {
    window.location.href = EXTERNAL_URLS.COMMUNITY;
  }, []);

  return (
    <div className="survey-select-container">
      <div className="survey-select-header">
        <h1 className="survey-select-title">설문 선택</h1>
        <div className="header-buttons">
          <button onClick={handleCommunityClick} className="community-button">
            커뮤니티
          </button>
          <button onClick={handleLogout} className="logout-button">
            로그아웃
          </button>
        </div>
      </div>

      <div className="survey-select-content">
        <p className="survey-select-description">
          진행하실 설문을 선택해주세요.
        </p>

        <div className="survey-cards">
          <div
            className="survey-card"
            onClick={() => handleSurveySelect("survey1")}
          >
            <div className="survey-card-icon">📋</div>
            <h2 className="survey-card-title">설문 1</h2>
            <p className="survey-card-description">
              기본 건강 스크리닝 및 생활습관 설문
            </p>
            <button className="survey-card-button">시작하기</button>
          </div>

          <div
            className="survey-card"
            onClick={() => handleSurveySelect("survey2")}
          >
            <div className="survey-card-icon">📊</div>
            <h2 className="survey-card-title">설문 2</h2>
            <p className="survey-card-description">
              심리사회적 적응 및 회복 지원 설문
            </p>
            <button className="survey-card-button">시작하기</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SurveySelectPage;
