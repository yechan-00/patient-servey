// web2/src/utils/FirebaseUtils.js
// Firestore 조회/업데이트 공통 유틸
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  orderBy,
} from "firebase/firestore";

// 날짜 포맷터 (YYYY-MM-DD)
function fmtDate(v) {
  try {
    if (!v) return "";
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    // Firestore Timestamp인 경우
    if (v instanceof Timestamp) return v.toDate().toISOString().slice(0, 10);
    // 문자열(YYYY-MM-DD or ISO)인 경우
    const d = new Date(v);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
    return String(v);
  } catch {
    return String(v ?? "");
  }
}

// 위험도 정규화 함수 (상세 페이지와 동일한 로직)
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
 * 환자 간단 리스트용 최소 필드 조회
 * @param {Object} opts
 * @param {boolean} opts.includeArchived - 보관 포함 여부
 * @returns {Promise<Array>}
 */
export async function getPatientsLite({ includeArchived = false } = {}) {
  const ref = collection(db, "patients");
  const qRef = includeArchived
    ? ref
    : query(ref, where("archived", "==", false));

  const snap = await getDocs(qRef);
  const patientDocs = snap.docs;

  // 각 환자에 대해 users 컬렉션도 병렬로 읽어서 위험도 우선순위 맞추기
  const patientsWithRisk = await Promise.all(
    patientDocs.map(async (d) => {
      const v = d.data() || {};
      const patientId = d.id;

      // users 컬렉션에서 lastOverallRiskGroup 읽기
      let userRiskLevel = null;
      try {
        const userDoc = await getDoc(doc(db, "users", patientId));
        if (userDoc.exists()) {
          const userData = userDoc.data() || {};
          userRiskLevel =
            userData.lastOverallRiskGroup || userData.overallRiskGroup || null;
        }
      } catch (e) {
        // users 문서가 없거나 읽기 실패 시 무시
        console.warn(
          `[getPatientsLite] Failed to read users/${patientId}:`,
          e.message
        );
      }

      // 위험도 우선순위: users.lastOverallRiskGroup > patients.riskLevel
      const rawRiskLevel = userRiskLevel || v.riskLevel || "";
      const normalizedRisk = normalizeRiskLevel(rawRiskLevel);

      return {
        id: patientId,
        name: v.name ?? "",
        birthDate: fmtDate(v.birthDate),
        cancerType: v.cancerType ?? "",
        diagnosisDate: fmtDate(v.diagnosisDate),
        riskLevel: normalizedRisk || rawRiskLevel || "",
        counselingStatus: v.counselingStatus ?? "미요청",
        archived: !!v.archived,
      };
    })
  );

  return patientsWithRisk;
}

/**
 * 환자 실시간 구독 (대시보드용)
 * @param {Object} opts
 * @param {boolean} opts.showArchived - 보관 환자도 포함할지
 * @param {(patients:Array)=>void} cb - 스냅샷 수신 콜백
 * @returns {() => void} unsubscribe 함수
 */
export function subscribePatients({ showArchived = false } = {}, cb) {
  const ref = collection(db, "patients");
  const qRef = showArchived ? ref : query(ref, where("archived", "==", false));
  return onSnapshot(qRef, (snap) => {
    const rows = snap.docs.map((d) => mapPatient(d));
    cb(rows);
  });
}

/**
 * counselingRequests: 특정 환자(userId) 기준 최근순 조회
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function fetchCounselingRequestsByUserId(userId) {
  const ref = collection(db, "counselingRequests");
  const qRef = query(
    ref,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(qRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * 상담 상태 업데이트 (counselingRequests 단건)
 * @param {string} requestId
 * @param {string} status - "pending" | "scheduled" | "in_progress" | "completed" 등
 */
export async function updateCounselingStatus(requestId, status) {
  await updateDoc(doc(db, "counselingRequests", requestId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 보관 플래그 토글 (patients)
 * @param {string} patientId
 * @param {boolean} archived
 */
export async function setPatientArchived(patientId, archived) {
  await updateDoc(doc(db, "patients", patientId), {
    archived: !!archived,
    archivedAt: archived ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 환자 문서 스냅샷 → 표시용 데이터 매핑
 * 누락/이질 키에 대한 폴백을 제공하여 UI 공란을 줄임
 * @param {import("firebase/firestore").QueryDocumentSnapshot} docSnap
 */
export function mapPatient(docSnap) {
  const v = docSnap.data() || {};
  return {
    id: docSnap.id,
    name: v.name ?? "",
    phone: v.phone ?? v.contact ?? "",
    email: v.email ?? "",
    birthDate: fmtDate(v.birthDate ?? v.birthdate ?? v.dob ?? null),
    cancerType: v.cancerType ?? v.cancer_type ?? "",
    diagnosisDate: fmtDate(v.diagnosisDate ?? v.diagnosis_date ?? null),
    contactMethod: v.contactMethod ?? v.preferredMethod ?? "",
    contactTime: v.contactTime ?? v.timeSlot ?? "",
    riskLevel: v.riskLevel ?? "low",
    archived: !!v.archived,
    lastSurveyAt: fmtDate(v.lastSurveyAt ?? null),
    lastCounselingRequestAt: fmtDate(v.lastCounselingRequestAt ?? null),
    counselingStatus: v.counselingStatus ?? "미요청",
  };
}

// --- 상담 상태 및 보관 업데이트 유틸 ---
export const COUNSELING_STATUSES = ["미요청", "요청", "진행중", "완료", "보관"];

/**
 * 상담 상태 업데이트 (보관 선택 시 archived=true 동반)
 * @param {string} patientId
 * @param {"미요청"|"요청"|"진행중"|"완료"|"보관"} nextStatus
 */
export async function updatePatientStatus(patientId, nextStatus) {
  if (!COUNSELING_STATUSES.includes(nextStatus)) {
    throw new Error(`Unknown counselingStatus: ${nextStatus}`);
  }
  const ref = doc(db, "patients", patientId);
  await updateDoc(ref, {
    counselingStatus: nextStatus,
    updatedAt: serverTimestamp(),
    ...(nextStatus === "보관" ? { archived: true } : {}),
  });
}

/**
 * 보관 플래그 설정/해제
 * @param {string} patientId
 * @param {boolean} archived
 */
export async function setArchived(patientId, archived = true) {
  const ref = doc(db, "patients", patientId);
  await updateDoc(ref, {
    archived,
    // 정책상 보관 해제 시 상태를 '완료'로 되돌릴지 여부는 운영 규칙 확정 후 적용
    updatedAt: serverTimestamp(),
  });
}
