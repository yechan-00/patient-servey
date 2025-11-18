// web2/src/models/integratedPatientData.js
// 통합 환자 데이터 로더 (web1/web3 자동 감지)

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS, SURVEY_TYPES } from "../utils/collectionConfig";
import { getIntegratedPatientDetail } from "../utils/IntegratedFirebaseUtils";

/**
 * 통합 환자 코어 데이터 로드 (타입 자동 감지)
 * @param {string} patientId
 * @returns {Promise<{type: string, patient: Object, user: Object} | null>}
 */
export async function loadIntegratedPatientCore(patientId) {
  // 먼저 타입 확인
  const detail = await getIntegratedPatientDetail(patientId);
  if (!detail) {
    return { notFound: true };
  }

  const { type, data, id } = detail;
  const isPatient = type === SURVEY_TYPES.PATIENT;

  // 타입에 따라 올바른 컬렉션에서 데이터 로드
  const usersCollection = isPatient
    ? COLLECTIONS.PATIENTS.USERS
    : COLLECTIONS.SURVIVORS.USERS;
  const patientsCollection = isPatient
    ? COLLECTIONS.PATIENTS.PATIENTS
    : COLLECTIONS.SURVIVORS.PATIENTS;

  const [userSnap, metaSnap] = await Promise.all([
    getDoc(doc(db, usersCollection, patientId)),
    getDoc(doc(db, patientsCollection, patientId)),
  ]);

  const userData = userSnap.exists() ? userSnap.data() || {} : {};
  const metaData = metaSnap.exists() ? metaSnap.data() || {} : {};

  // 기본 프로필 데이터 구성
  const patient = {
    id: id || patientId,
    name: metaData.name || userData.name || data.name || "",
    birthDate: metaData.birthDate || userData.birthDate || data.birthDate || "",
    cancerType:
      metaData.cancerType || userData.cancerType || data.cancerType || "",
    diagnosisDate:
      metaData.diagnosisDate ||
      userData.diagnosisDate ||
      data.diagnosisDate ||
      "",
    riskLevel: metaData.riskLevel || userData.riskLevel || data.riskLevel || "",
    counselingStatus:
      metaData.counselingStatus || userData.counselingStatus || "미요청",
    archived: !!metaData.archived,
    createdAt: metaData.createdAt || userData.createdAt || data.createdAt,
    lastSurveyAt:
      metaData.lastSurveyAt || userData.lastSurveyAt || data.lastSurveyAt,
    ...metaData,
    ...userData,
  };

  return {
    type,
    patient,
    user: userData,
    meta: metaData,
  };
}

/**
 * 통합 설문 번들 로드
 * @param {string} patientId
 * @param {string} type - "survivor" | "patient"
 * @returns {Promise<Object>}
 */
