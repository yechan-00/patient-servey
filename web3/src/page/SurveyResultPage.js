// src/pages/SurveyResultPage.js
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import SurveyResult from "../component/SurveyResult";
import {
  saveSurveyScores,
  saveSurveySnapshot,
  saveSurveySummary,
  savePatientSnapshot,
} from "../utils/firebaseUtils";

// 이름+생년월일 기반으로 브라우저 crypto를 이용해 안정적인 환자 ID 생성
async function makeStablePatientId(name, birthDate) {
  try {
    const text = `${(name || "").trim()}|${(birthDate || "").trim()}`;
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-1", enc);
    const hex = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `p-${hex.slice(0, 16)}`;
  } catch (e) {
    return `p-${Date.now()}`;
  }
}

// Section1 점수 계산 (예=1, 아니오=0)
const calculateSection1Score = (section1Answers) => {
  let yesCount = 0;
  const questionIds = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10", "q11", "q12"];
  
  questionIds.forEach((qId) => {
    if (section1Answers[qId] === "예") {
      yesCount++;
    }
  });

  return {
    total: yesCount,
    isHighRisk: yesCount >= 5,
  };
};

// Section2 카테고리별 위험 판단
const calculateSection2Risks = (answers, section1Answers) => {
  const risks = {};

  // Section1 답변에 따른 카테고리 활성화 여부
  const showCategory = {
    재정: section1Answers.q1 === "예" || section1Answers.q7 === "예",
    사회적고립: section1Answers.q2 === "예",
    정신건강: section1Answers.q3 === "예",
    주거: section1Answers.q4 === "예",
    음식: section1Answers.q5 === "예",
    교통: section1Answers.q6 === "예",
    정보이해: section1Answers.q8 === "예",
    폭력: section1Answers.q9 === "예",
    고용: section1Answers.q10 === "예",
    사회적지원: section1Answers.q11 === "예",
    돌봄책임: section1Answers.q12 === "예",
  };

  // 각 카테고리별 위험 판단
  if (showCategory.재정) {
    const incomeRisk = ["lt40", "lt50", "lt75"].includes(answers.q1);
    const paymentRisk = answers.q2 && Array.isArray(answers.q2) && 
      answers.q2.length > 0 && !answers.q2.every(v => v === "none");
    risks.재정 = incomeRisk || paymentRisk;
  }

  if (showCategory.사회적고립) {
    const q3Risk = ["often", "always"].includes(answers.q3);
    const q4Risk = answers.q4 === "m1";
    risks.사회적고립 = q3Risk || q4Risk;
  }

  if (showCategory.정신건강) {
    const score = parseInt(answers.q5) || 0;
    risks.정신건강 = score >= 6;
  }

  if (showCategory.주거) {
    const housingRiskValues = ["relativeTemp", "shelter", "facility"];
    const q6Risk = housingRiskValues.includes(answers.q6);
    const q7Risk = answers.q7 === "Y";
    risks.주거 = q6Risk || q7Risk;
  }

  if (showCategory.음식) {
    risks.음식 = answers.q7_food === "N";
  }

  if (showCategory.교통) {
    const transportRisk = answers.q8 && Array.isArray(answers.q8) && 
      answers.q8.length > 0 && !answers.q8.every(v => v === "none");
    risks.교통 = transportRisk;
  }

  if (showCategory.정보이해) {
    const eduRisk = ["무학", "초졸", "중졸"].includes(answers.q9);
    const readRisk = ["2", "3", "4"].includes(answers.q10);
    const digitalRisk = answers.q11 === "제한적";
    risks.정보이해 = eduRisk || readRisk || digitalRisk;
  }

  if (showCategory.폭력) {
    const noViolence = "없다";
    const q12Risk = answers.q12 && answers.q12 !== noViolence;
    const q13Risk = answers.q13 && answers.q13 !== noViolence;
    const q14Risk = answers.q14 && answers.q14 !== noViolence;
    risks.폭력 = q12Risk || q13Risk || q14Risk;
  }

  if (showCategory.고용) {
    let employmentRisk = false;
    if (answers.q15 === "working") {
      const riskDetails = ["leave_or_sick", "contract_end", "quit_planned"];
      employmentRisk = riskDetails.includes(answers.q15_working_detail);
    } else if (answers.q15 === "notWorking") {
      const riskReasons = ["quit_after_dx", "other"];
      employmentRisk = riskReasons.includes(answers.q15_notWorking_reasons);
    }
    risks.고용 = employmentRisk;
  }

  if (showCategory.사회적지원) {
    const q16Risk = answers.q16 === "N";
    const q17Risk = answers.q17 === "N";
    risks.사회적지원 = q16Risk || q17Risk;
  }

  if (showCategory.돌봄책임) {
    risks.돌봄책임 = answers.q18 === "Y";
  }

  return risks;
};

const SurveyResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const answers = location.state?.answers || {};
  const section1Answers = location.state?.section1Answers || 
    JSON.parse(localStorage.getItem("section1Answers") || "{}");
  const userName = location.state?.name || localStorage.getItem("userName") || "";

  useEffect(() => {
    const saveResults = async () => {
      try {
        setIsLoading(true);

        // Section1 점수 계산
        const section1Result = calculateSection1Score(section1Answers);
        
        // Section2 위험 요인 계산
        const section2Risks = calculateSection2Risks(answers, section1Answers);
        const riskCategories = Object.entries(section2Risks)
          .filter(([_, isRisk]) => isRisk)
          .map(([category]) => category);

        // Firebase에 결과 저장 (사용자명이 있는 경우에만)
        if (userName) {
          const nameVal = userName || localStorage.getItem("userName") || "익명";
          const birthDateVal = location.state?.birthDate || localStorage.getItem("birthDate") || "";
          const cancerTypeVal = location.state?.cancerType || localStorage.getItem("cancerType") || "";
          const diagnosisDateVal = location.state?.diagnosisDate || localStorage.getItem("diagnosisDate") || "";

          const pidFromState = location.state?.patientId || localStorage.getItem("patientId") || "";
          const patientId = pidFromState || (await makeStablePatientId(nameVal, birthDateVal));
          
          try {
            localStorage.setItem("patientId", patientId);
          } catch (e) {
            // localStorage 접근 불가한 환경 대비
          }

          // 위험 수준 결정
          const riskLevel = section1Result.isHighRisk ? "high" : 
            riskCategories.length > 0 ? "medium" : "low";

          try {
            await savePatientSnapshot(patientId, {
              name: nameVal,
              birthDate: birthDateVal,
              cancerType: cancerTypeVal,
              diagnosisDate: diagnosisDateVal,
              riskLevel,
              counselingStatus: "미요청",
              archived: false,
            });

            const scoresToSave = {
              section1Score: section1Result.total,
              section1IsHighRisk: section1Result.isHighRisk,
              section2Risks: section2Risks,
              riskCategories: riskCategories,
              riskLevel,
            };

            const snapshotData = {
              section1Answers,
              section2Answers: answers,
              section1Score: section1Result.total,
              section1IsHighRisk: section1Result.isHighRisk,
              section2Risks,
              riskCategories,
              createdAt: new Date().toISOString(),
            };

            const summary = {
              lastSurveyCompletedAt: new Date().toISOString(),
              lastSection1Score: section1Result.total,
              lastSection1IsHighRisk: section1Result.isHighRisk,
              lastRiskCategories: riskCategories,
              lastRiskLevel: riskLevel,
            };

            await saveSurveySnapshot(patientId, snapshotData);
            await saveSurveySummary(patientId, summary);
            await saveSurveyScores(patientId, scoresToSave, {
              name: nameVal,
              birthDate: birthDateVal,
              cancerType: cancerTypeVal,
              diagnosisDate: diagnosisDateVal,
              requestCounseling: false,
            });

            console.log("Survey results saved successfully");
          } catch (e) {
            console.error("Error saving survey results:", e);
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error in result page:", err);
        setError(err.message || "결과를 처리하는 중 오류가 발생했습니다.");
        setIsLoading(false);
      }
    };

    saveResults();
  }, [answers, section1Answers, userName, location.state]);

  // 로딩 중 화면
  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="50vh"
        p={4}
      >
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" align="center" sx={{ mb: 1 }}>
          결과를 분석하고 있습니다...
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary">
          잠시만 기다려주세요.
        </Typography>
      </Box>
    );
  }

  // 에러 화면
  if (error) {
    return (
      <Box p={4} display="flex" flexDirection="column" alignItems="center">
        <Alert severity="error" sx={{ mb: 3, maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom>
            결과 표시 오류
          </Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={() => navigate("/section1")}>
            설문 다시하기
          </Button>
          <Button variant="contained" onClick={() => navigate("/")}>
            홈으로 가기
          </Button>
        </Box>
      </Box>
    );
  }

  // 정상 결과 화면
  return (
    <Box p={4}>
      <SurveyResult
        answers={answers}
        section1Answers={section1Answers}
      />

      <Box
        mt={4}
        display="flex"
        justifyContent="center"
        gap={2}
        flexWrap="wrap"
      >
        <Button
          variant="outlined"
          onClick={() => {
            const isLocalhost =
              window.location.hostname === "localhost" ||
              window.location.hostname === "127.0.0.1" ||
              window.location.hostname === "";
            const dashboardUrl = isLocalhost
              ? "http://localhost:3001/#/"
              : "https://yechan-00.github.io/patient-servey/web2/#/";
            window.location.href = dashboardUrl;
          }}
          sx={{
            px: { xs: 3, sm: 6 },
            py: 2,
            fontSize: { xs: "0.9rem", sm: "1.1rem" },
            fontWeight: "bold",
            borderRadius: 1,
          }}
        >
          대시보드로 가기
        </Button>
        <Button
          variant="contained"
          color="primary"
          sx={{
            px: { xs: 3, sm: 6 },
            py: 2,
            fontSize: { xs: "0.9rem", sm: "1.1rem" },
            fontWeight: "bold",
            borderRadius: 1,
          }}
          onClick={() => navigate("/counseling-request")}
        >
          상담 요청
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          sx={{
            px: { xs: 3, sm: 6 },
            py: 2,
            fontSize: { xs: "0.9rem", sm: "1.1rem" },
            fontWeight: "bold",
            borderRadius: 1,
          }}
          onClick={() => window.print()}
        >
          결과 출력
        </Button>
      </Box>
    </Box>
  );
};

export default SurveyResultPage;
