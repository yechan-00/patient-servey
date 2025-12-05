// src/component/Section2Component.js
import React, { useEffect } from "react";
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
  section1Answers = {}, // Section1 답변을 받아서 조건부 렌더링
}) => {
  // Section1 답변에 따른 카테고리별 표시 여부 계산
  const showCategory = {
    재정: section1Answers.q1 === "예" || section1Answers.q7 === "예", // 공과금(q7)과 재정(q1) 통합
    사회적고립: section1Answers.q2 === "예",
    정신건강: section1Answers.q3 === "예",
    주거: section1Answers.q4 === "예",
    음식: section1Answers.q5 === "예",
    교통: section1Answers.q6 === "예",
    정보이해: section1Answers.q8 === "예",
    폭력: section1Answers.q9 === "예",
    고용: section1Answers.q10 === "예",
    사회적지원: section1Answers.q11 === "예",
    돌봄책임: section1Answers.q12 === "예",
  };

  // 슬라이더(q5) 초기값 설정: 정신건강 카테고리가 활성화되고 q5가 없으면 "1"로 초기화
  useEffect(() => {
    if (showCategory.정신건강 && !answers.q5) {
      setAnswers((prev) => ({ ...prev, q5: "1" }));
    }
  }, [showCategory.정신건강, answers.q5, setAnswers]);

  // ===== 핸들러 =====
  const handleChange = (e) => {
    const { name: questionId, value } = e.target;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // radio-with-sub 전용 핸들러: 상위 선택 변경 시 모든 하위 선택지 초기화
  const handleRadioWithSubChange = (questionId, options) => (e) => {
    const { value } = e.target;
    setAnswers((prev) => {
      const newAnswers = { ...prev, [questionId]: value };
      
      // 모든 옵션의 하위 선택지 초기화
      options.forEach((opt) => {
        if (opt.subId) {
          newAnswers[opt.subId] = opt.subType === "checkbox" ? [] : "";
        }
        if (opt.subOtherKey) {
          newAnswers[opt.subOtherKey] = "";
        }
      });
      
      return newAnswers;
    });
  };

  // yn-with-details 전용 핸들러: 예/아니오 변경 시 하위 선택지 초기화
  const handleYnWithDetailsChange = (questionId, detailId, otherKey) => (e) => {
    const { value } = e.target;
    setAnswers((prev) => {
      const newAnswers = { ...prev, [questionId]: value };
      
      // 하위 선택지 초기화
      if (detailId) {
        newAnswers[detailId] = [];
      }
      if (otherKey) {
        newAnswers[otherKey] = "";
      }
      
      return newAnswers;
    });
  };

  const handleCheck = (qid, value) => (e) => {
    const checked = e.target.checked;
    setAnswers((prev) => {
      const cur = Array.isArray(prev[qid]) ? prev[qid] : [];
      
      // "해당 사항 없음"(none)을 선택한 경우 다른 선택지 모두 해제
      if (value === "none" && checked) {
        return { ...prev, [qid]: ["none"] };
      }
      
      // 다른 선택지를 선택한 경우 "해당 사항 없음" 해제
      let next = checked
        ? [...new Set([...cur.filter((v) => v !== "none"), value])]
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
  // category: Section1과 연동되는 카테고리
  const questions = [
    // 재정 카테고리 (Section1 q1="예" OR q7="예")
    {
      id: "q1",
      order: 1,
      type: "income-combo",
      category: "재정",
      label:
        "월 평균 가구 소득은 무엇입니까? (금액/가구원 수 입력 후 구간 선택)",
      options: incomeOptions,
    },
    {
      id: "q2",
      order: 2,
      type: "checkbox",
      category: "재정",
      label:
        "최근 3개월 동안 다음 항목 중 하나라도 지불하는 데 어려움이 있었습니까? (복수 선택)",
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
    // 사회적 고립 카테고리 (Section1 q2="예")
    {
      id: "q3",
      order: 3,
      type: "radio",
      category: "사회적고립",
      label: "얼마나 자주 외롭거나 주변으로부터 고립되어 있다고 느낍니까?",
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
      category: "사회적고립",
      label: "(최근 3개월) 친한 사람들과 얼마나 자주 만나거나 이야기합니까?",
      options: [
        { value: "m1", label: "월 1회 미만" },
        { value: "w1_2", label: "주 1–2회" },
        { value: "w3_4", label: "주 3–4회" },
        { value: "w5p", label: "주 5일 이상" },
      ],
    },
    // 정신 건강 카테고리 (Section1 q3="예")
    {
      id: "q5",
      order: 5,
      type: "slider",
      category: "정신건강",
      label: "지난 일주일 동안 경험한 디스트레스는 어느 정도입니까?",
      slider: {
        min: 1,
        max: 10,
        step: 1,
        help: "1=전혀 힘들지 않다 · 10=몹시 힘들다",
      },
    },
    // 주거 카테고리 (Section1 q4="예")
    {
      id: "q6",
      order: 6,
      type: "radio",
      category: "주거",
      label:
        "현재 주거 상황을 가장 잘 설명하는 것은 무엇입니까? (하나만 선택)",
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
      category: "주거",
      label:
        "주거 환경, 안전, 그리고 비용과 같이 현재 생활하는 곳에 대해 염려하는 부분이 있습니까?",
      detailId: "q7Details",
      detailLabel: "염려되는 항목을 모두 선택해 주세요. (복수 선택)",
      detailOptions: housingConcernOptions, // 포함: other
      otherKey: "q7Other", // 기타 텍스트 저장 키
    },
    // 음식 카테고리 (Section1 q5="예") - 주거와도 연결 가능
    {
      id: "q7_food",
      order: 7.5,
      type: "yn-with-details",
      category: "음식",
      label:
        "지난 3개월 동안, 신선하고 건강한 식품을 쉽게 얻을 수 있었나요?",
      triggerValue: "N", // '아니오' 선택 시에만 하위 선택지 표시
      detailId: "q7_foodDetails",
      detailLabel: "해당하는 항목을 모두 선택해 주세요. (복수 선택)",
      detailOptions: [
        { value: "cost", label: "신선하고 건강한 먹거리를 구입할 비용의 부족" },
        { value: "distance", label: "신선하고 건강한 식재료를 파는 곳이 집에서 먼 곳에 위치" },
        { value: "other", label: "기타" },
      ],
      otherKey: "q7_foodOther", // 기타 텍스트 저장 키
    },
    // 교통 카테고리 (Section1 q6="예")
    {
      id: "q8",
      order: 8,
      type: "checkbox",
      category: "교통",
      label: "교통편 부족을 경험했다면, 그 이유는 무엇입니까? (복수 선택)",
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
    // 정보이해 카테고리 (Section1 q8="예")
    {
      id: "q9",
      order: 9,
      type: "radio",
      category: "정보이해",
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
      category: "정보이해",
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
      category: "정보이해",
      label: "디지털 숙련도는 어느정도인가요?",
      options: [
        { value: "제한적", label: "제한적" },
        { value: "제한적이지 않음", label: "제한적이지 않음" },
      ],
    },
    // 폭력 카테고리 (Section1 q9="예")
    {
      id: "q12",
      order: 12,
      type: "radio",
      category: "폭력",
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
      category: "폭력",
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
      category: "폭력",
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
    // 고용 카테고리 (Section1 q10="예")
    {
      id: "q15",
      order: 15,
      type: "radio-with-sub",
      category: "고용",
      label: "현재 고용 현황은 무엇입니까?",
      options: [
        { 
          value: "working", 
          label: "일을 하고 있다",
          subType: "radio",
          subId: "q15_working_detail",
          subOptions: workingDetailOptions,
        },
        { 
          value: "notWorking", 
          label: "일을 하고 있지 않다",
          subType: "radio",
          subId: "q15_notWorking_reasons",
          subOptions: notWorkingReasonOptions,
          subOtherKey: "q15_notWorking_other",
        },
      ],
    },
    // 사회적 지원 카테고리 (Section1 q11="예")
    {
      id: "q16",
      order: 16,
      type: "radio",
      category: "사회적지원",
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
      category: "사회적지원",
      label:
        "필요한 경우, 통원 시 동행 혹은 퇴원 후 간병(식사준비 등)을 해줄 사람이 있나요?",
      options: [
        { value: "Y", label: "예" },
        { value: "N", label: "아니요" },
      ],
    },
    // 돌봄책임 카테고리 (Section1 q12="예")
    {
      id: "q18",
      order: 18,
      type: "radio-with-sub",
      category: "돌봄책임",
      label: "가족 중 누군가를 보살피는 가족 돌봄 제공자인가요?",
      options: [
        { 
          value: "Y", 
          label: "예",
          subType: "checkbox",
          subId: "q18Details",
          subLabel: "돌봄 대상자를 모두 선택해 주세요. (복수 선택)",
          subOptions: caregiverTargetOptions,
          subOtherKey: "q18Other",
        },
        { value: "N", label: "아니요" },
      ],
    },
  ];

  // 카테고리 표시 여부에 따라 질문 필터링
  const filteredQuestions = questions.filter((q) => {
    if (!q.category) return true; // 카테고리 없으면 항상 표시
    return showCategory[q.category]; // 해당 카테고리가 활성화된 경우에만 표시
  });

  // ===== 체크박스 렌더러 ('기타' 인라인 텍스트) =====
  const noOtherTextSet = new Set(["q2"]);
  const renderCheckboxWithInlineOther = (qid, opts, otherKey) => {
    // 선택지 정렬: 일반 → 기타 → 해당 사항 없음
    const sortedOpts = [...(opts || [])].sort((a, b) => {
      const order = { none: 2, other: 1 }; // none이 마지막, other가 그 앞
      const aOrder = order[a.value] ?? 0;
      const bOrder = order[b.value] ?? 0;
      return aOrder - bOrder;
    });

    return (
      <FormGroup sx={{ mt: 0.5 }}>
        {sortedOpts.map((opt) => {
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
                    sx={{ py: 0.5 }}
                  />
                }
                label={
                  <Typography component="span" sx={{ lineHeight: 1.5 }}>
                    {opt.label}
                  </Typography>
                }
                sx={{
                  alignItems: "center",
                  my: 0.25,
                }}
              />
              {/* 기타 텍스트 필드: 체크박스 밖에서 들여쓰기하여 표시 */}
              {showOther && !noOtherTextSet.has(qid) && (
                <Box sx={{ ml: 4, mt: 0.5, mb: 1 }}>
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

      case "radio-with-sub":
        // 라디오 버튼 + 선택에 따른 하위 질문
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
              onChange={handleRadioWithSubChange(q.id, q.options || [])}
            >
              {(q.options || []).map((opt) => {
                const isSelected = answers[q.id] === opt.value;
                const hasSubOptions = opt.subOptions && opt.subOptions.length > 0;
                
                return (
                  <Box key={opt.value}>
                    <FormControlLabel
                      value={opt.value}
                      control={<Radio color="primary" />}
                      label={opt.label}
                      sx={{ my: 0.5 }}
                    />
                    {/* 선택된 옵션의 하위 질문 표시 */}
                    {isSelected && hasSubOptions && (
                      <Box sx={{ ml: 4, mt: 1, mb: 2, pl: 2, borderLeft: "2px solid #e0e0e0" }}>
                        {opt.subLabel && (
                          <FormLabel
                            sx={{
                              fontWeight: 600,
                              color: "text.primary",
                              mb: 1,
                              display: "block",
                            }}
                          >
                            {opt.subLabel}
                          </FormLabel>
                        )}
                        {opt.subType === "radio" ? (
                          <RadioGroup
                            name={opt.subId}
                            value={answers[opt.subId] || ""}
                            onChange={handleChange}
                          >
                            {opt.subOptions.map((subOpt) => (
                              <FormControlLabel
                                key={subOpt.value}
                                value={subOpt.value}
                                control={<Radio color="primary" size="small" />}
                                label={subOpt.label}
                                sx={{ my: 0.25 }}
                              />
                            ))}
                          </RadioGroup>
                        ) : (
                          renderCheckboxWithInlineOther(
                            opt.subId,
                            opt.subOptions,
                            opt.subOtherKey
                          )
                        )}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </RadioGroup>
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

        // 미싱: missingQuestions에 포함된 경우에만 표시 (제출 시도 후)
        // 초기에는 missingQuestions가 비어있으므로 표시되지 않음
        const localMissing = missingQuestions.length > 0 && (
          isSubBlock
            ? false
            : missingQuestions.includes(q.id) || missingQuestions.includes(q.detailId)
        );

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
                onChange={handleYnWithDetailsChange(q.id, q.detailId, q.otherKey)}
              >
                {/* 예 선택지 */}
                <Box>
                  <FormControlLabel
                    value="Y"
                    control={<Radio color="primary" />}
                    label="예"
                  />
                  {/* 트리거가 Y이고 Y가 선택되었을 때 하위 질문 표시 */}
                  {trigger === "Y" && answers[q.id] === "Y" && (
                    <Box sx={{ ml: 4, mt: 1, mb: 2, pl: 2, borderLeft: "2px solid #e0e0e0" }}>
                      {q.detailLabel && (
                        <FormLabel
                          sx={{
                            fontWeight: 600,
                            color: "text.primary",
                            mb: 1,
                            display: "block",
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
                              control={<Radio color="primary" size="small" />}
                              label={opt.label}
                              sx={{ my: 0.25 }}
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
                    </Box>
                  )}
                </Box>
                
                {/* 아니오 선택지 */}
                <Box>
                  <FormControlLabel
                    value="N"
                    control={<Radio color="primary" />}
                    label="아니오"
                  />
                  {/* 트리거가 N이고 N이 선택되었을 때 하위 질문 표시 */}
                  {trigger === "N" && answers[q.id] === "N" && (
                    <Box sx={{ ml: 4, mt: 1, mb: 2, pl: 2, borderLeft: "2px solid #e0e0e0" }}>
                      {q.detailLabel && (
                        <FormLabel
                          sx={{
                            fontWeight: 600,
                            color: "text.primary",
                            mb: 1,
                            display: "block",
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
                              control={<Radio color="primary" size="small" />}
                              label={opt.label}
                              sx={{ my: 0.25 }}
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
                    </Box>
                  )}
                </Box>
              </RadioGroup>
            )}

            {/* 하위 블록(mainId가 다른 경우)의 세부 컨트롤 */}
            {isSubBlock && showDetails && (
              <Box sx={{ ml: 4, pl: 2, borderLeft: "2px solid #e0e0e0" }}>
                {q.detailLabel && (
                  <FormLabel
                    sx={{
                      fontWeight: 600,
                      color: "text.primary",
                      mb: 1,
                      display: "block",
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
                        control={<Radio color="primary" size="small" />}
                        label={opt.label}
                        sx={{ my: 0.25 }}
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
              </Box>
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
      {filteredQuestions
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((q) => renderQuestion(q))}
    </Box>
  );
};

export default Section2Component;
