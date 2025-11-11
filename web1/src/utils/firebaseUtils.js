// Firestore에서 필요한 함수 가져오기
import {
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebaseConfig"; // Firestore 인스턴스 가져오기
import {
  COLLECTIONS,
  SCHEMA_VERSION,
} from "../component/survey/utils/constants";

export const serverTS = () => serverTimestamp();

export const colSurveyResults = () =>
  collection(db, COLLECTIONS?.SURVEY_RESULTS || "surveyResults");
export const userDocRef = (id) => doc(db, "users", id);
export const patientDocRef = (id) => doc(db, COLLECTIONS.PATIENTS, id);

// 깊은 빈값 제거 유틸 ("", null, undefined, 빈 배열/객체 제거)
function stripEmptyDeep(obj) {
  if (Array.isArray(obj)) {
    const arr = obj.map(stripEmptyDeep).filter((v) => v !== undefined);
    return arr.length ? arr : undefined;
  }
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const sv = stripEmptyDeep(v);
      if (sv !== "" && sv != null) out[k] = sv;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return obj;
}

// 중첩 객체 평탄화: { a: { b: 1 } } -> { "a.b": 1 }
function flattenDeep(obj, prefix = "", out = {}) {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) {
        flattenDeep(v, key, out);
      } else {
        out[key] = v;
      }
    }
  }
  return out;
}

