// web1/src/utils/SurveyUtils.js
// ---------------------------------------------------------
// 설문 점수/피드백 유틸 (저장 파이프라인에서 재사용)
// - 역코딩, 섹션 통계, T점수 변환, 집단 분류, 추가 피드백
// - saveSurvey.js, 결과 화면 모듈에서 공통 사용
// ---------------------------------------------------------

/** 역코딩이 필요한 문항 번호 목록 (q 접두 제거 숫자 기준) */
export const reverseIds = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8, // 신체/자기관리 일부 문항
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  28, // 심리/사회 영역 역채점 문항
];

/** 단일 값 역코딩 */
export function reverseScore(score, max = 5, min = 1) {
  const n = Number(score);
  if (!Number.isFinite(n)) return null;
  return max + min - n;
}

/** 여러 문항에 역코딩 적용
 * @param {Record&lt;string, any&gt;} answers - { q1: "3", q2: "4", ... }
 * @returns {Record&lt;string, number|null&gt;}
 */
export function applyReverseScore(answers = {}) {
  const result = {};
  for (const [qid, raw] of Object.entries(answers)) {
    if (!/^q\d+/.test(qid)) continue; // 설문키(q1~)만 처리
    const numId = Number(qid.replace(/^q/, ""));
    const n = Number(String(raw).trim());
    if (!Number.isFinite(n)) {
      result[qid] = null;
      continue;
    }
    result[qid] = reverseIds.includes(numId) ? reverseScore(n) : n;
  }
  return result;
}

/** 섹션별 통계 (원점수 평균/표준편차) — T점수 변환 기준 */
export const SectionStats = {
  "암 이후 내 몸의 변화": { mean: 3.09, sd: 0.95 },
  "건강한 삶을 위한 관리": { mean: 3.63, sd: 0.76 },
  "회복을 도와주는 사람들": { mean: 3.84, sd: 0.94 },
  "심리적 부담": { mean: 3.08, sd: 0.91 },
  "사회적 삶의 부담": { mean: 3.39, sd: 1.2 },
  "암 이후 탄력성": { mean: 4.28, sd: 0.72 },
  "전체 평균 (암 생존자 건강관리)": { mean: 3.46, sd: 0.65 },
};

/** 원점수 -&gt; NewScore(T 유사점수, 평균 50 기준)
 * (원점수 - 섹션평균) / 섹션표준편차 * 16.67 + 50
 * 반올림하여 정수 리턴 (표시용)
 */
export function newScore(sectionName, userScore) {
  const stat = SectionStats[sectionName];
  const n = Number(userScore);
  if (!stat || !Number.isFinite(n)) return null;
  const z = (n - stat.mean) / stat.sd;
  return Math.round(z * 16.67 + 50);
}

/** 집단 분류 (원점수 기준 cutoff=mean - sd) */
export function getRiskGroup(sectionName, meanScore) {
  const stat = SectionStats[sectionName];
  const n = Number(meanScore);
  if (!stat || !Number.isFinite(n)) return null;
  const cutoff = stat.mean - stat.sd;
  if (n <= cutoff) return "고위험집단";
  if (n <= stat.mean) return "주의집단";
  return "저위험집단";
}

/** 메인 코멘트 */
export const Comments = {
  patient: {
    고위험집단:
      "🩺검사 결과를 보니 도움이 필요해 보여요. 혹시 불편한 점이 있으면 언제든 편하게 전문가와 상담해 보세요. 함께 곁에서 도와드릴게요❤️",
    주의집단:
      "주기적인 점검과 관심이 필요합니다. 건강 상태를 꾸준히 확인해 주세요.😊",
    저위험집단:
      "현재 양호한 상태를 유지하고 있습니다🌟 지금처럼 건강을 잘 관리해 주세요. 계속 응원할게요🎉👍",
  },
  socialWorker: {
    고위험집단:
      "환자가 고위험집단에 해당합니다. 추가적인 개입 및 전문 상담 연계가 필요합니다.",
    주의집단:
      "환자가 주의집단에 해당합니다. 정기적인 모니터링과 예방적 지원이 권장됩니다.",
    저위험집단:
      "환자가 저위험집단에 해당합니다. 현재 상태를 유지할 수 있도록 지속적인 격려가 필요합니다.",
  },
};

