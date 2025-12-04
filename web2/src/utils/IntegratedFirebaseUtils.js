// web2/src/utils/IntegratedFirebaseUtils.js
// 통합 Firebase 유틸리티 (web1 + web3)
// ⚠️ 기존 FirebaseUtils.js는 수정하지 않음 - 완전히 분리된 새 파일

import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { COLLECTIONS, SURVEY_TYPES } from "./collectionConfig";

// 날짜 포맷터 (기존 FirebaseUtils와 동일)
function fmtDate(v) {
  try {
    if (!v) return "";
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if (v?.toDate) return v.toDate().toISOString().slice(0, 10);
    const d = new Date(v);
    return isNaN(d) ? String(v) : d.toISOString().slice(0, 10);
  } catch {
    return String(v ?? "");
  }
}

// 위험도 정규화 (기존 FirebaseUtils와 동일)
function normalizeRiskLevel(text) {
  if (!text) return undefined;
  const t = String(text).toLowerCase();
  if (["high", "고위험", "고위험집단", "위험"].some((k) => t.includes(k)))
    return "high";
  if (["medium", "중위험", "중위험집단", "주의"].some((k) => t.includes(k)))
    return "medium";
  if (["low", "저위험", "저위험집단", "양호"].some((k) => t.includes(k)))
    return "low";
  return undefined;
}

/**
 * 통합 환자 조회 (생존자 + 환자)
 * @param {Object} opts
 * @param {string} opts.surveyType - "survivor" | "patient" | "all" (기본: "all")
 * @param {boolean} opts.includeArchived - 보관 포함 여부
 * @returns {Promise<Array>} - { id, name, birthDate, ..., type: "survivor" | "patient" }
 */
export async function getIntegratedPatients({
  surveyType = SURVEY_TYPES.SURVIVOR,
  includeArchived = false,
} = {}) {
  const results = [];

  // 생존자 데이터 조회
  if (surveyType === SURVEY_TYPES.SURVIVOR) {
    try {
      const survivorsRef = collection(db, COLLECTIONS.SURVIVORS.PATIENTS);
      const survivorsQuery = includeArchived
        ? survivorsRef
        : query(survivorsRef, where("archived", "==", false));

      const survivorsSnap = await getDocs(survivorsQuery);
      survivorsSnap.docs.forEach((d) => {
        const v = d.data() || {};
        // createdAt 파싱
        const createdAt =
          v.createdAt?.toDate?.() ||
          (v.createdAt instanceof Date ? v.createdAt : null) ||
          (typeof v.createdAt === "string" ? new Date(v.createdAt) : null) ||
          null;

        // lastSurveyAt 파싱
        const lastSurveyAt =
          v.lastSurveyAt?.toDate?.() ||
          (v.lastSurveyAt instanceof Date ? v.lastSurveyAt : null) ||
          (typeof v.lastSurveyAt === "string"
            ? new Date(v.lastSurveyAt)
            : null) ||
          null;

        results.push({
          id: d.id,
          name: v.name ?? "",
          birthDate: fmtDate(v.birthDate),
          cancerType: v.cancerType ?? "",
          diagnosisDate: fmtDate(v.diagnosisDate),
          riskLevel: normalizeRiskLevel(v.riskLevel) || v.riskLevel || "",
          counselingStatus: v.counselingStatus ?? "미요청",
          requested:
            v.requested === true ||
            v.counselingStatus === "요청" ||
            v.counselingStatus === "대기",
          archived: !!v.archived,
          createdAt,
          lastSurveyAt,
          type: SURVEY_TYPES.SURVIVOR, // 타입 구분 필드
        });
      });
    } catch (error) {
      console.error("[getIntegratedPatients] Survivors fetch error:", error);
    }
  }

  // 환자 데이터 조회
  if (surveyType === SURVEY_TYPES.PATIENT) {
    try {
      const patientsRef = collection(db, COLLECTIONS.PATIENTS.PATIENTS);
      const patientsQuery = includeArchived
        ? patientsRef
        : query(patientsRef, where("archived", "==", false));

      const patientsSnap = await getDocs(patientsQuery);
      patientsSnap.docs.forEach((d) => {
        const v = d.data() || {};
        // createdAt 파싱
        const createdAt =
          v.createdAt?.toDate?.() ||
          (v.createdAt instanceof Date ? v.createdAt : null) ||
          (typeof v.createdAt === "string" ? new Date(v.createdAt) : null) ||
          null;

        // lastSurveyAt 파싱
        const lastSurveyAt =
          v.lastSurveyAt?.toDate?.() ||
          (v.lastSurveyAt instanceof Date ? v.lastSurveyAt : null) ||
          (typeof v.lastSurveyAt === "string"
            ? new Date(v.lastSurveyAt)
            : null) ||
          null;

        results.push({
          id: d.id,
          name: v.name ?? "",
          birthDate: fmtDate(v.birthDate),
          cancerType: v.cancerType ?? "",
          diagnosisDate: fmtDate(v.diagnosisDate),
          riskLevel: normalizeRiskLevel(v.riskLevel) || v.riskLevel || "",
          counselingStatus: v.counselingStatus ?? "미요청",
          requested:
            v.requested === true ||
            v.counselingStatus === "요청" ||
            v.counselingStatus === "대기",
          archived: !!v.archived,
          createdAt,
          lastSurveyAt,
          type: SURVEY_TYPES.PATIENT, // 타입 구분 필드
          // web3 설문에서 수집하는 정보
          respondent: v.respondent ?? "",
          phone: v.phone ?? "",
          contactMethod: v.contactMethod ?? "",
          insuranceType: v.insuranceType ?? "",
        });
      });
    } catch (error) {
      console.error("[getIntegratedPatients] Patients fetch error:", error);
    }
  }

  return results;
}

