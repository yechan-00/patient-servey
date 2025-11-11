// web1/src/utils/saveSurvey.js
import { doc, setDoc, addDoc, updateDoc, collection } from "firebase/firestore";
import { db, serverTS } from "./firebaseUtils";
import { normalizeSurveyBundle } from "./surveySchema";
import { buildScoresFromMeans, likertToYesNo } from "./SurveyUtils";

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
  let overallRiskGroup;

  const hasStd = patchedStd && Object.keys(patchedStd).length > 0;
  const hasMean = meanScores && Object.keys(meanScores).length > 0;

  if (!hasStd && hasMean) {
    const built = buildScoresFromMeans(meanScores);
    patchedStd = built.stdScores || {};
    patchedRisk = built.riskGroups || {};
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
  const userRef = doc(db, "users", patientId);
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
  const surveyRef = await addDoc(collection(db, "surveyResults"), {
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

  // overallRiskGroup을 riskLevel로 변환하는 함수
  const mapRiskLevelFromGroup = (group) => {
    if (!group) return null;
    const g = String(group).toLowerCase();
    if (["high", "고위험", "고위험집단", "위험"].some((k) => g.includes(k)))
      return "high";
    if (["medium", "중위험", "중위험집단", "주의"].some((k) => g.includes(k)))
      return "medium";
    if (["low", "저위험", "저위험집단", "양호"].some((k) => g.includes(k)))
      return "low";
    return null;
  };

  // --- 4) patients/{id} 미러링 병합 ---
  const finalRiskLevel =
    mapRiskLevelFromGroup(overallRiskGroup) ||
    mapRiskLevelFromGroup(userDoc.lastOverallRiskGroup) ||
    null;

  await setDoc(
    doc(db, "patients", patientId),
    {
      ...patientsDoc,
      stdScores: patchedStd,
      meanScores: meanScores || {},
      riskGroups: patchedRisk,
      riskLevel: finalRiskLevel, // 위험도 명시적으로 저장
      updatedAt: serverTS(),
    },
    { merge: true }
  );

  // --- 5) users 컬렉션에 profile 객체도 명시적으로 저장 (web2 호환성) ---
  // userDoc에는 이미 profile이 포함되어 있지만, 명시적으로 확인
  if (userDoc.profile && typeof userDoc.profile === "object") {
    await setDoc(
      userRef,
      {
        profile: userDoc.profile,
        updatedAt: serverTS(),
      },
      { merge: true }
    );
  }

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
