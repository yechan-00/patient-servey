// Firestore에서 필요한 함수 가져오기
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebaseConfig"; // Firestore 인스턴스 가져오기
import { COLLECTIONS } from "./collectionConfig"; // 컬렉션 분리 설정

export const serverTS = () => serverTimestamp();

// 컬렉션 분리 적용: 환자용 접두사 사용
export const colSurveyResults = () =>
  collection(db, COLLECTIONS.SURVEY_RESULTS);
export const userDocRef = (id) => doc(db, COLLECTIONS.USERS, id);
export const patientDocRef = (id) => doc(db, COLLECTIONS.PATIENTS, id);

/**
 * 날짜 정규화 유틸 함수 (공통 사용)
 * YYYY-MM-DD / Timestamp / Date → YYYY-MM-DD 문자열로 정규화
 * @param {any} v - 날짜 값 (Date, Timestamp, string 등)
 * @returns {string} - YYYY-MM-DD 형식의 문자열
 */
export const fmtDate = (v) => {
  try {
    if (!v) return "";
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if (v?.toDate) return v.toDate().toISOString().slice(0, 10); // Firestore Timestamp 지원
    const d = new Date(v);
    return isNaN(d) ? String(v) : d.toISOString().slice(0, 10);
  } catch {
    return String(v ?? "");
  }
};

