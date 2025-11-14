// web2/src/utils/collectionConfig.js
// Firebase 컬렉션 분리 설정 (web3 통합용)
// ⚠️ 기존 web1/web2 코드에 영향 없이 통합 기능만 제공

/**
 * 컬렉션 이름 상수
 * - Web1 (생존자): 기본 컬렉션
 * - Web3 (환자): 접두사가 붙은 컬렉션
 */
export const COLLECTIONS = {
  // Web1 (생존자) - 기존 컬렉션
  SURVIVORS: {
    USERS: "users",
    PATIENTS: "patients",
    SURVEY_RESULTS: "surveyResults",
    COUNSELING_REQUESTS: "counselingRequests",
  },

  // Web3 (환자) - 접두사 적용
  PATIENTS: {
    USERS: "patients_users",
    PATIENTS: "patients_patients",
    SURVEY_RESULTS: "patients_surveyResults",
    COUNSELING_REQUESTS: "patients_counselingRequests",
  },
};

/**
 * 설문 유형 구분
 */
export const SURVEY_TYPES = {
  SURVIVOR: "survivor", // 생존자 설문 (web1)
  PATIENT: "patient", // 환자 설문 (web3)
  ALL: "all", // 전체
};

const collectionConfig = {
  COLLECTIONS,
  SURVEY_TYPES,
};

export default collectionConfig;
