// src/models/patientData.js
import {
  getDoc,
  getDocs,
  collection,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

/** ─────────────────────────────────────────────────────────
 * 공통 유틸
 * ───────────────────────────────────────────────────────── */
const isFilledString = (v) => {
  if (v === undefined || v === null) return false;
  if (typeof v !== "string") return true;
  const s = v.trim();
  return s !== "" && s !== "-" && s !== "없음" && s !== "정보 없음";
};

const pick = (...values) => {
  for (const v of values) {
    if (isFilledString(v)) return v;
  }
  return "";
};

const getAny = (obj, keys = []) => {
  if (!obj || typeof obj !== "object") return "";
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return "";
};

// Converts various Firestore/JS date representations into a JS Date
const toJsDate = (raw) => {
  try {
    if (!raw) return null;
    if (typeof raw?.toDate === "function") return raw.toDate(); // Firestore Timestamp
    if (raw && typeof raw === "object" && typeof raw.seconds === "number") {
      return new Date(raw.seconds * 1000 + (raw.nanoseconds ?? 0) / 1e6);
    }
    const d = new Date(raw); // string/number
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

const normalizeAnswerKeys = (src) => {
  if (!src || typeof src !== "object") return {};
  const out = { ...src };
  const map = [
    ["gender", ["성별", "Gender"]],
    ["birthDate", ["생년월일", "BirthDate", "birth_date"]],
    ["maritalStatus", ["결혼상태", "결혼 상태", "MaritalStatus"]],
    ["cancerType", ["암종류", "암 종류", "CancerType"]],
    ["cancerStage", ["암 병기", "암병기", "CancerStage"]],
    ["diagnosisDate", ["진단시기", "진단 시기", "진단일", "DiagnosisDate"]],
    ["hasRecurrence", ["재발여부", "재발 여부", "Recurrence"]],
    ["hasSurgery", ["수술여부", "수술 여부", "Surgery"]],
    ["surgeryDate", ["수술일", "수술 날짜", "SurgeryDate"]],
    ["otherCancerDiagnosis", ["다른암진단여부", "다른 암 진단 여부"]],
    ["otherCancerType", ["다른암종류", "다른 암 종류"]],
    ["otherCancerDetails", ["다른암상세정보", "다른 암 상세 정보"]],
    ["mentalHealthHistory", ["정신건강력", "정신 건강력"]],
    ["mentalHealthDiagnosesText", ["정신건강 진단명", "정신 건강 진단명"]],
    ["otherMentalDiagnosis", ["기타 정신건강 진단"]],
    ["mentalHealthImpact", ["정신건강 영향"]],
    ["otherTreatmentType", ["기타 치료법"]],
    ["alcoholAbstinence", ["절주여부", "절주 여부"]],
    ["smokingCessation", ["금연여부", "금연 여부"]],
    // contact
    ["phone", ["연락처", "전화번호", "phoneNumber"]],
    ["contactMethod", ["연락 방법", "상담 방식", "method"]],
    ["contactTime", ["연락 가능 시간", "availableTime"]],
    // name
    ["name", ["이름"]],
  ];

  for (const [std, alts] of map) {
    if (out[std] !== undefined && out[std] !== null) continue;
    for (const k of alts) {
      const v = out[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        out[std] = v;
        break;
      }
    }
  }
  return out;
};

const calcAgeFromBirthDate = (birthDate) => {
  const d = toJsDate(birthDate);
  if (!d) return null;
  const t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
  return a;
};

/** 영역별 표준점수 변환용 기준값 */
const DOMAIN_STATS = {
  physical: { mean: 3.09, sd: 0.95 },
  selfcare: { mean: 3.63, sd: 0.76 },
  support: { mean: 3.84, sd: 0.94 },
  psychological: { mean: 3.08, sd: 0.91 },
  social: { mean: 3.39, sd: 1.2 },
  resilience: { mean: 4.28, sd: 0.72 },
};

const safeNum = (v) => (typeof v === "number" && !Number.isNaN(v) ? v : null);

const keyToDomain = (key) => {
  return key === "physicalChange"
    ? "physical"
    : key === "healthManagement"
    ? "selfcare"
    : key === "socialSupport"
    ? "support"
    : key === "psychologicalBurden"
    ? "psychological"
    : key === "socialBurden"
    ? "social"
    : key === "resilience"
    ? "resilience"
    : null;
};

const toT = (raw, key) => {
  const domain = keyToDomain(key);
  const stats = DOMAIN_STATS[domain];
  if (!stats || !safeNum(raw)) return null;
  const tScore = 50 + 10 * ((raw - stats.mean) / stats.sd);
  return Math.max(1, tScore); // 마이너스 점수 방지
};

const backToRaw = (t, key) => {
  const domain = keyToDomain(key);
  const stats = DOMAIN_STATS[domain];
  if (!stats || !safeNum(t)) return null;
  return Math.max(1, Math.min(5, ((t - 50) / 10) * stats.sd + stats.mean));
};

/** 위험도 등급 산출 */
const inferRiskLevelFromStdScores = (stdScores = {}) => {
  const vals = Object.values(stdScores).filter(
    (v) => typeof v === "number" && !Number.isNaN(v)
  );
  if (!vals.length) return null;
  const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
  return avg < 40 ? "high" : avg < 50 ? "medium" : "low";
};

/** ─────────────────────────────────────────────────────────
 * 1) 기본 프로필/상태 로딩
 * @param {string} patientId
 * @param {Object} opts - 옵션 객체
 * @param {Object} opts.user - 이미 로드된 user 데이터 (선택적, 중복 쿼리 방지)
 * @param {Object} opts.meta - 이미 로드된 meta/patient 데이터 (선택적, 중복 쿼리 방지)
 * ───────────────────────────────────────────────────────── */
export async function loadPatientCore(patientId, opts = {}) {
  // 이미 로드된 데이터가 있으면 재사용, 없으면 새로 읽기 (중복 쿼리 방지)
  let user, meta;
  if (opts.user !== undefined && opts.meta !== undefined) {
    user = opts.user || {};
    meta = opts.meta || {};
  } else {
    const userSnap = await getDoc(doc(db, "users", patientId));
    const metaSnap = await getDoc(doc(db, "patients", patientId));

    if (!userSnap.exists() && !metaSnap.exists()) {
      return { notFound: true };
    }

    user = userSnap.exists() ? userSnap.data() || {} : {};
    meta = metaSnap.exists() ? metaSnap.data() || {} : {};
  }

  // 설문 answers 일부가 프로필 보완에 쓰일 수 있음
  const answers = normalizeAnswerKeys(
    (user.answers && typeof user.answers === "object" && user.answers) ||
      (meta.answers && typeof meta.answers === "object" && meta.answers) ||
      {}
  );

  // in-doc surveyResults에서 프로필 데이터 찾기 (모든 항목 확인)
  let profileSrc = {};
  if (Array.isArray(user.surveyResults) && user.surveyResults.length > 0) {
    // 최신부터 역순으로 확인하여 가장 먼저 발견된 값 사용
    for (let i = 0; i < user.surveyResults.length; i++) {
      const sr = user.surveyResults[i];
      if (sr?.profile && typeof sr.profile === "object") {
        // 빈 문자열이 아닌 값만 사용
        if (
          !profileSrc.gender &&
          sr.profile.gender &&
          String(sr.profile.gender).trim() !== ""
        ) {
          profileSrc.gender = sr.profile.gender;
        }
        if (
          !profileSrc.maritalStatus &&
          sr.profile.maritalStatus &&
          String(sr.profile.maritalStatus).trim() !== ""
        ) {
          profileSrc.maritalStatus = sr.profile.maritalStatus;
        }
        if (
          !profileSrc.cancerStage &&
          sr.profile.cancerStage &&
          String(sr.profile.cancerStage).trim() !== ""
        ) {
          profileSrc.cancerStage = sr.profile.cancerStage;
        }
        if (
          !profileSrc.hasRecurrence &&
          sr.profile.hasRecurrence &&
          String(sr.profile.hasRecurrence).trim() !== ""
        ) {
          profileSrc.hasRecurrence = sr.profile.hasRecurrence;
        }
        if (
          !profileSrc.hasSurgery &&
          sr.profile.hasSurgery &&
          String(sr.profile.hasSurgery).trim() !== ""
        ) {
          profileSrc.hasSurgery = sr.profile.hasSurgery;
        }
        if (
          !profileSrc.surgeryDate &&
          sr.profile.surgeryDate &&
          String(sr.profile.surgeryDate).trim() !== ""
        ) {
          profileSrc.surgeryDate = sr.profile.surgeryDate;
        }
        if (
          !profileSrc.mentalHealthHistory &&
          sr.profile.mentalHealthHistory &&
          String(sr.profile.mentalHealthHistory).trim() !== ""
        ) {
          profileSrc.mentalHealthHistory = sr.profile.mentalHealthHistory;
        }
        if (
          !profileSrc.mentalHealthDiagnosesText &&
          sr.profile.mentalHealthDiagnosesText &&
          String(sr.profile.mentalHealthDiagnosesText).trim() !== ""
        ) {
          profileSrc.mentalHealthDiagnosesText =
            sr.profile.mentalHealthDiagnosesText;
        }
        if (
          !profileSrc.otherMentalDiagnosis &&
          sr.profile.otherMentalDiagnosis &&
          String(sr.profile.otherMentalDiagnosis).trim() !== ""
        ) {
          profileSrc.otherMentalDiagnosis = sr.profile.otherMentalDiagnosis;
        }
      }
    }
  }

  // lifestyle from answers (fallback)
  const toYesNo = (v) => {
    const n = parseInt(v, 10);
    if (!Number.isNaN(n)) return n >= 3 ? "예" : "아니오";
    return undefined;
  };
  const alcoholFromAnswers =
    toYesNo(answers.q32) ??
    answers.alcoholAbstinence ??
    getAny(answers, ["절주여부", "절주 여부"]);
  const smokingFromAnswers =
    toYesNo(answers.q33) ??
    answers.smokingCessation ??
    getAny(answers, ["금연여부", "금연 여부"]);

  // 중첩 구조를 읽기 위한 헬퍼 함수
  const getNested = (obj, path) => {
    if (!obj || typeof obj !== "object") return undefined;
    try {
      const parts = path.split(".");
      let val = obj;
      for (const part of parts) {
        if (val && typeof val === "object" && part in val) {
          val = val[part];
        } else {
          return undefined;
        }
      }
      return val;
    } catch {
      return undefined;
    }
  };

  const patient = {
    id: patientId,
    // 원본 중첩 구조도 포함 (PatientBasicInfo에서 읽을 수 있도록)
    // 안전하게 체크하여 포함
    ...(meta && meta.diagnosis ? { diagnosis: meta.diagnosis } : {}),
    ...(meta && meta.otherCancer ? { otherCancer: meta.otherCancer } : {}),
    ...(meta && meta.mentalHealth ? { mentalHealth: meta.mentalHealth } : {}),
    ...(meta && meta.treatment ? { treatment: meta.treatment } : {}),
    ...(meta && meta.recurrence !== undefined
      ? { recurrence: meta.recurrence }
      : {}),
    ...(meta && meta.lifestyle ? { lifestyle: meta.lifestyle } : {}),
    ...(meta && meta.meta ? { meta: meta.meta } : {}),

    name: pick(
      user.name,
      meta.name,
      getAny(answers, ["name", "이름"]) || "익명"
    ),
    gender: pick(
      user.gender,
      user?.profile?.gender,
      user?.basic?.gender,
      meta.gender,
      getNested(meta, "profile.gender"),
      getNested(meta, "basic.gender"),
      getAny(answers, ["gender", "성별"]),
      profileSrc.gender
    ),
    birthDate: pick(
      user.birthDate,
      meta.birthDate,
      profileSrc.birthDate || answers.birthDate || ""
    ),
    age: calcAgeFromBirthDate(
      pick(
        user.birthDate,
        meta.birthDate,
        profileSrc.birthDate || answers.birthDate || ""
      )
    ),
    maritalStatus: pick(
      user.maritalStatus,
      user?.profile?.maritalStatus,
      user?.basic?.maritalStatus,
      meta.maritalStatus,
      getNested(meta, "profile.maritalStatus"),
      getNested(meta, "basic.maritalStatus"),
      getAny(answers, ["maritalStatus", "결혼상태", "결혼 상태"]),
      profileSrc.maritalStatus
    ),
    cancerType: pick(
      user.cancerType,
      meta.cancerType,
      getNested(meta, "diagnosis.cancerType"),
      profileSrc.cancerType || ""
    ),
    cancerStage: pick(
      user.cancerStage,
      user?.profile?.cancerStage,
      user?.diagnosis?.stage,
      getNested(user, "diagnosis.stage"),
      meta.cancerStage,
      getNested(meta, "diagnosis.stage"),
      getAny(answers, ["cancerStage", "암병기", "암 병기", "stage"]),
      profileSrc.cancerStage
    ),
    diagnosisDate: pick(
      user.diagnosisDate,
      meta.diagnosisDate,
      profileSrc.diagnosisDate || ""
    ),
    hasRecurrence: pick(
      user.hasRecurrence,
      user?.profile?.hasRecurrence,
      getNested(user, "recurrence"),
      meta.hasRecurrence,
      getNested(meta, "recurrence"),
      getAny(answers, ["hasRecurrence", "재발여부", "재발 여부", "recurrence"]),
      profileSrc.hasRecurrence
    ),
    hasSurgery: pick(
      user.hasSurgery,
      user?.profile?.hasSurgery,
      getNested(user, "treatment.hasSurgery"),
      getNested(user, "treatment.surgery.has"),
      meta.hasSurgery,
      getNested(meta, "treatment.hasSurgery"),
      getNested(meta, "treatment.surgery.has"),
      getAny(answers, ["hasSurgery", "수술여부", "수술 여부"]),
      profileSrc.hasSurgery
    ),
    surgeryDate: pick(
      user.surgeryDate,
      user?.profile?.surgeryDate,
      getNested(user, "treatment.surgery.date"),
      (() => {
        const y = getNested(user, "treatment.surgery.year");
        const m = getNested(user, "treatment.surgery.month");
        if (y && m) return `${y}-${String(m).padStart(2, "0")}`;
        return undefined;
      })(),
      meta.surgeryDate,
      getNested(meta, "treatment.surgery.date"),
      (() => {
        const y = getNested(meta, "treatment.surgery.year");
        const m = getNested(meta, "treatment.surgery.month");
        if (y && m) return `${y}-${String(m).padStart(2, "0")}`;
        return undefined;
      })(),
      getAny(answers, ["surgeryDate", "수술일", "수술 날짜"]),
      profileSrc.surgeryDate
    ),
    otherCancerDiagnosis: pick(
      user.otherCancerDiagnosis,
      user?.profile?.otherCancerDiagnosis,
      getNested(user, "otherCancer.hasOther"),
      meta.otherCancerDiagnosis,
      getNested(meta, "otherCancer.hasOther"),
      getAny(answers, [
        "otherCancerDiagnosis",
        "다른암진단여부",
        "다른 암 진단 여부",
      ]),
      profileSrc.otherCancerDiagnosis
    ),
    otherCancerType: pick(
      user.otherCancerType,
      user?.profile?.otherCancerType,
      getNested(user, "otherCancer.type"),
      meta.otherCancerType,
      getNested(meta, "otherCancer.type"),
      getAny(answers, ["otherCancerType", "다른암종류", "다른 암 종류"]),
      profileSrc.otherCancerType
    ),
    otherCancerDetails: pick(
      user.otherCancerDetails,
      user?.profile?.otherCancerDetails,
      getNested(user, "otherCancer.details"),
      meta.otherCancerDetails,
      getNested(meta, "otherCancer.details"),
      getAny(answers, [
        "otherCancerDetails",
        "다른암상세정보",
        "다른 암 상세 정보",
      ]),
      profileSrc.otherCancerDetails
    ),
    mentalHealthHistory: pick(
      user.mentalHealthHistory,
      user?.profile?.mentalHealthHistory,
      getNested(user, "mentalHealth.history"),
      meta.mentalHealthHistory,
      getNested(meta, "mentalHealth.history"),
      getAny(answers, ["mentalHealthHistory", "정신건강력", "정신 건강력"]),
      profileSrc.mentalHealthHistory
    ),
    // 진단명 문자열 조립
    mentalHealthDiagnoses: (() => {
      // user 객체에서 먼저 확인
      const userDiagnosesObj =
        user.mentalHealthDiagnoses || getNested(user, "mentalHealth.diagnoses");
      const metaDiagnosesObj =
        meta.mentalHealthDiagnoses || getNested(meta, "mentalHealth.diagnoses");
      const diagnosesObj = userDiagnosesObj || metaDiagnosesObj;

      if (diagnosesObj && typeof diagnosesObj === "object") {
        const arr = [];
        if (diagnosesObj.depression) arr.push("우울증");
        if (diagnosesObj.anxietyDisorder) arr.push("불안장애");
        if (diagnosesObj.schizophrenia) arr.push("조현병");
        if (diagnosesObj.other) {
          const otherName =
            getNested(user, "mentalHealth.otherName") ||
            getNested(meta, "mentalHealth.otherName") ||
            "";
          arr.push(otherName || "기타");
        }
        if (arr.length) return arr.join(", ");
      }
      const txt =
        user.mentalHealthDiagnosesText ||
        user?.profile?.mentalHealthDiagnosesText ||
        meta.mentalHealthDiagnosesText ||
        getAny(answers, [
          "mentalHealthDiagnosesText",
          "정신건강 진단명",
          "정신 건강 진단명",
        ]) ||
        profileSrc.mentalHealthDiagnoses;
      return txt || "없음";
    })(),
    otherMentalDiagnosis: pick(
      user.otherMentalDiagnosis,
      user?.profile?.otherMentalDiagnosis,
      getNested(user, "mentalHealth.otherName"),
      meta.otherMentalDiagnosis,
      getNested(meta, "mentalHealth.otherName"),
      getAny(answers, [
        "otherMentalDiagnosis",
        "정신건강 진단명",
        "정신 건강 진단명",
      ]),
      profileSrc.otherMentalDiagnosis
    ),
    mentalHealthImpact: pick(
      user.mentalHealthImpact,
      user?.profile?.mentalHealthImpact,
      getNested(user, "mentalHealth.impact"),
      meta.mentalHealthImpact,
      getNested(meta, "mentalHealth.impact"),
      getAny(answers, ["mentalHealthImpact", "정신건강 영향", "정신건강영향"]),
      profileSrc.mentalHealthImpact
    ),
    otherTreatmentType: pick(
      user.otherTreatmentType,
      user?.profile?.otherTreatmentType,
      getNested(user, "treatment.otherType"),
      meta.otherTreatmentType,
      getNested(meta, "treatment.otherType"),
      getAny(answers, ["otherTreatmentType", "기타치료", "기타 치료"]),
      profileSrc.otherTreatmentType
    ),
    alcoholAbstinence: pick(
      user.alcoholAbstinence,
      user?.profile?.alcoholAbstinence,
      getNested(user, "lifestyle.alcoholAbstinence"),
      meta.alcoholAbstinence,
      getNested(meta, "lifestyle.alcoholAbstinence"),
      alcoholFromAnswers
    ),
    smokingCessation: pick(
      user.smokingCessation,
      user?.profile?.smokingCessation,
      getNested(user, "lifestyle.smokingCessation"),
      meta.smokingCessation,
      getNested(meta, "lifestyle.smokingCessation"),
      smokingFromAnswers
    ),
    // lifestyle 객체 전체 보존 (구체적 내용 포함)
    lifestyle: pick(
      user.lifestyle,
      meta.lifestyle,
      (() => {
        // answers에서 lifestyle 데이터 구성
        const lifestyleFromAnswers = {};
        if (
          answers.q32 !== undefined ||
          answers.currentAlcoholSoju ||
          answers.currentAlcoholBeer ||
          answers.currentAlcoholOther ||
          answers.alcoholReductionBarriers
        ) {
          lifestyleFromAnswers.alcohol = {
            tried:
              answers.q32 !== undefined
                ? parseInt(answers.q32, 10) >= 3
                  ? true
                  : false
                : undefined,
            current:
              answers.currentAlcoholSoju ||
              answers.currentAlcoholBeer ||
              answers.currentAlcoholOther
                ? {
                    soju: answers.currentAlcoholSoju || "",
                    beer: answers.currentAlcoholBeer || "",
                    other: answers.currentAlcoholOther || "",
                  }
                : undefined,
            barriers: Array.isArray(answers.alcoholReductionBarriers)
              ? answers.alcoholReductionBarriers
              : answers.alcoholReductionBarriers
              ? [answers.alcoholReductionBarriers]
              : undefined,
          };
        }
        if (
          answers.q33 !== undefined ||
          answers.currentSmokingRegular ||
          answers.currentSmokingEletronic ||
          answers.currentSmokingOther ||
          answers.smokingCessationBarriers
        ) {
          lifestyleFromAnswers.smoking = {
            tried:
              answers.q33 !== undefined
                ? parseInt(answers.q33, 10) >= 3
                  ? true
                  : false
                : undefined,
            current:
              answers.currentSmokingRegular ||
              answers.currentSmokingEletronic ||
              answers.currentSmokingOther
                ? {
                    regular: answers.currentSmokingRegular || "",
                    electronic:
                      answers.currentSmokingEletronic ||
                      answers.currentSmokingElectronic ||
                      "",
                    other: answers.currentSmokingOther || "",
                  }
                : undefined,
            barriers: Array.isArray(answers.smokingCessationBarriers)
              ? answers.smokingCessationBarriers
              : answers.smokingCessationBarriers
              ? [answers.smokingCessationBarriers]
              : undefined,
          };
        }
        return Object.keys(lifestyleFromAnswers).length > 0
          ? lifestyleFromAnswers
          : undefined;
      })() || {}
    ),
    riskLevel: pick(user.riskLevel, meta.riskLevel, ""),
    phone: pick(
      user.phone,
      meta.phone,
      answers.phone || profileSrc.phone || ""
    ),
    contactMethod: pick(
      user.contactMethod,
      meta.contactMethod,
      answers.contactMethod || profileSrc.contactMethod || ""
    ),
    contactTime: pick(
      user.contactTime,
      meta.contactTime,
      answers.contactTime || profileSrc.contactTime || ""
    ),
    counselingStatus: pick(
      user.counselingStatus,
      meta.counselingStatus,
      "미요청"
    ),
    archived: !!pick(user.archived, meta.archived, false),

    // 각종 시점
    lastSurveyAt:
      (user.lastSurveyAt && user.lastSurveyAt.toDate?.()) ||
      (meta.lastSurveyAt && meta.lastSurveyAt.toDate?.()) ||
      (user.lastSurveyAt ? new Date(user.lastSurveyAt) : null) ||
      (meta.lastSurveyAt ? new Date(meta.lastSurveyAt) : null) ||
      (user.surveyResults && user.surveyResults[0]?.updatedAt?.toDate?.()) ||
      null,
    lastSurveyId:
      pick(user.lastSurveyId, meta.lastSurveyId) ||
      (user.surveyResults && user.surveyResults[0]?.id) ||
      "",
    lastCounselingRequestAt:
      (user.lastCounselingRequestAt &&
        user.lastCounselingRequestAt.toDate?.()) ||
      (meta.lastCounselingRequestAt &&
        meta.lastCounselingRequestAt.toDate?.()) ||
      (user.lastCounselingRequestAt
        ? new Date(user.lastCounselingRequestAt)
        : null) ||
      (meta.lastCounselingRequestAt
        ? new Date(meta.lastCounselingRequestAt)
        : null),
    lastCounselingRequestId: pick(
      user.lastCounselingRequestId,
      meta.lastCounselingRequestId,
      ""
    ),
  };

  return { patient };
}

/** ─────────────────────────────────────────────────────────
 * 2) 설문 번들 로딩 (answers/점수/리스크/피드백)
 * @param {string} patientId
 * @param {Object} opts - 옵션 객체
 * @param {Object} opts.user - 이미 로드된 user 데이터 (선택적, 중복 쿼리 방지)
 * @param {Object} opts.meta - 이미 로드된 meta/patient 데이터 (선택적, 중복 쿼리 방지)
 * ───────────────────────────────────────────────────────── */
export async function loadSurveyBundle(patientId, opts = {}) {
  // 이미 로드된 데이터가 있으면 재사용, 없으면 새로 읽기 (중복 쿼리 방지)
  let user, meta;
  if (opts.user !== undefined && opts.meta !== undefined) {
    user = opts.user || {};
    meta = opts.meta || {};
  } else {
    const userSnap = await getDoc(doc(db, "users", patientId));
    const metaSnap = await getDoc(doc(db, "patients", patientId));
    user = userSnap.exists() ? userSnap.data() || {} : {};
    meta = metaSnap.exists() ? metaSnap.data() || {} : {};
  }

  const answersInDoc =
    (user.answers && typeof user.answers === "object" && user.answers) ||
    (meta.answers && typeof meta.answers === "object" && meta.answers) ||
    null;

  const normalizedAnswersInDoc = normalizeAnswerKeys(answersInDoc || {});

  // 여러 컬렉션에서 최신 1건 찾기
  const SURVEY_COLLECTIONS = [
    "surveyResults",
    "survey_responses",
    "surveyResponses",
    "survey_results",
  ];
  const ID_FIELDS = [
    "userId",
    "patientId",
    "uid",
    "pidFromState",
    "patient_id",
    "pid",
    "name",
  ];

  const pickLatestDoc = (arr) =>
    arr
      .map((d) => ({
        ...d,
        _ts:
          d.updatedAt?.toDate?.()?.getTime?.() ||
          (d.updatedAt?.seconds ? d.updatedAt.seconds * 1000 : 0) ||
          d.createdAt?.toDate?.()?.getTime?.() ||
          (d.createdAt?.seconds ? d.createdAt.seconds * 1000 : 0) ||
          0,
      }))
      .sort((a, b) => b._ts - a._ts)[0];

  let bestFound = null;

  for (const col of SURVEY_COLLECTIONS) {
    for (const key of ID_FIELDS) {
      const value =
        key === "name"
          ? normalizedAnswersInDoc.name || user.name || meta.name || ""
          : patientId;
      if (!value) continue;
      try {
        const snap = await getDocs(
          query(collection(db, col), where(key, "==", value))
        );
        if (!snap.empty) {
          const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          const picked = pickLatestDoc(docs);
          if (picked && (!bestFound || picked._ts > (bestFound._ts || 0))) {
            bestFound = picked;
          }
        }
      } catch {
        // 컬렉션/필드 조합이 없을 수 있음 → 무시하고 다음으로
      }
    }
  }

  // lastSurveyId 보조 조회
  if (!bestFound && user.lastSurveyId) {
    try {
      const s = await getDoc(doc(db, "surveyResults", user.lastSurveyId));
      if (s.exists()) bestFound = { id: s.id, ...s.data() };
    } catch {}
  }

  // bestFound에서 profile 데이터도 확인 (surveyResults 컬렉션 문서의 profile)

  // in-doc surveyResults 보조
  if (
    !bestFound &&
    Array.isArray(user.surveyResults) &&
    user.surveyResults.length
  ) {
    // 최신 설문 결과 찾기 (timestamp 기준)
    const sorted = [...user.surveyResults].sort((a, b) => {
      const tsA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tsB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tsB - tsA; // 최신이 먼저
    });
    bestFound = sorted[0];
  }

  // 디버깅: bestFound 확인
  console.log("[loadSurveyBundle] bestFound:", bestFound);
  console.log("[loadSurveyBundle] bestFound?.profile:", bestFound?.profile);
  console.log(
    "[loadSurveyBundle] bestFound?.profile?.gender:",
    bestFound?.profile?.gender
  );
  console.log(
    "[loadSurveyBundle] bestFound?.profile?.maritalStatus:",
    bestFound?.profile?.maritalStatus
  );

  // answers 병합 (문서 answers가 우선, 그 다음 bestFound)
  // bestFound.answers가 있으면 사용, 없으면 bestFound.raw.answers 사용
  const fromBest =
    (bestFound &&
      (bestFound.answers ||
        bestFound.response ||
        (bestFound.raw && typeof bestFound.raw === "object"
          ? bestFound.raw.answers || bestFound.raw
          : bestFound.raw))) ||
    {};
  const normalizedFromBest = normalizeAnswerKeys(fromBest);

  // user와 meta에서 직접 answers 가져오기 (추가 소스)
  const userAnswers =
    user.answers && typeof user.answers === "object" ? user.answers : {};
  const metaAnswers =
    meta.answers && typeof meta.answers === "object" ? meta.answers : {};

  // bestFound.profile에서도 데이터 가져오기 (surveyResults 컬렉션 문서의 profile)
  const profileFromBestFound =
    bestFound?.profile && typeof bestFound.profile === "object"
      ? bestFound.profile
      : {};

  // 모든 소스 병합 (우선순위: normalizedAnswersInDoc > userAnswers > metaAnswers > normalizedFromBest > profileFromBestFound)
  const mergedAnswers = {
    ...normalizedFromBest,
    ...normalizeAnswerKeys(metaAnswers),
    ...normalizeAnswerKeys(userAnswers),
    ...normalizedAnswersInDoc, // 최우선
    // profile 데이터도 answers에 병합 (fallback)
    ...(profileFromBestFound.gender &&
    String(profileFromBestFound.gender).trim() !== ""
      ? { gender: profileFromBestFound.gender }
      : {}),
    ...(profileFromBestFound.maritalStatus &&
    String(profileFromBestFound.maritalStatus).trim() !== ""
      ? { maritalStatus: profileFromBestFound.maritalStatus }
      : {}),
    ...(profileFromBestFound.cancerStage &&
    String(profileFromBestFound.cancerStage).trim() !== ""
      ? { cancerStage: profileFromBestFound.cancerStage }
      : {}),
    ...(profileFromBestFound.hasRecurrence &&
    String(profileFromBestFound.hasRecurrence).trim() !== ""
      ? { hasRecurrence: profileFromBestFound.hasRecurrence }
      : {}),
    ...(profileFromBestFound.hasSurgery &&
    String(profileFromBestFound.hasSurgery).trim() !== ""
      ? { hasSurgery: profileFromBestFound.hasSurgery }
      : {}),
    ...(profileFromBestFound.surgeryDate &&
    String(profileFromBestFound.surgeryDate).trim() !== ""
      ? { surgeryDate: profileFromBestFound.surgeryDate }
      : {}),
    ...(profileFromBestFound.mentalHealthHistory &&
    String(profileFromBestFound.mentalHealthHistory).trim() !== ""
      ? { mentalHealthHistory: profileFromBestFound.mentalHealthHistory }
      : {}),
    ...(profileFromBestFound.mentalHealthDiagnosesText &&
    String(profileFromBestFound.mentalHealthDiagnosesText).trim() !== ""
      ? {
          mentalHealthDiagnosesText:
            profileFromBestFound.mentalHealthDiagnosesText,
        }
      : {}),
    ...(profileFromBestFound.otherMentalDiagnosis &&
    String(profileFromBestFound.otherMentalDiagnosis).trim() !== ""
      ? { otherMentalDiagnosis: profileFromBestFound.otherMentalDiagnosis }
      : {}),
  };

  // 피드백 (bestFound에서 직접 읽거나 raw 객체 안에서 읽기)
  let overallFeedback = "";
  let additionalFeedback = [];
  if (bestFound) {
    overallFeedback =
      bestFound.overallFeedback ||
      (bestFound?.raw && typeof bestFound.raw === "object"
        ? bestFound.raw.overallFeedback
        : "") ||
      "";
    if (Array.isArray(bestFound.additionalFeedback))
      additionalFeedback = bestFound.additionalFeedback;
    else if (
      bestFound?.raw &&
      typeof bestFound.raw === "object" &&
      Array.isArray(bestFound.raw.additionalFeedback)
    )
      additionalFeedback = bestFound.raw.additionalFeedback;
    if (bestFound.feedback && typeof bestFound.feedback === "object") {
      if (!overallFeedback && bestFound.feedback.overall)
        overallFeedback = bestFound.feedback.overall;
      if (
        !additionalFeedback.length &&
        Array.isArray(bestFound.feedback.additional)
      )
        additionalFeedback = bestFound.feedback.additional;
    }
  }

  // 점수 계산
  // 점수 계산 (빈 객체에 막히지 않도록 병합)
  // bestFound에서 직접 읽거나 raw 객체 안에서 읽기
  const bestStdScores =
    (bestFound && bestFound.stdScores) ||
    (bestFound?.raw && typeof bestFound.raw === "object"
      ? bestFound.raw.stdScores
      : {}) ||
    {};
  const bestMeanScores =
    (bestFound && bestFound.meanScores) ||
    (bestFound?.raw && typeof bestFound.raw === "object"
      ? bestFound.raw.meanScores
      : {}) ||
    {};
  const bestRiskGroups =
    (bestFound && bestFound.riskGroups) ||
    (bestFound?.raw && typeof bestFound.raw === "object"
      ? bestFound.raw.riskGroups
      : {}) ||
    {};

  const stdScores = {
    ...(meta.stdScores || {}),
    ...(user.stdScores || {}),
    ...bestStdScores,
  };

  const meanScores = {
    ...(meta.meanScores || {}),
    ...(user.meanScores || {}),
    ...bestMeanScores,
  };

  // riskGroups도 병합하여 사용
  const riskGroups = {
    ...(meta.riskGroups || {}),
    ...(user.riskGroups || {}),
    ...bestRiskGroups,
  };
  const categoryKeys = [
    "physicalChange",
    "healthManagement",
    "socialSupport",
    "psychologicalBurden",
    "socialBurden",
    "resilience",
  ];

  const categoryScores = {};
  for (const key of categoryKeys) {
    const t = safeNum(stdScores[key]) ?? toT(meanScores[key], key);
    const raw = safeNum(meanScores[key]) ?? backToRaw(stdScores[key], key);
    categoryScores[key] = {
      title:
        key === "physicalChange"
          ? "신체적 변화"
          : key === "healthManagement"
          ? "건강 관리"
          : key === "socialSupport"
          ? "사회적 지지"
          : key === "psychologicalBurden"
          ? "심리적 부담"
          : key === "socialBurden"
          ? "사회적 부담"
          : "회복 탄력성",
      t: t ?? null,
      raw: raw ?? null,
    };
  }

  // 위험도
  let riskLevel =
    user.overallRiskGroup ||
    meta.riskLevel ||
    inferRiskLevelFromStdScores(stdScores) ||
    (user.mentalHealthHistory && user.mentalHealthHistory !== "아니오"
      ? "high"
      : user.mentalHealthImpact
      ? "medium"
      : "low");

  // 절주/금연 보조 계산
  const toYesNo = (v) => {
    const n = parseInt(v, 10);
    if (!Number.isNaN(n)) return n >= 3 ? "예" : "아니오";
    return undefined;
  };
  const alcoholAbstinence =
    toYesNo(mergedAnswers.q32) ??
    (getAny(mergedAnswers, ["절주여부", "절주 여부", "alcoholAbstinence"]) ||
      "정보 없음");
  const smokingCessation =
    toYesNo(mergedAnswers.q33) ??
    (getAny(mergedAnswers, ["금연여부", "금연 여부", "smokingCessation"]) ||
      "정보 없음");

  // --- lastSurvey 메타(그래프/기본정보에서 공통 사용) ---
  // bestFound에서 직접 읽거나 raw 객체 안에서 읽기
  const lastSurvey = bestFound
    ? {
        id: bestFound.id || "",
        createdAt:
          (bestFound.updatedAt && bestFound.updatedAt.toDate?.()) ||
          (bestFound.createdAt && bestFound.createdAt.toDate?.()) ||
          (bestFound.updatedAt ? new Date(bestFound.updatedAt) : null) ||
          (bestFound.createdAt ? new Date(bestFound.createdAt) : null),
        stdScores:
          bestFound.stdScores ||
          (bestFound?.raw && typeof bestFound.raw === "object"
            ? bestFound.raw.stdScores
            : {}) ||
          {},
        meanScores:
          bestFound.meanScores ||
          (bestFound?.raw && typeof bestFound.raw === "object"
            ? bestFound.raw.meanScores
            : {}) ||
          {},
        riskGroups:
          bestFound.riskGroups ||
          (bestFound?.raw && typeof bestFound.raw === "object"
            ? bestFound.raw.riskGroups
            : {}) ||
          {},
        overallRiskGroup:
          bestFound.overallRiskGroup ||
          (bestFound?.raw && typeof bestFound.raw === "object"
            ? bestFound.raw.overallRiskGroup
            : "") ||
          riskLevel ||
          "",
        // profile 객체도 포함 (PatientBasicInfo에서 읽을 수 있도록)
        profile:
          bestFound.profile ||
          (bestFound?.raw && typeof bestFound.raw === "object"
            ? bestFound.raw.profile
            : undefined),
      }
    : null;

  return {
    answers: mergedAnswers,
    stdScores,
    meanScores,
    categoryScores,
    riskGroups,
    riskLevel,
    overallFeedback,
    additionalFeedback,
    lifestyle: { alcoholAbstinence, smokingCessation },
    lastSurvey,
  };
}

/** ─────────────────────────────────────────────────────────
 * 3) 상담 번들 로딩 (요청 리스트 + 노트)
 * ───────────────────────────────────────────────────────── */
export async function loadCounselingBundle(patientId) {
  // counselingRequests
  let counselingRequests = [];
  try {
    const snap = await getDocs(
      query(
        collection(db, "counselingRequests"),
        where("userId", "==", patientId)
      )
    );
    counselingRequests = snap.docs
      .map((d) => {
        const data = d.data() || {};
        const createdAt =
          (data.createdAt && data.createdAt.toDate?.()) ||
          (data.createdAt ? new Date(data.createdAt) : new Date(0));
        return { id: d.id, ...data, createdAt };
      })
      .sort(
        (a, b) =>
          (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0)
      );
  } catch {
    counselingRequests = [];
  }

  // notes
  let notes = [];
  try {
    const notesCol = collection(db, "patients", patientId, "notes");
    const notesSnap = await getDocs(notesCol); // 정렬 인덱스 없을 수 있어 클라에서 정렬
    notes = notesSnap.docs
      .map((d) => {
        const data = d.data() || {};
        return {
          id: d.id,
          ...data,
          createdAt:
            (data.createdAt && data.createdAt.toDate?.()) ||
            (data.createdAt ? new Date(data.createdAt) : new Date()),
          updatedAt:
            (data.updatedAt && data.updatedAt.toDate?.()) ||
            (data.updatedAt ? new Date(data.updatedAt) : null),
        };
      })
      .sort(
        (a, b) =>
          (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0)
      );
  } catch {
    notes = [];
  }

  return { counselingRequests, notes };
}

/** ─────────────────────────────────────────────────────────
 * 표시용 헬퍼(컴포넌트에서 재사용 가능)
 * ───────────────────────────────────────────────────────── */
export const getSurgeryDisplayText = (hasSurgery, surgeryDate) => {
  if (hasSurgery === "예") {
    return surgeryDate ? `예 (${surgeryDate})` : "예";
  }
  return hasSurgery || "정보 없음";
};

export const getCancerTypeDisplayText = (cancerType, otherCancerType) => {
  if (cancerType === "기타") {
    return otherCancerType ? `기타(${otherCancerType})` : "기타";
  }
  return cancerType || "정보 없음";
};

/**
 * Flexible users loader:
 * - If users/{patientId} exists, prefer it.
 * - If not, but another users doc keyed by the patient's name exists and
 *   contains richer fields (stdScores/lastSurveyId), use that as a fallback.
 * @param {string} patientId
 * @param {string} nameHint - 환자 이름 힌트
 * @param {Object} opts - 옵션 객체
 * @param {Object} opts.userData - 이미 로드된 users/{patientId} 데이터 (선택적, 중복 쿼리 방지)
 * Return {} when nothing usable is found.
 */
export async function loadUserForPatient(patientId, nameHint, opts = {}) {
  // Candidates we may discover
  const candidates = [];

  // Helper to safely push if doc exists
  const pushDoc = (snap) => {
    if (snap && snap.exists && snap.exists()) {
      const data = snap.data() || {};
      candidates.push({ id: snap.id, ...data });
    }
  };

  // Helper to push data directly
  const pushData = (id, data) => {
    if (data && typeof data === "object") {
      candidates.push({ id, ...data });
    }
  };

  // 1) Direct by patientId (users/{patientId}) - 이미 읽은 데이터가 있으면 재사용
  if (opts.userData !== undefined) {
    pushData(String(patientId), opts.userData);
  } else {
    try {
      const snap = await getDoc(doc(db, "users", String(patientId)));
      pushDoc(snap);
    } catch {}
  }

  // 2) Direct by name as document id (users/{name})
  const hint = typeof nameHint === "string" ? nameHint.trim() : "";
  if (hint) {
    try {
      const snap = await getDoc(doc(db, "users", hint));
      pushDoc(snap);
    } catch {}
  }

  // 3) Query by name field (users where name == hint)
  if (hint) {
    try {
      const q = query(collection(db, "users"), where("name", "==", hint));
      const snap = await getDocs(q);
      snap.docs.forEach((d) =>
        candidates.push({ id: d.id, ...(d.data() || {}) })
      );
    } catch {}
  }

  // 4) Query by lastSurveyId if available in any discovered candidate
  //    (Sometimes the richer doc is keyed randomly like 'p-xxxx' but
  //     carries lastSurveyId and stdScores)
  let lastSurveyIdFromCand =
    candidates.find((c) => c.lastSurveyId)?.lastSurveyId || "";
  if (lastSurveyIdFromCand) {
    try {
      const q = query(
        collection(db, "users"),
        where("lastSurveyId", "==", lastSurveyIdFromCand)
      );
      const snap = await getDocs(q);
      snap.docs.forEach((d) =>
        candidates.push({ id: d.id, ...(d.data() || {}) })
      );
    } catch {}
  }

  // Scoring function to pick the "richest" user document
  const richness = (u) => {
    if (!u || typeof u !== "object") return -1;
    const stdCount =
      u.stdScores && typeof u.stdScores === "object"
        ? Object.keys(u.stdScores).length
        : 0;
    const meanCount =
      u.meanScores && typeof u.meanScores === "object"
        ? Object.keys(u.meanScores).length
        : 0;
    const riskCount =
      u.riskGroups && typeof u.riskGroups === "object"
        ? Object.keys(u.riskGroups).length
        : 0;
    const hasLastSurvey = u.lastSurveyId ? 1 : 0;
    const hasOverall = u.overallRiskGroup ? 1 : 0;
    // Weight stdScores highest, then mean/risk, then meta flags
    return (
      stdCount * 5 + meanCount * 3 + riskCount * 2 + hasLastSurvey + hasOverall
    );
  };

  // Deduplicate by id while keeping richest
  const byId = new Map();
  for (const c of candidates) {
    const prev = byId.get(c.id);
    if (!prev || richness(c) > richness(prev)) byId.set(c.id, c);
  }

  // Pick the richest overall
  let best = null;
  for (const v of byId.values()) {
    if (!best || richness(v) > richness(best)) best = v;
  }

  return best || {};
}

export async function loadPatientAll(patientId) {
  // 최적화: users와 patients 문서를 한 번만 읽고 공유
  const [userSnap, metaSnap] = await Promise.all([
    getDoc(doc(db, "users", patientId)),
    getDoc(doc(db, "patients", patientId)),
  ]);

  const userData = userSnap.exists() ? userSnap.data() || {} : {};
  const metaData = metaSnap.exists() ? metaSnap.data() || {} : {};

  const core = await loadPatientCore(patientId, {
    user: userData,
    meta: metaData,
  });
  const bestUser = await loadUserForPatient(patientId, core?.patient?.name, {
    userData: userData,
  });
  const [survey, counseling] = await Promise.all([
    loadSurveyBundle(patientId, { user: userData, meta: metaData }),
    loadCounselingBundle(patientId),
  ]);

  return { core: { ...core, user: bestUser || {} }, survey, counseling };
}
