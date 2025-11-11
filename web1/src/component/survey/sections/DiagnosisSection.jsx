// web1/src/component/survey/sections/DiagnosisSection.jsx
import React, { useMemo, useState, useCallback } from "react";
import { Grid, TextField, MenuItem, RadioGroup, FormControlLabel, Radio, FormLabel, FormControl } from "@mui/material";
import SectionTitle from "../parts/SectionTitle";
import NavButtons from "../parts/NavButtons";
import { useSurveyForm } from "../../../context/SurveyFormContext";
import { isValidYMD, isNotFuture, compareYmd } from "../utils/validationRules"; // isValidYMD, isNotFuture, compareYmd( a,b ) -> -1/0/1
import { scrollToField } from "../utils/scrollFocus"; // 선택: 첫 에러 위치로 스크롤

/**
 * 진단/치료 섹션
 * - cancerType / cancerStage / diagnosisDate
 * - hasSurgery / surgeryDate
 * - hasRecurrence
 * - otherCancerDiagnosis / otherCancerType / otherCancerDetails
 */
const DiagnosisSection = ({ onPrev, onNext }) => {
  const { answers, setAnswer } = useSurveyForm();

  // 로컬 에러 상태
  const [errors, setErrors] = useState({});

  // 값 꺼내기(초기값 포함)
  const v = useMemo(
    () => ({
      cancerType: answers.cancerType || "",
      otherCancerType: answers.otherCancerType || "",
      cancerStage: answers.cancerStage || "",
      diagnosisDate: answers.diagnosisDate || "",
      hasSurgery: answers.hasSurgery || "", // "예" | "아니오"
      surgeryDate: answers.surgeryDate || "",
      hasRecurrence: answers.hasRecurrence || "", // "예" | "아니오"
      otherCancerDiagnosis: answers.otherCancerDiagnosis || "", // "예" | "아니오"
      otherCancerDetails: answers.otherCancerDetails || "",
    }),
    [answers]
  );

  const set = useCallback((name, value) => {
    setAnswer(name, value);
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }, [setAnswer]);

  // 유효성 검사
  const validate = useCallback(() => {
    const e = {};

    // 필수값
    if (!v.cancerType) e.cancerType = "암 종류를 선택해주세요.";
    if (!v.cancerStage) e.cancerStage = "암 병기를 선택해주세요.";
    if (!v.diagnosisDate) e.diagnosisDate = "진단일을 입력해주세요.";

    // 날짜 형식/미래일 금지
    if (v.diagnosisDate) {
      if (!isValidYMD(v.diagnosisDate)) {
        e.diagnosisDate = "YYYY-MM-DD 형식이어야 합니다.";
      } else if (!isNotFuture(v.diagnosisDate)) {
        e.diagnosisDate = "미래 날짜는 입력할 수 없습니다.";
      }
    }

    // 수술 관련
    if (!v.hasSurgery) e.hasSurgery = "수술 여부를 선택해주세요.";
    if (v.hasSurgery === "예") {
      if (!v.surgeryDate) {
        e.surgeryDate = "수술일을 입력해주세요.";
      } else {
        if (!isValidYMD(v.surgeryDate)) {
          e.surgeryDate = "YYYY-MM-DD 형식이어야 합니다.";
        } else if (!isNotFuture(v.surgeryDate)) {
          e.surgeryDate = "미래 날짜는 입력할 수 없습니다.";
        }
        // 진단일보다 빠를 수 없음
        if (!e.surgeryDate && isValidYMD(v.diagnosisDate) && isValidYMD(v.surgeryDate)) {
          const cmp = compareYmd(v.surgeryDate, v.diagnosisDate); // surgery vs diagnosis
          if (cmp < 0) e.surgeryDate = "발병(진단) 시기보다 수술 날짜가 빠릅니다.";
        }
      }
    }

    if (!v.hasRecurrence) e.hasRecurrence = "재발 여부를 선택해주세요.";

    // 다른 암
    if (!v.otherCancerDiagnosis) e.otherCancerDiagnosis = "다른 암 진단 여부를 선택해주세요.";
    if (v.otherCancerDiagnosis === "예") {
      if (!v.otherCancerType) e.otherCancerType = "다른 암 종류를 입력해주세요.";
      // details는 선택 입력
    }

    setErrors(e);
    if (Object.keys(e).length) {
      // 첫 에러로 스크롤
      const firstKey = Object.keys(e)[0];
      scrollToField(firstKey);
      return false;
    }
    return true;
  }, [v, setErrors]);

  const handleNext = useCallback(() => {
    if (validate()) onNext?.();
  }, [validate, onNext]);

  // 옵션
  const cancerTypes = [
    "유방암",
    "폐암",
    "대장암",
    "위암",
    "간암",
    "갑상선암",
    "췌장암",
    "전립선암",
    "기타",
  ];
  const stages = ["I", "II", "III", "IV", "모름"];

  return (
    <>
      <SectionTitle
        title="진단 및 치료 정보"
        subtitle="가능한 정확한 날짜와 병기 정보를 입력해주세요."
        step={2}
        total={7}
        required
      />

      <Grid container spacing={2}>
        {/* 암 종류 */}
        <Grid item xs={12} md={6}>
          <TextField
            id="cancerType"
            label="암 종류"
            select
            fullWidth
            value={v.cancerType}
            onChange={(e) => set("cancerType", e.target.value)}
            error={!!errors.cancerType}
            helperText={errors.cancerType}
          >
            {cancerTypes.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* 암 종류: 기타 */}
        {v.cancerType === "기타" && (
          <Grid item xs={12} md={6}>
            <TextField
              id="otherCancerType"
              label="기타 암 종류"
              fullWidth
              value={v.otherCancerType}
              onChange={(e) => set("otherCancerType", e.target.value)}
              error={!!errors.otherCancerType}
              helperText={errors.otherCancerType}
            />
          </Grid>
        )}

        {/* 암 병기 */}
        <Grid item xs={12} md={6}>
          <TextField
            id="cancerStage"
            label="암 병기"
            select
            fullWidth
            value={v.cancerStage}
            onChange={(e) => set("cancerStage", e.target.value)}
            error={!!errors.cancerStage}
            helperText={errors.cancerStage}
          >
            {stages.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* 진단일 */}
        <Grid item xs={12} md={6}>
          <TextField
            id="diagnosisDate"
            label="진단일 (YYYY-MM-DD)"
            placeholder="예) 2023-08-15"
            fullWidth
            value={v.diagnosisDate}
            onChange={(e) => set("diagnosisDate", e.target.value)}
            onBlur={() => {
              // 즉시 간단 검증
              if (!v.diagnosisDate) return;
              if (!isValidYMD(v.diagnosisDate)) {
                setErrors((prev) => ({ ...prev, diagnosisDate: "YYYY-MM-DD 형식이어야 합니다." }));
              } else if (!isNotFuture(v.diagnosisDate)) {
                setErrors((prev) => ({ ...prev, diagnosisDate: "미래 날짜는 입력할 수 없습니다." }));
              }
            }}
            error={!!errors.diagnosisDate}
            helperText={errors.diagnosisDate}
          />
        </Grid>

        {/* 수술 여부 */}
        <Grid item xs={12} md={6}>
          <FormControl component="fieldset" error={!!errors.hasSurgery}>
            <FormLabel component="legend">수술 여부</FormLabel>
            <RadioGroup
              row
              name="hasSurgery"
              value={v.hasSurgery}
              onChange={(e) => set("hasSurgery", e.target.value)}
            >
              <FormControlLabel value="예" control={<Radio />} label="예" />
              <FormControlLabel value="아니오" control={<Radio />} label="아니오" />
            </RadioGroup>
          </FormControl>
          {errors.hasSurgery && (
            <div style={{ color: "#d32f2f", fontSize: 12, marginTop: 4 }}>{errors.hasSurgery}</div>
          )}
        </Grid>

        {/* 수술일 */}
        {v.hasSurgery === "예" && (
          <Grid item xs={12} md={6}>
            <TextField
              id="surgeryDate"
              label="수술일 (YYYY-MM-DD)"
              placeholder="예) 2023-09-01"
              fullWidth
              value={v.surgeryDate}
              onChange={(e) => set("surgeryDate", e.target.value)}
              onBlur={() => {
                if (!v.surgeryDate) return;
                if (!isValidYMD(v.surgeryDate)) {
                  setErrors((prev) => ({ ...prev, surgeryDate: "YYYY-MM-DD 형식이어야 합니다." }));
                  return;
                }
                if (!isNotFuture(v.surgeryDate)) {
                  setErrors((prev) => ({ ...prev, surgeryDate: "미래 날짜는 입력할 수 없습니다." }));
                  return;
                }
                if (isValidYMD(v.diagnosisDate)) {
                  const cmp = compareYmd(v.surgeryDate, v.diagnosisDate);
                  if (cmp < 0) {
                    setErrors((prev) => ({ ...prev, surgeryDate: "발병(진단) 시기보다 수술 날짜가 빠릅니다." }));
                  }
                }
              }}
              error={!!errors.surgeryDate}
              helperText={errors.surgeryDate}
            />
          </Grid>
        )}

        {/* 재발 여부 */}
        <Grid item xs={12} md={6}>
          <FormControl component="fieldset" error={!!errors.hasRecurrence}>
            <FormLabel component="legend">재발 여부</FormLabel>
            <RadioGroup
              row
              name="hasRecurrence"
              value={v.hasRecurrence}
              onChange={(e) => set("hasRecurrence", e.target.value)}
            >
              <FormControlLabel value="예" control={<Radio />} label="예" />
              <FormControlLabel value="아니오" control={<Radio />} label="아니오" />
            </RadioGroup>
          </FormControl>
          {errors.hasRecurrence && (
            <div style={{ color: "#d32f2f", fontSize: 12, marginTop: 4 }}>{errors.hasRecurrence}</div>
          )}
        </Grid>

        {/* 다른 암 진단 여부 */}
        <Grid item xs={12} md={6}>
          <FormControl component="fieldset" error={!!errors.otherCancerDiagnosis}>
            <FormLabel component="legend">다른 암 진단 여부</FormLabel>
            <RadioGroup
              row
              name="otherCancerDiagnosis"
              value={v.otherCancerDiagnosis}
              onChange={(e) => set("otherCancerDiagnosis", e.target.value)}
            >
              <FormControlLabel value="예" control={<Radio />} label="예" />
              <FormControlLabel value="아니오" control={<Radio />} label="아니오" />
            </RadioGroup>
          </FormControl>
          {errors.otherCancerDiagnosis && (
            <div style={{ color: "#d32f2f", fontSize: 12, marginTop: 4 }}>{errors.otherCancerDiagnosis}</div>
          )}
        </Grid>

        {/* 다른 암 상세 */}
        {v.otherCancerDiagnosis === "예" && (
          <>
            <Grid item xs={12} md={6}>
              <TextField
                id="otherCancerType"
                label="다른 암 종류"
                fullWidth
                value={v.otherCancerType}
                onChange={(e) => set("otherCancerType", e.target.value)}
                error={!!errors.otherCancerType}
                helperText={errors.otherCancerType}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="otherCancerDetails"
                label="다른 암 상세 정보(선택)"
                fullWidth
                multiline
                minRows={2}
                value={v.otherCancerDetails}
                onChange={(e) => set("otherCancerDetails", e.target.value)}
              />
            </Grid>
          </>
        )}
      </Grid>

      <NavButtons onPrev={onPrev} onNext={handleNext} />
    </>
  );
};

export default DiagnosisSection;