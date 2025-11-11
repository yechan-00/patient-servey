// src/page/info.js
import React, { useEffect } from "react";
import { Container } from "@mui/material";
import { useLocation } from "react-router-dom";
import SurveyForm from "../component/SurveyForm"; // 🔁 파일명 반영
import { useSurveyForm } from "../context/SurveyFormContext";

const Info = () => {
  const { reset } = useSurveyForm();
  const location = useLocation();

  // 새 설문 시작 시에만 설문 폼 초기화
  // location.state.newSurvey가 true일 때만 초기화 (홈에서 직접 접근할 때)
  // 뒤로 가기로 돌아올 때는 location.state가 없거나 newSurvey가 false이므로 데이터 유지
  useEffect(() => {
    // 새 설문 시작 플래그 확인
    const isNewSurvey = location.state?.newSurvey === true;

    if (isNewSurvey) {
      reset();
      // 새로운 설문 시작 시 이전 환자 정보 및 설문 초안 삭제 (다른 사람 설문 시 덮어쓰기 방지)
      try {
        localStorage.removeItem("patientId");
        localStorage.removeItem("userName");
        localStorage.removeItem("birthDate");
        localStorage.removeItem("cancerType");
        localStorage.removeItem("diagnosisDate");
        // SurveyForm.js의 localStorage도 클리어
        localStorage.removeItem("survey-draft");
        // SurveyFormContext의 localStorage도 클리어 (버전별 키)
        localStorage.removeItem("survey-draft@v1");
        console.log(
          "[Info] 새 설문 시작 - Survey form reset and previous patient data cleared"
        );
      } catch (e) {
        console.warn("[Info] Failed to clear localStorage:", e);
      }
    } else {
      // 뒤로 가기로 돌아온 경우 - 데이터 유지 (SurveyForm.js에서 localStorage에서 자동 로드)
      const draftData = localStorage.getItem("survey-draft");
      console.log(
        "[Info] 뒤로 가기로 돌아옴 - 데이터 유지, localStorage 상태:",
        {
          hasSurveyDraft: !!draftData,
          draftDataPreview: draftData ? JSON.parse(draftData) : null,
          locationState: location.state,
        }
      );
    }
  }, [reset, location.state]);

  return (
    <Container
      maxWidth="md"
      sx={{ py: 4, background: "none", bgcolor: "background.default" }}
    >
      <SurveyForm />
    </Container>
  );
};

export default Info;