export async function loadIntegratedSurveyBundle(patientId, type) {
  const isPatient = type === SURVEY_TYPES.PATIENT;
  const usersCollection = isPatient
    ? COLLECTIONS.PATIENTS.USERS
    : COLLECTIONS.SURVIVORS.USERS;
  const surveyResultsCollection = isPatient
    ? COLLECTIONS.PATIENTS.SURVEY_RESULTS
    : COLLECTIONS.SURVIVORS.SURVEY_RESULTS;

  // users 문서에서 기본 정보
  const userSnap = await getDoc(doc(db, usersCollection, patientId));
  const userData = userSnap.exists() ? userSnap.data() || {} : {};

  // surveyResults에서 최신 설문 찾기
  let lastSurvey = null;
  let answers = {};
  let stdScores = {};
  let meanScores = {};
  let riskLevel = null;
  let overallFeedback = "";
  let additionalFeedback = [];

  // lastSurveyId가 있으면 직접 조회
  if (userData.lastSurveyId) {
    try {
      const surveySnap = await getDoc(
        doc(db, surveyResultsCollection, userData.lastSurveyId)
      );
      if (surveySnap.exists()) {
        const surveyData = surveySnap.data() || {};
        lastSurvey = {
          id: surveySnap.id,
          ...surveyData,
        };
        answers = surveyData.answers || {};
        stdScores = surveyData.stdScores || {};
        meanScores = surveyData.meanScores || {};
        riskLevel = surveyData.riskLevel || surveyData.overallRiskGroup || null;
        overallFeedback = surveyData.overallFeedback || "";
        additionalFeedback = surveyData.additionalFeedback || [];
      }
    } catch (error) {
      console.error("[loadIntegratedSurveyBundle] Survey load error:", error);
    }
  }

  // lastSurveyId가 없으면 최신 설문 검색
  if (!lastSurvey) {
    try {
      const q = query(
        collection(db, surveyResultsCollection),
        where("userId", "==", patientId),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const latestDoc = snap.docs[0];
        const surveyData = latestDoc.data() || {};
        lastSurvey = {
          id: latestDoc.id,
          ...surveyData,
        };
        answers = surveyData.answers || {};
        stdScores = surveyData.stdScores || {};
        meanScores = surveyData.meanScores || {};
        riskLevel = surveyData.riskLevel || surveyData.overallRiskGroup || null;
        overallFeedback = surveyData.overallFeedback || "";
        additionalFeedback = surveyData.additionalFeedback || [];
      }
    } catch (error) {
      console.error("[loadIntegratedSurveyBundle] Survey query error:", error);
    }
  }

  // userData에서 보완
  if (!answers || Object.keys(answers).length === 0) {
    answers = userData.answers || {};
  }
  if (!stdScores || Object.keys(stdScores).length === 0) {
    stdScores = userData.stdScores || {};
  }
  if (!meanScores || Object.keys(meanScores).length === 0) {
    meanScores = userData.meanScores || {};
  }
  if (!riskLevel) {
    riskLevel =
      userData.riskLevel ||
      userData.lastOverallRiskGroup ||
      userData.overallRiskGroup ||
      null;
  }
  if (!overallFeedback) {
    overallFeedback =
      userData.overallFeedback || userData.lastOverallFeedback || "";
  }
  if (!additionalFeedback || additionalFeedback.length === 0) {
    additionalFeedback = userData.additionalFeedback || [];
  }

  return {
    lastSurvey,
    answers,
    stdScores,
    meanScores,
    riskLevel,
    overallFeedback,
    additionalFeedback,
  };
}

/**
 * 통합 상담 번들 로드
 * @param {string} patientId
 * @param {string} type - "survivor" | "patient"
 * @returns {Promise<Object>}
 */
export async function loadIntegratedCounselingBundle(patientId, type) {
  const isPatient = type === SURVEY_TYPES.PATIENT;
  const counselingCollection = isPatient
    ? COLLECTIONS.PATIENTS.COUNSELING_REQUESTS
    : COLLECTIONS.SURVIVORS.COUNSELING_REQUESTS;

  try {
    const q = query(
      collection(db, counselingCollection),
      where("userId", "==", patientId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    const requests = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return {
      counselingRequests: requests,
      lastCounseling: requests.length > 0 ? requests[0] : null,
    };
  } catch (error) {
    console.error("[loadIntegratedCounselingBundle] Error:", error);
    return {
      counselingRequests: [],
      lastCounseling: null,
    };
  }
}

/**
 * 통합 환자 전체 데이터 로드
 * @param {string} patientId
 * @returns {Promise<Object>}
 */
export async function loadIntegratedPatientAll(patientId) {
  // 먼저 타입 확인
  const detail = await getIntegratedPatientDetail(patientId);
  if (!detail) {
    return { notFound: true };
  }

  const { type } = detail;

  // 병렬 로드
  const [core, survey, counseling] = await Promise.all([
    loadIntegratedPatientCore(patientId),
    loadIntegratedSurveyBundle(patientId, type),
    loadIntegratedCounselingBundle(patientId, type),
  ]);

  return {
    type,
    core,
    survey,
    counseling,
  };
}
