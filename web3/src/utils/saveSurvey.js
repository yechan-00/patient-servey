// web3/src/utils/saveSurvey.js
import { doc, setDoc, addDoc, updateDoc, collection } from "firebase/firestore";
import { db, serverTS } from "./firebaseUtils";
import { normalizeSurveyBundle } from "./surveySchema";
import { buildScoresFromMeans, likertToYesNo } from "./SurveyUtils";
import { COLLECTIONS } from "./collectionConfig";

/**
 * 설문 저장 단일 출구
 * - 입력: 설문 완료 시점의 원본/계산 데이터
 * - 동작:
 *    1) 표준 스키마로 정규화 (surveySchema.normalizeSurveyBundle)
 *       - stdScores/riskGroups 누락 시 meanScores로 보정(buildScoresFromMeans)
 *       - q32/q33 → 절주/금연 예/아니오 파생
 *    2) users/{id} 병합 저장 (lastSurveyId/At, profile, 점수/리스크 포함)
 *    3) surveyResults 에 새 문서 추가 (원문 백업 포함)
 *    4) patients/{id} 미러링 병합
 * - 출력: { userId, surveyId, wrotePatients }
 */
export async function saveSurvey({
  patientId,
  answers = {},
  meanScores = {},
  stdScores = {},
  riskGroups = {},
  overallFeedback = "",
  additionalFeedback = [],
  profile = {},
  raw = {},
}) {
  if (!patientId) {
    throw new Error("saveSurvey: patientId 가 필요합니다.");
  }

  // --- 0) 방어적 보정: meanScores만 있어도 stdScores/riskGroups 산출 ---
  let patchedStd = stdScores || {};
  let patchedRisk = riskGroups || {};
  let overallMean;
  let overallRiskGroup;

  const hasStd = patchedStd && Object.keys(patchedStd).length > 0;
  const hasMean = meanScores && Object.keys(meanScores).length > 0;

  if (!hasStd && hasMean) {
    const built = buildScoresFromMeans(meanScores);
    patchedStd = built.stdScores || {};
    patchedRisk = built.riskGroups || {};
    overallMean = built.overallMean;
    overallRiskGroup = built.overallRiskGroup;
  }

  // --- 0-1) 파생값: q32/q33 -> 예/아니오 (표시/요약용) ---
  const alcoholAbstinence =
    answers?.q32 !== undefined ? likertToYesNo(answers.q32) : undefined;
  const smokingCessation =
    answers?.q33 !== undefined ? likertToYesNo(answers.q33) : undefined;

  // --- 1) 정규화 (표준 스키마로 매핑) ---
  const { userDoc, surveyDoc, patientsDoc } = normalizeSurveyBundle({
    patientId,
    answers,
    meanScores,
    stdScores: patchedStd,
    riskGroups: patchedRisk,
    overallFeedback,
    additionalFeedback,
    profile,
    lifestyle: {
      alcoholAbstinence,
      smokingCessation,
    },
    raw,
  });

  // overall 리스크(있으면) 주입
  if (overallRiskGroup && !userDoc.lastOverallRiskGroup) {
    userDoc.lastOverallRiskGroup = overallRiskGroup;
  }

  // --- 2) users/{id} 병합 저장 ---
  const userRef = doc(db, COLLECTIONS.USERS, patientId);
  await setDoc(
    userRef,
    {
      ...userDoc,
      // 점수/요약을 users에도 캐싱(조회 최적화)
      stdScores: patchedStd,
      meanScores: meanScores || {},
      riskGroups: patchedRisk,
      updatedAt: serverTS(),
    },
    { merge: true }
  );

  // --- 3) surveyResults 새 문서 추가 ---
  const surveyRef = await addDoc(collection(db, COLLECTIONS.SURVEY_RESULTS), {
    ...surveyDoc,
    userId: patientId, // 조회 보조용
    createdAt: serverTS(),
    updatedAt: serverTS(),
  });

  // lastSurveyId/At 동기화
  await updateDoc(userRef, {
    lastSurveyId: surveyRef.id,
    lastSurveyAt: serverTS(),
    lastOverallRiskGroup:
      userDoc.lastOverallRiskGroup || overallRiskGroup || null,
  });

  // --- 4) patients/{id} 미러링 병합 ---
  await setDoc(
    doc(db, COLLECTIONS.PATIENTS, patientId),
    {
      ...patientsDoc,
      stdScores: patchedStd,
      meanScores: meanScores || {},
      riskGroups: patchedRisk,
      updatedAt: serverTS(),
    },
    { merge: true }
  );

  return {
    userId: patientId,
    surveyId: surveyRef.id,
    wrotePatients: true,
  };
}

/**
 * 기존 코드에서 쓰기 쉽게: “그냥 이거 하나만 호출”
 *   await persistSurveyResult({ patientId, answers, ... })
 */
export async function persistSurveyResult(payload) {
  return saveSurvey(payload);
}
