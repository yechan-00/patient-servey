// src/pages/Section2Page.js
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Alert,
  AlertTitle,
} from "@mui/material";
import Section2Component from "../component/Section2Component";

const steps = ["암 환자 사회적 스크리닝 설문", "사회적 위험요인 평가 설문"];

const Section2Page = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const userName = state?.name || localStorage.getItem("userName") || "";
  const section1Answers = state?.answers || {}; // Section1에서 전달받은 답변

  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(false);
  const [missingQuestions, setMissingQuestions] = useState([]);
  const currentStep = 1;

  // Section1 답변에 따른 카테고리별 표시 여부 계산
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

  // 필수 질문 목록 (카테고리에 따라 동적으로 생성)
  const getRequiredQuestions = () => {
    const required = [];
    
    // 재정 카테고리
    if (showCategory.재정) {
      required.push("q1", "q1Amount", "q1Household", "q2");
    }
    // 사회적 고립 카테고리
    if (showCategory.사회적고립) {
      required.push("q3", "q4");
    }
    // 정신 건강 카테고리
    if (showCategory.정신건강) {
      required.push("q5");
    }
    // 주거 카테고리
    if (showCategory.주거) {
      required.push("q6", "q7");
    }
    // 음식 카테고리
    if (showCategory.음식) {
      required.push("q7_food");
    }
    // 교통 카테고리
    if (showCategory.교통) {
      required.push("q8");
    }
    // 정보이해 카테고리
    if (showCategory.정보이해) {
      required.push("q9", "q10", "q11");
    }
    // 폭력 카테고리
    if (showCategory.폭력) {
      required.push("q12", "q13", "q14");
    }
    // 고용 카테고리
    if (showCategory.고용) {
      required.push("q15");
    }
    // 사회적 지원 카테고리
    if (showCategory.사회적지원) {
      required.push("q16", "q17");
    }
    // 돌봄책임 카테고리
    if (showCategory.돌봄책임) {
      required.push("q18");
    }
    
    return required;
  };

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
    const requiredQuestions = getRequiredQuestions();
    let missing = [];

    requiredQuestions.forEach((qId) => {
      const answer = answers[qId];
      
      // 체크박스 타입 (배열)
      if (Array.isArray(answer)) {
        if (answer.length === 0) {
          missing.push(qId);
        }
      }
      // 문자열 또는 숫자 타입
      else if (!answer || (typeof answer === "string" && answer.trim() === "")) {
        missing.push(qId);
      }
    });

    // yn-with-details 타입의 하위 질문 체크 (표시될 때만 필수)
    // q7: "Y" 선택 시 q7Details 필수
    if (showCategory.주거 && answers.q7 === "Y") {
      if (!answers.q7Details || answers.q7Details.length === 0) {
        missing.push("q7Details");
      }
    }
    // q7_food: "N" 선택 시 q7_foodDetails 필수
    if (showCategory.음식 && answers.q7_food === "N") {
      if (!answers.q7_foodDetails || answers.q7_foodDetails.length === 0) {
        missing.push("q7_foodDetails");
      }
    }
    // q15: working 선택 시 q15_working_detail 필수
    if (showCategory.고용 && answers.q15 === "working") {
      if (!answers.q15_working_detail) {
        missing.push("q15_working_detail");
      }
    }
    // q15: notWorking 선택 시 q15_notWorking_reasons 필수
    if (showCategory.고용 && answers.q15 === "notWorking") {
      if (!answers.q15_notWorking_reasons) {
        missing.push("q15_notWorking_reasons");
      }
    }
    // q18: "Y" 선택 시 q18Details 필수
    if (showCategory.돌봄책임 && answers.q18 === "Y") {
      if (!answers.q18Details || answers.q18Details.length === 0) {
        missing.push("q18Details");
      }
    }

    if (missing.length > 0) {
      setMissingQuestions(missing);
      setError(true);
      scrollToFirstMissing(missing);
      return;
    }

    // section1Answers를 localStorage에도 저장
    localStorage.setItem("section1Answers", JSON.stringify(section1Answers));
    
    navigate("/survey-result", { 
      state: { 
        name: userName, 
        answers,
        section1Answers 
      } 
    });
  };


  return (
    <Container
      maxWidth="md"
      sx={{ py: 4, background: "none", bgcolor: "background.default" }}
    >
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        sx={{ fontWeight: "bold" }}
      >
        암 환자 사회적 스크리닝 설문
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

      {/* 커스텀 스텝바 */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 5 }}>
        {steps.map((label, idx) => {
          const bg =
            idx < currentStep
              ? "success.main"
              : idx === currentStep
              ? "primary.main"
              : "grey.300";
          const color = idx <= currentStep ? "text.primary" : "text.disabled";
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

        <Section2Component
          name={userName}
          answers={answers}
          setAnswers={setAnswers}
          setValidationError={setError}
          validationError={error}
          missingQuestions={missingQuestions}
          section1Answers={section1Answers}
        />

        {error && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <AlertTitle>미응답 문항이 있습니다</AlertTitle>
            모든 문항을 응답해야 다음으로 넘어갈 수 있습니다. 빨간색으로 표시된
            문항을 확인해 주세요.
            {missingQuestions.length > 0 && (
              <Box sx={{ mt: 1 }}>
                미응답 문항:{" "}
                {missingQuestions
                  .filter((q) => q !== "q12_reasons")
                  .map((q) => q.replace("q", "").replace("_1_", "-1-") + "번")
                  .join(", ")}
              </Box>
            )}
          </Alert>
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <Button variant="outlined" onClick={() => navigate("/section1", { state: { name: userName } })}>
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

export default Section2Page;
