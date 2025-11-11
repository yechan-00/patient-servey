// src/components/Section7Component.js
// Section7: 추가 섹션 (절주, 금연, 상담 희망 분야, 필요 정보) 질문

import React, { useEffect } from "react";
import {
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Typography,
  Checkbox,
  FormGroup,
  Divider,
} from "@mui/material";
import { saveUserAnswers } from "../utils/firebaseUtils";
import { useSurveyForm } from "../context/SurveyFormContext";

const Section7Component = ({ name, missingQuestions = [] }) => {
  const { answers, setAnswer, bulkSet } = useSurveyForm();

  // answers 변경 시마다 Firestore에 저장
  useEffect(() => {
    console.log(
      "[Section7Component] useEffect – name:",
      name,
      "answers:",
      answers
    );
    if (!name) {
      console.log("[Section7Component] useEffect aborted – no name provided");
      return;
    }
    saveUserAnswers(name, answers)
      .then(() =>
        console.log(`[Section7Component] Saved Section7 answers for ${name}`)
      )
      .catch((err) =>
        console.error("[Section7Component] Error saving Section7 answers:", err)
      );
  }, [answers, name]);

  const questions = [
    { id: "q32", label: "32. 암 발병 이후, 절주 하고 있다." },
    { id: "q33", label: "33. 암 발병 이후, 금연 하고 있다." },
  ];

  const options = [
    { value: "1", label: "전혀 그렇지 않다" },
    { value: "2", label: "약간 그렇지 않다" },
    { value: "3", label: "보통이다" },
    { value: "4", label: "약간 그렇다" },
    { value: "5", label: "매우 그렇다" },
  ];

  // 상담 희망 분야 옵션
  const counselingAreas = [
    "심리적 지원 및 상담",
    "사회복귀 및 직업 상담",
    "경제적 지원 및 복지서비스",
    "가족 관계 및 소통",
    "건강관리 및 영양상담",
    "의료진과의 소통",
    "재발 및 전이에 대한 불안",
    "일상생활 적응",
    "성생활 및 관계",
    "기타",
  ];

  // 필요한 건강관리 정보 옵션
  const healthInfoNeeds = [
    "영양 및 식단 관리",
    "운동 및 신체활동",
    "정기검진 및 추적관찰",
    "증상 관리 및 대처법",
    "약물 관리",
    "재발 예방법",
    "스트레스 관리",
    "수면 관리",
    "피로 관리",
    "통증 관리",
    "부작용 대처법",
    "기타",
  ];

  const handleChange = (e) => {
    const { name: questionId, value } = e.target;
    setAnswer(questionId, value);
  };

  const handleTextChange = (e) => {
    const { name: fieldName, value } = e.target;
    setAnswer(fieldName, value);
  };

  const handleCheckboxChange = (field, value) => (e) => {
    const currentValues = answers[field] || [];
    const newValues = e.target.checked
      ? [...currentValues, value]
      : currentValues.filter((v) => v !== value);
    bulkSet({ [field]: newValues });
  };

  return (
    <Box>
      {/* 기존 절주/금연 문항 */}
      {questions.map((q) => (
        <FormControl
          component="fieldset"
          key={q.id}
          sx={{
            mb: 2,
            ...(missingQuestions.includes(q.id) && {
              border: "2px solid #f44336",
              borderRadius: 1,
              p: 2,
              backgroundColor: "#ffebee",
            }),
          }}
          fullWidth
          id={q.id}
        >
          <FormLabel
            component="legend"
            sx={{
              fontWeight: "bold",
              color: missingQuestions.includes(q.id)
                ? "error.main"
                : "primary.main",
            }}
          >
            {q.label}
            {missingQuestions.includes(q.id) && (
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
              />
            ))}
          </RadioGroup>
        </FormControl>
      ))}

      {/* 구분선 */}
      <Divider sx={{ my: 4 }} />

      {/* 추가 질문 섹션 */}
      <Typography
        variant="h6"
        sx={{ fontWeight: "bold", mb: 2, color: "primary.main" }}
      >
        📋 추가 정보
      </Typography>

      {/* 상담 희망 분야 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
          34. 주로 상담 받고 싶은 분야는 무엇입니까? (해당하는 모든 항목 선택)
        </Typography>
        <FormGroup>
          {counselingAreas.map((area) => (
            <FormControlLabel
              key={area}
              control={
                <Checkbox
                  checked={(answers.counselingAreas || []).includes(area)}
                  onChange={handleCheckboxChange("counselingAreas", area)}
                />
              }
              label={area}
              sx={{ mb: 0.5 }}
            />
          ))}
        </FormGroup>

        {/* 기타 선택 시 주관식 입력 */}
        {(answers.counselingAreas || []).includes("기타") && (
          <TextField
            name="counselingAreasOther"
            label="기타 상담 희망 분야"
            placeholder="구체적으로 입력해 주세요"
            fullWidth
            multiline
            rows={2}
            value={answers.counselingAreasOther || ""}
            onChange={handleTextChange}
            sx={{ mt: 2 }}
          />
        )}

        {/* 자유 의견 */}
        <TextField
          name="counselingAreasText"
          label="상담 희망 분야에 대한 추가 의견 (선택사항)"
          placeholder="상담을 통해 해결하고 싶은 구체적인 문제나 고민이 있으시면 자유롭게 작성해 주세요"
          fullWidth
          multiline
          rows={3}
          value={answers.counselingAreasText || ""}
          onChange={handleTextChange}
          sx={{ mt: 2 }}
        />
      </Box>

      {/* 필요한 건강관리 정보 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
          35. 건강관리를 위해 추가적으로 필요하다고 생각하는 정보는 무엇입니까?
          (해당하는 모든 항목 선택)
        </Typography>
        <FormGroup>
          {healthInfoNeeds.map((info) => (
            <FormControlLabel
              key={info}
              control={
                <Checkbox
                  checked={(answers.healthInfoNeeds || []).includes(info)}
                  onChange={handleCheckboxChange("healthInfoNeeds", info)}
                />
              }
              label={info}
              sx={{ mb: 0.5 }}
            />
          ))}
        </FormGroup>

        {/* 기타 선택 시 주관식 입력 */}
        {(answers.healthInfoNeeds || []).includes("기타") && (
          <TextField
            name="healthInfoNeedsOther"
            label="기타 필요한 건강관리 정보"
            placeholder="구체적으로 입력해 주세요"
            fullWidth
            multiline
            rows={2}
            value={answers.healthInfoNeedsOther || ""}
            onChange={handleTextChange}
            sx={{ mt: 2 }}
          />
        )}

        {/* 자유 의견 */}
        <TextField
          name="healthInfoNeedsText"
          label="건강관리 정보에 대한 추가 의견 (선택사항)"
          placeholder="건강관리를 위해 더 알고 싶은 정보나 궁금한 점이 있으시면 자유롭게 작성해 주세요"
          fullWidth
          multiline
          rows={3}
          value={answers.healthInfoNeedsText || ""}
          onChange={handleTextChange}
          sx={{ mt: 2 }}
        />
      </Box>

      {/* 전체적인 의견 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
          36. 기타 의견 (선택사항)
        </Typography>
        <TextField
          name="generalComments"
          label="전체적인 의견이나 건의사항"
          placeholder="설문조사에 대한 의견이나 암 생존자 지원 서비스에 대한 건의사항이 있으시면 자유롭게 작성해 주세요"
          fullWidth
          multiline
          rows={4}
          value={answers.generalComments || ""}
          onChange={handleTextChange}
        />
      </Box>
    </Box>
  );
};

export default Section7Component;
