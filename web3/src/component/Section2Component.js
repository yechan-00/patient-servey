// src/component/Section2Component.js
import React from "react";
import {
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  Typography,
  Checkbox,
  FormGroup,
  TextField,
  InputAdornment,
} from "@mui/material";

const Section2Component = ({
  patientId,
  answers,
  setAnswers,
  missingQuestions = [],
}) => {
  // ===== 핸들러 =====
  const handleChange = (e) => {
    const { name: questionId, value } = e.target;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleCheck = (qid, value) => (e) => {
    const checked = e.target.checked;
    setAnswers((prev) => {
      const cur = Array.isArray(prev[qid]) ? prev[qid] : [];
      const next = checked
        ? [...new Set([...cur, value])]
        : cur.filter((v) => v !== value);
      return { ...prev, [qid]: next };
    });
  };

  const handleNumber = (name) => (e) => {
    const v = e.target.value.replace(/[^\d]/g, "");
    setAnswers((prev) => ({ ...prev, [name]: v }));
  };

  const handleText = (name) => (e) => {
    setAnswers((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleSlider = (qid) => (_e, value) => {
    setAnswers((prev) => ({ ...prev, [qid]: String(value) }));
  };

  const isMissingAny = (...ids) =>
    ids.some((id) => missingQuestions.includes(id));
  const isSelected = (qid, val) =>
    Array.isArray(answers[qid]) ? answers[qid].includes(val) : false;

  // ===== 공통 옵션 =====
  const defaultOptions = [
    { value: "1", label: "전혀 그렇지 않다" },
    { value: "2", label: "약간 그렇지 않다" },
    { value: "3", label: "보통이다" },
    { value: "4", label: "약간 그렇다" },
    { value: "5", label: "매우 그렇다" },
  ];

  const incomeOptions = [
    { value: "lt40", label: "40% 미만" },
    { value: "lt50", label: "50% 미만" },
    { value: "lt75", label: "75% 미만" },
    { value: "lt100", label: "100% 미만" },
    { value: "lt200", label: "200% 미만" },
    { value: "gte200", label: "200% 이상" },
  ];

  const housingConcernOptions = [
    {
      value: "healthEnv",
      label: "건강에 위험한 주거 환경(난방/누수/위생 문제)",
    },
    {
      value: "maintenance",
      label: "장기적으로 안심하고 살 수 있는 곳의 부족(빈번한 이사 등)",
    }, // 오타 수정
    { value: "cost", label: "대출금/월세/공과금 지불의 어려움" },
    {
      value: "safety",
      label:
        "안전하지 않다는 느낌(누군가 집에 침입할 수 있는 위험, 폭력의 두려움 등)",
    },
    { value: "other", label: "기타" },
  ];

  // q15: 일을 하고 있다 → 라디오 4개 (단일 선택)
  const workingDetailOptions = [
    { value: "keep_work", label: "암 진단 후 근로 계속" },
    { value: "leave_or_sick", label: "암 진단 후 휴직 또는 휴업 상태" },
    { value: "contract_end", label: "암 진단 후 이직 또는 업종 변경" },
    { value: "quit_planned", label: "암 진단 후 퇴사 예정" },
  ];

  // q15: 일을 하고 있지 않다 → 체크박스 3개 (복수 선택)
  const notWorkingReasonOptions = [
    { value: "never_work", label: "암 진단 전에도 일을 하지 않았음" },
    { value: "quit_after_dx", label: "암 진단 후 퇴사 또는 자영업 그만둠" },
    { value: "other", label: "기타" }, // '기타' 선택 시 텍스트 입력
  ];

  // q18: 돌봄 대상(복수 선택) — 필요 시 q18 하위에 재활용 가능
  const caregiverTargetOptions = [
    { value: "child", label: "18세 미만의 아동" },
    { value: "elder", label: "만 65세 이상의 노인" },
    { value: "disabled", label: "장애가 있는 사람" },
    { value: "other", label: "기타" },
  ];

  // ===== 질문 배열 (order로 정렬) =====
  // type: 'income-combo' | 'checkbox' | 'radio' | 'slider' | 'yn-with-details'
  const questions = [
    {
      id: "q1",
      order: 1,
      type: "income-combo",
      label:
        "1. 월 평균 가구 소득은 무엇입니까? (금액/가구원 수 입력 후 구간 선택)",
      options: incomeOptions,
    },
    {
      id: "q2",
      order: 2,
      type: "checkbox",
      label:
        "2. 최근 3개월 동안 다음 항목 중 하나라도 지불하는 데 어려움이 있었습니까? (복수 선택)",
      options: [
        { value: "food", label: "음식" },
        { value: "home", label: "주거" },
        { value: "utilitybills", label: "공과금" },
        { value: "medical", label: "의료비" },
        { value: "transport", label: "교통" },
        { value: "Caringresponsibility", label: "돌봄책임" },
        { value: "debtor", label: "채무" },
        { value: "other", label: "기타" },
        { value: "none", label: "해당 사항 없음" },
      ],
    },
    {
      id: "q3",
      order: 3,
      type: "radio",
      label: "3. 얼마나 자주 외롭거나 주변으로부터 고립되어 있다고 느낍니까?",
      options: [
        { value: "never", label: "전혀 느끼지 않는다" },
        { value: "some", label: "조금 느낀다" },
        { value: "often", label: "자주 느낀다" },
        { value: "always", label: "항상 느낀다" },
      ],
    },
    {
      id: "q4",
      order: 4,
      type: "radio",
      label: "4. (최근 3개월) 친한 사람들과 얼마나 자주 만나거나 이야기합니까?",
      options: [
        { value: "m1", label: "월 1회 미만" },
        { value: "w1_2", label: "주 1–2회" },
        { value: "w3_4", label: "주 3–4회" },
        { value: "w5p", label: "주 5일 이상" },
      ],
    },
    {
      id: "q5",
      order: 5,
      type: "slider",
      label: "5. 지난 일주일 동안 경험한 디스트레스는 어느 정도입니까?",
      slider: {
        min: 1,
        max: 10,
        step: 1,
        help: "1=전혀 힘들지 않다 · 10=몹시 힘들다",
      },
    },
    {
      id: "q6",
      order: 6,
      type: "radio",
      label:
        "6. 현재 주거 상황을 가장 잘 설명하는 것은 무엇입니까? (하나만 선택)",
      options: [
        { value: "alone", label: "본인 집에서 혼자 생활" },
        { value: "withFamily", label: "다른 사람(가족/룸메이트)과 함께 거주" },
        { value: "relativeTemp", label: "친지·친구 집에서 임시 생활" },
        { value: "shelter", label: "쉼터/보호시설/고시원 등에서 임시 생활" },
        { value: "facility", label: "요양병원/보호 시설 등에서 생활" },
      ],
    },
    {
      id: "q7",
      order: 7,
      type: "yn-with-details",
      label:
        "7. 주거 환경, 안전, 그리고 비용과 같이 현재 생활하는 곳에 대해 염려하는 부분이 있습니까?",
      detailId: "q7Details",
      detailLabel: "염려되는 항목을 모두 선택해 주세요. (복수 선택)",
      detailOptions: housingConcernOptions, // 포함: other
      otherKey: "q7Other", // 기타 텍스트 저장 키
    },
    {
      id: "q8",
      order: 8,
      type: "checkbox",
      label: "8. 교통편 부족을 경험했다면, 그 이유는 무엇입니까? (복수 선택)",
      options: [
        { value: "차량없음", label: "개인적으로 소유한 차량이 없음" },
        {
          value: "운전할사람x",
          label: "누군가 운전을 해서 데려다 줄 사람(가족,친구,이웃 등)이 없음",
        },
        { value: "교통비부담", label: "교통비가 부담스러움" },
        { value: "대중교통어려움", label: "대중 교통 환승의 어려움이 있음" },
        {
          value: "교통약자서비스자격x",
          label: "교통 약자 서비스 이용을 위한 자격 요건이 되지 않음",
        },
        { value: "other", label: "기타" },
        { value: "none", label: "해당 사항 없음" },
      ],
      otherKey: "q8Other",
    },
    // 정보이해
    {
      id: "q9",
      order: 9,
      type: "radio",
      label: "최종학력은 무엇입니까?",
      options: [
        { value: "무학", label: "무학" },
        { value: "초졸", label: "초졸" },
        { value: "중졸", label: "중졸" },
        { value: "고졸", label: "고졸" },
        { value: "대졸", label: "대졸" },
        { value: "대졸 이상", label: "대졸 이상" },
      ],
    },
    {
      id: "q10",
      order: 10,
      type: "radio",
      label: "전문의·의사/약사가 제공한 문서를 읽을 때 도움 필요 정도는?",
      options: [
        { value: "0", label: "전혀 필요하지 않았다(0점)" },
        { value: "1", label: "조금 필요했다(1점)" },
        { value: "2", label: "때때로 필요했다(2점)" },
        { value: "3", label: "대체로 필요했다(3점)" },
        { value: "4", label: "항상 필요했다(4점)" },
      ],
    },
    {
      id: "q11",
      order: 11,
      type: "radio",
      label: "디지털 숙련도는 어느정도인가요?",
      options: [
        { value: "제한적", label: "제한적" },
        { value: "제한적이지 않음", label: "제한적이지 않음" },
      ],
    },
    // 폭력
    {
      id: "q12",
      order: 12,
      type: "radio",
      label:
        "최근 3개월 이내에, 가족과 친구를 포함한 누구든 당신에게 신체적인 폭력을 행사한 적이 있나요?",
      options: [
        { value: "없다", label: "없다" },
        { value: "드물게 있다", label: "드물게 있다" },
        { value: "때때로 있다", label: "때때로 있다" },
        { value: "자주 있다", label: "자주 있다" },
        { value: "항상 있다", label: "항상 있다" },
      ],
    },
    {
      id: "q13",
      order: 13,
      type: "radio",
      label:
        "최근 3개월 이내에, 가족과 친구를 포함한 누구든 당신에게 욕설 등 언어적 폭력을 사용한 적이 있나요?",
      options: [
        { value: "없다", label: "없다" },
        { value: "드물게 있다", label: "드물게 있다" },
        { value: "때때로 있다", label: "때때로 있다" },
        { value: "자주 있다", label: "자주 있다" },
        { value: "항상 있다", label: "항상 있다" },
      ],
    },
    {
      id: "q14",
      order: 14,
      type: "radio",
      label:
        "최근 3개월 이내에, 가족과 친구를 포함한 누구든 당신에게 위협을 가한 적이 있나요?",
      options: [
        { value: "없다", label: "없다" },
        { value: "드물게 있다", label: "드물게 있다" },
        { value: "때때로 있다", label: "때때로 있다" },
        { value: "자주 있다", label: "자주 있다" },
        { value: "항상 있다", label: "항상 있다" },
      ],
    },
    // 고용(메인)
    {
      id: "q15",
      order: 15,
      type: "radio",
      label: "현재 고용 현황은 무엇입니까?",
      options: [
        { value: "working", label: "일을 하고 있다" },
        { value: "notWorking", label: "일을 하고 있지 않다" },
      ],
    },
    // q15 하위: working → 라디오
    {
      id: "q15_working_detail_block",
      order: 15.1,
      type: "yn-with-details",
      label: "", // 추가 제목 X
      mainId: "q15",
      triggerValue: "working",
      detailType: "radio",
      detailId: "q15_working_detail",
      detailOptions: workingDetailOptions,
    },
    // q15 하위: notWorking → 체크박스(+기타)
    {
      id: "q15_notWorking_reasons_block",
      order: 15.2,
      type: "yn-with-details",
      label: "", // 추가 제목 X
      mainId: "q15",
      triggerValue: "notWorking",
      detailType: "radio",
      detailId: "q15_notWorking_reasons",
      detailOptions: notWorkingReasonOptions,
      otherKey: "q15_notWorking_other",
    },
    // 사회적 지원
    {
      id: "q16",
      order: 16,
      type: "radio",
      label: "도움이 필요할 때, 연락할 수 있는 사람이 있나요?",
      options: [
        { value: "Y", label: "예" },
        { value: "N", label: "아니요" },
      ],
    },
    {
      id: "q17",
      order: 17,
      type: "radio",
      label:
        "필요한 경우, 통원 시 동행 혹은 퇴원 후 간병(식사준비 등)을 해줄 사람이 있나요?",
      options: [
        { value: "Y", label: "예" },
        { value: "N", label: "아니요" },
      ],
    },
    // 돌봄책임
    {
      id: "q18",
      order: 18,
      type: "radio",
      label: "가족 중 누군가를 보살피는 가족 돌봄 제공자인가요?",
      options: [
        { value: "Y", label: "예" },
        { value: "N", label: "아니요" },
      ],
    },
    // q18 하위: 예 선택 시 체크박스 4개
    {
      id: "q18_yes_details_block",
      order: 18.1,
      type: "yn-with-details",
      label: "", // 추가 제목 X
      mainId: "q18",
      triggerValue: "Y",
      detailType: "checkbox",
      detailId: "q18Details",
      detailLabel: "돌봄 대상자를 모두 선택해 주세요. (복수 선택)",
      detailOptions: caregiverTargetOptions,
      otherKey: "q18Other",
    },
  ];

  // ===== 체크박스 렌더러 ('기타' 인라인 텍스트) =====
  const noOtherTextSet = new Set(["q2"]);
  const renderCheckboxWithInlineOther = (qid, opts, otherKey) => {
    return (
      <FormGroup sx={{ mt: 0.5 }}>
        {(opts || []).map((opt) => {
          const checked = (answers[qid] || []).includes(opt.value);
          const isOther = opt.value === "other";
          const showOther = isOther && checked;
          const otherStorageKey = otherKey || `${qid}Other`;

          return (
            <Box key={opt.value} sx={{ mb: showOther ? 1.5 : 0.2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    checked={checked}
                    onChange={handleCheck(qid, opt.value)}
                  />
                }
                label={
                  <Box sx={{ display: "block", width: "100%" }}>
                    {opt.label}
                    {showOther && !noOtherTextSet.has(qid) && (
                      <Box
                        sx={{ mt: 1 }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TextField
                          fullWidth
                          label="기타 내용"
                          placeholder="자세한 내용을 입력해 주세요"
                          value={answers[otherStorageKey] || ""}
                          onChange={handleText(otherStorageKey)}
                        />
                      </Box>
                    )}
                  </Box>
                }
                sx={{
                  alignItems: "flex-start",
                  width: "100%",
                  ".MuiFormControlLabel-label": { width: "100%" },
                }}
              />
            </Box>
          );
        })}
      </FormGroup>
    );
  };

  const renderQuestion = (q) => {
    // 기본 미싱: yn-with-details는 아래에서 별도 처리
    const missing =
      q.type === "income-combo"
        ? isMissingAny("q1", "q1Amount", "q1Household")
        : q.type === "yn-with-details"
        ? false
        : missingQuestions.includes(q.id);

    const wrapperSx = {
      mb: 3,
      ...(missing && {
        border: "2px solid #f44336",
        borderRadius: 1,
        p: 2,
        backgroundColor: "#ffebee",
      }),
    };

    switch (q.type) {
      case "income-combo":
        return (
          <FormControl
            key={q.id}
            component="fieldset"
            fullWidth
            sx={wrapperSx}
            id={q.id}
          >
            <FormLabel
              component="legend"
              sx={{
                fontWeight: "bold",
                color: missing ? "error.main" : "primary.main",
                mb: 1,
              }}
            >
              {q.label}
              {missing && (
                <Box
                  component="span"
                  sx={{ color: "error.main", fontWeight: "bold", ml: 1 }}
                >
                  ※ 필수 응답
                </Box>
              )}
            </FormLabel>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
              <TextField
                type="tel"
                label="월평균 가구 소득"
                placeholder="예) 250"
                value={answers.q1Amount || ""}
                onChange={handleNumber("q1Amount")}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">만원</InputAdornment>
                  ),
                }}
                sx={{ width: 220 }}
              />
              <TextField
                type="tel"
                label="가구원 수"
                placeholder="예) 3"
                value={answers.q1Household || ""}
                onChange={handleNumber("q1Household")}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">인</InputAdornment>
                  ),
                }}
                sx={{ width: 180 }}
              />
            </Box>

            <FormLabel sx={{ fontWeight: 600, mb: 0.5 }}>
              중위소득 기준 구간
            </FormLabel>
            <RadioGroup
              name="q1"
              value={answers.q1 || ""}
              onChange={handleChange}
            >
              {(q.options || incomeOptions).map((opt) => (
                <FormControlLabel
                  key={opt.value}
                  value={opt.value}
                  control={<Radio color="primary" />}
                  label={opt.label}
                  sx={{ my: 0.2, width: "500px" }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case "checkbox":
        return (
          <FormControl
            key={q.id}
            component="fieldset"
            fullWidth
            sx={wrapperSx}
            id={q.id}
          >
            <FormLabel
              component="legend"
              sx={{
                fontWeight: "bold",
                color: missing ? "error.main" : "primary.main",
                mb: 1,
              }}
            >
              {q.label}
              {missing && (
                <Box
                  component="span"
                  sx={{ color: "error.main", fontWeight: "bold", ml: 1 }}
                >
                  ※ 필수 응답
                </Box>
              )}
            </FormLabel>
            {renderCheckboxWithInlineOther(q.id, q.options || [], q.otherKey)}
          </FormControl>
        );

      case "radio":
        return (
          <FormControl
            key={q.id}
            component="fieldset"
            fullWidth
            sx={wrapperSx}
            id={q.id}
          >
            <FormLabel
              component="legend"
              sx={{
                fontWeight: "bold",
                color: missing ? "error.main" : "primary.main",
                mb: 1,
              }}
            >
              {q.label}
              {missing && (
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
              {(q.options || defaultOptions).map((opt) => (
                <FormControlLabel
                  key={opt.value}
                  value={opt.value}
                  control={<Radio color="primary" />}
                  label={opt.label}
                  sx={{ my: 0.5 }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case "slider":
        return (
          <FormControl
            key={q.id}
            component="fieldset"
            fullWidth
            sx={wrapperSx}
            id={q.id}
          >
            <FormLabel
              component="legend"
              sx={{
                fontWeight: "bold",
                color: missing ? "error.main" : "primary.main",
                mb: 1,
              }}
            >
              {q.label}
              {q.slider?.help && (
                <Box component="span" sx={{ ml: 1, color: "text.secondary" }}>
                  {q.slider.help}
                </Box>
              )}
              {missing && (
                <Box
                  component="span"
                  sx={{ color: "error.main", fontWeight: "bold", ml: 1 }}
                >
                  ※ 필수 응답
                </Box>
              )}
            </FormLabel>
            <Box sx={{ px: 1, mt: 2 }}>
              <Slider
                value={Number(answers[q.id] || q.slider?.min || 1)}
                min={q.slider?.min ?? 1}
                max={q.slider?.max ?? 10}
                step={q.slider?.step ?? 1}
                marks
                valueLabelDisplay="on"
                onChange={handleSlider(q.id)}
                aria-label="슬라이더 문항"
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                마우스나 손가락으로 드래그하면 바뀌어져요 &nbsp;&nbsp;현재 점수:{" "}
                {answers[q.id] || String(q.slider?.min ?? 1)}
                {q.slider?.max ? ` / ${q.slider.max}` : ""}
              </Typography>
            </Box>
          </FormControl>
        );

      case "yn-with-details": {
        // === 확장: mainId/triggerValue/detailType 지원 (q7은 기본 Y/N) ===
        const mainKey = q.mainId || q.id; // 기본은 자기 자신(q7)
        const trigger = q.triggerValue ?? "Y"; // 기본은 'Y'일 때 세부 열림
        const showDetails = answers[mainKey] === trigger;
        const isSubBlock = mainKey !== q.id; // 하위 블록인지 여부

        // 세부 응답 비었는지
        const detailsEmpty =
          !answers[q.detailId] ||
          (Array.isArray(answers[q.detailId]) &&
            answers[q.detailId].length === 0);

        // 미싱: 메인 비었거나, 펼친 상태인데 세부가 비었을 때
        // 하위 블록인 경우 미싱 표시하지 않음 (부모 질문에서 검증)
        const localMissing = isSubBlock
          ? false
          : !answers[mainKey] || (showDetails && detailsEmpty);

        const localWrapperSx = {
          mb: 3,
          ...(localMissing && {
            border: "2px solid #f44336",
            borderRadius: 1,
            p: 2,
            backgroundColor: "#ffebee",
          }),
        };

        return (
          <FormControl
            key={q.id}
            component="fieldset"
            fullWidth
            sx={localWrapperSx}
            id={q.id}
          >
            {/* 라벨: 비어있으면 숨기고, 미싱이면 안내만 */}
            {q.label ? (
              <FormLabel
                component="legend"
                sx={{
                  fontWeight: "bold",
                  color: localMissing ? "error.main" : "primary.main",
                  mb: 1,
                }}
              >
                {q.label}
                {localMissing && (
                  <Box
                    component="span"
                    sx={{ color: "error.main", fontWeight: "bold", ml: 1 }}
                  >
                    ※ 필수 응답
                  </Box>
                )}
              </FormLabel>
            ) : (
              localMissing && (
                <Box sx={{ color: "error.main", fontWeight: "bold", mb: 1 }}>
                  ※ 필수 응답
                </Box>
              )
            )}

            {/* 메인 컨트롤: q7처럼 자기 자신이 메인일 때만(Y/N) 노출 */}
            {mainKey === q.id && (
              <RadioGroup
                name={q.id}
                value={answers[q.id] || ""}
                onChange={handleChange}
                row
              >
                <FormControlLabel
                  value="Y"
                  control={<Radio color="primary" />}
                  label="예"
                />
                <FormControlLabel
                  value="N"
                  control={<Radio color="primary" />}
                  label="아니오"
                />
              </RadioGroup>
            )}

            {/* 세부 컨트롤: 트리거 값일 때만 노출 */}
            {showDetails && (
              <>
                {q.detailLabel && (
                  <FormLabel
                    sx={{
                      fontWeight: 600,
                      color: "text.primary",
                      mb: 1,
                      mt: mainKey === q.id ? 2 : 0,
                    }}
                  >
                    {q.detailLabel}
                  </FormLabel>
                )}
                {q.detailType === "radio" ? (
                  <RadioGroup
                    name={q.detailId}
                    value={answers[q.detailId] || ""}
                    onChange={handleChange}
                  >
                    {(q.detailOptions || []).map((opt) => (
                      <FormControlLabel
                        key={opt.value}
                        value={opt.value}
                        control={<Radio color="primary" />}
                        label={opt.label}
                      />
                    ))}
                  </RadioGroup>
                ) : (
                  renderCheckboxWithInlineOther(
                    q.detailId,
                    q.detailOptions || [],
                    q.otherKey
                  )
                )}
              </>
            )}
          </FormControl>
        );
      }

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "background.paper",
        p: 3,
        borderRadius: 2,
        boxShadow: 1,
      }}
    >
      {questions
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((q) => renderQuestion(q))}
    </Box>
  );
};

export default Section2Component;
