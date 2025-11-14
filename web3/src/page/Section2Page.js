// src/pages/Section2Page.js
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
import Section2Component from "../component/Section2Component";

const steps = ["암 환자 사회적 스크리닝 설문", "사회적 위험요인 평가 설문"];

const Section2Page = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const userName = state?.name || localStorage.getItem("userName") || "";

  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(false);
  const [missingQuestions, setMissingQuestions] = useState([]);

  const requiredSub12 = ["1", "2"].includes(answers.q12);
  const requiredSub13 = ["4", "5"].includes(answers.q13);

  const mainDone = ["q9", "q10", "q11"].filter((id) => answers[id]).length;
  const sub12Done = requiredSub12 && answers.q12_reasons?.length > 0 ? 1 : 0;
  const sub13Ids = [
    "q13_1_1",
    "q13_1_2",
    "q13_1_3",
    "q13_1_4",
    "q13_1_5",
    "q13_1_6",
  ];
  const sub13Done = requiredSub13
    ? sub13Ids.filter((id) => answers[id]).length
    : 0;
  const doneCount = mainDone + sub12Done + sub13Done;
  const totalCount =
    3 + (requiredSub12 ? 1 : 0) + (requiredSub13 ? sub13Ids.length : 0);

  const mainProgressCount =
    mainDone + (answers.q12 ? 1 : 0) + (answers.q13 ? 1 : 0);
  const progressPercentage = (mainProgressCount / 5) * 100;
  const currentStep = 1;

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
    // 기본 필수 문항들
    let requiredQuestions = ["q9", "q10", "q11", "q12", "q13"];
    let missing = [];

    // 9, 10, 11번 필수 체크
    ["q9", "q10", "q11"].forEach((q) => {
      if (
        !answers[q] ||
        (typeof answers[q] === "string" && answers[q].trim() === "")
      ) {
        missing.push(q);
      }
    });

    // q12 체크
    if (!answers.q12) missing.push("q12");

    // q13 체크
    if (!answers.q13) missing.push("q13");

    // q12가 1,2인 경우 q12_reasons 필요
    if (
      ["1", "2"].includes(answers.q12) &&
      (!answers.q12_reasons || answers.q12_reasons.length === 0)
    ) {
      missing.push("q12_reasons"); // 실제 ID가 없지만 에러 표시용
    }

    // q13이 4,5인 경우 서브 문항들 필요
    if (["4", "5"].includes(answers.q13)) {
      sub13Ids.forEach((id) => {
        if (!answers[id]) missing.push(id);
      });
    }

    if (missing.length > 0) {
      setMissingQuestions(missing);
      setError(true);
      scrollToFirstMissing(missing);
      return;
    }

    navigate("/section3", { state: { name: userName, answers } });
  };

  useEffect(() => {
    if (doneCount === totalCount) {
      setError(false);
      setMissingQuestions([]);
    }
  }, [doneCount, totalCount]);

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

        <Box sx={{ mb: 3 }}>
          <LinearProgress variant="determinate" value={progressPercentage} />
          <Typography
            variant="body2"
            align="right"
            sx={{ mt: 1, color: "text.secondary" }}
          >
            진행 상황: {mainProgressCount}/5
          </Typography>
        </Box>

        <Section2Component
          name={userName}
          answers={answers}
          setAnswers={setAnswers}
          setValidationError={setError}
          validationError={error}
          missingQuestions={missingQuestions}
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
          <Button variant="outlined" onClick={() => navigate("/section1")}>
            이전
          </Button>
          <Button variant="contained" onClick={handleNext}>
            다음
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Section2Page;
