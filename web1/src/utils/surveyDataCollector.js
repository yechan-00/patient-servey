/**
 * surveyDataCollector.js
 *
 * 설문 완료 시점의 모든 데이터를 확실하게 수집하는 전용 모듈
 * - 여러 소스(location.state, answers, localStorage)에서 데이터 수집
 * - 명확한 우선순위와 fallback 로직
 * - 기존 기능들(SurveyFormContext, localStorage 등)에 영향 없음
 */

/**
 * 모든 소스에서 개인 정보 데이터를 수집
 * @param {Object} sources - 데이터 소스들
 * @param {Object} sources.locationState - location.state 객체
 * @param {Object} sources.answers - SurveyFormContext의 answers
 * @param {Object} sources.localStorage - localStorage에서 읽은 값들 (선택적)
 * @returns {Object} 수집된 profileData
 */
export function collectProfileData({
  locationState = {},
  answers = {},
  localStorage = {},
}) {
  // 우선순위: location.state > answers > localStorage > 빈 문자열
  const get = (key, altKeys = []) => {
    // location.state에서 찾기
    if (
      locationState &&
      locationState[key] !== undefined &&
      locationState[key] !== null &&
      String(locationState[key]).trim() !== ""
    ) {
      return locationState[key];
    }

    // altKeys도 location.state에서 확인
    for (const altKey of altKeys) {
      if (
        locationState &&
        locationState[altKey] !== undefined &&
        locationState[altKey] !== null &&
        String(locationState[altKey]).trim() !== ""
      ) {
        return locationState[altKey];
      }
    }

    // answers에서 찾기
    if (
      answers &&
      answers[key] !== undefined &&
      answers[key] !== null &&
      String(answers[key]).trim() !== ""
    ) {
      return answers[key];
    }

    // altKeys도 answers에서 확인
    for (const altKey of altKeys) {
      if (
        answers &&
        answers[altKey] !== undefined &&
        answers[altKey] !== null &&
        String(answers[altKey]).trim() !== ""
      ) {
        return answers[altKey];
      }
    }

    // localStorage에서 찾기
    if (
      localStorage &&
      localStorage[key] !== undefined &&
      localStorage[key] !== null &&
      String(localStorage[key]).trim() !== ""
    ) {
      return localStorage[key];
    }

    return "";
  };

  // 기본 정보
  const name = get("name", ["userName", "이름"]);
  const birthDate = get("birthDate", ["생년월일", "dob"]);
  const cancerType = get("cancerType", ["암종류", "암 종류"]);
  const diagnosisDate = get("diagnosisDate", ["진단일", "진단시기"]);

  // 개인 정보
  const gender = get("gender", ["성별"]);
  const maritalStatus = get("maritalStatus", ["결혼상태", "결혼 상태"]);
  const cancerStage = get("cancerStage", ["암병기", "암 병기", "stage"]);
  const hasRecurrence = get("hasRecurrence", ["재발여부", "재발 여부"]);
  const hasSurgery = get("hasSurgery", ["수술여부", "수술 여부"]);
  const surgeryDate = get("surgeryDate", ["수술시기", "수술 시기"]);

  // 정신 건강 정보
  const mentalHealthHistory = get("mentalHealthHistory", ["정신건강력"]);
  const mentalHealthDiagnosesText = get("mentalHealthDiagnosesText", [
    "정신건강진단기타",
    "정신건강 기타",
  ]);
  const otherMentalDiagnosis = get("otherMentalDiagnosis", [
    "정신건강진단명",
    "정신 건강 진단명",
  ]);
  const mentalHealthImpact = get("mentalHealthImpact", [
    "정신건강영향",
    "정신건강 영향",
  ]);

  // 치료 정보
  const otherTreatmentType = get("otherTreatmentType", [
    "기타치료",
    "기타 치료",
  ]);

  // 연락처 정보
  const phone = get("phone", ["연락처", "휴대폰"]);
  const contactMethod = get("contactMethod", ["연락방법", "상담 방식"]);
  const contactTime = get("contactTime", ["연락가능시간", "상담 가능 시간"]);

  // 다른 암 정보
  const otherCancerDiagnosis = get("otherCancerDiagnosis", [
    "다른암진단여부",
    "다른 암 진단 여부",
  ]);
  const otherCancerType = get("otherCancerType", [
    "다른암종류",
    "다른 암 종류",
  ]);
  const otherCancerDetails = get("otherCancerDetails", [
    "다른암세부",
    "다른 암 세부",
  ]);

  return {
    name,
    birthDate,
    cancerType,
    diagnosisDate,
    requestCounseling: false,
    gender,
    maritalStatus,
    cancerStage,
    hasRecurrence,
    hasSurgery,
    surgeryDate,
    mentalHealthHistory,
    mentalHealthDiagnosesText,
    otherMentalDiagnosis,
    mentalHealthImpact,
    otherTreatmentType,
    phone,
    contactMethod,
    contactTime,
    otherCancerDiagnosis,
    otherCancerType,
    otherCancerDetails,
  };
}

/**
 * localStorage에서 개인 정보 읽기 (선택적)
 * @returns {Object} localStorage에서 읽은 값들
 */
export function readLocalStorageProfile() {
  if (typeof window === "undefined" || !window.localStorage) {
    return {};
  }

  try {
    return {
      name: localStorage.getItem("userName") || "",
      birthDate: localStorage.getItem("birthDate") || "",
      cancerType: localStorage.getItem("cancerType") || "",
      diagnosisDate: localStorage.getItem("diagnosisDate") || "",
      gender: localStorage.getItem("gender") || "",
      maritalStatus: localStorage.getItem("maritalStatus") || "",
      cancerStage: localStorage.getItem("cancerStage") || "",
      hasRecurrence: localStorage.getItem("hasRecurrence") || "",
      hasSurgery: localStorage.getItem("hasSurgery") || "",
      surgeryDate: localStorage.getItem("surgeryDate") || "",
      mentalHealthHistory: localStorage.getItem("mentalHealthHistory") || "",
      mentalHealthDiagnosesText:
        localStorage.getItem("mentalHealthDiagnosesText") || "",
      otherMentalDiagnosis: localStorage.getItem("otherMentalDiagnosis") || "",
      mentalHealthImpact: localStorage.getItem("mentalHealthImpact") || "",
      otherTreatmentType: localStorage.getItem("otherTreatmentType") || "",
      phone: localStorage.getItem("phone") || "",
      contactMethod: localStorage.getItem("contactMethod") || "",
      contactTime: localStorage.getItem("contactTime") || "",
      otherCancerDiagnosis: localStorage.getItem("otherCancerDiagnosis") || "",
      otherCancerType: localStorage.getItem("otherCancerType") || "",
      otherCancerDetails: localStorage.getItem("otherCancerDetails") || "",
    };
  } catch (e) {
    console.warn("[surveyDataCollector] localStorage 읽기 실패:", e);
    return {};
  }
}