// 안정적 환자 ID 생성: 로그인 uid 우선, 없으면 이름+생년월일 해시로 p- 접두
export async function computeStablePatientId(
  name = "",
  birthDate = "",
  fallbackSeed = ""
) {
  const norm = (s = "") => s.normalize("NFC").trim().toLowerCase();
  const key = `${norm(name)}|${norm(birthDate)}|${norm(fallbackSeed)}`;
  try {
    const enc = new TextEncoder().encode(key);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const hex = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `p-${hex.slice(0, 20)}`; // 20자 사용 (충분히 유니크)
  } catch (e) {
    // crypto 미지원 환경 폴백
    return `p-${Date.now().toString(36)}${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }
}

const isProbableId = (s = "") => {
  if (!s || typeof s !== "string") return false;
  const t = s.trim();
  if (t.startsWith("p-")) return true; // our stable computed id
  // very common uid/id patterns: long, lowercase/hex/uuid-like
  return /^[a-z0-9\-_]{16,}$/i.test(t);
};

// 사용자(환자) 기본 정보를 patients 컬렉션에 업서트하고 patientId를 반환
export const saveUserData = async (data = {}) => {
  try {
    const name = (data?.name || data?.userName || "").trim();
    const birthDate = data?.birthDate || ""; // YYYY-MM-DD 기대

    // 1) 안정 ID 산출 (로그인 uid가 있다면 그걸 사용하도록 호출부에서 넘겨줄 수도 있음)
    const auth = getAuth();
    const uid = data?.uid || auth.currentUser?.uid || "";
    const patientId = uid || (await computeStablePatientId(name, birthDate));

    // 2) 문서 참조 및 최초 생성 여부 판단
    const patientRef = doc(db, COLLECTIONS.PATIENTS, patientId);
    const current = await getDoc(patientRef);
    const base = current.exists()
      ? {}
      : {
          createdAt: serverTimestamp(),
          archived: false,
          counselingStatus: "미요청",
        };

    // 3) 업서트 페이로드 구성 (빈 값 방지 및 표준화)
    // web3 사회경제 정보 포함
    const payload = {
      name,
      birthDate: birthDate || "",
      // 기본 정보
      gender: data?.gender || "",
      maritalStatus: data?.maritalStatus || "",
      evaluationDate: data?.evaluationDate || "",
      respondent: data?.respondent || "",
      // 거주지 정보
      residenceRegZip: data?.residenceRegZip || "",
      residenceActual: data?.residenceActual || "",
      // 가구/주거 정보
      familyComposition: data?.familyComposition || [],
      familyOther: data?.familyOther || "",
      religion: data?.religion || "",
      housingType: data?.housingType || "",
      housingTypeOther: data?.housingTypeOther || "",
      // 장애 정보
      disability: data?.disability || "",
      disabilityDetails: data?.disabilityDetails || "",
      // 의료보장/지불재원 정보
      insuranceType: data?.insuranceType || [],
      paymentSource: data?.paymentSource || [],
      privateInsuranceType: data?.privateInsuranceType || [],
      otherPaymentSource: data?.otherPaymentSource || "",
      // 암 정보
      cancerType: data?.cancerType || data?.cancer || "",
      diagnosisDate:
        data?.diagnosisDate ||
        (data?.diagnosisYear && data?.diagnosisMonth
          ? `${data.diagnosisYear}-${String(data.diagnosisMonth).padStart(
              2,
              "0"
            )}`
          : ""),
      phone: data?.phone || "",
      riskLevel: data?.riskLevel || current.data()?.riskLevel || "low",
      updatedAt: serverTimestamp(),
    };

    // 4) patients/{patientId}에만 저장 (guest-* 등 중복 생성 금지)
    const finalData = { ...base, ...payload };
    await setDoc(patientRef, finalData, { merge: true });

    console.log("[saveUserData] Saved patient", patientId, "to", COLLECTIONS.PATIENTS);
    return patientId;
  } catch (e) {
    console.error("[saveUserData] Error:", e);
    throw e;
  }
};

// 사용자별 answers를 저장하는 함수
export const saveUserAnswers = async (userName, answers) => {
  try {
    // Resolve a stable id: prefer passed value if it looks like an id; else derive from name (+ optional birthDate in answers)
    const auth = getAuth();
    const fromAuth = auth.currentUser?.uid || "";
    const derivedId = await computeStablePatientId(
      (userName || "").trim(),
      (answers && (answers.birthDate || answers["생년월일"])) || "",
      "answers"
    );
    const userId = isProbableId(userName) ? userName : fromAuth || derivedId;

    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const snap = await getDoc(userRef);
    const existing =
      snap.exists() && snap.data().answers ? snap.data().answers : {};
    const merged = { ...existing, ...(answers || {}) };

    await setDoc(
      userRef,
      { answers: merged, updatedAt: serverTimestamp() },
      { merge: true }
    );
    console.log(`[saveUserAnswers] answers saved for ${userId}`, merged);
    return userId;
  } catch (error) {
    console.error("Error saving answers:", error);
    throw error;
  }
};

// 사용자별 answers를 불러오는 함수
export const getUserAnswers = async (userName) => {
  try {
    const auth = getAuth();
    const fromAuth = auth.currentUser?.uid || "";
    const derivedId = await computeStablePatientId(
      (userName || "").trim(),
      "",
      "answers-read"
    );
    const userId = isProbableId(userName) ? userName : fromAuth || derivedId;

    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const snap = await getDoc(userRef);
    return snap.exists() ? snap.data().answers || {} : {};
  } catch (e) {
    console.error("Error getting user answers: ", e);
    throw e;
  }
};

// 사용자의 설문 결과 점수를 저장하는 함수
export const saveSurveyScores = async (
  patientId,
  scores,
  profile = {},
  opts = {}
) => {
  try {
    // 저장 대상 문서 ID는 호출부에서 전달한 patientId를 그대로 사용
    const effectiveId = patientId;

    const userRef = doc(db, COLLECTIONS.USERS, effectiveId);
    const patientRef = doc(db, COLLECTIONS.PATIENTS, effectiveId);

    const timestamp = new Date().toISOString();
    const userSnap = await getDoc(userRef);
    const existingData = userSnap.exists() ? userSnap.data() : {};
    const answers = existingData.answers || {}; // 설문 응답 원본(한글/영문 혼용 가능)

    // --- 유틸 ---
    const pick = (obj, keys) => {
      for (const k of keys) {
        const val = obj && obj[k];
        if (val !== undefined && val !== null && String(val).trim() !== "")
          return val;
      }
      return "";
    };

    // --- 다양한 키 후보에서 표준 필드 뽑기 ---
    const mergedSource = {
      ...(scores?.profile || {}),
      ...(profile || {}),
      ...existingData,
      ...answers,
    };

    const name =
      pick(mergedSource, ["name", "이름", "성명", "fullName"]) || patientId;

    const birthDate = fmtDate(
      pick(mergedSource, [
        "birthDate",
        "생년월일",
        "dob",
        "출생일",
        "출생 날짜",
        "birth_date",
      ])
    );

    const cancerType = pick(mergedSource, [
      "cancerType",
      "암종류",
      "암 종류",
      "진단암종",
      "암진단명",
      "암",
      "primaryCancer",
    ]);

    const diagnosisDate = fmtDate(
      pick(mergedSource, [
        "diagnosisDate",
        "진단시기",
        "진단 시기",
        "진단연월",
        "진단년월",
        "진단일",
        "diagnosis",
        "diagnosedAt",
      ])
    );

    // --- 프로필 필드 표준화 추출 도우미 & 패치 객체 ---
    const get = (keys) => pick(mergedSource, keys);

    const profilePatch = {
      gender: get(["gender", "성별"]),
      maritalStatus: get(["maritalStatus", "결혼상태", "결혼 상태"]),
      cancerStage: get(["cancerStage", "암병기", "암 병기", "stage"]),
      hasRecurrence: get(["hasRecurrence", "재발여부", "재발 여부"]),
      hasSurgery: get(["hasSurgery", "수술여부", "수술 여부"]),
      surgeryDate: fmtDate(get(["surgeryDate", "수술시기", "수술 시기"])),
      otherCancerDiagnosis: get([
        "otherCancerDiagnosis",
        "다른암진단여부",
        "다른 암 진단 여부",
      ]),
      otherCancerType: get(["otherCancerType", "다른암종류", "다른 암 종류"]),
      otherCancerDetails: get([
        "otherCancerDetails",
        "다른암세부",
        "다른 암 세부",
      ]),
      mentalHealthHistory: get(["mentalHealthHistory", "정신건강력"]),
      otherMentalDiagnosis: get([
        "otherMentalDiagnosis",
        "정신건강진단명",
        "정신 건강 진단명",
      ]),
      mentalHealthDiagnosesText: get([
        "mentalHealthDiagnosesText",
        "정신건강진단기타",
        "정신건강 기타",
      ]),
      mentalHealthImpact: get([
        "mentalHealthImpact",
        "정신건강영향",
        "정신건강 영향",
      ]),
      otherTreatmentType: get(["otherTreatmentType", "기타치료", "기타 치료"]),
      phone: get(["phone", "연락처", "휴대폰"]),
      contactMethod: get(["contactMethod", "연락방법", "상담 방식"]),
      contactTime: get(["contactTime", "연락가능시간", "상담 가능 시간"]),
    };

    // 상담 요청 여부 / 상태
    const requested = !!pick(mergedSource, [
      "requestCounseling",
      "상담요청",
      "상담 요청",
      "counselingRequest",
      "wantCounseling",
    ]);

    const counselingStatus = requested
      ? "대기"
      : existingData.counselingStatus || "미요청";

    // --- 점수 스냅샷(있으면 저장) ---
    const scoreEntry = {
      timestamp,
      stdScores: scores?.stdScores ?? null,
      meanScores: scores?.meanScores ?? null,
      riskGroups: scores?.riskGroups ?? null,
      overallMean: scores?.overallMean ?? null,
      overallRiskGroup: scores?.overallRiskGroup ?? null,
      overallFeedback: scores?.overallFeedback ?? null,
      additionalFeedback: scores?.additionalFeedback ?? null,
      profile: { name, birthDate, cancerType, diagnosisDate, requested },
    };

    // users 문서의 surveyResults 배열 히스토리 유지
    const surveyResults = Array.isArray(existingData.surveyResults)
      ? [...existingData.surveyResults]
      : [];
    surveyResults.push(scoreEntry);

    // 2) patients/{userName} 문서에 표시용 필드 업서트(merge)
    await setDoc(
      patientRef,
      {
        name,
        birthDate,
        cancerType,
        diagnosisDate,
        requested, // boolean
        counselingStatus, // "대기" | "미요청" 등
        ...profilePatch,
        lastSurveyAt: serverTimestamp(),
        ...(opts?.surveyId ? { lastSurveyId: opts.surveyId } : {}),
      },
      { merge: true }
    );

    // 3) users/{userName} 문서에는 히스토리와 완료시각을 계속 저장
    await setDoc(
      userRef,
      {
        ...existingData,
        ...profilePatch,
        surveyResults, // 히스토리 유지
        lastSurveyCompletedAt: timestamp, // 마지막 설문 완료 시간 (ISO)
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log(
      `[saveSurveyScores] upserted patients & survey results for ${effectiveId}:`,
      {
        name,
        birthDate,
        cancerType,
        diagnosisDate,
        requested,
        counselingStatus,
      }
    );
    return true;
  } catch (error) {
    console.error("Error saving survey scores:", error);
    throw error;
  }
};

export const saveSurveySnapshot = async (userId, snapshotData) => {
  try {
    const payload = {
      userId,
      raw: { ...snapshotData },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(
      collection(db, COLLECTIONS.SURVEY_RESULTS),
      payload
    );
    // 최신 설문 링크를 users/{id}에 저장(merge)
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await setDoc(
        userRef,
        { lastSurveyId: docRef.id, lastSurveyAt: serverTimestamp() },
        { merge: true }
      );
    } catch (e) {
      console.warn("[saveSurveySnapshot] failed to set lastSurveyId:", e);
    }
    console.log(
      `Survey snapshot (surveyResults) saved with ID: ${docRef.id} for user: ${userId}`
    );
    return docRef.id;
  } catch (error) {
    console.error("Error saving survey snapshot:", error);
    throw error;
  }
};

// --- patients 컬렉션 요약 스냅샷 저장 유틸 ---
/**
 * patients/{userId}에 요약 스냅샷 저장(업서트)
 * - 최초 생성: createdAt, 이후 저장: updatedAt만 갱신
 */
export const savePatientSnapshot = async (userId, snapshot) => {
  try {
    const ref = doc(db, COLLECTIONS.PATIENTS, userId);

    // 날짜 필드 정규화 + 기본값 부여
    const payload = {
      name: snapshot.name ?? "",
      birthDate: fmtDate(snapshot.birthDate),
      cancerType: snapshot.cancerType ?? "",
      diagnosisDate: fmtDate(snapshot.diagnosisDate),
      riskLevel: snapshot.riskLevel ?? "low",
      counselingStatus: snapshot.counselingStatus ?? "미요청",
      archived: snapshot.archived ?? false,
      // ▼ 추가된 프로필 필드 (표시용)
      gender: snapshot.gender ?? "",
      maritalStatus: snapshot.maritalStatus ?? "",
      cancerStage: snapshot.cancerStage ?? "",
      hasRecurrence: snapshot.hasRecurrence ?? "",
      hasSurgery: snapshot.hasSurgery ?? "",
      surgeryDate: fmtDate(snapshot.surgeryDate),
      otherCancerDiagnosis: snapshot.otherCancerDiagnosis ?? "",
      otherCancerType: snapshot.otherCancerType ?? "",
      otherCancerDetails: snapshot.otherCancerDetails ?? "",
      mentalHealthHistory: snapshot.mentalHealthHistory ?? "",
      otherMentalDiagnosis: snapshot.otherMentalDiagnosis ?? "",
      mentalHealthDiagnosesText: snapshot.mentalHealthDiagnosesText ?? "",
      mentalHealthImpact: snapshot.mentalHealthImpact ?? "",
      otherTreatmentType: snapshot.otherTreatmentType ?? "",
      phone: snapshot.phone ?? "",
      contactMethod: snapshot.contactMethod ?? "",
      contactTime: snapshot.contactTime ?? "",
      // createdAt은 최초 생성 시에만 세팅하고, 이후에는 유지하고 updatedAt만 갱신
      updatedAt: serverTimestamp(),
    };

    // 최초 생성 여부 판단을 위해 한 번 읽기
    const current = await getDoc(ref);
    const base = current.exists() ? {} : { createdAt: serverTimestamp() };

    await setDoc(ref, { ...base, ...payload }, { merge: true });
    console.log("Patient snapshot saved:", userId, payload);
  } catch (e) {
    console.error("Error saving patient snapshot:", e);
    throw e;
  }
};

/**
 * 마지막 설문 요약 저장 (users/{userId} 문서에 머지)
 * - lastSurveyCompletedAt, lastOverallMean, lastOverallRiskGroup, lastOverallFeedback 저장
 * - updatedAt 자동 갱신
 */
export const saveSurveySummary = async (userId, summary) => {
  try {
    const ref = doc(db, COLLECTIONS.USERS, userId);
    const payload = {
      lastSurveyCompletedAt: summary.lastSurveyCompletedAt ?? null,
      lastOverallMean: summary.lastOverallMean ?? null,
      lastOverallRiskGroup: summary.lastOverallRiskGroup ?? null,
      lastOverallFeedback: summary.lastOverallFeedback ?? null,
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, payload, { merge: true });
    console.log("Survey summary saved:", userId, payload);
  } catch (e) {
    console.error("Error saving survey summary:", e);
    throw e;
  }
};
