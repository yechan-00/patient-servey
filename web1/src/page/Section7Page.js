// src/pages/Section7Page.js
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Alert,
  AlertTitle,
  LinearProgress,
} from "@mui/material";
import Section7Component from "../component/Section7Component";
import { useSurveyForm } from "../context/SurveyFormContext";

const steps = [
  "암 이후 내 몸의 변화",
  "건강한 삶을 위한 관리",
  "회복을 도와주는 사람들",
  "심리적 부담",
  "사회적 삶의 부담",
  "암 이후 탄력성",
  "추가",
];

const Section7Page = () => {
  const navigate = useNavigate();
  const { answers } = useSurveyForm();
  const { state } = useLocation();
  const userName = state?.name || localStorage.getItem("userName") || "";

  const [error, setError] = useState(false);
  const [missingQuestions, setMissingQuestions] = useState([]);

  // 참고: Section7Page는 getUserAnswers를 호출하지 않음
  // SurveyFormContext가 이미 모든 답변을 관리하고 있음
  // Firebase에서 불러오면 이전 설문 데이터가 덮어씌워질 수 있음

  const total = 2; // Q32~Q33 (추가 질문들은 선택사항)
  const done = ["q32", "q33"].filter((id) => answers[id]).length;
  const progress = (done / total) * 100;
  const currentStep = 6;

  // 미응답 문항으로 스크롤하는 함수
  const scrollToFirstMissing = (missing) => {
    if (missing.length > 0) {
      const firstMissingElement = document.getElementById(missing[0]);
      if (firstMissingElement) {
        firstMissingElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  };

  const handleNext = () => {
    const requiredQuestions = ["q32", "q33"];
    const missing = requiredQuestions.filter((q) => !answers[q]);

    if (missing.length > 0) {
      setMissingQuestions(missing);
      setError(true);
      scrollToFirstMissing(missing);
      return;
    }

    // localStorage에서 개인 정보 가져오기 (SurveyForm에서 저장한 값)
    // 우선순위: localStorage > answers > 빈 문자열
    const personalInfo = {
      name: userName || localStorage.getItem("userName") || "",
      birthDate: localStorage.getItem("birthDate") || "",
      cancerType: localStorage.getItem("cancerType") || "",
      diagnosisDate: localStorage.getItem("diagnosisDate") || "",
      // localStorage 우선, 없으면 answers에서 읽기
      gender: localStorage.getItem("gender") || answers.gender || "",
      maritalStatus:
        localStorage.getItem("maritalStatus") || answers.maritalStatus || "",
      cancerStage:
        localStorage.getItem("cancerStage") || answers.cancerStage || "",
      hasRecurrence:
        localStorage.getItem("hasRecurrence") || answers.hasRecurrence || "",
      hasSurgery:
        localStorage.getItem("hasSurgery") || answers.hasSurgery || "",
      surgeryDate:
        localStorage.getItem("surgeryDate") || answers.surgeryDate || "",
      mentalHealthHistory:
        localStorage.getItem("mentalHealthHistory") ||
        answers.mentalHealthHistory ||
        "",
      mentalHealthDiagnosesText:
        localStorage.getItem("mentalHealthDiagnosesText") ||
        answers.mentalHealthDiagnosesText ||
        "",
      otherMentalDiagnosis:
        localStorage.getItem("otherMentalDiagnosis") ||
        answers.otherMentalDiagnosis ||
        "",
      mentalHealthImpact:
        localStorage.getItem("mentalHealthImpact") ||
        answers.mentalHealthImpact ||
        "",
      otherTreatmentType:
        localStorage.getItem("otherTreatmentType") ||
        answers.otherTreatmentType ||
        "",
      phone: localStorage.getItem("phone") || answers.phone || "",
      contactMethod:
        localStorage.getItem("contactMethod") || answers.contactMethod || "",
      contactTime:
        localStorage.getItem("contactTime") || answers.contactTime || "",
      otherCancerDiagnosis:
        localStorage.getItem("otherCancerDiagnosis") ||
        answers.otherCancerDiagnosis ||
        "",
      otherCancerType:
        localStorage.getItem("otherCancerType") ||
        answers.otherCancerType ||
        "",
      otherCancerDetails:
        localStorage.getItem("otherCancerDetails") ||
        answers.otherCancerDetails ||
        "",
    };

    // 디버깅: personalInfo 확인
    console.log("[Section7Page] personalInfo:", personalInfo);
    console.log("[Section7Page] personalInfo.gender:", personalInfo.gender);
    console.log(
      "[Section7Page] personalInfo.maritalStatus:",
      personalInfo.maritalStatus
    );
    console.log(
      "[Section7Page] personalInfo.cancerStage:",
      personalInfo.cancerStage
    );

    // navigate 호출 시 answers와 개인 정보를 state에 포함하여 전달
    navigate("/survey-result", {
      state: {
        answers: answers,
        // 개인 정보 필드 포함
        ...personalInfo,
      },
    });
  };

  useEffect(() => {
    if (done === total) {
      setError(false);
      setMissingQuestions([]);
    }
  }, [done]);

  return (
    <Container maxWidth="md" sx={{ py: 4, bgcolor: "background.default" }}>
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        sx={{ fontWeight: "bold" }}
      >
        암 생존자 건강관리 설문
      </Typography>
      <Typography
        variant="subtitle1"
        align="center"
        color="textSecondary"
        gutterBottom
        sx={{ mb: 4 }}
      >
        여러분의 건강 상태와 일상생활에 대한 것입니다. 아래 내용을 체크해
        주세요.
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 5 }}>
        {steps.map((label, idx) => {
          const bg =
            idx < currentStep
              ? "success.main"
              : idx === currentStep
              ? "primary.main"
              : "grey.300";
          return (
            <Box key={label} sx={{ flex: 1, textAlign: "center" }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  mx: "auto",
                  borderRadius: "50%",
                  bgcolor: bg,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {idx + 1}
              </Box>
            </Box>
          );
        })}
      </Box>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: "bold", mb: 2, textAlign: "center" }}
        >
          {steps[currentStep]}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography
            variant="body2"
            align="right"
            sx={{ mt: 1, color: "text.secondary" }}
          >
            필수 문항 진행 상황: {done}/{total}
          </Typography>
        </Box>

        {/* 추가 정보 안내 */}
        <Box
          sx={{
            mb: 3,
            p: 2,
            backgroundColor: "#e8f5e8",
            borderRadius: 1,
            borderLeft: "4px solid #4caf50",
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "#2e7d32", fontWeight: 500 }}
          >
            💡 <strong>안내:</strong> 32~33번은 필수 문항이며, 34~36번은
            선택사항입니다. 추가 정보를 제공해 주시면 더 나은 맞춤형 서비스를
            제공할 수 있습니다.
          </Typography>
        </Box>

        <Section7Component
          name={userName}
          missingQuestions={missingQuestions}
        />

        {error && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <AlertTitle>미응답 문항이 있습니다</AlertTitle>
            필수 문항을 모두 응답해야 설문을 완료할 수 있습니다. 빨간색으로
            표시된 문항을 확인해 주세요.
            {missingQuestions.length > 0 && (
              <Box sx={{ mt: 1 }}>
                미응답 문항:{" "}
                {missingQuestions
                  .map((q) => q.replace("q", "") + "번")
                  .join(", ")}
              </Box>
            )}
          </Alert>
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <Button
            variant="outlined"
            onClick={() => navigate("/section6", { state: { name: userName } })}
          >
            이전
          </Button>
          <Button variant="contained" onClick={handleNext}>
            완료
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Section7Page;