// === Contract-first 저장/조회 (mappedPatient 전용) ===
export async function savePatientMapped(
  mappedPatient,
  patientIdHint = "",
  location = null
) {
  // --- helpers (scoped) ---
  // 진단일/수술일용: YYYY-MM 형식으로 변환 (일자 제거)
  const toYearMonthOnly = (v) => {
    try {
      if (!v) return "";
      const s = String(v).trim();

      // 이미 YYYY-MM 형식이면 그대로 반환
      if (/^\d{4}-\d{2}$/.test(s)) {
        return s;
      }

      // YYYY-MM-DD 형식이면 YYYY-MM으로 변환
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        return s.slice(0, 7); // "YYYY-MM-DD" -> "YYYY-MM"
      }

      // YYYYMMDD 형식이면 YYYY-MM으로 변환
      if (/^\d{8}$/.test(s)) {
        return `${s.slice(0, 4)}-${s.slice(4, 6)}`;
      }

      // Date 객체나 Timestamp는 YYYY-MM 형식으로 변환
      if (v instanceof Date) {
        const y = v.getFullYear();
        const m = String(v.getMonth() + 1).padStart(2, "0");
        return `${y}-${m}`;
      }
      if (v?.toDate) {
        const d = v.toDate();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        return `${y}-${m}`;
      }

      // 다른 형식은 Date로 파싱 시도 후 YYYY-MM으로 변환
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        return `${y}-${m}`;
      }

      return "";
    } catch {
      return "";
    }
  };

  const toISODate = (v) => {
    try {
      if (!v) return "";
      const s = String(v).trim();
      // accept YYYYMMDD
      if (/^\d{8}$/.test(s)) {
        return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
      }
      // accept YYYY-MM-DD / ISO / Date-like
      if (v instanceof Date) return v.toISOString().slice(0, 10);
      if (v?.toDate) return v.toDate().toISOString().slice(0, 10);
      const d = new Date(s);
      return isNaN(d) ? "" : d.toISOString().slice(0, 10);
    } catch {
      return "";
    }
  };
  const toYearMonth = (y, m) => {
    const yy = Number(y);
    const mm = Number(m);
    if (!yy || !mm) return "";
    return `${yy}-${String(mm).padStart(2, "0")}`;
  };
  const getPath = (obj, path) =>
    path
      .split(".")
      .reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj);

  // boolean을 "예"/"아니오"로 변환하는 헬퍼
  const boolToYesNo = (v) => {
    if (v === true || v === "true" || v === "예") return "예";
    if (v === false || v === "false" || v === "아니오") return "아니오";
    if (v === undefined || v === null || v === "") return "";
    return String(v);
  };

  // 0) patientId 결정: 힌트 > location/state/localStorage/auth > 이름+생년월 안정ID
  // 새 설문 시작인 경우(location.state.newSurvey === true) localStorage의 patientId 무시
  // 새 설문 시작 시 타임스탬프를 포함하여 고유한 ID 생성 (같은 사람의 여러 설문 구분)
  const isNewSurvey = location?.state?.newSurvey === true;

  let patientId = "";
  try {
    if (patientIdHint && isProbableId(patientIdHint)) {
      patientId = patientIdHint;
    } else if (!isNewSurvey) {
      // 새 설문이 아닌 경우에만 location/state/localStorage에서 가져오기
      const fromContext = getStablePatientId(location);
      if (fromContext && isProbableId(fromContext)) {
        patientId = fromContext;
      }
    }
  } catch {}
  if (!patientId) {
    const nameSeed = (
      mappedPatient?.name ??
      getPath(mappedPatient, "meta.name") ??
      ""
    ).toString();
    const birthSeed = toISODate(
      mappedPatient?.birthDate ?? getPath(mappedPatient, "meta.birthDate")
    );
    patientId = await computeStablePatientId(nameSeed, birthSeed, "mapped");
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("patientId", patientId);
      }
    } catch {}
  }

  // 저장 전: 깊은 빈값 제거 후 타임스탬프/스키마 부여
  const cleaned =
    stripEmptyDeep({
      ...mappedPatient,
      schemaVersion: mappedPatient?.schemaVersion ?? SCHEMA_VERSION,
      // createdAt은 최초 생성시에만 세팅하고, 이후에는 유지
      updatedAt: serverTimestamp(),
    }) || {};

  const ref = doc(db, COLLECTIONS.PATIENTS, patientId);

  // 최초 생성 여부 판단
  const current = await getDoc(ref);
  const existingData = current.exists() ? current.data() : {};

  // 설문 완료 여부 확인: lastSurveyAt가 있으면 완료된 설문
  const hasCompletedSurvey = !!existingData.lastSurveyAt;

  // 기존 환자가 있고 설문이 완료되지 않은 경우(미완료 설문) 경고
  if (current.exists() && !hasCompletedSurvey) {
    console.warn(
      `[savePatientMapped] 기존 미완료 설문 발견 (patientId: ${patientId}). 덮어쓰기 진행.`
    );
  }

  const base = current.exists()
    ? {}
    : {
        createdAt: serverTimestamp(),
        archived: false,
        counselingStatus: "미요청",
      };

  // 1) 원본(중첩) 병합 저장
  await setDoc(ref, { ...base, ...cleaned }, { merge: true });

  // 2) 요약 평면 필드 생성 (Web2 표/카드에서 즉시 사용)
  const name = mappedPatient?.name ?? getPath(mappedPatient, "meta.name") ?? "";

  const birthDate = toISODate(
    mappedPatient?.birthDate ?? getPath(mappedPatient, "meta.birthDate")
  );

  const gender =
    mappedPatient?.gender ??
    getPath(mappedPatient, "meta.gender") ??
    getPath(mappedPatient, "basic.gender") ??
    "";

  const maritalStatus =
    mappedPatient?.maritalStatus ??
    getPath(mappedPatient, "meta.maritalStatus") ??
    getPath(mappedPatient, "basic.maritalStatus") ??
    "";

  const cancerType =
    getPath(mappedPatient, "diagnosis.cancerType") ??
    mappedPatient?.cancerType ??
    "";

  const cancerStage =
    getPath(mappedPatient, "diagnosis.stage") ??
    mappedPatient?.cancerStage ??
    "";

  const diagnosisYear = getPath(mappedPatient, "diagnosis.year") ?? "";
  const diagnosisMonth = getPath(mappedPatient, "diagnosis.month") ?? "";

  // 진단일: YYYY-MM 형식만 저장 (일자 제거)
  const diagnosisDate =
    toYearMonth(diagnosisYear, diagnosisMonth) ||
    toYearMonthOnly(mappedPatient?.diagnosisDate) ||
    "";

  const hasSurgeryRaw =
    mappedPatient?.hasSurgery ??
    getPath(mappedPatient, "treatment.hasSurgery") ??
    getPath(mappedPatient, "treatment.surgery.has") ??
    "";
  const hasSurgery = boolToYesNo(hasSurgeryRaw);

  const surgeryDate = (() => {
    const y = getPath(mappedPatient, "treatment.surgery.year");
    const m = getPath(mappedPatient, "treatment.surgery.month");
    const d = getPath(mappedPatient, "treatment.surgery.day");
    if (y && m && d)
      return toISODate(
        `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      );
    if (y && m) return toYearMonth(y, m); // YYYY-MM
    return toISODate(
      getPath(mappedPatient, "treatment.surgery.date") ??
        mappedPatient?.surgeryDate
    );
  })();

  const otherCancerDiagnosisRaw =
    mappedPatient?.otherCancerDiagnosis ??
    getPath(mappedPatient, "diagnosis.otherCancerDiagnosis") ??
    getPath(mappedPatient, "otherCancer.hasOther") ??
    "";
  const otherCancerDiagnosis = boolToYesNo(otherCancerDiagnosisRaw);

  const otherCancerType =
    mappedPatient?.otherCancerType ??
    getPath(mappedPatient, "diagnosis.otherCancerType") ??
    "";

  const otherCancerDetails =
    mappedPatient?.otherCancerDetails ??
    getPath(mappedPatient, "diagnosis.otherCancerDetails") ??
    getPath(mappedPatient, "otherCancer.details") ??
    "";

  const hasRecurrenceRaw =
    mappedPatient?.hasRecurrence ?? getPath(mappedPatient, "recurrence") ?? "";
  const hasRecurrence = boolToYesNo(hasRecurrenceRaw);

  const mentalHealthHistoryRaw =
    mappedPatient?.mentalHealthHistory ??
    getPath(mappedPatient, "mentalHealth.history") ??
    getPath(mappedPatient, "meta.mentalHealthHistory") ??
    "";
  const mentalHealthHistory = boolToYesNo(mentalHealthHistoryRaw);

  // 정신건강 진단명: diagnoses 객체를 문자열로 변환
  const mentalHealthDiagnosesObj =
    mappedPatient?.mentalHealthDiagnoses ??
    getPath(mappedPatient, "mentalHealth.diagnoses") ??
    null;
  const mentalHealthDiagnosesFromObj = (() => {
    if (
      !mentalHealthDiagnosesObj ||
      typeof mentalHealthDiagnosesObj !== "object"
    )
      return "";
    const arr = [];
    if (mentalHealthDiagnosesObj.depression) arr.push("우울증");
    if (mentalHealthDiagnosesObj.anxietyDisorder) arr.push("불안장애");
    if (mentalHealthDiagnosesObj.schizophrenia) arr.push("조현병");
    if (mentalHealthDiagnosesObj.other) {
      const otherName = getPath(mappedPatient, "mentalHealth.otherName") ?? "";
      arr.push(otherName || "기타");
    }
    return arr.length > 0 ? arr.join(", ") : "";
  })();

  const mentalHealthDiagnosesText =
    mappedPatient?.mentalHealthDiagnosesText ??
    getPath(mappedPatient, "mentalHealth.diagnoses.text") ??
    mentalHealthDiagnosesFromObj ??
    "";

  const mentalHealthImpact =
    mappedPatient?.mentalHealthImpact ??
    getPath(mappedPatient, "mentalHealth.impact") ??
    "";

  const otherMentalDiagnosis =
    mappedPatient?.otherMentalDiagnosis ??
    getPath(mappedPatient, "mentalHealth.otherName") ??
    "";

  const otherTreatmentType =
    mappedPatient?.otherTreatmentType ??
    getPath(mappedPatient, "treatment.otherType") ??
    "";

  const phone = mappedPatient?.phone ?? "";
  const contactMethod = mappedPatient?.contactMethod ?? "";
  const contactTime = mappedPatient?.contactTime ?? "";

  // 생활습관 필드 추출 (lifestyle 객체에서 또는 직접 필드에서)
  const alcoholAbstinence =
    getPath(mappedPatient, "lifestyle.alcoholAbstinence") ??
    getPath(mappedPatient, "lifestyle.alcohol.tried") ??
    mappedPatient?.alcoholAbstinence ??
    "";
  const smokingCessation =
    getPath(mappedPatient, "lifestyle.smokingCessation") ??
    getPath(mappedPatient, "lifestyle.smoking.tried") ??
    mappedPatient?.smokingCessation ??
    "";

  // ⚠️ 요약 필드는 비어있어도 키가 존재하도록 빈 문자열을 그대로 둔다.
  const summary = {
    patientId,
    name: name || "",
    birthDate: birthDate || "",
    gender: gender || "",
    maritalStatus: maritalStatus || "",
    cancerType: cancerType || "",
    cancerStage: cancerStage || "",
    diagnosisYear: diagnosisYear || "",
    diagnosisMonth: diagnosisMonth || "",
    diagnosisDate: diagnosisDate || "",
    hasSurgery: hasSurgery || "",
    surgeryDate: surgeryDate || "",
    otherCancerDiagnosis: otherCancerDiagnosis || "",
    otherCancerType: otherCancerType || "",
    otherCancerDetails: otherCancerDetails || "",
    hasRecurrence: hasRecurrence || "",
    mentalHealthHistory: mentalHealthHistory || "",
    mentalHealthDiagnosesText: mentalHealthDiagnosesText || "",
    mentalHealthImpact: mentalHealthImpact || "",
    otherMentalDiagnosis: otherMentalDiagnosis || "",
    otherTreatmentType: otherTreatmentType || "",
    phone: phone || "",
    contactMethod: contactMethod || "",
    contactTime: contactTime || "",
    alcoholAbstinence: alcoholAbstinence || "",
    smokingCessation: smokingCessation || "",
    riskLevel: mappedPatient?.riskLevel ?? "low",
    counselingStatus: mappedPatient?.counselingStatus ?? "미요청",
    archived: mappedPatient?.archived ?? false,
    updatedAt: serverTimestamp(),
  };

  // 3) 평면 요약 필드 머지 (※ stripEmptyDeep 사용하지 않음: 키 유지 목적)
  await setDoc(ref, summary, { merge: true });

  // 4) users 컬렉션에도 동일한 데이터 저장 (web2 대시보드에서 읽기 위해)
  const userRef = doc(db, "users", patientId);
  await setDoc(
    userRef,
    {
      ...summary,
      // users 컬렉션에는 추가 필드도 포함
      profile: {
        name: name || "",
        birthDate: birthDate || "",
        gender: gender || "",
        maritalStatus: maritalStatus || "",
        cancerType: cancerType || "",
        cancerStage: cancerStage || "",
        diagnosisDate: diagnosisDate || "",
        hasSurgery: hasSurgery || "",
        surgeryDate: surgeryDate || "",
        otherCancerDiagnosis: otherCancerDiagnosis || "",
        otherCancerType: otherCancerType || "",
        otherCancerDetails: otherCancerDetails || "",
        hasRecurrence: hasRecurrence || "",
        mentalHealthHistory: mentalHealthHistory || "",
        mentalHealthDiagnosesText: mentalHealthDiagnosesText || "",
        mentalHealthImpact: mentalHealthImpact || "",
        otherMentalDiagnosis: otherMentalDiagnosis || "",
        otherTreatmentType: otherTreatmentType || "",
        phone: phone || "",
        contactMethod: contactMethod || "",
        contactTime: contactTime || "",
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return patientId;
}

export async function getPatientById(patientId) {
  const snap = await getDoc(doc(db, COLLECTIONS.PATIENTS, patientId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

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
    const patientRef = doc(db, "patients", patientId);
    const current = await getDoc(patientRef);
    const base = current.exists()
      ? {}
      : {
          createdAt: serverTimestamp(),
          archived: false,
          counselingStatus: "미요청",
        };

    // 3) 업서트 페이로드 구성 (빈 값 방지 및 표준화)
    const payload = {
      name,
      birthDate: birthDate || "",
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
    await setDoc(patientRef, { ...base, ...payload }, { merge: true });

    console.log("[saveUserData] upserted patient", patientId, {
      ...base,
      ...payload,
    });
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

    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    const existing =
      snap.exists() && snap.data().answers ? snap.data().answers : {};
    const merged = { ...existing, ...(answers || {}) };

    await setDoc(
      userRef,
      { answers: merged, updatedAt: serverTimestamp() },
      { merge: true }
    );
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

    const userRef = doc(db, "users", userId);
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

    const userRef = doc(db, "users", effectiveId);
    const patientRef = doc(db, "patients", effectiveId);

    const timestamp = new Date().toISOString();
    const userSnap = await getDoc(userRef);
    const existingData = userSnap.exists() ? userSnap.data() : {};
    // opts에서 answers를 받거나, 기존 answers 사용
    // 새로운 answers가 있으면 기존 answers와 병합 (덮어쓰기 방지)
    const newAnswers = opts?.answers || {};
    const existingAnswers = existingData.answers || {};
    const answers =
      Object.keys(newAnswers).length > 0
        ? { ...existingAnswers, ...newAnswers } // 기존 answers에 새 answers 병합
        : existingAnswers; // 새 answers가 없으면 기존 것 사용

    // patients 문서도 읽어서 기존(중첩) 데이터를 병합 소스로 포함
    const patientSnap = await getDoc(patientRef);
    const patientExisting = patientSnap.exists() ? patientSnap.data() : {};
    const flatPatient = flattenDeep(patientExisting || {});

    // --- 유틸 ---
    // YYYY-MM 형식은 그대로 유지, YYYY-MM-DD 형식은 YYYY-MM으로 변환
    const toDateStr = (v) => {
      try {
        if (!v) return "";
        const str = String(v).trim();

        // YYYY-MM 형식이면 그대로 반환
        if (/^\d{4}-\d{2}$/.test(str)) {
          return str;
        }

        // YYYY-MM-DD 형식이면 YYYY-MM으로 변환
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
          return str.slice(0, 7); // "YYYY-MM-DD" -> "YYYY-MM"
        }

        // Date 객체나 Timestamp는 YYYY-MM 형식으로 변환
        if (v instanceof Date) {
          const y = v.getFullYear();
          const m = String(v.getMonth() + 1).padStart(2, "0");
          return `${y}-${m}`;
        }
        if (v?.toDate) {
          const d = v.toDate();
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          return `${y}-${m}`;
        }

        // 다른 형식은 Date로 파싱 시도 후 YYYY-MM으로 변환
        const d = new Date(v);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          return `${y}-${m}`;
        }

        return String(v ?? "");
      } catch {
        return String(v ?? "");
      }
    };
    const pick = (obj, keys) => {
      for (const k of keys) {
        const val = obj && obj[k];
        if (val !== undefined && val !== null && String(val).trim() !== "")
          return val;
      }
      return "";
    };

    // --- 다양한 키 후보에서 표준 필드 뽑기 ---
    const flatAnswers = flattenDeep(answers || {});
    const flatProfile = flattenDeep(profile || {});
    const mergedSource = {
      // profile 파라미터를 최우선으로 (SurveyResultPage에서 전달하는 개인 정보)
      ...(profile || {}),
      ...(scores?.profile || {}),
      // 루트 데이터
      ...existingData,
      ...patientExisting,
      // 원본/평탄화 응답
      ...answers,
      ...flatAnswers,
      ...flatProfile,
      ...flatPatient,
      // === 별칭 표준화(중첩 -> 평면 키 매핑) ===
      cancerStage:
        flatAnswers["cancerStage"] ??
        flatAnswers["diagnosis.stage"] ??
        flatProfile["cancerStage"] ??
        flatProfile["diagnosis.stage"] ??
        flatPatient["cancerStage"] ??
        flatPatient["diagnosis.stage"] ??
        "",
      hasRecurrence:
        flatAnswers["hasRecurrence"] ??
        flatAnswers["recurrence"] ??
        flatProfile["hasRecurrence"] ??
        flatProfile["recurrence"] ??
        flatPatient["hasRecurrence"] ??
        flatPatient["recurrence"] ??
        "",
      hasSurgery:
        flatAnswers["hasSurgery"] ??
        flatAnswers["treatment.surgery.has"] ??
        flatProfile["hasSurgery"] ??
        flatProfile["treatment.surgery.has"] ??
        flatPatient["hasSurgery"] ??
        flatPatient["treatment.surgery.has"] ??
        flatPatient["treatment.hasSurgery"] ??
        "",
      surgeryDate:
        flatAnswers["surgeryDate"] ??
        flatAnswers["treatment.surgery.date"] ??
        flatProfile["surgeryDate"] ??
        flatProfile["treatment.surgery.date"] ??
        flatPatient["surgeryDate"] ??
        flatPatient["treatment.surgery.date"] ??
        flatPatient["treatment.surgery.year"] ??
        flatPatient["treatment.surgery.month"] ??
        "",
      mentalHealthHistory:
        flatAnswers["mentalHealthHistory"] ??
        flatAnswers["mentalHealth.history"] ??
        flatProfile["mentalHealthHistory"] ??
        flatProfile["mentalHealth.history"] ??
        flatPatient["mentalHealthHistory"] ??
        flatPatient["mentalHealth.history"] ??
        "",
      mentalHealthImpact:
        flatAnswers["mentalHealthImpact"] ??
        flatAnswers["mentalHealth.impact"] ??
        flatProfile["mentalHealthImpact"] ??
        flatProfile["mentalHealth.impact"] ??
        flatPatient["mentalHealthImpact"] ??
        flatPatient["mentalHealth.impact"] ??
        "",
      mentalHealthDiagnosesText:
        flatAnswers["mentalHealthDiagnosesText"] ??
        flatAnswers["mentalHealth.diagnoses.text"] ??
        flatProfile["mentalHealthDiagnosesText"] ??
        flatProfile["mentalHealth.diagnoses.text"] ??
        flatPatient["mentalHealthDiagnosesText"] ??
        flatPatient["mentalHealth.diagnoses.text"] ??
        "",
      otherCancerType:
        flatAnswers["otherCancerType"] ??
        flatAnswers["diagnosis.otherCancerType"] ??
        flatProfile["otherCancerType"] ??
        flatProfile["diagnosis.otherCancerType"] ??
        flatPatient["otherCancerType"] ??
        flatPatient["diagnosis.otherCancerType"] ??
        "",
      otherCancerDetails:
        flatAnswers["otherCancerDetails"] ??
        flatAnswers["diagnosis.otherCancerDetails"] ??
        flatProfile["otherCancerDetails"] ??
        flatProfile["diagnosis.otherCancerDetails"] ??
        flatPatient["otherCancerDetails"] ??
        flatPatient["diagnosis.otherCancerDetails"] ??
        flatPatient["otherCancer.details"] ??
        "",
      otherCancerDiagnosis:
        flatAnswers["otherCancerDiagnosis"] ??
        flatAnswers["diagnosis.otherCancerDiagnosis"] ??
        flatProfile["otherCancerDiagnosis"] ??
        flatProfile["diagnosis.otherCancerDiagnosis"] ??
        flatPatient["otherCancerDiagnosis"] ??
        flatPatient["diagnosis.otherCancerDiagnosis"] ??
        flatPatient["otherCancer.hasOther"] ??
        "",
    };

    // 보조: 수술 연/월만 있을 때 YYYY-MM 보정
    const surgeryYear =
      flatPatient["treatment.surgery.year"] ??
      flatAnswers["treatment.surgery.year"] ??
      flatProfile["treatment.surgery.year"] ??
      "";
    const surgeryMonth =
      flatPatient["treatment.surgery.month"] ??
      flatAnswers["treatment.surgery.month"] ??
      flatProfile["treatment.surgery.month"] ??
      "";
    const fallbackSurgeryYM =
      surgeryYear && surgeryMonth
        ? `${surgeryYear}-${String(surgeryMonth).padStart(2, "0")}`
        : "";

    const name =
      pick(mergedSource, ["name", "이름", "성명", "fullName"]) || patientId;

    const birthDate = toDateStr(
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

    const diagnosisDate = toDateStr(
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
    // profile 파라미터를 최우선으로 사용 (SurveyResultPage에서 전달한 개인 정보)
    const get = (keys) => {
      // profile 파라미터에서 먼저 찾기
      for (const k of keys) {
        if (
          profile &&
          profile[k] !== undefined &&
          profile[k] !== null &&
          String(profile[k]).trim() !== ""
        ) {
          return profile[k];
        }
      }
      // profile에 없으면 mergedSource에서 찾기
      return pick(mergedSource, keys);
    };

    const profilePatch = {
      gender: get(["gender", "성별"]),
      maritalStatus: get(["maritalStatus", "결혼상태", "결혼 상태"]),
      cancerStage: get(["cancerStage", "암병기", "암 병기", "stage"]),
      hasRecurrence: get(["hasRecurrence", "재발여부", "재발 여부"]),
      hasSurgery: get(["hasSurgery", "수술여부", "수술 여부"]),
      surgeryDate: (() => {
        const surgeryDateRaw = get(["surgeryDate", "수술시기", "수술 시기"]);
        // YYYY-MM 형식으로 정규화
        if (surgeryDateRaw) {
          const normalized = toDateStr(surgeryDateRaw);
          if (normalized) return normalized;
        }
        return fallbackSurgeryYM || "";
      })(),
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

    const cleanPatch = Object.fromEntries(
      Object.entries(profilePatch).filter(
        ([, v]) => v !== "" && v !== undefined && v !== null
      )
    );

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

    // overallRiskGroup(국문) → riskLevel(high/medium/low) 매핑
    const mapRiskLevelFromGroup = (group) => {
      if (!group) return null;
      const s = String(group).toLowerCase().trim();
      if (["high", "고위험", "고위험집단", "위험"].some((k) => s.includes(k)))
        return "high";
      if (["medium", "중위험", "중위험집단", "주의"].some((k) => s.includes(k)))
        return "medium";
      if (["low", "저위험", "저위험집단", "양호"].some((k) => s.includes(k)))
        return "low";
      return null;
    };

    // --- 점수 스냅샷(있으면 저장) ---
    // profile 객체에 모든 개인 정보 필드 포함 (web2에서 읽을 수 있도록)
    // 디버깅: cleanPatch 확인
    console.log("[saveSurveyScores] cleanPatch:", cleanPatch);
    console.log("[saveSurveyScores] cleanPatch.gender:", cleanPatch.gender);
    console.log(
      "[saveSurveyScores] cleanPatch.maritalStatus:",
      cleanPatch.maritalStatus
    );
    console.log(
      "[saveSurveyScores] cleanPatch.cancerStage:",
      cleanPatch.cancerStage
    );
    console.log("[saveSurveyScores] profile 파라미터:", profile);

    const profileForEntry = {
      name,
      birthDate,
      cancerType,
      diagnosisDate,
      requested,
      // cleanPatch의 모든 필드를 profile에 포함 (빈 값 제외)
      ...cleanPatch,
    };

    console.log("[saveSurveyScores] profileForEntry:", profileForEntry);

    const scoreEntry = {
      timestamp,
      stdScores: scores?.stdScores ?? null,
      meanScores: scores?.meanScores ?? null,
      riskGroups: scores?.riskGroups ?? null,
      overallMean: scores?.overallMean ?? null,
      overallRiskGroup: scores?.overallRiskGroup ?? null,
      overallFeedback: scores?.overallFeedback ?? null,
      additionalFeedback: scores?.additionalFeedback ?? null,
      profile: profileForEntry,
    };

    // users 문서의 surveyResults 배열 히스토리 유지
    const surveyResults = Array.isArray(existingData.surveyResults)
      ? [...existingData.surveyResults]
      : [];
    surveyResults.push(scoreEntry);

    // 2) patients/{userName} 문서에 표시용 필드 업서트(merge)
    // 점수 데이터도 함께 저장하여 대시보드에서 쉽게 읽을 수 있도록 함
    await setDoc(
      patientRef,
      {
        name,
        birthDate,
        cancerType,
        diagnosisDate,
        requested, // boolean
        counselingStatus, // "대기" | "미요청" 등
        ...cleanPatch,
        lastSurveyAt: serverTimestamp(),
        ...(opts?.surveyId ? { lastSurveyId: opts.surveyId } : {}),
        // 점수 데이터 직접 저장
        stdScores: scores?.stdScores || patientExisting.stdScores || {},
        meanScores: scores?.meanScores || patientExisting.meanScores || {},
        riskGroups: scores?.riskGroups || patientExisting.riskGroups || {},
        riskLevel:
          mapRiskLevelFromGroup(scores?.overallRiskGroup) ||
          patientExisting.riskLevel ||
          "low",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 3) users/{userName} 문서에는 히스토리와 완료시각을 계속 저장
    // stdScores, meanScores, riskGroups도 직접 저장하여 대시보드에서 쉽게 읽을 수 있도록 함
    await setDoc(
      userRef,
      {
        ...existingData,
        ...profilePatch,
        surveyResults, // 히스토리 유지
        lastSurveyCompletedAt: timestamp, // 마지막 설문 완료 시간 (ISO)
        // answers 저장 (새로운 answers가 있으면 업데이트)
        answers:
          Object.keys(answers).length > 0
            ? answers
            : existingData.answers || {},
        // 점수 데이터 직접 저장 (대시보드에서 쉽게 읽기 위해)
        stdScores: scores?.stdScores || existingData.stdScores || {},
        meanScores: scores?.meanScores || existingData.meanScores || {},
        riskGroups: scores?.riskGroups || existingData.riskGroups || {},
        overallRiskGroup:
          scores?.overallRiskGroup || existingData.overallRiskGroup || "",
        lastOverallRiskGroup:
          scores?.overallRiskGroup || existingData.lastOverallRiskGroup || "",
        overallFeedback:
          scores?.overallFeedback || existingData.overallFeedback || "",
        lastOverallFeedback:
          scores?.overallFeedback || existingData.lastOverallFeedback || "",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    console.error("Error saving survey scores:", error);
    throw error;
  }
};

export const saveSurveySnapshot = async (userId, snapshotData) => {
  try {
    // raw 객체 안에 넣지 말고 직접 저장하여 대시보드에서 쉽게 읽을 수 있도록 함
    const payload = {
      userId,
      // answers, stdScores, meanScores 등을 직접 저장
      answers: snapshotData.answers || {},
      stdScores: snapshotData.stdScores || {},
      meanScores: snapshotData.meanScores || {},
      riskGroups: snapshotData.riskGroups || {},
      overallMean: snapshotData.overallMean ?? null,
      overallRiskGroup: snapshotData.overallRiskGroup || "",
      overallFeedback: snapshotData.overallFeedback || "",
      // raw 객체도 함께 저장 (하위 호환성)
      raw: { ...snapshotData },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "surveyResults"), payload);
    // 최신 설문 링크를 users/{id}와 patients/{id}에 저장(merge)
    try {
      const userRef = doc(db, "users", userId);
      const patientRef = doc(db, "patients", userId);
      const timestamp = serverTimestamp();

      // users에 저장
      await setDoc(
        userRef,
        { lastSurveyId: docRef.id, lastSurveyAt: timestamp },
        { merge: true }
      );

      // patients에도 저장 (대시보드에서 읽기 쉽도록)
      await setDoc(
        patientRef,
        { lastSurveyId: docRef.id, lastSurveyAt: timestamp },
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
// YYYY-MM-DD / Timestamp / Date → YYYY-MM-DD 문자열로 정규화
const fmtDate = (v) => {
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

/**
 * patients/{userId}에 요약 스냅샷 저장(업서트)
 * - 최초 생성: createdAt, 이후 저장: updatedAt만 갱신
 */
export const savePatientSnapshot = async (userId, snapshot) => {
  try {
    console.log("[savePatientSnapshot] 시작:", { userId, snapshot });
    const ref = doc(db, "patients", userId);

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

    console.log("[savePatientSnapshot] 저장할 payload:", payload);

    // 최초 생성 여부 판단을 위해 한 번 읽기
    const current = await getDoc(ref);
    const base = current.exists() ? {} : { createdAt: serverTimestamp() };
    console.log("[savePatientSnapshot] 문서 존재 여부:", current.exists());

    await setDoc(ref, { ...base, ...payload }, { merge: true });
    console.log("[savePatientSnapshot] 성공:", userId, payload);
    return { success: true, patientId: userId };
  } catch (e) {
    console.error("[savePatientSnapshot] 오류:", e);
    console.error("[savePatientSnapshot] 오류 스택:", e.stack);
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
    const ref = doc(db, "users", userId);
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

// === Basic Profile Save Utility ===

// 환자 ID 소스 우선순위: location.state → localStorage → auth.currentUser.uid
export const getStablePatientId = (location) => {
  try {
    const auth = getAuth();
    const fromState =
      location && location.state && location.state.patientId
        ? location.state.patientId
        : "";
    const fromStorage =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("patientId") || ""
        : "";
    const fromAuth = auth.currentUser?.uid || "";
    return fromState || fromStorage || fromAuth || "";
  } catch {
    return "";
  }
};

// YYYYMMDD → YYYY-MM-DD 변환
function normalizeBirthDate(raw) {
  if (!raw) return "";
  const str = String(raw).trim();
  if (/^\d{8}$/.test(str)) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }
  return str;
}

export const saveBasicProfile = async (answers = {}, location = null) => {
  try {
    // 0) 입력 정상화
    const clean = (v) =>
      v === undefined || v === null ? "" : String(v).trim();
    const normalizedBirth = normalizeBirthDate(answers.birthDate);

    // 1) 환자 ID 확보: 라우팅/스토리지/로그인 → 없으면 생성해서 고정
    let patientId = getStablePatientId(location);
    if (!patientId) {
      // 이름+생년월일 기반으로 안정 ID 생성
      const seedName = clean(answers.name);
      const seedBirth = normalizedBirth;
      patientId = await computeStablePatientId(
        seedName,
        seedBirth,
        "basic-profile"
      );
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("patientId", patientId);
        }
      } catch {}
      console.log("[saveBasicProfile] generated stable patientId:", patientId);
    } else {
      console.log("[saveBasicProfile] using existing patientId:", patientId);
    }

    // 2) 문서 참조 및 최초 생성 여부 판단
    const ref = doc(db, "patients", patientId);
    const snap = await getDoc(ref);
    const base = snap.exists()
      ? {}
      : {
          createdAt: serverTimestamp(),
          archived: false,
          counselingStatus: "미요청",
        };

    // 3) 업서트 페이로드 (YYYYMMDD → YYYY-MM-DD 정규화)
    const payload = {
      name: clean(answers.name),
      gender: clean(answers.gender),
      birthDate: normalizedBirth,
      maritalStatus: clean(answers.maritalStatus),
      phone: clean(answers.phone),
      contactMethod: clean(answers.contactMethod),
      contactTime: clean(answers.contactTime),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, { ...base, ...payload }, { merge: true });
    console.log("[saveBasicProfile] Saved:", patientId, payload);

    // 4) 호출부 편의를 위해 patientId 반환
    return patientId;
  } catch (e) {
    console.error("[saveBasicProfile] Error:", e);
    throw e;
  }
};
