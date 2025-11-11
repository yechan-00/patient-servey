// web1/src/component/survey/sections/TreatmentSection.jsx
import React, { useCallback, useMemo, useState } from "react";
import { Grid, TextField, MenuItem, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from "@mui/material";
import SectionTitle from "../SectionTitle";
import NavButtons from "../NavButtons";
import { useSurveyForm } from "../../../context/SurveyFormContext";
import { focusFirstInvalid } from "../../utils/scrollFocus";
import { isValidYMD, isPastOrToday } from "../../utils/validators";

/**
 * TreatmentSection
 * - 수술 여부(hasSurgery), 수술일(surgeryDate, YYYYMMDD), 기타 치료(otherTreatmentType)
 * - 진단일(diagnosisDate)가 이전 섹션에서 입력되었다면,
 *   수술일 < 진단일인 경우 경고/검증
 */
export default function TreatmentSection() {
  const { answers, setAnswer } = useSurveyForm();
  const [errors, setErrors] = useState({});

  const yesNoOptions = useMemo(
    () => [
      { value: "예", label: "예" },
      { value: "아니오", label: "아니오" },
    ],
    []
  );

  const onSurgeryDateChange = useCallback(
    (raw) => {
      const onlyDigits = String(raw || "").replace(/\D/g, "").slice(0, 8);
      setAnswer("surgeryDate", onlyDigits);
      if (errors.surgeryDate) {
        setErrors((prev) => ({ ...prev, surgeryDate: undefined }));
      }
    },
    [setAnswer, errors.surgeryDate]
  );

  // YYYYMMDD 문자열 비교용(동일 형식일 때만 의미)
  const isYmdLess = (a, b) => {
    if (!a || !b || a.length !== 8 || b.length !== 8) return false;
    return a < b;
  };

  const validate = useCallback(() => {
    const nextErr = {};

    // hasSurgery 필수
    if (!answers.hasSurgery || String(answers.hasSurgery).trim() === "") {
      nextErr.hasSurgery = "수술 여부를 선택해주세요.";
    }

    // 수술 여부가 예일 때 수술일 검증
    if (answers.hasSurgery === "예") {
      const sd = answers.surgeryDate;
      if (!sd || String(sd).trim() === "") {
        nextErr.surgeryDate = "수술 날짜(YYYYMMDD)를 입력해주세요.";
      } else if (!isValidYMD(sd)) {
        nextErr.surgeryDate = "YYYYMMDD 형식으로 입력해주세요. (예: 20230115)";
      } else if (!isPastOrToday(sd)) {
        nextErr.surgeryDate = "미래 날짜는 입력할 수 없습니다.";
      }

      // 진단일이 있으면 수술일이 진단일보다 빠른지 체크
      const diag = answers.diagnosisDate; // 이전 섹션에서 저장해 둔 값(YYYYMMDD 기대)
      if (!nextErr.surgeryDate && diag && isValidYMD(diag) && sd && sd.length === 8 && diag.length === 8) {
        if (isYmdLess(sd, diag)) {
          nextErr.surgeryDate = "발병(진단) 시기보다 수술 날짜가 이릅니다.";
        }
      }
    }

    setErrors(nextErr);
    if (Object.keys(nextErr).length > 0) {
      focusFirstInvalid([
        { name: "hasSurgery", hasError: !!nextErr.hasSurgery },
        { name: "surgeryDate", hasError: !!nextErr.surgeryDate },
      ]);
      return false;
    }
    return true;
  }, [answers]);

  const handleNext = useCallback(() => validate(), [validate]);

  return (
    <>
      <SectionTitle>치료 정보</SectionTitle>

      <Grid container spacing={2}>
        {/* 수술 여부 */}
        <Grid item xs={12} md={6}>
          <FormControl component="fieldset" error={!!errors.hasSurgery}>
            <FormLabel id="hasSurgery-label">수술 여부</FormLabel>
            <RadioGroup
              row
              aria-labelledby="hasSurgery-label"
              name="hasSurgery"
              value={answers.hasSurgery ?? ""}
              onChange={(e) => {
                setAnswer("hasSurgery", e.target.value);
                if (errors.hasSurgery) setErrors((p) => ({ ...p, hasSurgery: undefined }));
                // "아니오"로 바꿨을 때 수술일 초기화
                if (e.target.value !== "예" && answers.surgeryDate) {
                  setAnswer("surgeryDate", "");
                  if (errors.surgeryDate) setErrors((p) => ({ ...p, surgeryDate: undefined }));
                }
              }}
            >
              {yesNoOptions.map((opt) => (
                <FormControlLabel key={opt.value} value={opt.value} control={<Radio />} label={opt.label} />
              ))}
            </RadioGroup>
          </FormControl>
          {errors.hasSurgery && (
            <div style={{ color: "#d32f2f", fontSize: 12, marginTop: 6 }}>{errors.hasSurgery}</div>
          )}
        </Grid>

        {/* 수술일(YYYYMMDD) — 수술 '예'일 때만 노출 */}
        {answers.hasSurgery === "예" && (
          <Grid item xs={12} md={6}>
            <TextField
              id="surgeryDate"
              name="surgeryDate"
              label="수술 날짜 (YYYYMMDD)"
              placeholder="예: 20230115"
              fullWidth
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 8 }}
              value={answers.surgeryDate ?? ""}
              onChange={(e) => onSurgeryDateChange(e.target.value)}
              onBlur={() => {
                const sd = answers.surgeryDate;
                if (!sd || !isValidYMD(sd)) {
                  setErrors((p) => ({
                    ...p,
                    surgeryDate: !sd
                      ? "수술 날짜(YYYYMMDD)를 입력해주세요."
                      : "YYYYMMDD 형식으로 입력해주세요. (예: 20230115)",
                  }));
                } else if (!isPastOrToday(sd)) {
                  setErrors((p) => ({ ...p, surgeryDate: "미래 날짜는 입력할 수 없습니다." }));
                } else {
                  // 진단일과의 순서 체크
                  const diag = answers.diagnosisDate;
                  if (diag && isValidYMD(diag) && sd.length === 8 && diag.length === 8 && sd < diag) {
                    setErrors((p) => ({ ...p, surgeryDate: "발병(진단) 시기보다 수술 날짜가 이릅니다." }));
                  }
                }
              }}
              error={!!errors.surgeryDate}
              helperText={errors.surgeryDate}
            />
          </Grid>
        )}

        {/* 기타 치료 방법(자유 입력) */}
        <Grid item xs={12}>
          <TextField
            id="otherTreatmentType"
            name="otherTreatmentType"
            label="그 밖의 치료(선택)"
            placeholder="예: 항암치료 6회, 방사선치료 15회 등"
            fullWidth
            value={answers.otherTreatmentType ?? ""}
            onChange={(e) => setAnswer("otherTreatmentType", e.target.value)}
            multiline
            minRows={2}
          />
        </Grid>
      </Grid>

      <NavButtons
        prevPath="/section1"
        nextPath="/section3"
        onNext={handleNext}
      />
    </>
  );
}