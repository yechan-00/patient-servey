// src/component/SurveyForm.js
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  Grid,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Box,
  Paper,
  Divider,
  FormHelperText,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { savePatientMapped } from "../utils/firebaseUtils";
import { mapSurveyToPatient } from "./survey/utils/mappers";

const SurveyForm = () => {
  // ---- Field refs for scroll/focus to first invalid ----
  const fieldRefs = useRef({});
  const setFieldRef = (key) => (el) => {
    if (el) fieldRefs.current[key] = el;
  };
  const focusFirstInvalid = (key) => {
    const el = fieldRefs.current[key];
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch {}
    setTimeout(() => {
      if (typeof el.focus === "function") el.focus();
    }, 30);
  };
  const navigate = useNavigate();
  const location = useLocation();
  // 오늘 날짜 'YYYY-MM-DD' 문자열
  const todayStr = new Date().toISOString().slice(0, 10);

  // 기본 스크리닝 페이지는 localStorage 저장/로드 기능 비활성화 (설문 페이지만 저장)
  // ---- Helpers for year-month comparisons (shared) ----
  const toYM = (year, month) => {
    const y = Number(year);
    const m = Number(month);
    if (!y || !m) return null;
    return y * 100 + m; // e.g., 2024-09 -> 202409
  };

  const isSurgeryEarlierThanDiagnosis = useCallback(
    (diagYear, diagMonth, surgYear, surgMonth) => {
      const d = toYM(diagYear, diagMonth);
      const s = toYM(surgYear, surgMonth);
      if (d === null || s === null) return false;
      return s < d;
    },
    []
  );
  // 'YYYY-MM-DD' 형식 허용 + 미래날짜 금지
  const isValidYMD = (s) => {
    if (!s) return false;
    // YYYY-MM-DD 형식 검증
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s))) return false;
    const parts = String(s).split("-");
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    // 월/일 범위 대략 검증
    if (m < 1 || m > 12 || d < 1 || d > 31) return false;
    // 실제 날짜 객체로 유효성 검증
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(
      2,
      "0"
    )}`;
    const t = new Date(iso);
    if (Number.isNaN(t.getTime())) return false;
    // 미래 날짜 금지 (todayStr은 'YYYY-MM-DD')
    return iso <= todayStr;
  };

  const [birthDate, setBirthDate] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");

  // 개인정보 필드들
  const [familyComposition, setFamilyComposition] = useState([]);
  const [caregiver, setCaregiver] = useState("");
  const [healthConsultant, setHealthConsultant] = useState("");
  const [workStatus, setWorkStatus] = useState("");
  const [workType, setWorkType] = useState("");

  const [diagnosisYear, setDiagnosisYear] = useState("");
  const [diagnosisMonth, setDiagnosisMonth] = useState("");
  const [cancerType, setCancerType] = useState("");
  const [cancerStage, setCancerStage] = useState("");
  const [otherCancerDiagnosis, setOtherCancerDiagnosis] = useState("");
  const [otherCancerDetails, setOtherCancerDetails] = useState("");
  const [hasSurgery, setHasSurgery] = useState("");
  const [surgeryYear, setSurgeryYear] = useState("");
  const [surgeryMonth, setSurgeryMonth] = useState("");

  // 추가 스크리닝 질문들
  const [alcoholReduction, setAlcoholReduction] = useState("");
  const [smokingCessation, setSmokingCessation] = useState("");
  const [currentAlcoholSoju, setCurrentAlcoholSoju] = useState("");
  const [currentAlcoholBeer, setCurrentAlcoholBeer] = useState("");
  const [currentAlcoholOther, setCurrentAlcoholOther] = useState("");
  const [currentSmokingRegular, setCurrentSmokingRegular] = useState("");
  const [currentSmokingEletronic, setCurrentSmokingEletronic] = useState("");
  const [currentSmokingOther, setCurrentSmokingOther] = useState("");
  const [alcoholReductionBarriers, setAlcoholReductionBarriers] = useState([]);
  const [smokingCessationBarriers, setSmokingCessationBarriers] = useState([]);
  const [treatmentTypes, setTreatmentTypes] = useState([]);
  const [hasRecurrence, setHasRecurrence] = useState("");
  const [mentalHealthHistory, setMentalHealthHistory] = useState("");
  const [mentalHealthDiagnoses, setMentalHealthDiagnoses] = useState({
    depression: false,
    anxietyDisorder: false,
    schizophrenia: false,
    other: false,
  });
  const [otherMentalDiagnosis, setOtherMentalDiagnosis] = useState("");
  const [mentalHealthImpact, setMentalHealthImpact] = useState("");
  const [otherTreatmentType, setOtherTreatmentType] = useState("");
  const [errors, setErrors] = useState({});

  // 기본 스크리닝 페이지는 localStorage 저장하지 않음 (설문 페이지만 저장)

  useEffect(() => {
    // 수술 경험이 아니면 해당 오류 제거
    if (hasSurgery !== "예") {
      setErrors((prev) => {
        if (!prev.surgeryMonth) return prev;
        // 수술 관련 경고만 지움 (다른 에러는 유지)
        const { surgeryMonth, ...rest } = prev;
        return rest;
      });
      return;
    }

    // 값이 모두 있을 때만 비교
    if (diagnosisYear && diagnosisMonth && surgeryYear && surgeryMonth) {
      const earlier = isSurgeryEarlierThanDiagnosis(
        diagnosisYear,
        diagnosisMonth,
        surgeryYear,
        surgeryMonth
      );
      setErrors((prev) => {
        const msg = "발병시기보다 수술 날짜가 이릅니다.";
        // 이미 같은 메시지가 있고 상태도 동일하면 그대로 반환
        if (earlier && prev.surgeryMonth === msg) return prev;

        // earlier면 경고 세팅
        if (earlier) return { ...prev, surgeryMonth: msg };

        // earlier가 아니면 기존 수술 경고만 제거
        if (prev.surgeryMonth) {
          const { surgeryMonth, ...rest } = prev;
          return rest;
        }
        return prev;
      });
    }
  }, [
    hasSurgery,
    diagnosisYear,
    diagnosisMonth,
    surgeryYear,
    surgeryMonth,
    isSurgeryEarlierThanDiagnosis,
  ]);

  // 가족 구성 옵션
  const familyOptions = [
    "배우자",
    "자녀",
    "부모",
    "형제/자매",
    "기타 가족",
    "친구/지인",
    "혼자 거주",
  ];

  // 근로 상태 옵션
  const workStatusOptions = [
    "정규직",
    "비정규직",
    "자영업",
    "학생",
    "주부",
    "은퇴",
    "휴직/병가",
    "무직",
    "기타",
  ];

  const treatmentOptions = [
    "방사선치료",
    "항암화학치료",
    "호르몬치료",
    "표적치료",
    "면역치료",
    "기타",
    "없음",
  ];

  const handleTreatmentChange = (event) => {
    const { value } = event.target;
    setTreatmentTypes((prev) => {
      // "없음" 선택 시 단독 선택
      if (value === "없음") return prev.includes("없음") ? [] : ["없음"];
      // 다른 항목 선택 시 "없음" 제거 후 토글
      const base = prev.filter((t) => t !== "없음");
      return base.includes(value)
        ? base.filter((t) => t !== value)
        : [...base, value];
    });
  };

  const handleFamilyCompositionChange = (event) => {
    const { value } = event.target;
    setFamilyComposition((prev) =>
      prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value]
    );
  };

  const handleMentalHealthDiagnosisChange = (diagnosis) => (event) => {
    setMentalHealthDiagnoses((prev) => ({
      ...prev,
      [diagnosis]: event.target.checked,
    }));
  };

  const validate = () => {
    const newErrors = {};
    let firstKey = null;
    const mark = (key, msg) => {
      newErrors[key] = msg;
      if (!firstKey) firstKey = key;
    };

    // 수술 날짜가 진단 시기보다 빠른지 실시간/최종 검증
    if (
      hasSurgery === "예" &&
      diagnosisYear &&
      diagnosisMonth &&
      surgeryYear &&
      surgeryMonth &&
      isSurgeryEarlierThanDiagnosis(
        diagnosisYear,
        diagnosisMonth,
        surgeryYear,
        surgeryMonth
      )
    ) {
      mark("surgeryMonth", "발병시기보다 수술 날짜가 이릅니다.");
    }

    // 개인정보 검증
    if (!name) mark("name", "이름을 입력해주세요.");
    if (!birthDate) mark("birthDate", "생년월일을 입력해주세요.");
    else if (!isValidYMD(birthDate))
      mark("birthDate", "YYYYMMDD 형식, 미래 날짜 불가");
    if (!gender) mark("gender", "성별을 선택해주세요.");
    if (!maritalStatus) mark("maritalStatus", "결혼 상태를 선택해주세요.");
    if (familyComposition.length === 0)
      mark("familyComposition", "가족 구성을 선택해주세요.");
    if (!caregiver) mark("caregiver", "주 돌봄 제공자를 입력해주세요.");
    if (!healthConsultant)
      mark("healthConsultant", "건강 관리 상담 대상을 입력해주세요.");
    if (!workStatus) mark("workStatus", "근로 상태를 선택해주세요.");

    // 진단 정보 검증 (대략적 허용)
    if (!cancerType) mark("cancerType", "암 종류를 입력해주세요.");
    if (!cancerStage) mark("cancerStage", "암의 진행단계를 선택해주세요.");
    if (!otherCancerDiagnosis)
      mark("otherCancerDiagnosis", "다른 유형의 암 진단 여부를 선택해주세요.");
    if (otherCancerDiagnosis === "예" && !otherCancerDetails)
      mark("otherCancerDetails", "다른 진단받은 암의 종류를 입력해주세요.");

    // 치료 정보 검증
    if (!hasSurgery) mark("hasSurgery", "수술 경험 여부를 선택해주세요.");
    if (hasSurgery === "예") {
      if (!surgeryYear) mark("surgeryYear", "수술 연도를 선택해주세요.");
      if (!surgeryMonth) mark("surgeryMonth", "수술 월을 선택해주세요.");
    }
    if (treatmentTypes.length === 0)
      mark("treatmentTypes", "받은 치료 유형을 선택해주세요.");
    if (treatmentTypes.includes("기타") && !otherTreatmentType)
      mark("otherTreatmentType", "기타 치료명을 입력해주세요.");

    if (!hasRecurrence) mark("hasRecurrence", "재발/전이 여부를 선택해주세요.");

    // 정신 건강 정보 검증
    if (!mentalHealthHistory)
      mark(
        "mentalHealthHistory",
        "정신과적 진단을 받은 경험이 있는지 선택해주세요."
      );
    if (mentalHealthHistory === "예") {
      if (Object.values(mentalHealthDiagnoses).every((v) => !v)) {
        mark("mentalHealthDiagnoses", "받은 정신과적 진단을 선택해주세요.");
      }
      if (mentalHealthDiagnoses.other && !otherMentalDiagnosis) {
        mark("otherMentalDiagnosis", "기타 정신질환명을 입력해주세요.");
      }
      if (!mentalHealthImpact) {
        mark(
          "mentalHealthImpact",
          "정신과적 증상이 일상생활에 미친 영향을 선택해주세요."
        );
      }
    }

    setErrors(newErrors);
    return { ok: Object.keys(newErrors).length === 0, firstKey };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    {
      const { ok, firstKey } = validate();
      if (!ok) {
        if (firstKey) focusFirstInvalid(firstKey);
        return;
      }
    }

    // 1) 폼 -> 표준 스키마로 변환
    const mapped = mapSurveyToPatient({
      name,
      birthDate,
      gender,
      maritalStatus,
      familyComposition,
      caregiver,
      healthConsultant,
      workStatus,
      workType,
      diagnosisYear,
      diagnosisMonth,
      cancerType,
      cancerStage,
      otherCancerDiagnosis,
      otherCancerDetails,
      hasSurgery,
      surgeryYear,
      surgeryMonth,
      treatmentTypes,
      hasRecurrence,
      mentalHealthHistory,
      mentalHealthDiagnoses,
      otherMentalDiagnosis,
      mentalHealthImpact,
      otherTreatmentType,
      alcoholReduction,
      smokingCessation,
      currentAlcoholSoju,
      currentAlcoholBeer,
      currentAlcoholOther,
      currentSmokingRegular,
      currentSmokingEletronic,
      currentSmokingOther,
      alcoholReductionBarriers,
      smokingCessationBarriers,
    });

    // 2) 상호배타 규칙 위반 시 에러 표시
    if (mapped.__error === "TREATMENT_TYPES_CONFLICT") {
      setErrors((prev) => ({
        ...prev,
        treatmentTypes: '"없음"은 다른 치료와 함께 선택할 수 없습니다.',
      }));
      focusFirstInvalid("treatmentTypes");
      return;
    }

    // 3) Firestore 저장 (auto-id 반환)
    // 새 설문 시작인 경우 이전 patientId를 무시하고 새로 생성
    // location.state.newSurvey가 true이면 이전 patientId를 무시
    const isNewSurvey = location.state?.newSurvey === true;
    const patientIdHint = isNewSurvey ? "" : undefined; // 새 설문이면 힌트 없이 새로 생성
    const patientId = await savePatientMapped(mapped, patientIdHint, location);
    localStorage.setItem("patientId", patientId);

    // 4) 메타 값 저장 및 라우팅용 준비
    const nameVal = mapped.name || "";
    const birthISO = mapped.birthDate || ""; // YYYY-MM-DD 또는 ""
    const diagnosisDateVal =
      mapped?.diagnosis?.year && mapped?.diagnosis?.month
        ? `${mapped.diagnosis.year}-${String(mapped.diagnosis.month).padStart(
            2,
            "0"
          )}`
        : "";

    // LocalStorage에 저장 (결과 페이지에서 fallback으로 사용)
    localStorage.setItem("userName", nameVal);
    localStorage.setItem("birthDate", birthISO);
    localStorage.setItem("cancerType", mapped?.diagnosis?.cancerType || "");
    localStorage.setItem("diagnosisDate", diagnosisDateVal);
    // 개인 정보 필드도 localStorage에 저장 (Section7Page에서 사용)
    localStorage.setItem("gender", gender || "");
    localStorage.setItem("maritalStatus", maritalStatus || "");
    localStorage.setItem("cancerStage", cancerStage || "");
    localStorage.setItem("hasRecurrence", hasRecurrence || "");
    localStorage.setItem("hasSurgery", hasSurgery || "");
    localStorage.setItem("surgeryDate", mapped?.surgeryDate || "");
    localStorage.setItem("mentalHealthHistory", mentalHealthHistory || "");
    localStorage.setItem(
      "mentalHealthDiagnosesText",
      Object.keys(mentalHealthDiagnoses || {})
        .filter((k) => mentalHealthDiagnoses[k])
        .join(", ") || ""
    );
    localStorage.setItem("otherMentalDiagnosis", otherMentalDiagnosis || "");
    localStorage.setItem("mentalHealthImpact", mentalHealthImpact || "");
    localStorage.setItem("otherTreatmentType", otherTreatmentType || "");
    localStorage.setItem("otherCancerDiagnosis", otherCancerDiagnosis || "");
    localStorage.setItem("otherCancerDetails", otherCancerDetails || "");

    // 주의: localStorage (survey-draft)는 여기서 클리어하지 않음
    // 뒤로 가기로 돌아올 수 있으므로 데이터를 유지해야 함
    // 설문이 완전히 완료된 후(결과 페이지) 또는 새 설문 시작 시에만 클리어됨

    // 5) 다음 페이지로 이동 (state 우선)
    navigate("/section1", {
      state: {
        patientId,
        name: nameVal,
        birthDate: birthISO,
        cancerType: mapped?.diagnosis?.cancerType || "",
        diagnosisDate: diagnosisDateVal,
        // 개인 정보 필드도 state에 포함 (SurveyResultPage에서 사용)
        gender: gender || "",
        maritalStatus: maritalStatus || "",
        cancerStage: cancerStage || "",
        hasRecurrence: hasRecurrence || "",
        hasSurgery: hasSurgery || "",
        surgeryDate: mapped?.surgeryDate || "",
        mentalHealthHistory: mentalHealthHistory || "",
        mentalHealthDiagnosesText:
          Object.keys(mentalHealthDiagnoses || {})
            .filter((k) => mentalHealthDiagnoses[k])
            .join(", ") || "",
        otherMentalDiagnosis: otherMentalDiagnosis || "",
        mentalHealthImpact: mentalHealthImpact || "",
        otherTreatmentType: otherTreatmentType || "",
        phone: "", // 설문 폼에 phone 필드가 없으면 빈 문자열
        contactMethod: "", // 설문 폼에 contactMethod 필드가 없으면 빈 문자열
        contactTime: "", // 설문 폼에 contactTime 필드가 없으면 빈 문자열
        otherCancerDiagnosis: otherCancerDiagnosis || "",
        otherCancerType: "", // 설문 폼에 otherCancerType 필드가 없으면 빈 문자열
        otherCancerDetails: otherCancerDetails || "",
      },
    });
  };

  return (
    <Container maxWidth="md">
      <Paper
        elevation={4}
        sx={{
          p: { xs: 3, sm: 5 },
          mt: 5,
          backgroundColor: "#fafafa",
          borderRadius: 2,
        }}
      >
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{
            fontWeight: 700,
            color: "#0D47A1",
            fontSize: { xs: "1.5rem", sm: "2rem" },
          }}
        >
          기본 스크리닝 질문
        </Typography>

        <Typography
          align="center"
          sx={{ mb: 4, color: "gray", fontSize: { xs: "0.9rem", sm: "1rem" } }}
        >
          아래의 항목들을 빠짐없이 입력해 주세요.
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          {/* Section: 개인정보 */}
          <Typography
            variant="h6"
            sx={{
              mb: 1,
              fontWeight: "bold",
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
            }}
          >
            🧑‍🦲 개인정보
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2} direction="column">
            <Grid item xs={12}>
              <TextField
                inputRef={setFieldRef("name")}
                label="이름"
                placeholder="이름을 입력하세요"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                sx={{ minHeight: "72px" }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                inputRef={setFieldRef("birthDate")}
                label="생년월일 (YYYY-MM-DD)"
                placeholder="예) 1999-12-31"
                type="text"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={birthDate}
                onChange={(e) => {
                  // 숫자와 하이픈만 허용
                  let value = e.target.value.replace(/[^\d-]/g, "");

                  // 하이픈 자동 삽입: 4자리 입력 후, 7자리 입력 후
                  const digits = value.replace(/-/g, "");
                  let formatted = "";

                  if (digits.length > 0) {
                    formatted = digits.slice(0, 4);
                    if (digits.length > 4) {
                      formatted += "-" + digits.slice(4, 6);
                    }
                    if (digits.length > 6) {
                      formatted += "-" + digits.slice(6, 8);
                    }
                  }

                  setBirthDate(formatted);
                  if (errors.birthDate)
                    setErrors((prev) => ({ ...prev, birthDate: undefined }));
                }}
                onBlur={() => {
                  if (!birthDate) {
                    setErrors((prev) => ({
                      ...prev,
                      birthDate: "생년월일을 입력해주세요.",
                    }));
                  } else if (!isValidYMD(birthDate)) {
                    setErrors((prev) => ({
                      ...prev,
                      birthDate:
                        "YYYY-MM-DD 형식으로 입력해주세요. (예: 1999-12-31)",
                    }));
                  }
                }}
                inputProps={{
                  inputMode: "numeric",
                  pattern: "\\d{4}-\\d{2}-\\d{2}",
                  maxLength: 10,
                }}
                error={!!errors.birthDate}
                helperText={errors.birthDate}
                sx={{ minHeight: "72px" }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl
                fullWidth
                error={!!errors.gender}
                sx={{ minHeight: "72px" }}
              >
                <InputLabel>성별</InputLabel>
                <Select
                  inputRef={setFieldRef("gender")}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  label="성별"
                >
                  <MenuItem value="남성">남성</MenuItem>
                  <MenuItem value="여성">여성</MenuItem>
                </Select>
                <FormHelperText>{errors.gender}</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl
                fullWidth
                error={!!errors.maritalStatus}
                sx={{ minHeight: "72px" }}
              >
                <InputLabel>결혼 상태</InputLabel>
                <Select
                  inputRef={setFieldRef("maritalStatus")}
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  label="결혼 상태"
                >
                  <MenuItem value="미혼">미혼</MenuItem>
                  <MenuItem value="기혼">기혼</MenuItem>
                  <MenuItem value="이혼">이혼</MenuItem>
                  <MenuItem value="사별">사별</MenuItem>
                  <MenuItem value="기타">기타</MenuItem>
                </Select>
                <FormHelperText>{errors.maritalStatus}</FormHelperText>
              </FormControl>
            </Grid>

            {/* 가족 구성 */}
            <Grid item xs={12}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ mb: 1, fontSize: { xs: "1rem", sm: "1.1rem" } }}
              >
                가족 구성/동거인 (해당하는 모든 항목 선택)
              </Typography>
              <FormGroup>
                {familyOptions.map((option) => (
                  <FormControlLabel
                    key={option}
                    control={
                      <Checkbox
                        inputRef={setFieldRef("familyComposition")}
                        checked={familyComposition.includes(option)}
                        onChange={handleFamilyCompositionChange}
                        value={option}
                        size="small"
                      />
                    }
                    label={option}
                    sx={{ my: 0.2 }}
                  />
                ))}
              </FormGroup>
              {errors.familyComposition && (
                <FormHelperText error>
                  {errors.familyComposition}
                </FormHelperText>
              )}
            </Grid>

            {/* 주 돌봄 제공자 */}
            <Grid item xs={12}>
              <TextField
                inputRef={setFieldRef("caregiver")}
                label="주 돌봄 제공자"
                placeholder="예: 배우자, 자녀, 간병인, 본인 등"
                fullWidth
                value={caregiver}
                onChange={(e) => setCaregiver(e.target.value)}
                error={!!errors.caregiver}
                helperText={errors.caregiver}
                sx={{ minHeight: "72px" }}
              />
            </Grid>

            {/* 건강 관리 상담 대상 */}
            <Grid item xs={12}>
              <TextField
                inputRef={setFieldRef("healthConsultant")}
                label="건강 관리에 대해 상의할 수 있는 사람"
                placeholder="예: 주치의, 간호사, 가족, 친구 등"
                fullWidth
                value={healthConsultant}
                onChange={(e) => setHealthConsultant(e.target.value)}
                error={!!errors.healthConsultant}
                helperText={errors.healthConsultant}
                sx={{ minHeight: "72px" }}
              />
            </Grid>

            {/* 근로 상태 */}
            <Grid item xs={12}>
              <FormControl
                fullWidth
                error={!!errors.workStatus}
                sx={{ minHeight: "72px" }}
              >
                <InputLabel>근로 상태</InputLabel>
                <Select
                  inputRef={setFieldRef("workStatus")}
                  value={workStatus}
                  onChange={(e) => setWorkStatus(e.target.value)}
                  label="근로 상태"
                >
                  {workStatusOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{errors.workStatus}</FormHelperText>
              </FormControl>
            </Grid>

            {/* 근로 형태 */}
            <Grid item xs={12}>
              <TextField
                label="근로 형태 (선택사항)"
                placeholder="예: 사무직, 서비스업, 제조업 등"
                fullWidth
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                sx={{ minHeight: "72px" }}
              />
            </Grid>
          </Grid>

          {/* Section: 진단 정보 */}
          <Typography
            variant="h6"
            sx={{
              mt: 4,
              mb: 1,
              fontWeight: "bold",
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
            }}
          >
            🩺 진단 정보
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box
            sx={{
              mb: 2,
              p: 2,
              backgroundColor: "#e3f2fd",
              borderRadius: 1,
              borderLeft: "4px solid #1976d2",
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: "#1976d2", fontWeight: 500 }}
            >
              💡 <strong>안내:</strong> 정확한 날짜를 기억하지 못하셔도
              괜찮습니다. 대략적인 시기를 선택해 주세요.
            </Typography>
          </Box>

          <Grid container spacing={2} direction="column">
            {/* 진단 시기 - 년도/월 선택 */}
            <Grid item xs={12}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ mb: 1, fontSize: { xs: "1rem", sm: "1.1rem" } }}
              >
                진단받은 주요 암의 진단 시기 (대략적인 시기도 괜찮습니다)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl
                    fullWidth
                    error={!!errors.diagnosisYear}
                    sx={{ minHeight: "72px" }}
                  >
                    <InputLabel>년도</InputLabel>
                    <Select
                      inputRef={setFieldRef("diagnosisYear")}
                      value={diagnosisYear}
                      onChange={(e) => setDiagnosisYear(e.target.value)}
                      label="년도"
                    >
                      {Array.from(
                        { length: 30 },
                        (_, i) => new Date().getFullYear() - i
                      ).map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}년
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{errors.diagnosisYear}</FormHelperText>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl
                    fullWidth
                    error={!!errors.diagnosisMonth}
                    sx={{ minHeight: "72px" }}
                  >
                    <InputLabel>월</InputLabel>
                    <Select
                      inputRef={setFieldRef("diagnosisMonth")}
                      value={diagnosisMonth}
                      onChange={(e) => setDiagnosisMonth(e.target.value)}
                      label="월"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(
                        (month) => (
                          <MenuItem key={month} value={month}>
                            {month}월
                          </MenuItem>
                        )
                      )}
                    </Select>
                    <FormHelperText>{errors.diagnosisMonth}</FormHelperText>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>

            {/* 암 종류 - 주관식 입력 */}
            <Grid item xs={12}>
              <TextField
                inputRef={setFieldRef("cancerType")}
                label="진단받은 주요 암은 무엇인가요?"
                placeholder="예: 유방암, 폐암, 대장암, 위암, 간암 등 (여러 개의 암이 있는 경우 모두 기재)"
                fullWidth
                multiline
                rows={2}
                value={cancerType}
                onChange={(e) => setCancerType(e.target.value)}
                error={!!errors.cancerType}
                helperText={
                  errors.cancerType ||
                  "여러 개의 암이 있는 경우 모두 기재해 주세요."
                }
                sx={{ minHeight: "100px" }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl
                fullWidth
                error={!!errors.cancerStage}
                sx={{ minHeight: "72px" }}
              >
                <InputLabel>진단시 주요 암의 진행단계</InputLabel>
                <Select
                  inputRef={setFieldRef("cancerStage")}
                  value={cancerStage}
                  onChange={(e) => setCancerStage(e.target.value)}
                  label="진단시 주요 암의 진행단계"
                >
                  <MenuItem value="0기">0기</MenuItem>
                  <MenuItem value="1기">1기</MenuItem>
                  <MenuItem value="2기">2기</MenuItem>
                  <MenuItem value="3기">3기</MenuItem>
                  <MenuItem value="4기">4기</MenuItem>
                  <MenuItem value="모름">잘 모르겠다</MenuItem>
                </Select>
                <FormHelperText>{errors.cancerStage}</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl
                fullWidth
                error={!!errors.otherCancerDiagnosis}
                sx={{ minHeight: "72px" }}
              >
                <InputLabel>
                  위에서 작성한 암 외에 다른 유형의 암 진단을 받은 적이 있나요?
                </InputLabel>
                <Select
                  inputRef={setFieldRef("otherCancerDiagnosis")}
                  value={otherCancerDiagnosis}
                  onChange={(e) => setOtherCancerDiagnosis(e.target.value)}
                  label="위에서 작성한 암 외에 다른 유형의 암 진단을 받은 적이 있나요?"
                >
                  <MenuItem value="예">예</MenuItem>
                  <MenuItem value="아니오">아니오</MenuItem>
                </Select>
                <FormHelperText>{errors.otherCancerDiagnosis}</FormHelperText>
              </FormControl>
            </Grid>
            {otherCancerDiagnosis === "예" && (
              <Grid item xs={12}>
                <TextField
                  inputRef={setFieldRef("otherCancerDetails")}
                  fullWidth
                  label="다른 진단받은 암의 종류"
                  placeholder="다른 유형의 암을 모두 입력해주세요"
                  value={otherCancerDetails}
                  onChange={(e) => setOtherCancerDetails(e.target.value)}
                  error={!!errors.otherCancerDetails}
                  helperText={errors.otherCancerDetails}
                  sx={{ minHeight: "72px" }}
                />
              </Grid>
            )}
          </Grid>

          {/* Section: 치료 정보 */}
          <Typography
            variant="h6"
            sx={{
              mt: 4,
              mb: 1,
              fontWeight: "bold",
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
            }}
          >
            💊 치료 정보
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2} direction="column">
            <Grid item xs={12}>
              <FormControl
                fullWidth
                error={!!errors.hasSurgery}
                sx={{ minHeight: "72px" }}
              >
                <InputLabel>수술 경험 여부</InputLabel>
                <Select
                  inputRef={setFieldRef("hasSurgery")}
                  value={hasSurgery}
                  onChange={(e) => setHasSurgery(e.target.value)}
                  label="수술 경험 여부"
                >
                  <MenuItem value="예">예</MenuItem>
                  <MenuItem value="아니오">아니오</MenuItem>
                </Select>
                <FormHelperText>{errors.hasSurgery}</FormHelperText>
              </FormControl>
            </Grid>
            {hasSurgery === "예" && (
              <Grid item xs={12}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{ mb: 1, fontSize: { xs: "1rem", sm: "1.1rem" } }}
                >
                  수술 시기 (가장 최근 수술일 기준, 대략적인 시기도 괜찮습니다)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControl
                      inputRef={setFieldRef("surgeryYear")}
                      fullWidth
                      error={!!errors.surgeryYear}
                      sx={{ minHeight: "72px" }}
                    >
                      <InputLabel>년도</InputLabel>
                      <Select
                        value={surgeryYear}
                        onChange={(e) => setSurgeryYear(e.target.value)}
                        label="년도"
                      >
                        {Array.from(
                          { length: 30 },
                          (_, i) => new Date().getFullYear() - i
                        ).map((year) => (
                          <MenuItem key={year} value={year}>
                            {year}년
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>{errors.surgeryYear}</FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl
                      inputRef={setFieldRef("surgeryMonth")}
                      fullWidth
                      error={!!errors.surgeryMonth}
                      sx={{ minHeight: "72px" }}
                    >
                      <InputLabel>월</InputLabel>
                      <Select
                        value={surgeryMonth}
                        onChange={(e) => setSurgeryMonth(e.target.value)}
                        label="월"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(
                          (month) => (
                            <MenuItem key={month} value={month}>
                              {month}월
                            </MenuItem>
                          )
                        )}
                      </Select>
                      <FormHelperText>{errors.surgeryMonth}</FormHelperText>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
            )}
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              color="#003366"
              gutterBottom
              sx={{ fontSize: { xs: "1rem", sm: "1.1rem" } }}
            >
              받은 치료 유형 (해당하는 모든 항목 선택)
            </Typography>
            <FormGroup>
              {treatmentOptions.map((treatment) => (
                <FormControlLabel
                  key={treatment}
                  control={
                    <Checkbox
                      inputRef={
                        treatment === "방사선치료"
                          ? setFieldRef("treatmentTypes")
                          : undefined
                      }
                      checked={treatmentTypes.includes(treatment)}
                      onChange={handleTreatmentChange}
                      value={treatment}
                      size="small"
                    />
                  }
                  label={treatment}
                  sx={{ my: 0.2 }}
                />
              ))}
            </FormGroup>

            {errors.treatmentTypes && (
              <FormHelperText error>{errors.treatmentTypes}</FormHelperText>
            )}

            {/* 기타 항목 */}
            {treatmentTypes.includes("기타") && (
              <TextField
                inputRef={setFieldRef("otherTreatmentType")}
                fullWidth
                label="기타 치료 유형을 입력하세요"
                placeholder="예: 고강도 초음파 치료"
                value={otherTreatmentType}
                onChange={(e) => setOtherTreatmentType(e.target.value)}
                sx={{ mt: 1, mb: 3, minHeight: "72px" }}
                error={!!errors.otherTreatmentType}
                helperText={errors.otherTreatmentType}
              />
            )}
          </Box>

          <Grid container spacing={2} direction="column" sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <FormControl
                fullWidth
                error={!!errors.hasRecurrence}
                sx={{ minHeight: "72px" }}
              >
                <InputLabel>재발/전이 여부</InputLabel>
                <Select
                  inputRef={setFieldRef("hasRecurrence")}
                  value={hasRecurrence}
                  onChange={(e) => setHasRecurrence(e.target.value)}
                  label="재발/전이 여부"
                >
                  <MenuItem value="예">예</MenuItem>
                  <MenuItem value="아니오">아니오</MenuItem>
                </Select>
                <FormHelperText>{errors.hasRecurrence}</FormHelperText>
              </FormControl>
            </Grid>
          </Grid>

          {/* Section: 정신 건강 정보 */}
          <Typography
            variant="h6"
            sx={{
              mt: 4,
              mb: 1,
              fontWeight: "bold",
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
            }}
          >
            🧠 정신 건강 정보
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2} direction="column">
            <Grid item xs={12}>
              <FormControl
                fullWidth
                error={!!errors.mentalHealthHistory}
                sx={{ minHeight: "72px" }}
              >
                <InputLabel>정신과적 진단을 받은 경험이 있습니까?</InputLabel>
                <Select
                  inputRef={setFieldRef("mentalHealthHistory")}
                  value={mentalHealthHistory}
                  onChange={(e) => setMentalHealthHistory(e.target.value)}
                  label="정신과적 진단을 받은 경험이 있습니까?"
                >
                  <MenuItem value="예">예</MenuItem>
                  <MenuItem value="아니오">아니오</MenuItem>
                </Select>
                <FormHelperText>{errors.mentalHealthHistory}</FormHelperText>
              </FormControl>
            </Grid>

            {mentalHealthHistory === "예" && (
              <>
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                    sx={{ fontSize: { xs: "1rem", sm: "1.1rem" } }}
                  >
                    받은 정신과적 진단 (해당하는 모든 항목 선택)
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          inputRef={setFieldRef("mentalHealthDiagnoses")}
                          checked={mentalHealthDiagnoses.depression}
                          onChange={handleMentalHealthDiagnosisChange(
                            "depression"
                          )}
                          sx={{ transform: "scale(1.2)" }}
                        />
                      }
                      label="우울증"
                      componentsProps={{
                        typography: {
                          variant: "subtitle2",
                          color: "text.secondary",
                        },
                      }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={mentalHealthDiagnoses.anxietyDisorder}
                          onChange={handleMentalHealthDiagnosisChange(
                            "anxietyDisorder"
                          )}
                          sx={{ transform: "scale(1.2)" }}
                        />
                      }
                      label="불안장애"
                      componentsProps={{
                        typography: {
                          variant: "subtitle2",
                          color: "text.secondary",
                        },
                      }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          inputRef={setFieldRef("otherMentalDiagnosis")}
                          checked={mentalHealthDiagnoses.schizophrenia}
                          onChange={handleMentalHealthDiagnosisChange(
                            "schizophrenia"
                          )}
                          sx={{ transform: "scale(1.2)" }}
                        />
                      }
                      label="조현병"
                      componentsProps={{
                        typography: {
                          variant: "subtitle2",
                          color: "text.secondary",
                        },
                      }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={mentalHealthDiagnoses.other}
                          onChange={handleMentalHealthDiagnosisChange("other")}
                          sx={{ transform: "scale(1.2)" }}
                        />
                      }
                      label="기타 정신질환"
                      componentsProps={{
                        typography: {
                          variant: "subtitle2",
                          color: "text.secondary",
                        },
                      }}
                    />
                  </FormGroup>
                  {errors.mentalHealthDiagnoses && (
                    <FormHelperText error>
                      {errors.mentalHealthDiagnoses}
                    </FormHelperText>
                  )}
                </Grid>

                {mentalHealthDiagnoses.other && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="기타 정신질환 진단명"
                      placeholder="진단명을 입력하세요"
                      value={otherMentalDiagnosis}
                      onChange={(e) => setOtherMentalDiagnosis(e.target.value)}
                      error={!!errors.otherMentalDiagnosis}
                      helperText={errors.otherMentalDiagnosis}
                      sx={{ minHeight: "72px" }}
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <FormControl
                    fullWidth
                    error={!!errors.mentalHealthImpact}
                    sx={{ minHeight: "72px" }}
                  >
                    <InputLabel>
                      위와 같은 정신과적 증상이 귀하의 일상생활에 얼마나 방해가
                      되었습니까?
                    </InputLabel>
                    <Select
                      inputRef={setFieldRef("mentalHealthImpact")}
                      value={mentalHealthImpact}
                      onChange={(e) => setMentalHealthImpact(e.target.value)}
                      label="위와 같은 정신과적 증상이 귀하의 일상생활에 얼마나 방해가 되었습니까?"
                    >
                      <MenuItem value="전혀 아님">전혀 아님</MenuItem>
                      <MenuItem value="거의 아님">거의 아님</MenuItem>
                      <MenuItem value="보통">보통</MenuItem>
                      <MenuItem value="종종">종종</MenuItem>
                      <MenuItem value="자주">자주</MenuItem>
                    </Select>
                    <FormHelperText>{errors.mentalHealthImpact}</FormHelperText>
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>

          {/* Section: 건강행동 정보 (절주/금연) */}
          <Typography
            variant="h6"
            sx={{
              mt: 4,
              mb: 1,
              fontWeight: "bold",
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
            }}
          >
            🚭🍷 건강행동 정보
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2} direction="column">
            {/* 절주 관련 질문 */}
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ minHeight: "72px" }}>
                <InputLabel>절주를 시도한 경험이 있으신가요?</InputLabel>
                <Select
                  value={alcoholReduction}
                  onChange={(e) => setAlcoholReduction(e.target.value)}
                  label="절주를 시도한 경험이 있으신가요?"
                >
                  <MenuItem value="예">예</MenuItem>
                  <MenuItem value="아니오">아니오</MenuItem>
                  <MenuItem value="해당없음">
                    해당없음 (음주를 하지 않음)
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {alcoholReduction === "예" && (
              <>
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1, fontWeight: 600 }}
                  >
                    현재 음주량 (주당)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="소주"
                        placeholder="예: 2병"
                        fullWidth
                        value={currentAlcoholSoju}
                        onChange={(e) => setCurrentAlcoholSoju(e.target.value)}
                        sx={{ minHeight: "72px" }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="맥주"
                        placeholder="예: 6캔"
                        fullWidth
                        value={currentAlcoholBeer}
                        onChange={(e) => setCurrentAlcoholBeer(e.target.value)}
                        sx={{ minHeight: "72px" }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="기타"
                        placeholder="예: 와인 1병"
                        fullWidth
                        value={currentAlcoholOther}
                        onChange={(e) => setCurrentAlcoholOther(e.target.value)}
                        sx={{ minHeight: "72px" }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    sx={{ mb: 1, fontSize: { xs: "1rem", sm: "1.1rem" } }}
                  >
                    절주 실패 이유 (해당하는 모든 항목 선택)
                  </Typography>
                  <FormGroup>
                    {[
                      "스트레스",
                      "사교 모임",
                      "습관",
                      "의지력 부족",
                      "환경적 요인",
                      "기타",
                    ].map((reason) => (
                      <FormControlLabel
                        key={reason}
                        control={
                          <Checkbox
                            checked={alcoholReductionBarriers.includes(reason)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAlcoholReductionBarriers((prev) => [
                                  ...prev,
                                  reason,
                                ]);
                              } else {
                                setAlcoholReductionBarriers((prev) =>
                                  prev.filter((r) => r !== reason)
                                );
                              }
                            }}
                            size="small"
                          />
                        }
                        label={reason}
                        sx={{ my: 0.2 }}
                      />
                    ))}
                  </FormGroup>
                </Grid>
              </>
            )}

            {/* 금연 관련 질문 */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ minHeight: "72px" }}>
                <InputLabel>금연을 시도한 경험이 있으신가요?</InputLabel>
                <Select
                  value={smokingCessation}
                  onChange={(e) => setSmokingCessation(e.target.value)}
                  label="금연을 시도한 경험이 있으신가요?"
                >
                  <MenuItem value="예">예</MenuItem>
                  <MenuItem value="아니오">아니오</MenuItem>
                  <MenuItem value="해당없음">
                    해당없음 (흡연을 하지 않음)
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {smokingCessation === "예" && (
              <>
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1, fontWeight: 600 }}
                  >
                    현재 흡연량 (일일)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="일반담배"
                        placeholder="예: 하루 반갑"
                        fullWidth
                        value={currentSmokingRegular}
                        onChange={(e) =>
                          setCurrentSmokingRegular(e.target.value)
                        }
                        sx={{ minHeight: "72px" }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="전자담배"
                        placeholder="예: 하루 5회"
                        fullWidth
                        value={currentSmokingEletronic}
                        onChange={(e) =>
                          setCurrentSmokingEletronic(e.target.value)
                        }
                        sx={{ minHeight: "72px" }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="기타"
                        placeholder="예: 궐련 3개"
                        fullWidth
                        value={currentSmokingOther}
                        onChange={(e) => setCurrentSmokingOther(e.target.value)}
                        sx={{ minHeight: "72px" }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    sx={{ mb: 1, fontSize: { xs: "1rem", sm: "1.1rem" } }}
                  >
                    금연 실패 이유 (해당하는 모든 항목 선택)
                  </Typography>
                  <FormGroup>
                    {[
                      "스트레스",
                      "습관",
                      "금단증상",
                      "의지력 부족",
                      "환경적 요인",
                      "기타",
                    ].map((reason) => (
                      <FormControlLabel
                        key={reason}
                        control={
                          <Checkbox
                            checked={smokingCessationBarriers.includes(reason)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSmokingCessationBarriers((prev) => [
                                  ...prev,
                                  reason,
                                ]);
                              } else {
                                setSmokingCessationBarriers((prev) =>
                                  prev.filter((r) => r !== reason)
                                );
                              }
                            }}
                            size="small"
                          />
                        }
                        label={reason}
                        sx={{ my: 0.2 }}
                      />
                    ))}
                  </FormGroup>
                </Grid>
              </>
            )}
          </Grid>

          {/* 버튼 */}
          <Grid container spacing={2} mt={4}>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate(-1)}
                sx={{
                  fontWeight: "bold",
                  color: "#1976D2",
                  borderColor: "#1976D2",
                  "&:hover": { backgroundColor: "#E3F2FD" },
                  minHeight: "48px",
                }}
              >
                이전
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#1976D2",
                  color: "#fff",
                  "&:hover": { backgroundColor: "#1565C0" },
                  minHeight: "48px",
                }}
              >
                다음
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default SurveyForm;
