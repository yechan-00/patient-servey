// web1/src/component/survey/sections/MentalHealthSection.jsx
import React, { useMemo, useState, useCallback } from "react";
import {
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  TextField,
  Typography,
} from "@mui/material";
import SectionTitle from "../parts/SectionTitle";
import NavButtons from "../parts/NavButtons";
import { useSurveyForm } from "../../../context/SurveyFormContext";
import { scrollToField } from "../utils/scrollFocus";

/**
 * 정신건강 섹션
 * 스키마 키(기존 저장 키와 100% 일치):
 *  - mentalHealthHistory           : "예" | "아니오"
 *  - mentalHealthDiagnoses         : { depression?: boolean, anxietyDisorder?: boolean, schizophrenia?: boolean, other?: boolean }
 *  - mentalHealthDiagnosesText     : string (선택. 위 체크박스 요약 또는 자유기입)
 *  - otherMentalDiagnosis          : string (선택)
 *  - mentalHealthImpact            : string (선택)
 *  - otherTreatmentType            : string (선택)
 */
const MentalHealthSection = ({ onPrev, onNext }) => {
  const { answers, setAnswer } = useSurveyForm();
  const [errors, setErrors] = useState({});

  // 현재 값 메모이즈
  const v = useMemo(
    () => ({
      mentalHealthHistory: answers.mentalHealthHistory || "",
      mentalHealthDiagnoses:
        (answers.mentalHealthDiagnoses && typeof answers.mentalHealthDiagnoses === "object"
          ? answers.mentalHealthDiagnoses
          : {}) || {},
      mentalHealthDiagnosesText: answers.mentalHealthDiagnosesText || "",
      otherMentalDiagnosis: answers.otherMentalDiagnosis || "",
      mentalHealthImpact: answers.mentalHealthImpact || "",
      otherTreatmentType: answers.otherTreatmentType || "",
    }),
    [answers]
  );

  const set = useCallback(
    (name, value) => {
      setAnswer(name, value);
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    },
    [setAnswer]
  );

  const toggleDiagnosis = useCallback(
    (key) => {
      const cur = v.mentalHealthDiagnoses || {};
      const next = { ...cur, [key]: !cur[key] };
      set("mentalHealthDiagnoses", next);
      // 진단 체크가 바뀌면 텍스트 요약이 비어있다면 자동으로 간단요약을 채워줌(사용자가 수정 가능)
      if (!answers.mentalHealthDiagnosesText) {
        const labelMap = {
          depression: "우울증",
          anxietyDisorder: "불안장애",
          schizophrenia: "조현병",
          other: "기타",
        };
        const picked = Object.entries(next)
          .filter(([, val]) => !!val)
          .map(([k]) => labelMap[k])
          .filter(Boolean);
        set("mentalHealthDiagnosesText", picked.length ? picked.join(", ") : "");
      }
    },
    [v.mentalHealthDiagnoses, set, answers.mentalHealthDiagnosesText]
  );

  // 필수: mentalHealthHistory
  const validate = useCallback(() => {
    const e = {};
    if (!v.mentalHealthHistory) e.mentalHealthHistory = "정신 건강력 여부를 선택해주세요.";
    setErrors(e);
    if (Object.keys(e).length) {
      const firstKey = Object.keys(e)[0];
      scrollToField(firstKey);
      return false;
    }
    return true;
  }, [v]);

  const handleNext = useCallback(() => {
    if (validate()) onNext?.();
  }, [validate, onNext]);

  return (
    <>
      <SectionTitle
        title="정신건강"
        subtitle="정신건강 관련 과거력과 현재 상태에 대해 알려주세요."
        step={6}
        total={7}
        required
      />

      <Grid container spacing={3}>
        {/* 정신건강력 여부 */}
        <Grid item xs={12}>
          <FormControl component="fieldset" error={!!errors.mentalHealthHistory}>
            <FormLabel id="mentalHealthHistory-label">정신 건강력</FormLabel>
            <RadioGroup
              id="mentalHealthHistory"
              row
              value={v.mentalHealthHistory}
              onChange={(e) => set("mentalHealthHistory", e.target.value)}
              aria-labelledby="mentalHealthHistory-label"
            >
              <FormControlLabel value="예" control={<Radio />} label="예" />
              <FormControlLabel value="아니오" control={<Radio />} label="아니오" />
            </RadioGroup>
          </FormControl>
          {errors.mentalHealthHistory && (
            <div style={{ color: "#d32f2f", fontSize: 12, marginTop: 4 }}>{errors.mentalHealthHistory}</div>
          )}
        </Grid>

        {/* 진단명 체크박스 */}
        <Grid item xs={12}>
          <FormLabel component="legend">정신건강 진단명(해당하는 항목을 체크)</FormLabel>
          <Grid container spacing={1} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm="auto">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!v.mentalHealthDiagnoses.depression}
                    onChange={() => toggleDiagnosis("depression")}
                  />
                }
                label="우울증"
              />
            </Grid>
            <Grid item xs={12} sm="auto">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!v.mentalHealthDiagnoses.anxietyDisorder}
                    onChange={() => toggleDiagnosis("anxietyDisorder")}
                  />
                }
                label="불안장애"
              />
            </Grid>
            <Grid item xs={12} sm="auto">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!v.mentalHealthDiagnoses.schizophrenia}
                    onChange={() => toggleDiagnosis("schizophrenia")}
                  />
                }
                label="조현병"
              />
            </Grid>
            <Grid item xs={12} sm="auto">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!v.mentalHealthDiagnoses.other}
                    onChange={() => toggleDiagnosis("other")}
                  />
                }
                label="기타"
              />
            </Grid>
          </Grid>
        </Grid>

        {/* 진단명 텍스트 요약 */}
        <Grid item xs={12}>
          <TextField
            id="mentalHealthDiagnosesText"
            label="정신건강 진단명(자유기입 또는 요약)"
            fullWidth
            value={v.mentalHealthDiagnosesText}
            onChange={(e) => set("mentalHealthDiagnosesText", e.target.value)}
            placeholder="예: 우울증, 불안장애"
            multiline
            minRows={1}
          />
        </Grid>

        {/* 기타 정신건강 진단 */}
        <Grid item xs={12}>
          <TextField
            id="otherMentalDiagnosis"
            label="기타 정신건강 진단(선택)"
            fullWidth
            value={v.otherMentalDiagnosis}
            onChange={(e) => set("otherMentalDiagnosis", e.target.value)}
            placeholder="기타 진단명을 자유롭게 입력하세요."
          />
        </Grid>

        {/* 정신건강 영향 */}
        <Grid item xs={12}>
          <TextField
            id="mentalHealthImpact"
            label="정신건강 관련 현재 영향(선택)"
            fullWidth
            value={v.mentalHealthImpact}
            onChange={(e) => set("mentalHealthImpact", e.target.value)}
            placeholder="예: 불면, 집중력 저하 등"
            multiline
            minRows={2}
          />
        </Grid>

        {/* 기타 치료법 */}
        <Grid item xs={12}>
          <TextField
            id="otherTreatmentType"
            label="기타 치료법(선택)"
            fullWidth
            value={v.otherTreatmentType}
            onChange={(e) => set("otherTreatmentType", e.target.value)}
            placeholder="예: 명상, 운동, 상담 등"
          />
        </Grid>
      </Grid>

      <NavButtons onPrev={onPrev} onNext={handleNext} />
    </>
  );
};

export default MentalHealthSection;