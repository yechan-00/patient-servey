// src/pages/Section3Page.js
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import Section3Component from "../component/Section3Component";
import { saveUserAnswers } from "../utils/firebaseUtils";
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

const Section3Page = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { answers: contextAnswers, bulkSet } = useSurveyForm();
  const userName = state?.name || localStorage.getItem("userName") || "";

  // Context에서 답변을 가져오되, 없으면 빈 객체로 시작
  // location.state의 답변도 병합 (이전 섹션에서 온 경우)
  const [localAnswers, setLocalAnswers] = useState(() => {
    const merged = { ...contextAnswers, ...(state?.answers || {}) };
    // q15_reasons가 없으면 빈 배열로 초기화
    if (!merged.q15_reasons) merged.q15_reasons = [];
    return merged;
  });
  const [error, setError] = useState(false);
  const [missingQuestions, setMissingQuestions] = useState([]);

  // localAnswers가 변경될 때마다 Context에 저장
  useEffect(() => {
    bulkSet(localAnswers);
  }, [localAnswers, bulkSet]);

  // Q14~Q17 진행
  const requiredIds = ["q14", "q15", "q16", "q17"];
  const doneCount = requiredIds.filter((id) => localAnswers[id]).length;
  const total = requiredIds.length;
  const progress = (doneCount / total) * 100;
  const currentStep = 2;

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

  // Q15-1 조건
  const needsReasons = localAnswers.q15 === "1" || localAnswers.q15 === "2";
  const ready = needsReasons
    ? doneCount === total && localAnswers.q15_reasons.length > 0
    : doneCount === total;

  const handleNext = async () => {
    const missing = requiredIds.filter((id) => !localAnswers[id]);

    if (missing.length > 0) {
      setMissingQuestions(missing);
      setError(true);
      scrollToFirstMissing(missing);
      return;
    }

    // Q15-1 조건 체크
    if (
      needsReasons &&
      (!localAnswers.q15_reasons || localAnswers.q15_reasons.length === 0)
    ) {
      setError(true);
      // 여기서는 q15로 스크롤
      scrollToFirstMissing(["q15"]);
      return;
    }

    // Context에 최종 저장
    bulkSet(localAnswers);

    try {
      await saveUserAnswers(userName, localAnswers); // 답변 저장
      navigate("/section4", {
        state: { name: userName, answers: localAnswers },
      });
    } catch (e) {
      alert("답변 저장에 실패했습니다.");
    }
  };

  useEffect(() => {
    if (ready) {
      setError(false);
      setMissingQuestions([]);
    }
  }, [ready]);

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
            진행 상황: {doneCount}/{total}
          </Typography>
        </Box>

        <Section3Component
          name={userName}
          answers={localAnswers}
          setAnswers={setLocalAnswers}
          missingQuestions={missingQuestions}
        />

        {/* error가 true일 때만 Alert 보이기 */}
        {error && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <AlertTitle>미응답 문항이 있습니다</AlertTitle>
            모든 문항을 응답해야 다음으로 넘어갈 수 있습니다. 빨간색으로 표시된
            문항을 확인해 주세요.
            {missingQuestions.length > 0 && (
              <Box sx={{ mt: 1 }}>
                미응답 문항:{" "}
                {missingQuestions
                  .map((q) => q.replace("q", "") + "번")
                  .join(", ")}
              </Box>
            )}
            {needsReasons &&
              (!localAnswers.q15_reasons ||
                localAnswers.q15_reasons.length === 0) && (
                <Box sx={{ mt: 1, color: "warning.main" }}>
                  15번에서 1번 또는 2번을 선택하신 경우, 15-1번 이유를 하나 이상
                  선택해주세요.
                </Box>
              )}
          </Alert>
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <Button variant="outlined" onClick={() => navigate("/section2")}>
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

export default Section3Page;