/**
 * 통합 환자 실시간 구독 (생존자 + 환자)
 * @param {Object} opts
 * @param {string} opts.surveyType - "survivor" | "patient" | "all"
 * @param {boolean} opts.showArchived - 보관 포함 여부
 * @param {(patients:Array)=>void} cb - 스냅샷 수신 콜백
 * @returns {() => void} unsubscribe 함수
 */
export function subscribeIntegratedPatients(
  { surveyType = SURVEY_TYPES.SURVIVOR, showArchived = false } = {},
  cb
) {
  const unsubscribers = [];
  let survivorsCache = [];
  let patientsCache = [];

  // 두 구독을 합쳐서 처리하는 헬퍼
  const mergeAndCallback = () => {
    if (surveyType === SURVEY_TYPES.SURVIVOR) {
      // 생존자만
      cb(survivorsCache);
    } else if (surveyType === SURVEY_TYPES.PATIENT) {
      // 환자만
      cb(patientsCache);
    }
  };

  // 생존자 구독
  if (surveyType === SURVEY_TYPES.SURVIVOR) {
    const survivorsRef = collection(db, COLLECTIONS.SURVIVORS.PATIENTS);
    const survivorsQuery = showArchived
      ? survivorsRef
      : query(survivorsRef, where("archived", "==", false));

    const unsubSurvivors = onSnapshot(survivorsQuery, (snap) => {
      survivorsCache = snap.docs.map((d) => {
        const v = d.data() || {};
        // createdAt, lastSurveyAt 파싱
        const createdAt =
          v.createdAt?.toDate?.() ||
          (v.createdAt instanceof Date ? v.createdAt : null) ||
          (typeof v.createdAt === "string" ? new Date(v.createdAt) : null) ||
          null;
        const lastSurveyAt =
          v.lastSurveyAt?.toDate?.() ||
          (v.lastSurveyAt instanceof Date ? v.lastSurveyAt : null) ||
          (typeof v.lastSurveyAt === "string"
            ? new Date(v.lastSurveyAt)
            : null) ||
          null;
        return {
          id: d.id,
          name: v.name ?? "",
          birthDate: fmtDate(v.birthDate),
          cancerType: v.cancerType ?? "",
          diagnosisDate: fmtDate(v.diagnosisDate),
          riskLevel: normalizeRiskLevel(v.riskLevel) || v.riskLevel || "",
          counselingStatus: v.counselingStatus ?? "미요청",
          requested:
            v.requested === true ||
            v.counselingStatus === "요청" ||
            v.counselingStatus === "대기",
          archived: !!v.archived,
          createdAt,
          lastSurveyAt,
          type: SURVEY_TYPES.SURVIVOR,
        };
      });
      mergeAndCallback();
    });
    unsubscribers.push(unsubSurvivors);
  }

  // 환자 구독
  if (surveyType === SURVEY_TYPES.PATIENT) {
    const patientsRef = collection(db, COLLECTIONS.PATIENTS.PATIENTS);
    const patientsQuery = showArchived
      ? patientsRef
      : query(patientsRef, where("archived", "==", false));

    const unsubPatients = onSnapshot(patientsQuery, (snap) => {
      patientsCache = snap.docs.map((d) => {
        const v = d.data() || {};
        // createdAt, lastSurveyAt 파싱
        const createdAt =
          v.createdAt?.toDate?.() ||
          (v.createdAt instanceof Date ? v.createdAt : null) ||
          (typeof v.createdAt === "string" ? new Date(v.createdAt) : null) ||
          null;
        const lastSurveyAt =
          v.lastSurveyAt?.toDate?.() ||
          (v.lastSurveyAt instanceof Date ? v.lastSurveyAt : null) ||
          (typeof v.lastSurveyAt === "string"
            ? new Date(v.lastSurveyAt)
            : null) ||
          null;
        return {
          id: d.id,
          name: v.name ?? "",
          birthDate: fmtDate(v.birthDate),
          cancerType: v.cancerType ?? "",
          diagnosisDate: fmtDate(v.diagnosisDate),
          riskLevel: normalizeRiskLevel(v.riskLevel) || v.riskLevel || "",
          counselingStatus: v.counselingStatus ?? "미요청",
          requested:
            v.requested === true ||
            v.counselingStatus === "요청" ||
            v.counselingStatus === "대기",
          archived: !!v.archived,
          createdAt,
          lastSurveyAt,
          type: SURVEY_TYPES.PATIENT,
          // web3 설문에서 수집하는 정보
          respondent: v.respondent ?? "",
          phone: v.phone ?? "",
          contactMethod: v.contactMethod ?? "",
          insuranceType: v.insuranceType ?? "",
        };
      });
      mergeAndCallback();
    });
    unsubscribers.push(unsubPatients);
  }

  // 구독 해제 함수 반환
  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

/**
 * 통합 상담 요청 조회
 * @param {Object} opts
 * @param {string} opts.surveyType - "survivor" | "patient" | "all"
 * @returns {Promise<Array>}
 */
export async function getIntegratedCounselingRequests({
  surveyType = SURVEY_TYPES.SURVIVOR,
} = {}) {
  const results = [];

  // 생존자 상담 요청
  if (surveyType === SURVEY_TYPES.SURVIVOR) {
    try {
      const survivorsRef = collection(
        db,
        COLLECTIONS.SURVIVORS.COUNSELING_REQUESTS
      );
      const survivorsQuery = query(survivorsRef, orderBy("createdAt", "desc"));
      const survivorsSnap = await getDocs(survivorsQuery);
      survivorsSnap.docs.forEach((d) => {
        results.push({
          id: d.id,
          ...d.data(),
          type: SURVEY_TYPES.SURVIVOR,
        });
      });
    } catch (error) {
      console.error(
        "[getIntegratedCounselingRequests] Survivors error:",
        error
      );
    }
  }

  // 환자 상담 요청
  if (surveyType === SURVEY_TYPES.PATIENT) {
    try {
      const patientsRef = collection(
        db,
        COLLECTIONS.PATIENTS.COUNSELING_REQUESTS
      );
      const patientsQuery = query(patientsRef, orderBy("createdAt", "desc"));
      const patientsSnap = await getDocs(patientsQuery);
      patientsSnap.docs.forEach((d) => {
        results.push({
          id: d.id,
          ...d.data(),
          type: SURVEY_TYPES.PATIENT,
        });
      });
    } catch (error) {
      console.error("[getIntegratedCounselingRequests] Patients error:", error);
    }
  }

  // 생성일 기준 정렬
  results.sort((a, b) => {
    const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
    const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
    return bTime - aTime;
  });

  return results;
}

/**
 * 통합 통계 계산
 * @param {Array} patients - getIntegratedPatients 결과
 * @returns {Object} 통계 객체
 */
export function calculateIntegratedStats(patients) {
  const survivors = patients.filter((p) => p.type === SURVEY_TYPES.SURVIVOR);
  const patientPatients = patients.filter(
    (p) => p.type === SURVEY_TYPES.PATIENT
  );

  const calculateStats = (list) => ({
    total: list.length,
    highRisk: list.filter((p) => p.riskLevel === "high").length,
    mediumRisk: list.filter((p) => p.riskLevel === "medium").length,
    lowRisk: list.filter((p) => p.riskLevel === "low").length,
    pendingRequests: list.filter(
      (p) => p.counselingStatus === "요청" || p.counselingStatus === "대기"
    ).length,
  });

  return {
    all: calculateStats(patients),
    survivors: calculateStats(survivors),
    patients: calculateStats(patientPatients),
  };
}

/**
 * 환자 상세 정보 조회 (타입 자동 감지)
 * @param {string} patientId
 * @returns {Promise<{type: string, data: Object} | null>}
 */
export async function getIntegratedPatientDetail(patientId) {
  // 먼저 생존자 컬렉션 확인
  try {
    const survivorDoc = await getDoc(
      doc(db, COLLECTIONS.SURVIVORS.PATIENTS, patientId)
    );
    if (survivorDoc.exists()) {
      return {
        type: SURVEY_TYPES.SURVIVOR,
        data: survivorDoc.data(),
        id: survivorDoc.id,
      };
    }
  } catch (error) {
    console.warn("[getIntegratedPatientDetail] Survivor check failed:", error);
  }

  // 없으면 환자 컬렉션 확인
  try {
    const patientDoc = await getDoc(
      doc(db, COLLECTIONS.PATIENTS.PATIENTS, patientId)
    );
    if (patientDoc.exists()) {
      return {
        type: SURVEY_TYPES.PATIENT,
        data: patientDoc.data(),
        id: patientDoc.id,
      };
    }
  } catch (error) {
    console.warn("[getIntegratedPatientDetail] Patient check failed:", error);
  }

  return null;
}

/**
 * 통합 상담 상태 업데이트 (타입 자동 감지)
 * @param {string} patientId
 * @param {string} nextStatus - "미요청" | "요청" | "진행중" | "완료" | "보관"
 */
export async function updateIntegratedPatientStatus(patientId, nextStatus) {
  const COUNSELING_STATUSES = ["미요청", "요청", "진행중", "완료", "보관"];
  if (!COUNSELING_STATUSES.includes(nextStatus)) {
    throw new Error(`Unknown counselingStatus: ${nextStatus}`);
  }

  // 먼저 타입 확인
  const detail = await getIntegratedPatientDetail(patientId);
  if (!detail) {
    throw new Error("환자 정보를 찾을 수 없습니다.");
  }

  const isPatient = detail.type === SURVEY_TYPES.PATIENT;
  const patientsCollection = isPatient
    ? COLLECTIONS.PATIENTS.PATIENTS
    : COLLECTIONS.SURVIVORS.PATIENTS;

  const ref = doc(db, patientsCollection, patientId);
  const updateData = {
    counselingStatus: nextStatus,
    updatedAt: serverTimestamp(),
  };

  // 보관 선택 시 archived=true 동반
  if (nextStatus === "보관") {
    updateData.archived = true;
    updateData.archivedAt = serverTimestamp();
  } else if (nextStatus === "완료" && detail.data?.archived) {
    // 완료로 변경 시 보관 해제
    updateData.archived = false;
    updateData.archivedAt = null;
  }

  await updateDoc(ref, updateData);
}

/**
 * 통합 보관 플래그 토글 (타입 자동 감지)
 * @param {string} patientId
 * @param {boolean} archived
 */
export async function setIntegratedArchived(patientId, archived) {
  // 먼저 타입 확인
  const detail = await getIntegratedPatientDetail(patientId);
  if (!detail) {
    throw new Error("환자 정보를 찾을 수 없습니다.");
  }

  const isPatient = detail.type === SURVEY_TYPES.PATIENT;
  const patientsCollection = isPatient
    ? COLLECTIONS.PATIENTS.PATIENTS
    : COLLECTIONS.SURVIVORS.PATIENTS;

  const ref = doc(db, patientsCollection, patientId);
  await updateDoc(ref, {
    archived: !!archived,
    archivedAt: archived ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
}

// SURVEY_TYPES를 named export로 추가
export { SURVEY_TYPES };

const IntegratedFirebaseUtils = {
  getIntegratedPatients,
  subscribeIntegratedPatients,
  getIntegratedCounselingRequests,
  calculateIntegratedStats,
  getIntegratedPatientDetail,
  updateIntegratedPatientStatus,
  setIntegratedArchived,
  SURVEY_TYPES,
};

export default IntegratedFirebaseUtils;
