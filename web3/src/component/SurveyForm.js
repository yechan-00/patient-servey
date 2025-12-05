import React, { useEffect, useRef, useState } from "react";
import {
  Container,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Box,
  Paper,
  Divider,
  FormHelperText,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormGroup,
  Checkbox,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { saveUserData } from "../utils/firebaseUtils";

const STORAGE_KEY = "survey-personal-only";

const SurveyForm = () => {
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // ---------- focus helper ----------
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
    setTimeout(() => typeof el?.focus === "function" && el.focus(), 30);
  };

  // ---------- utils ----------
  const isValidYMD = (s) => {
    if (!s) return false;
    const digits = String(s).replace(/[^\d]/g, "");
    if (!/^\d{8}$/.test(digits)) return false;
    const y = Number(digits.slice(0, 4));
    const m = Number(digits.slice(4, 6));
    const d = Number(digits.slice(6, 8));
    if (m < 1 || m > 12 || d < 1 || d > 31) return false;
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(
      2,
      "0"
    )}`;
    const t = new Date(iso);
    if (Number.isNaN(t.getTime())) return false;
    return iso <= todayStr; // 미래 금지
  };

  // ---------- state----------
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState(""); // YYYYMMDD
  const [evaluationDate, setEvaluationDate] = useState(
    new Date().toISOString().slice(0, 10).replace(/-/g, "")
  ); // YYYYMMDD

  // 응답자: 사진 문구에 맞춰 라디오 3옵션
  const [respondent, setRespondent] = useState(""); // "환자" | "직원의 도움으로" | "가족/친구/돌봄 제공자"
  // 거주지: 주민등록지(우편번호), 실제 거주시(주소)
  const [residenceRegZip, setResidenceRegZip] = useState("");
  const [residenceActual, setResidenceActual] = useState("");

  // 성별/결혼상태
  const [gender, setGender] = useState(""); // 남성/여성
  const [maritalStatus, setMaritalStatus] = useState("");
  // 가구형태(동거인): 체크박스 다중선택
  const FAMILY_OPTIONS = [
    "혼자",
    "배우자 또는 파트너만",
    "배우자, 파트너 및 다른 가족들",
    "배우자 없이 자녀와",
    "부모 또는 법적 보호자",
    "형제/자매",
    "다른 친척",
    "친척이 아닌 다른 사람",
  ];
  const [familyComposition, setFamilyComposition] = useState([]);
  const [familyOther, setFamilyOther] = useState("");

  // 종교: 목록만
  const [religion, setReligion] = useState("");

  // 주거형태: 기본 옵션 + 기타 시 텍스트 (사진은 더 세분되어 보이지만 요청사항에 맞춰 ‘목록+기타입력’으로 단순화)
  const [housingType, setHousingType] = useState("");
  const [housingTypeOther, setHousingTypeOther] = useState("");

  // 장애여부(+세부)
  const [disability, setDisability] = useState(""); // 예/아니오
  const [disabilityDetails, setDisabilityDetails] = useState("");

  // 의료보장 유형(복수 선택 가능)
  const [insuranceType, setInsuranceType] = useState([]); // 건강보험/의료급여/차상위/일반

  // 지불재원: 민간보험 선택 시 실손/보장성 세부, 기타 시 텍스트
  const [paymentSource, setPaymentSource] = useState([]); // 본인 부담/민간보험/기타
  const [privateInsuranceType, setPrivateInsuranceType] = useState([]); // 실손/보장성
  const [otherPaymentSource, setOtherPaymentSource] = useState("");

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false); // 제출 시도 후에만 오류 표시

  // ---------- draft load ----------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const a = JSON.parse(raw) || {};
      [
        "name",
        "birthDate",
        "evaluationDate",
        "respondent",
        "residenceRegZip",
        "residenceActual",
        "gender",
        "maritalStatus",
        "religion",
        "housingType",
        "housingTypeOther",
        "disability",
        "disabilityDetails",
        "insuranceType",
        "paymentSource",
        "privateInsuranceType",
        "otherPaymentSource",
        "familyComposition",
        "familyOther",
      ].forEach((k) => {
        if (a[k] !== undefined) {
          (k === "familyComposition"
            ? setFamilyComposition
            : {
                name: setName,
                birthDate: setBirthDate,
                evaluationDate: setEvaluationDate,
                respondent: setRespondent,
                residenceRegZip: setResidenceRegZip,
                residenceActual: setResidenceActual,
                gender: setGender,
                maritalStatus: setMaritalStatus,
                religion: setReligion,
                housingType: setHousingType,
                housingTypeOther: setHousingTypeOther,
                disability: setDisability,
                disabilityDetails: setDisabilityDetails,
                insuranceType: setInsuranceType,
                paymentSource: setPaymentSource,
                privateInsuranceType: setPrivateInsuranceType,
                otherPaymentSource: setOtherPaymentSource,
                familyOther: setFamilyOther,
              }[k])(a[k]);
        }
      });
    } catch {}
  }, []);

  // ---------- draft save ----------
  useEffect(() => {
    const draft = {
      name,
      birthDate,
      evaluationDate,
      respondent,
      residenceRegZip,
      residenceActual,
      gender,
      maritalStatus,
      religion,
      housingType,
      housingTypeOther,
      disability,
      disabilityDetails,
      insuranceType,
      paymentSource,
      privateInsuranceType,
      otherPaymentSource,
      familyComposition,
      familyOther,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {}
  }, [
    name,
    birthDate,
    evaluationDate,
    respondent,
    residenceRegZip,
    residenceActual,
    gender,
    maritalStatus,
    religion,
    housingType,
    housingTypeOther,
    disability,
    disabilityDetails,
    insuranceType,
    paymentSource,
    privateInsuranceType,
    otherPaymentSource,
    familyComposition,
    familyOther,
  ]);

  // ---------- handlers ----------
  const toggleFamily = (e, checked) => {
    const value = e.target.value;
    setFamilyComposition((prev) =>
      checked
        ? prev.includes(value)
          ? prev
          : [...prev, value]
        : prev.filter((v) => v !== value)
    );
  };

  // ---------- validate ----------
  const validate = () => {
    const newErrors = {};
    let firstKey = null;
    const mark = (k, m) => {
      newErrors[k] = m;
      if (!firstKey) firstKey = k;
    };

    if (!name) mark("name", "이름을 입력해주세요.");
    if (!birthDate) mark("birthDate", "생년월일을 입력해주세요.");
    else if (!isValidYMD(birthDate))
      mark("birthDate", "YYYYMMDD 형식, 미래 날짜 불가");

    if (!respondent) mark("respondent", "응답자를 선택해주세요.");

    if (!residenceActual)
      mark("residenceActual", "실제 거주시 주소를 입력해주세요.");

    if (!gender) mark("gender", "성별을 선택해주세요.");
    if (!maritalStatus) mark("maritalStatus", "결혼 상태를 선택해주세요.");

    if (familyComposition.length === 0)
      mark("familyComposition", "가구 형태/동거인을 선택해주세요.");
    if (familyComposition.includes("기타") && !familyOther)
      mark("familyOther", "가구 형태(기타)를 입력해주세요.");

    if (!housingType) mark("housingType", "주거형태를 선택해주세요.");
    if (housingType === "기타" && !housingTypeOther)
      mark("housingTypeOther", "주거형태(기타)를 입력해주세요.");

    if (!disability) mark("disability", "장애 여부를 선택해주세요.");
    if (disability === "예" && !disabilityDetails)
      mark("disabilityDetails", "장애 관련 세부 내용을 입력해주세요.");

    if (!Array.isArray(insuranceType) || insuranceType.length === 0)
      mark("insuranceType", "의료보장 유형을 선택해주세요.");

    if (!Array.isArray(paymentSource) || paymentSource.length === 0)
      mark("paymentSource", "지불재원을 선택해주세요.");
    if (Array.isArray(paymentSource) && paymentSource.includes("민간보험") && 
        (!Array.isArray(privateInsuranceType) || privateInsuranceType.length === 0))
      mark("privateInsuranceType", "민간보험 유형을 선택해주세요.");
    if (Array.isArray(paymentSource) && paymentSource.includes("기타") && !otherPaymentSource)
      mark("otherPaymentSource", "기타 지불재원을 입력해주세요.");

    setErrors(newErrors);
    return { ok: Object.keys(newErrors).length === 0, firstKey };
  };

  // ---------- submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true); // 제출 시도 표시
    const { ok, firstKey } = validate();
    if (!ok) {
      if (firstKey) focusFirstInvalid(firstKey);
      return;
    }

    const userData = {
      name,
      birthDate,
      evaluationDate,
      respondent,
      residenceRegZip,
      residenceActual,
      gender,
      maritalStatus,
      familyComposition,
      familyOther,
      religion,
      housingType,
      housingTypeOther,
      disability,
      disabilityDetails,
      insuranceType,
      paymentSource,
      privateInsuranceType,
      otherPaymentSource,
    };

    const patientId = await saveUserData(userData);
    localStorage.setItem("patientId", patientId);
    localStorage.setItem("userName", name.trim());
    localStorage.setItem("birthDate", birthDate);

    navigate("/section1", {
      state: { patientId, name: name.trim(), birthDate },
    });
  };

  // ---------- UI ----------
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
          sx={{ fontWeight: 700, color: "#0D47A1" }}
        >
          사회적 스크리닝 질문
        </Typography>
        <Typography align="center" sx={{ mb: 4, color: "gray" }}>
          사회적 스크리닝 설문 폼에 오신 것을 환영합니다. 이 설문은 환자의
          사회적, 경제적 상황을 이해하여 보다 나은 의료 서비스를 제공하기 위한
          목적으로 사용됩니다. 모든 정보는 엄격히 비밀로 유지되며, 환자의 동의
          없이 외부에 공개되지 않습니다. 설문에 성실히 응답해 주시면
          감사하겠습니다.
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
            환자 정보
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2} direction="column">
            {/* 이름 */}
            <Grid item xs={12}>
              <TextField
                inputRef={setFieldRef("name")}
                label="이름"
                placeholder="이름을 입력하세요"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={submitted && !!errors.name}
                helperText={submitted ? errors.name : ""}
                sx={{ minHeight: "72px" }}
              />
            </Grid>

            {/* 생년월일 */}
            <Grid item xs={12}>
              <TextField
                inputRef={setFieldRef("birthDate")}
                label="생년월일 (YYYYMMDD)"
                placeholder="예) 19991231"
                fullWidth
                value={birthDate}
                onChange={(e) =>
                  setBirthDate(e.target.value.replace(/[^\d]/g, "").slice(0, 8))
                }
                inputProps={{
                  inputMode: "numeric",
                  pattern: "\\d{8}",
                  maxLength: 8,
                }}
                error={submitted && !!errors.birthDate}
                helperText={submitted ? errors.birthDate : ""}
                sx={{ minHeight: "72px" }}
              />
            </Grid>

            {/* 성별 */}
            <Grid item xs={12}>
              <FormControl
                fullWidth
                error={submitted && !!errors.gender}
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

            {/* 응답자(내담자) */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 600 }}>
                응답자(내담자)
              </Typography>
              <RadioGroup
                value={respondent}
                onChange={(e) => setRespondent(e.target.value)}
              >
                <FormControlLabel
                  value="환자"
                  control={<Radio inputRef={setFieldRef("respondent")} />}
                  label="환자"
                />
                <FormControlLabel
                  value="직원의 도움으로"
                  control={<Radio />}
                  label="직원의 도움으로"
                />
                <FormControlLabel
                  value="가족/친구/돌봄 제공자"
                  control={<Radio />}
                  label="환자의 가족, 친구 또는 돌봄 제공자(사회복지사, 사례관리사, 요양보호사, 간병인 등)"
                />
              </RadioGroup>
              {errors.respondent && (
                <FormHelperText error>{errors.respondent}</FormHelperText>
              )}
            </Grid>

            {/* 거주지 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 600 }}>
                거주지
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    inputRef={setFieldRef("residenceActual")}
                    label="실제 거주시 (주소)"
                    placeholder="예: 서울특별시 강남구 ..."
                    fullWidth
                    value={residenceActual}
                    onChange={(e) => setResidenceActual(e.target.value)}
                    error={submitted && !!errors.residenceActual}
                    helperText={errors.residenceActual}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* 결혼 상태 (사진 문구 반영) */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 600 }}>
                결혼상태
              </Typography>
              <FormControl
                fullWidth
                error={submitted && !!errors.maritalStatus}
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
                  <MenuItem value="기혼(사실혼 포함)">
                    기혼(사실혼 포함)
                  </MenuItem>
                  <MenuItem value="동거(파트너 또는 애인)">
                    동거(파트너 또는 애인)
                  </MenuItem>
                  <MenuItem value="사별">사별</MenuItem>
                  <MenuItem value="별거">별거</MenuItem>
                  <MenuItem value="이혼">이혼</MenuItem>
                </Select>
                <FormHelperText>{errors.maritalStatus}</FormHelperText>
              </FormControl>
            </Grid>

            {/* 가구 형태 / 동거인 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 600 }}>
                가구 형태 / 동거인 (해당하는 모든 항목 선택)
              </Typography>
              <FormGroup>
                {FAMILY_OPTIONS.map((opt) => (
                  <FormControlLabel
                    key={opt}
                    control={
                      <Checkbox
                        checked={familyComposition.includes(opt)}
                        onChange={(e, checked) => toggleFamily(e, checked)}
                        value={opt}
                        size="small"
                      />
                    }
                    label={opt}
                    sx={{ my: 0.25 }}
                  />
                ))}
              </FormGroup>
              {familyComposition.includes("기타") && (
                <TextField
                  inputRef={setFieldRef("familyOther")}
                  fullWidth
                  label="가구 형태 (기타)"
                  placeholder="기타 동거 형태를 입력하세요"
                  value={familyOther}
                  onChange={(e) => setFamilyOther(e.target.value)}
                  sx={{ mt: 1 }}
                  error={submitted && !!errors.familyOther}
                  helperText={errors.familyOther}
                />
              )}
              {errors.familyComposition && (
                <FormHelperText error>
                  {errors.familyComposition}
                </FormHelperText>
              )}
            </Grid>

            {/* 종교 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 600 }}>
                종교
              </Typography>
              <FormControl fullWidth>
                <InputLabel>종교</InputLabel>
                <Select
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  label="종교"
                >
                  <MenuItem value="무교">무교</MenuItem>
                  <MenuItem value="개신교">개신교</MenuItem>
                  <MenuItem value="천주교">천주교</MenuItem>
                  <MenuItem value="불교">불교</MenuItem>
                  <MenuItem value="기타">기타</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* 주거형태 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 600 }}>
                주거형태
              </Typography>
              <FormControl
                fullWidth
                error={submitted && !!errors.housingType}
                sx={{ minHeight: "72px" }}
              >
                <InputLabel>주거형태</InputLabel>
                <Select
                  value={housingType}
                  onChange={(e) => setHousingType(e.target.value)}
                  label="주거형태"
                >
                  <MenuItem value="개인주택/아파트/빌라/전·월세(개인 소유 여부에 상관없이)">
                    개인주택/아파트/빌라/전·월세(개인 소유 여부에 상관없이)
                  </MenuItem>
                  <MenuItem value="사회복지시설(정신보건/신체/지적장애 그룹홈 등)">
                    사회복지시설(정신보건/신체/지적장애 그룹홈 등)
                  </MenuItem>
                  <MenuItem value="장기요양시설(요양원)">
                    장기요양시설(요양원)
                  </MenuItem>
                  <MenuItem value="시니어타운">시니어타운</MenuItem>
                  <MenuItem value="기타">기타</MenuItem>
                </Select>
                <FormHelperText>{errors.housingType}</FormHelperText>
              </FormControl>
              {housingType === "기타" && (
                <TextField
                  inputRef={setFieldRef("housingTypeOther")}
                  fullWidth
                  label="주거형태 (기타)"
                  placeholder="주거형태를 입력하세요"
                  value={housingTypeOther}
                  onChange={(e) => setHousingTypeOther(e.target.value)}
                  sx={{ mt: 1 }}
                  error={submitted && !!errors.housingTypeOther}
                  helperText={errors.housingTypeOther}
                />
              )}
            </Grid>

            {/* 장애여부 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 600 }}>
                장애여부
              </Typography>
              <FormControl
                fullWidth
                error={submitted && !!errors.disability}
                sx={{ minHeight: "72px" }}
              >
                <InputLabel>장애 여부</InputLabel>
                <Select
                  value={disability}
                  onChange={(e) => setDisability(e.target.value)}
                  label="장애 여부"
                >
                  <MenuItem value="있다">있다</MenuItem>
                  <MenuItem value="없다">없다</MenuItem>
                </Select>
                <FormHelperText>{errors.disability}</FormHelperText>
              </FormControl>
              {disability === "예" && (
                <TextField
                  inputRef={setFieldRef("disabilityDetails")}
                  fullWidth
                  label="장애 관련 세부 내용"
                  placeholder="장애 유형/등급 등"
                  value={disabilityDetails}
                  onChange={(e) => setDisabilityDetails(e.target.value)}
                  sx={{ mt: 1 }}
                  error={submitted && !!errors.disabilityDetails}
                  helperText={errors.disabilityDetails}
                />
              )}
            </Grid>

            {/* 의료보장 유형 (복수 선택 가능) */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 600 }}>
                의료보장 유형 (해당하는 모든 항목 선택)
              </Typography>
              <FormGroup>
                {[
                  { value: "건강보험", label: "국민건강보험" },
                  { value: "차상위", label: "차상위" },
                  { value: "의료급여", label: "의료급여" },
                  { value: "일반", label: "일반" },
                ].map((opt) => (
                  <FormControlLabel
                    key={opt.value}
                    control={
                      <Checkbox
                        checked={Array.isArray(insuranceType) ? insuranceType.includes(opt.value) : insuranceType === opt.value}
                        onChange={(e, checked) => {
                          setInsuranceType((prev) => {
                            const arr = Array.isArray(prev) ? prev : (prev ? [prev] : []);
                            return checked
                              ? arr.includes(opt.value) ? arr : [...arr, opt.value]
                              : arr.filter((v) => v !== opt.value);
                          });
                        }}
                        size="small"
                      />
                    }
                    label={opt.label}
                    sx={{ my: 0.25 }}
                  />
                ))}
              </FormGroup>
              {submitted && errors.insuranceType && (
                <FormHelperText error>{errors.insuranceType}</FormHelperText>
              )}
            </Grid>

            {/* 지불재원 (복수 선택 가능) */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 600 }}>
                지불재원 (해당하는 모든 항목 선택)
              </Typography>
              <FormGroup>
                {/* 본인 부담 */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Array.isArray(paymentSource) && paymentSource.includes("본인 부담")}
                      onChange={(e, checked) => {
                        setPaymentSource((prev) => {
                          const arr = Array.isArray(prev) ? prev : [];
                          return checked
                            ? arr.includes("본인 부담") ? arr : [...arr, "본인 부담"]
                            : arr.filter((v) => v !== "본인 부담");
                        });
                      }}
                      size="small"
                    />
                  }
                  label="본인 부담"
                  sx={{ my: 0.25 }}
                />

                {/* 민간보험 */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Array.isArray(paymentSource) && paymentSource.includes("민간보험")}
                      onChange={(e, checked) => {
                        setPaymentSource((prev) => {
                          const arr = Array.isArray(prev) ? prev : [];
                          if (checked) {
                            return arr.includes("민간보험") ? arr : [...arr, "민간보험"];
                          } else {
                            setPrivateInsuranceType([]);
                            return arr.filter((v) => v !== "민간보험");
                          }
                        });
                      }}
                      size="small"
                    />
                  }
                  label="민간보험"
                  sx={{ my: 0.25 }}
                />
                {/* 민간보험 하위 선택지 - 들여쓰기 */}
                {Array.isArray(paymentSource) && paymentSource.includes("민간보험") && (
                  <Box sx={{ ml: 4, mb: 1 }}>
                    <FormGroup row>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Array.isArray(privateInsuranceType) && privateInsuranceType.includes("실손 보험")}
                            onChange={(e, checked) => {
                              setPrivateInsuranceType((prev) => {
                                const arr = Array.isArray(prev) ? prev : [];
                                return checked
                                  ? arr.includes("실손 보험") ? arr : [...arr, "실손 보험"]
                                  : arr.filter((v) => v !== "실손 보험");
                              });
                            }}
                            size="small"
                          />
                        }
                        label="실손 보험"
                        sx={{ my: 0 }}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Array.isArray(privateInsuranceType) && privateInsuranceType.includes("보장성 보험")}
                            onChange={(e, checked) => {
                              setPrivateInsuranceType((prev) => {
                                const arr = Array.isArray(prev) ? prev : [];
                                return checked
                                  ? arr.includes("보장성 보험") ? arr : [...arr, "보장성 보험"]
                                  : arr.filter((v) => v !== "보장성 보험");
                              });
                            }}
                            size="small"
                          />
                        }
                        label="보장성 보험"
                        sx={{ my: 0 }}
                      />
                    </FormGroup>
                    {errors.privateInsuranceType && (
                      <FormHelperText error sx={{ ml: 0 }}>{errors.privateInsuranceType}</FormHelperText>
                    )}
                  </Box>
                )}

                {/* 국가 및 민간 지원금 */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Array.isArray(paymentSource) && paymentSource.includes("국가 및 민간 지원금")}
                      onChange={(e, checked) => {
                        setPaymentSource((prev) => {
                          const arr = Array.isArray(prev) ? prev : [];
                          return checked
                            ? arr.includes("국가 및 민간 지원금") ? arr : [...arr, "국가 및 민간 지원금"]
                            : arr.filter((v) => v !== "국가 및 민간 지원금");
                        });
                      }}
                      size="small"
                    />
                  }
                  label="국가 및 민간 지원금"
                  sx={{ my: 0.25 }}
                />

                {/* 기타 */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Array.isArray(paymentSource) && paymentSource.includes("기타")}
                      onChange={(e, checked) => {
                        setPaymentSource((prev) => {
                          const arr = Array.isArray(prev) ? prev : [];
                          if (checked) {
                            return arr.includes("기타") ? arr : [...arr, "기타"];
                          } else {
                            setOtherPaymentSource("");
                            return arr.filter((v) => v !== "기타");
                          }
                        });
                      }}
                      size="small"
                    />
                  }
                  label="기타"
                  sx={{ my: 0.25 }}
                />
                {/* 기타 하위 입력 - 들여쓰기 */}
                {Array.isArray(paymentSource) && paymentSource.includes("기타") && (
                  <Box sx={{ ml: 4, mb: 1 }}>
                    <TextField
                      inputRef={setFieldRef("otherPaymentSource")}
                      fullWidth
                      size="small"
                      label="기타 지불재원"
                      placeholder="지불재원을 입력하세요"
                      value={otherPaymentSource}
                      onChange={(e) => setOtherPaymentSource(e.target.value)}
                      error={submitted && !!errors.otherPaymentSource}
                      helperText={errors.otherPaymentSource}
                    />
                  </Box>
                )}
              </FormGroup>
              {errors.paymentSource && (
                <FormHelperText error>{errors.paymentSource}</FormHelperText>
              )}
            </Grid>
          </Grid>

          {/* 하단 버튼 */}
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
