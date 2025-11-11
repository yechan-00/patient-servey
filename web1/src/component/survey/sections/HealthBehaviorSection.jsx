// web1/src/component/survey/sections/HealthBehaviorSection.jsx
import React, { useMemo, useState, useCallback } from "react";
import {
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
} from "@mui/material";
import SectionTitle from "../parts/SectionTitle";
import NavButtons from "../parts/NavButtons";
import { useSurveyForm } from "../../../context/SurveyFormContext";
import { scrollToField } from "../utils/scrollFocus";

/**
 * 건강행동 섹션
 * - 식이조절 세부(q13_1_1 ~ q13_1_6): 1~5 리커트
 * - 절주(q32): 1~5 리커트 (필수)
 * - 금연(q33): 1~5 리커트 (필수)
 *
 * ✔ 키 이름은 기존 저장 스키마와 동일하게 사용합니다.
 */
const HealthBehaviorSection = ({ onPrev, onNext }) => {
  const { answers, setAnswer } = useSurveyForm();
  const [errors, setErrors] = useState({});

  const v = useMemo(
    () => ({
      // 식이조절 세부
      q13_1_1: answers.q13_1_1 || "",
      q13_1_2: answers.q13_1_2 || "",
      q13_1_3: answers.q13_1_3 || "",
      q13_1_4: answers.q13_1_4 || "",
      q13_1_5: answers.q13_1_5 || "",
      q13_1_6: answers.q13_1_6 || "",
      // 절주/금연
      q32: answers.q32 || "",
      q33: answers.q33 || "",
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

  // 필수 검증: q32, q33
  const validate = useCallback(() => {
    const e = {};
    if (!v.q32) e.q32 = "절주 관련 항목을 선택해주세요.";
    if (!v.q33) e.q33 = "금연 관련 항목을 선택해주세요.";
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

  const likert = [
    { value: "1", label: "1 전혀 그렇지 않다" },
    { value: "2", label: "2 그렇지 않다" },
    { value: "3", label: "3 보통이다" },
    { value: "4", label: "4 그렇다" },
    { value: "5", label: "5 매우 그렇다" },
  ];

  return (
    <>
      <SectionTitle
        title="건강 행동"
        subtitle="최근 건강 행동에 대해 해당하는 정도를 선택해주세요."
        step={3}
        total={7}
        required
      />

      <Grid container spacing={3}>
        {/* --- 식이조절 세부 (선택 항목, 스키마 키 유지) --- */}
        <Grid item xs={12}>
          <FormLabel component="legend">식이 조절 관련</FormLabel>
        </Grid>

        <Grid item xs={12}>
          <FormControl component="fieldset" fullWidth>
            <FormLabel id="q13_1_1-label">조미료 섭취를 줄인다. (q13_1_1)</FormLabel>
            <RadioGroup
              id="q13_1_1"
              row
              value={v.q13_1_1}
              onChange={(e) => set("q13_1_1", e.target.value)}
              aria-labelledby="q13_1_1-label"
            >
              {likert.map((o) => (
                <FormControlLabel key={o.value} value={o.value} control={<Radio />} label={o.label} />
              ))}
            </RadioGroup>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl component="fieldset" fullWidth>
            <FormLabel id="q13_1_2-label">식품의 신선도를 중요시한다. (q13_1_2)</FormLabel>
            <RadioGroup
              id="q13_1_2"
              row
              value={v.q13_1_2}
              onChange={(e) => set("q13_1_2", e.target.value)}
              aria-labelledby="q13_1_2-label"
            >
              {likert.map((o) => (
                <FormControlLabel key={o.value} value={o.value} control={<Radio />} label={o.label} />
              ))}
            </RadioGroup>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl component="fieldset" fullWidth>
            <FormLabel id="q13_1_3-label">채식 및 과일 위주의 식습관을 한다. (q13_1_3)</FormLabel>
            <RadioGroup
              id="q13_1_3"
              row
              value={v.q13_1_3}
              onChange={(e) => set("q13_1_3", e.target.value)}
              aria-labelledby="q13_1_3-label"
            >
              {likert.map((o) => (
                <FormControlLabel key={o.value} value={o.value} control={<Radio />} label={o.label} />
              ))}
            </RadioGroup>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl component="fieldset" fullWidth>
            <FormLabel id="q13_1_4-label">육류 섭취를 조절한다. (q13_1_4)</FormLabel>
            <RadioGroup
              id="q13_1_4"
              row
              value={v.q13_1_4}
              onChange={(e) => set("q13_1_4", e.target.value)}
              aria-labelledby="q13_1_4-label"
            >
              {likert.map((o) => (
                <FormControlLabel key={o.value} value={o.value} control={<Radio />} label={o.label} />
              ))}
            </RadioGroup>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl component="fieldset" fullWidth>
            <FormLabel id="q13_1_5-label">탄수화물 섭취를 조절한다. (q13_1_5)</FormLabel>
            <RadioGroup
              id="q13_1_5"
              row
              value={v.q13_1_5}
              onChange={(e) => set("q13_1_5", e.target.value)}
              aria-labelledby="q13_1_5-label"
            >
              {likert.map((o) => (
                <FormControlLabel key={o.value} value={o.value} control={<Radio />} label={o.label} />
              ))}
            </RadioGroup>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl component="fieldset" fullWidth>
            <FormLabel id="q13_1_6-label">
              항암식품(예: 버섯, 도라지, 두유, 현미식 등)을 먹는다. (q13_1_6)
            </FormLabel>
            <RadioGroup
              id="q13_1_6"
              row
              value={v.q13_1_6}
              onChange={(e) => set("q13_1_6", e.target.value)}
              aria-labelledby="q13_1_6-label"
            >
              {likert.map((o) => (
                <FormControlLabel key={o.value} value={o.value} control={<Radio />} label={o.label} />
              ))}
            </RadioGroup>
          </FormControl>
        </Grid>

        {/* --- 절주/금연 (필수, q32/q33 → 숫자 1~5 저장) --- */}
        <Grid item xs={12} mt={2}>
          <FormLabel component="legend">생활 습관</FormLabel>
        </Grid>

        <Grid item xs={12}>
          <FormControl component="fieldset" error={!!errors.q32}>
            <FormLabel id="q32-label">절주 관련 행동 (q32)</FormLabel>
            <RadioGroup
              id="q32"
              row
              value={v.q32}
              onChange={(e) => set("q32", e.target.value)}
              aria-labelledby="q32-label"
            >
              {likert.map((o) => (
                <FormControlLabel key={o.value} value={o.value} control={<Radio />} label={o.label} />
              ))}
            </RadioGroup>
          </FormControl>
          {errors.q32 && (
            <div style={{ color: "#d32f2f", fontSize: 12, marginTop: 4 }}>{errors.q32}</div>
          )}
        </Grid>

        <Grid item xs={12}>
          <FormControl component="fieldset" error={!!errors.q33}>
            <FormLabel id="q33-label">금연 관련 행동 (q33)</FormLabel>
            <RadioGroup
              id="q33"
              row
              value={v.q33}
              onChange={(e) => set("q33", e.target.value)}
              aria-labelledby="q33-label"
            >
              {likert.map((o) => (
                <FormControlLabel key={o.value} value={o.value} control={<Radio />} label={o.label} />
              ))}
            </RadioGroup>
          </FormControl>
          {errors.q33 && (
            <div style={{ color: "#d32f2f", fontSize: 12, marginTop: 4 }}>{errors.q33}</div>
          )}
        </Grid>
      </Grid>

      <NavButtons onPrev={onPrev} onNext={handleNext} />
    </>
  );
};

export default HealthBehaviorSection;