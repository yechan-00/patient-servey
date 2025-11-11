/**
 * surveyDataSaver.js
 *
 * 수집된 설문 데이터를 확실하게 저장하는 전용 모듈
 * - profileData를 surveyResults[].profile에 확실하게 저장
 * - 기존 saveSurveyScores를 래핑하여 profile 저장을 보장
 * - 다른 로직에 영향 없이 데이터만 확실하게 저장
 */

import { saveSurveyScores } from "./firebaseUtils";

/**
 * 설문 데이터를 확실하게 저장
 * @param {string} patientId - 환자 ID
 * @param {Object} scores - 점수 데이터
 * @param {Object} profileData - 개인 정보 데이터 (collectProfileData로 수집된 데이터)
 * @param {Object} answers - 설문 답변 전체
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export async function saveSurveyDataWithProfile(
  patientId,
  scores,
  profileData,
  answers = {}
) {
  try {
    // 디버깅: 저장 전 데이터 확인
    console.log("[surveyDataSaver] 저장할 데이터 확인:");
    console.log("  - patientId:", patientId);
    console.log("  - profileData:", profileData);
    console.log("  - profileData.gender:", profileData?.gender);
    console.log("  - profileData.maritalStatus:", profileData?.maritalStatus);
    console.log("  - profileData.cancerStage:", profileData?.cancerStage);
    console.log("  - profileData.hasRecurrence:", profileData?.hasRecurrence);
    console.log("  - profileData.hasSurgery:", profileData?.hasSurgery);

    // profileData가 비어있지 않은지 확인
    const hasProfileData = profileData && Object.keys(profileData).length > 0;
    if (!hasProfileData) {
      console.warn("[surveyDataSaver] profileData가 비어있습니다!");
    }

    // saveSurveyScores 호출 (profile 파라미터로 명시적으로 전달)
    await saveSurveyScores(patientId, scores, profileData, {
      answers: answers,
    });

    console.log("[surveyDataSaver] 저장 완료");
    return true;
  } catch (error) {
    console.error("[surveyDataSaver] 저장 실패:", error);
    throw error;
  }
}