export function getPatientComment(group) {
  return Comments.patient[group] || "";
}

/** 선택지 접두 제거 "1) 내용" -&gt; "내용" */
const stripPrefix = (s = "") => String(s).replace(/^[0-9]+\)\s*/, "");

/** 13-1 세부 문항 (식이조절) */
const SUB13 = [
  {
    id: "q13_1_1",
    text: "조미료 섭취를 줄인다.",
    comment: "나트륨·조미료 섭취를 조금 더 줄여 보세요.",
  },
  {
    id: "q13_1_2",
    text: "식품의 신선도를 중요시한다.",
    comment: "신선한 식재료를 선택하면 건강에 도움이 됩니다!",
  },
  {
    id: "q13_1_3",
    text: "채식 및 과일 위주의 식습관을 한다.",
    comment: "🥗 채소·과일 섭취를 늘려 보세요.",
  },
  {
    id: "q13_1_4",
    text: "육류 섭취를 조절한다.",
    comment: "붉은 고기 섭취를 줄이고, 살코기·어류로 대체해 보세요.",
  },
  {
    id: "q13_1_5",
    text: "탄수화물 섭취를 조절한다.",
    comment: "정제 탄수화물 대신 통곡물을 선택해 보세요.",
  },
  {
    id: "q13_1_6",
    text: "항암식품을 먹는다.",
    comment: "항암식품을 꾸준히 섭취해 보세요.",
  },
];

/** Q10(운동), Q12-1(장애요인) 등 기본 규칙 */
const BASE_RULES = [
  {
    id: "exercise",
    condition: (a) => [1, 2].includes(Number(a.q10)),
    comment: "💪 규칙적인 운동을 해보세요! 가벼운 걷기부터 시작해도 좋아요.",
    style: "info",
  },
];

/** 13-1 규칙: 1·2·3(낮음)인 경우 주의 피드백 */
const DIET_RULES = SUB13.map(({ id, comment }) => ({
  id,
  condition: (a) => {
    const v = Number(a[id]); // 1~5
    return Number.isFinite(v) && v <= 3;
  },
  comment,
  style: "warning",
}));

/** 배열/객체 혼용 대응: q12_reasons가 object 또는 array일 수 있음 */
const ensureArray = (v) => {
  if (Array.isArray(v)) return v.map(stripPrefix);
  if (v && typeof v === "object")
    return Object.values(v).map((x) => stripPrefix(String(x)));
  if (v == null) return [];
  return [stripPrefix(String(v))];
};

/** 추가 피드백 규칙 테이블 */
const FEEDBACK_RULES = [
  // 상담 권장: (1) 12-1 특정 이유 포함 OR (2) 심리적 부담 고위험
  {
    id: "counselling",
    condition: (a, _mean, risk) => {
      const reasons = ensureArray(a.q12_reasons);
      const match12 = [
        "무엇을 해야 할지 몰라서",
        "건강관리 자체를 스트레스라고 생각해서",
        "의지가 없어서",
      ].some((t) => reasons.includes(t));
      const psychHigh = risk?.psychologicalBurden === "고위험집단";
      return match12 || psychHigh;
    },
    comment: "참여자님은 사회복지사나 상담가와의 상담을 강력 권장합니다🚨",
    style: "error",
  },

  // 회복 탄력성 영역 등급별
  {
    id: "resilience_high",
    condition: (_a, _m, risk) => risk?.resilience === "고위험집단",
    comment:
      "🚨 회복 탄력성이 낮게 평가되었습니다. 전문가와 상의해 심리·정서적 지원을 받아보세요!",
    style: "error",
  },
  {
    id: "resilience_mid",
    condition: (_a, _m, risk) => risk?.resilience === "주의집단",
    comment:
      "💪 회복 탄력성을 높일 수 있도록 스트레스 관리와 규칙적인 생활에 조금 더 힘써보세요!",
    style: "warning",
  },
  {
    id: "resilience_low",
    condition: (_a, _m, risk) => risk?.resilience === "저위험집단",
    comment:
      "🌟 훌륭합니다! 현재의 긍정적인 회복 탄력성을 계속 유지해 보세요. 응원합니다!",
    style: "success",
  },

  // 13-1 식이 주의 규칙
  ...DIET_RULES,

  // 절주/금연
  {
    id: "alcohol_warning",
    condition: (a) => {
      const v = Number(a.q32);
      return Number.isFinite(v) && v <= 3;
    },
    comment: "🍺 술은 암 재발 위험을 높일 수 있습니다. 금주를 권장합니다.",
    style: "warning",
  },
  {
    id: "smoke_warning",
    condition: (a) => {
      const v = Number(a.q33);
      return Number.isFinite(v) && v <= 3;
    },
    comment: "🚭 담배는 암 재발 위험을 높일 수 있습니다. 금연을 권장합니다.",
    style: "warning",
  },

  // 운동 기본 규칙
  ...BASE_RULES,
];

