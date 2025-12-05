// src/component/Section1Component.js
import React, { useEffect } from "react";
import {
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";

const Section1Component = ({
  patientId,
  answers,
  setAnswers,
  missingQuestions = [],
}) => {
  console.log(
    "Section1Component render – patientId:",
    patientId,
    "answers:",
    answers
  );

  const handleChange = (e) => {
    const { name: questionId, value } = e.target;
    console.log("handleChange – questionId:", questionId, "value:", value);
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const questions = [
    { id: "q1", category: "재정", label: "비용 때문에 의사의 진료를 받기 어려운가요?" },
    { id: "q2", category: "사회적 고립", label: "종종 가까이 지내는 사람이 없다고 느끼나요?" },
    { id: "q3", category: "정신 건강", label: "질병으로 인한 심리적 문제(스트레스,우울,불안)로 일상생활에 어려움이 있나요?" },
    { id: "q4", category: "주거", label: "앞으로 안정적으로 살 곳이 없을까 걱정하고 있나요?" },
    { id: "q5", category: "음식", label: "지난 3개월 동안, 음식 살 돈이 모자라 먹어야 하는 양보다 적게 먹은 적이 있나요?" },
    { id: "q6", category: "교통", label: "지난 3개월 동안, 병원에 갈 방법이 없어서 진료를 받지 못한 적이 있나요?" },
    { id: "q7", category: "공과금", label: "청구된 비용을 지급하지 않아서 전기, 가스, 수도, 전화 이용이 어려운 적이 있나요?" },
    { id: "q8", category: "정보이해", label: "병원 자료를 읽고 이해하는데 어려움이 있나요?" },
    { id: "q9", category: "폭력", label: "당신의 가정, 이웃으로부터 신체적/언어적 폭력을 경험한 적이 있나요?" },
    { id: "q10", category: "고용", label: "일자리를 찾거나 일을 유지하는데 도움이 필요한가요?" },
    { id: "q11", category: "사회적 지원", label: "질병 치료와 관리를 도와줄 가족이나 주변 사람이 없나요?" },
    { id: "q12", category: "돌봄 책임", label: "가족 중 나의 돌봄이 필요한 아동청소년, 환자, 노인, 장애를 가진 사람이 있나요?" },
  ];

  const options = [
    { value: "예", label: "예" },
    { value: "아니오", label: "아니오" },
  ];

  return (
    <Box
      sx={{
        backgroundColor: "background.paper",
        p: 3,
        borderRadius: 2,
        boxShadow: 1,
      }}
    >
      {questions.map((q) => {
        const isMissing = missingQuestions.includes(q.id);
        return (
          <FormControl
            component="fieldset"
            key={q.id}
            fullWidth
            sx={{
              mb: 3,
              ...(isMissing && {
                border: "2px solid #f44336",
                borderRadius: 1,
                p: 2,
                backgroundColor: "#ffebee",
              }),
            }}
            id={q.id} // 스크롤 이동을 위한 ID 추가
          >
            <FormLabel
              component="legend"
              sx={{
                fontWeight: "bold",
                color: isMissing ? "error.main" : "primary.main",
                mb: 1,
              }}
            >
              {q.label}
              {isMissing && (
                <Box
                  component="span"
                  sx={{ color: "error.main", fontWeight: "bold", ml: 1 }}
                >
                  ※ 필수 응답
                </Box>
              )}
            </FormLabel>
            <RadioGroup
              name={q.id}
              value={answers[q.id] || ""}
              onChange={handleChange}
            >
              {options.map((opt) => (
                <FormControlLabel
                  key={opt.value}
                  value={opt.value}
                  control={<Radio color="primary" />}
                  label={opt.label}
                  sx={{ my: 0.5 }}
                  componentsProps={{
                    typography: {
                      sx: {
                        color: "text.secondary",
                      },
                    },
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );
      })}
    </Box>
  );
};

export default Section1Component;
