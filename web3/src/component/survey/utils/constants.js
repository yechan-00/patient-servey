// web1/src/component/survey/utils/constants.js
// 공통 상수 모음 (한 곳에서만 관리)

// 설문 섹션 ID (라우팅/진행도/임시저장 키에서 공통 사용)
export const SECTION_IDS = [
  "personalInfo", // 개인정보/기본 스크리닝(달력/생년월일은 여기서만)
  "healthBehavior", // 생활습관
  "diagnosis", // 진단 관련
  "treatment", // 치료/수술 관련
  "mentalHealth", // 심리/정신건강
];

// 섹션 라벨 (탭/제목 등에 사용)
export const SECTION_TITLES = {
  personalInfo: "기본 스크리닝",
  healthBehavior: "건강행동 스크리닝",
  diagnosis: "진단 스크리닝",
  treatment: "치료 스크리닝",
  mentalHealth: "정신건강 스크리닝",
};

// 로컬스토리지 키 (임시저장/복구)
export const STORAGE_KEYS = {
  SURVEY_DRAFT: "survey-draft", // 설문 전체 임시 저장본
  PERSONAL_INFO: "survey-personal-info", // 개인정보 페이지만 별도 보관이 필요할 때 사용 가능
};

// 유틸: 섹션 인덱스 → ID
export const sectionIdAt = (idx) =>
  SECTION_IDS[Math.max(0, Math.min(idx, SECTION_IDS.length - 1))];

// 유틸: ID → 인덱스
export const sectionIndexOf = (id) => {
  const i = SECTION_IDS.indexOf(id);
  return i < 0 ? 0 : i;
};

// 라우팅 경로 규칙(필요 시 조정)
export const ROUTE_PATHS = {
  FORM: "/survey", // 설문 페이지 루트
  SECTION: (id) => `/survey/${id}`, // 섹션별 경로
  RESULT: "/survey-result", // 결과 페이지
  COUNSELING: "/counseling-request", //상담요청
};

// 진행바 계산 시 섹션 별 문항 수(대략값). 실제 문항 수와 다르면 각 섹션에서 override 가능
export const DEFAULT_QUESTIONS_PER_SECTION = {
  personalInfo: 8,
  healthBehavior: 8,
  diagnosis: 8,
  treatment: 8,
  mentalHealth: 8,
};

// 라디오 공통 선택지 (필요 시 확장)
export const FIVE_LIKERT = [
  { value: 1, label: "전혀 그렇지 않다" },
  { value: 2, label: "약간 그렇지 않다" },
  { value: 3, label: "보통이다" },
  { value: 4, label: "약간 그렇다" },
  { value: 5, label: "매우 그렇다" },
];

export const YES_NO = [
  { value: "yes", label: "예" },
  { value: "no", label: "아니오" },
];

// 날짜 형식
export const DATE_FMT = {
  YMD: "YYYY-MM-DD",
  COMPACT: "YYYYMMDD",
};

export default {
  SECTION_IDS,
  SECTION_TITLES,
  STORAGE_KEYS,
  sectionIdAt,
  sectionIndexOf,
  ROUTE_PATHS,
  DEFAULT_QUESTIONS_PER_SECTION,
  FIVE_LIKERT,
  YES_NO,
  DATE_FMT,
};
