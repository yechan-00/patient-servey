// web3/src/utils/collectionConfig.js
// Firebase 컬렉션 분리 설정
// web1(생존자)와 web3(환자)의 데이터를 분리하기 위한 접두사 관리

/**
 * 컬렉션 접두사 설정
 * - web1 (생존자): 접두사 없음 또는 "survivors"
 * - web3 (환자): "patients" 접두사 사용
 */
export const COLLECTION_PREFIX = "patients_";

/**
 * 컬렉션 이름 생성 헬퍼
 * @param {string} baseName - 기본 컬렉션 이름 (예: "users", "patients")
 * @returns {string} - 접두사가 붙은 컬렉션 이름 (예: "patients_users")
 */
export const getCollectionName = (baseName) => {
  // 접두사가 이미 있는 경우 그대로 반환
  if (baseName.startsWith(COLLECTION_PREFIX)) {
    return baseName;
  }
  return `${COLLECTION_PREFIX}${baseName}`;
};

/**
 * 컬렉션 이름 상수
 * - 모든 Firebase 호출에서 이 상수를 사용하여 일관성 유지
 */
export const COLLECTIONS = {
  USERS: getCollectionName("users"),
  PATIENTS: getCollectionName("patients"),
  SURVEY_RESULTS: getCollectionName("surveyResults"),
  COUNSELING_REQUESTS: getCollectionName("counselingRequests"),
};

/**
 * 개발/프로덕션 환경에 따른 접두사 제거 옵션
 * (필요시 환경변수로 제어 가능)
 */
export const shouldUsePrefix = () => {
  // 환경변수로 제어 가능
  const envPrefix = process.env.REACT_APP_COLLECTION_PREFIX;
  if (envPrefix === "none" || envPrefix === "false") {
    return false;
  }
  // 기본값: 접두사 사용
  return true;
};

/**
 * 동적 컬렉션 이름 생성 (환경변수 고려)
 */
export const getDynamicCollectionName = (baseName) => {
  if (!shouldUsePrefix()) {
    return baseName;
  }
  return getCollectionName(baseName);
};

const collectionConfig = {
  COLLECTION_PREFIX,
  COLLECTIONS,
  getCollectionName,
  getDynamicCollectionName,
  shouldUsePrefix,
};

export default collectionConfig;