/** 추가 피드백 생성 */
export function getAdditionalFeedback(answers = {}, mean = {}, risk = {}) {
  return FEEDBACK_RULES.filter((r) => {
    try {
      return !!r.condition(answers, mean, risk);
    } catch {
      return false;
    }
  }).map((r) => ({ text: r.comment, style: r.style }));
}

/** T점수 백분위 */
export function getPercentile(tScore) {
  const n = Number(tScore);
  if (!Number.isFinite(n)) return "-";
  const z = (n - 50) / 10;
  const percentile = Math.round(100 * 0.5 * (1 + erf(z / Math.sqrt(2))));
  return percentile;
}

/** 정규오차함수 근사 */
function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741,
    a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911;

  const t = 1 / (1 + p * x);
  const y =
    1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

// ---------------------------------------------------------
// Derived scores builder (mean -> T scores, risk groups, overall)
// ---------------------------------------------------------

/** 도메인 키 -> SectionStats의 라벨 매핑 */
export const DOMAIN_LABELS = {
  physicalChange: "암 이후 내 몸의 변화",
  healthManagement: "건강한 삶을 위한 관리",
  socialSupport: "회복을 도와주는 사람들",
  psychologicalBurden: "심리적 부담",
  socialBurden: "사회적 삶의 부담",
  resilience: "암 이후 탄력성",
};

/** 섹션 라벨과 평균으로 표준점수(T 유사)를 계산 */
function meanToT(sectionLabel, meanScore) {
  const stat = SectionStats[sectionLabel];
  const n = Number(meanScore);
  if (!stat || !Number.isFinite(n)) return null;
  const z = (n - stat.mean) / stat.sd;
  return Math.round(z * 16.67 + 50);
}

/**
 * 평균점수 객체를 받아 표준점수/집단/종합을 계산
 * @param {{physicalChange?:number,healthManagement?:number,socialSupport?:number,psychologicalBurden?:number,socialBurden?:number,resilience?:number}} meanScores
 * @returns {{stdScores:Record<string,number>, riskGroups:Record<string,string>, overallMean:number|null, overallRiskGroup:string|null}}
 */
export function buildScoresFromMeans(meanScores = {}) {
  const stdScores = {};
  const riskGroups = {};
  let sum = 0;
  let cnt = 0;

  for (const [key, label] of Object.entries(DOMAIN_LABELS)) {
    const m = Number(meanScores?.[key]);
    if (!Number.isFinite(m)) continue;

    const t = meanToT(label, m);
    if (t != null) stdScores[key] = t;

    const group = getRiskGroup(label, m);
    if (group) riskGroups[key] = group;

    sum += m;
    cnt += 1;
  }

  const overallMean = cnt ? +(sum / cnt).toFixed(12) : null;

  let overallRiskGroup = null;
  if (cnt) {
    const vals = Object.values(riskGroups);
    if (vals.includes("고위험집단")) overallRiskGroup = "고위험집단";
    else if (vals.includes("주의집단")) overallRiskGroup = "주의집단";
    else overallRiskGroup = "저위험집단";
  }

  return { stdScores, riskGroups, overallMean, overallRiskGroup };
}

/**
 * Likert 1~5 값을 예/아니오로 변환
 * (3 이상 = "예", 1~2 = "아니오")
 */
export function likertToYesNo(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return n >= 3 ? "예" : "아니오";
}
