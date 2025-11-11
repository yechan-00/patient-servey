import React, { useCallback, useMemo, useState } from "react";
import { Grid, TextField, MenuItem } from "@mui/material";
import SectionTitle from "../SectionTitle";
import NavButtons from "../NavButtons";
import { useSurveyForm } from "../../../context/SurveyFormContext";
import { focusFirstInvalid } from "../../utils/scrollFocus";
import { saveBasicProfile } from "../../../utils/firebaseUtils";
import { useLocation } from "react-router-dom";

/**
 * PersonalInfoSection
 * - name, gender, birthDate(YYYYMMDD 텍스트), maritalStatus, phone, contactMethod, contactTime
 * - 컨텍스트(useSurveyForm)와 연결되어 뒤로가기/앞으로가기에도 값 유지
 * - 필수: name, gender, birthDate
 */
export default function PersonalInfoSection() {
  const { answers, setAnswer } = useSurveyForm();
  const location = useLocation();
  const [errors, setErrors] = useState({});

  // 입력 헬퍼: YYYY-MM-DD 형식 유지(숫자와 하이픈만, 최대 10자)
  const onBirthDateChange = useCallback(
    (raw) => {
      const s = String(raw || "").replace(/[^0-9-]/g, "").slice(0, 10);
      setAnswer("birthDate", s);
      if (errors.birthDate) {
        setErrors((prev) => ({ ...prev, birthDate: undefined }));
      }
    },
    [setAnswer, errors.birthDate]
  );

  // YYYY-MM-DD 유효성 검사
  const isValidYMDHyphen = (str) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(str || ""))) return false;
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return false;
    const [y, m, day] = str.split("-").map((v) => parseInt(v, 10));
    // JS Date는 월 0~11, 날짜 보정 이슈 있을 수 있어 재확인
    return (
      d.getUTCFullYear() === y &&
      d.getUTCMonth() + 1 === m &&
      d.getUTCDate() === day
    );
  };

  const isPastOrTodayHyphen = (str) => {
    if (!isValidYMDHyphen(str)) return false;
    const today = new Date();
    const ymd = new Date(str + "T00:00:00");
    // 날짜만 비교(로컬 기준)
    const toKey = (d) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    return toKey(ymd) <= toKey(today);
  };

  const genderOptions = useMemo(
    () => [
      { value: "남성", label: "남성" },
      { value: "여성", label: "여성" },
      { value: "기타/응답없음", label: "기타/응답없음" },
    ],
    []
  );

  const maritalOptions = useMemo(
    () => [
      { value: "미혼", label: "미혼" },
      { value: "기혼", label: "기혼" },
      { value: "사별/이혼", label: "사별/이혼" },
      { value: "응답없음", label: "응답없음" },
    ],
    []
  );

  const contactMethodOptions = useMemo(
    () => [
      { value: "전화", label: "전화" },
      { value: "문자", label: "문자" },
      { value: "카카오톡", label: "카카오톡" },
      { value: "이메일", label: "이메일" },
      { value: "대면", label: "대면" },
    ],
    []
  );

  const validate = useCallback(() => {
    const nextErr = {};

    // 이름
    if (!answers.name || String(answers.name).trim() === "") {
      nextErr.name = "이름을 입력해주세요.";
    }

    // 성별
    if (!answers.gender || String(answers.gender).trim() === "") {
      nextErr.gender = "성별을 선택해주세요.";
    }

    // 생년월일(YYYY-MM-DD)
    const bd = answers.birthDate;
    if (!bd || String(bd).trim() === "") {
      nextErr.birthDate = "생년월일(YYYY-MM-DD)을 입력해주세요.";
    } else if (!isValidYMDHyphen(bd)) {
      nextErr.birthDate = "YYYY-MM-DD 형식으로 입력해주세요. (예: 1985-03-17)";
    } else if (!isPastOrTodayHyphen(bd)) {
      nextErr.birthDate = "미래 날짜는 입력할 수 없습니다.";
    }

    // 연락처(선택 입력 시 포맷 가이드만)
    if (answers.phone) {
      const cleaned = String(answers.phone).replace(/\D/g, "");
      if (cleaned.length < 8) {
        nextErr.phone = "연락처 형식이 올바르지 않습니다.";
      }
    }

    setErrors(nextErr);
    if (Object.keys(nextErr).length > 0) {
      // 첫 번째 에러 필드로 스크롤/포커스
      focusFirstInvalid([
        { name: "name", hasError: !!nextErr.name },
        { name: "gender", hasError: !!nextErr.gender },
        { name: "birthDate", hasError: !!nextErr.birthDate },
        { name: "phone", hasError: !!nextErr.phone },
      ]);
      return false;
    }
    return true;
  }, [answers, setErrors]);

  const handleNext = useCallback(async () => {
    if (!validate()) return false;
    await saveBasicProfile(answers, location);
    return true;
  }, [validate, answers, location]);

  return (
    <>
      <SectionTitle>환자 기본 정보</SectionTitle>
      <Grid container spacing={2}>
        {/* 이름 */}
        <Grid item xs={12} md={6}>
          <TextField
            id="name"
            name="name"
            label="이름"
            fullWidth
            value={answers.name ?? ""}
            onChange={(e) => {
              setAnswer("name", e.target.value);
              if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
            }}
            error={!!errors.name}
            helperText={errors.name}
          />
        </Grid>

        {/* 성별 */}
        <Grid item xs={12} md={6}>
          <TextField
            id="gender"
            name="gender"
            label="성별"
            select
            fullWidth
            value={answers.gender ?? ""}
            onChange={(e) => {
              setAnswer("gender", e.target.value);
              if (errors.gender) setErrors((p) => ({ ...p, gender: undefined }));
            }}
            error={!!errors.gender}
            helperText={errors.gender}
          >
            {genderOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* 생년월일(YYYY-MM-DD 텍스트) */}
        <Grid item xs={12} md={6}>
          <TextField
            id="birthDate"
            name="birthDate"
            label="생년월일 (YYYY-MM-DD)"
            placeholder="예: 1985-03-17"
            fullWidth
            inputProps={{
              pattern: "\\d{4}-\\d{2}-\\d{2}",
              maxLength: 10,
            }}
            value={answers.birthDate ?? ""}
            onChange={(e) => onBirthDateChange(e.target.value)}
            onBlur={() => {
              // 블러 시 재검증(필드 단위)
              if (!answers.birthDate || !isValidYMDHyphen(answers.birthDate)) {
                setErrors((p) => ({
                  ...p,
                  birthDate: !answers.birthDate
                    ? "생년월일(YYYY-MM-DD)을 입력해주세요."
                    : "YYYY-MM-DD 형식으로 입력해주세요. (예: 1985-03-17)",
                }));
              } else if (!isPastOrTodayHyphen(answers.birthDate)) {
                setErrors((p) => ({
                  ...p,
                  birthDate: "미래 날짜는 입력할 수 없습니다.",
                }));
              }
            }}
            error={!!errors.birthDate}
            helperText={errors.birthDate}
          />
        </Grid>

        {/* 결혼 상태(선택) */}
        <Grid item xs={12} md={6}>
          <TextField
            id="maritalStatus"
            name="maritalStatus"
            label="결혼 상태(선택)"
            select
            fullWidth
            value={answers.maritalStatus ?? ""}
            onChange={(e) => setAnswer("maritalStatus", e.target.value)}
          >
            {maritalOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* 연락처(선택) */}
        <Grid item xs={12} md={6}>
          <TextField
            id="phone"
            name="phone"
            label="연락처(선택, 숫자만)"
            placeholder="예: 01012345678"
            fullWidth
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
            value={answers.phone ?? ""}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              setAnswer("phone", digits);
              if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }));
            }}
            error={!!errors.phone}
            helperText={errors.phone}
          />
        </Grid>

        {/* 연락 방법(선택) */}
        <Grid item xs={12} md={6}>
          <TextField
            id="contactMethod"
            name="contactMethod"
            label="연락 방법(선택)"
            select
            fullWidth
            value={answers.contactMethod ?? ""}
            onChange={(e) => setAnswer("contactMethod", e.target.value)}
          >
            {contactMethodOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* 연락 가능 시간(선택, 자유 입력) */}
        <Grid item xs={12}>
          <TextField
            id="contactTime"
            name="contactTime"
            label="연락 가능 시간(선택)"
            placeholder="예: 평일 10:00~18:00 / 오후 선호"
            fullWidth
            value={answers.contactTime ?? ""}
            onChange={(e) => setAnswer("contactTime", e.target.value)}
          />
        </Grid>
      </Grid>

      {/* 네비게이션: 이전 페이지 경로/다음 페이지 경로는 프로젝트 라우팅에 맞게 조정 */}
      <NavButtons
        prevPath="/"
        nextPath="/section1"
        onNext={handleNext}
      />
    </>
  );
}