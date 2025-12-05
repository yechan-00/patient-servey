// web1/src/utils/surveySchema.js
// 단일 책임: 설문 완료 시점의 원본/계산 데이터를
// 표준 스키마(userDoc / surveyDoc / patientsDoc)로 정규화

/* ──────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────── */
const isFilled = (v) =>
  v !== undefined && v !== null && String(v).trim() !== "";

const coalesce = (...vals) => vals.find(isFilled);

const toBool = (v) => {
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  return ["true", "예", "y", "yes", "1"].includes(s);
};

const asStr = (v) => (isFilled(v) ? String(v) : "");

/** 다양한 라벨/키 → 표준키 매핑 */
const ALIAS = {
  // 프로필/기본
  name: ["이름", "성명"],
  gender: ["성별", "Gender"],
  birthDate: ["생년월일", "BirthDate", "birth_date", "profile.birthDate"],
  maritalStatus: ["결혼상태", "결혼 상태", "MaritalStatus"],

  // 질환
  cancerType: ["암종류", "암 종류", "CancerType"],
  cancerStage: ["암병기", "암 병기", "CancerStage"],
  diagnosisDate: ["진단시기", "진단 시기", "진단일", "DiagnosisDate"],
  hasRecurrence: ["재발여부", "재발 여부", "Recurrence"],
  hasSurgery: ["수술여부", "수술 여부", "Surgery"],
  surgeryDate: ["수술일", "수술 날짜", "SurgeryDate"],
  otherCancerDiagnosis: ["다른암진단여부", "다른 암 진단 여부"],
  otherCancerType: ["다른암종류", "다른 암 종류"],
  otherCancerDetails: ["다른암상세정보", "다른 암 상세 정보"],

  // 정신건강
  mentalHealthHistory: ["정신건강력", "정신 건강력"],
  mentalHealthDiagnosesText: ["정신건강 진단명", "정신 건강 진단명"],
  otherMentalDiagnosis: ["기타 정신건강 진단"],
  mentalHealthImpact: ["정신건강 영향"],
  otherTreatmentType: ["기타 치료법"],

  // 연락
  phone: ["연락처", "전화번호", "phoneNumber"],
  contactMethod: ["연락 방법", "상담 방식", "method"],
  contactTime: ["연락 가능 시간", "availableTime"],

  // 점수/요약(이미 표준키로 들어올 수도 있음)
  meanScores: ["meanScores"],
  stdScores: ["stdScores"],
  riskGroups: ["riskGroups"],

  // answers에 있을 수도 있는 표준 키들
  q12_reasons: ["q12_reasons"],
  q15_reasons: ["q15_reasons"],
};

/** 객체의 모든 별칭을 표준키로 당겨오기 */
function normalizeKeys(src = {}) {
  const out = { ...src };
  Object.entries(ALIAS).forEach(([std, aliases]) => {
    if (isFilled(out[std])) return;
    for (const k of aliases) {
      if (isFilled(src[k])) {
        out[std] = src[k];
        return;
      }
      // 중첩 키 접근 (예: profile.birthDate)
      if (k.includes(".")) {
        const parts = k.split(".");
        let cur = src;
        let ok = true;
        for (const p of parts) {
          if (cur && Object.prototype.hasOwnProperty.call(cur, p)) {
            cur = cur[p];
          } else {
            ok = false;
            break;
          }
        }
        if (ok && isFilled(cur)) {
          out[std] = cur;
          return;
        }
      }
    }
  });
  return out;
}

/** answers + profile 를 합쳐 사용자 표시용 프로필을 구성 */
function buildProfile({ normAnswers = {}, normProfile = {} }) {
  const p = {};
  p.name = asStr(coalesce(normProfile.name, normAnswers.name));
  p.gender = asStr(coalesce(normProfile.gender, normAnswers.gender));
  p.birthDate = asStr(coalesce(normProfile.birthDate, normAnswers.birthDate));
  p.maritalStatus = asStr(
    coalesce(normProfile.maritalStatus, normAnswers.maritalStatus)
  );

  p.cancerType = asStr(
    coalesce(normProfile.cancerType, normAnswers.cancerType)
  );
  p.cancerStage = asStr(
    coalesce(normProfile.cancerStage, normAnswers.cancerStage)
  );
  p.diagnosisDate = asStr(
    coalesce(normProfile.diagnosisDate, normAnswers.diagnosisDate)
  );
  p.hasRecurrence = asStr(
    coalesce(normProfile.hasRecurrence, normAnswers.hasRecurrence)
  );
  p.hasSurgery = asStr(
    coalesce(normProfile.hasSurgery, normAnswers.hasSurgery)
  );
  p.surgeryDate = asStr(
    coalesce(normProfile.surgeryDate, normAnswers.surgeryDate)
  );
  p.otherCancerDiagnosis = asStr(
    coalesce(normProfile.otherCancerDiagnosis, normAnswers.otherCancerDiagnosis)
  );
  p.otherCancerType = asStr(
    coalesce(normProfile.otherCancerType, normAnswers.otherCancerType)
  );
  p.otherCancerDetails = asStr(
    coalesce(normProfile.otherCancerDetails, normAnswers.otherCancerDetails)
  );

  p.mentalHealthHistory = asStr(
    coalesce(normProfile.mentalHealthHistory, normAnswers.mentalHealthHistory)
  );
  p.mentalHealthDiagnosesText = asStr(
    coalesce(
      normProfile.mentalHealthDiagnosesText,
      normAnswers.mentalHealthDiagnosesText
    )
  );
  p.otherMentalDiagnosis = asStr(
    coalesce(normProfile.otherMentalDiagnosis, normAnswers.otherMentalDiagnosis)
  );
  p.mentalHealthImpact = asStr(
    coalesce(normProfile.mentalHealthImpact, normAnswers.mentalHealthImpact)
  );
  p.otherTreatmentType = asStr(
    coalesce(normProfile.otherTreatmentType, normAnswers.otherTreatmentType)
  );

  p.phone = asStr(coalesce(normProfile.phone, normAnswers.phone));
  p.contactMethod = asStr(
    coalesce(normProfile.contactMethod, normAnswers.contactMethod)
  );
  p.contactTime = asStr(
    coalesce(normProfile.contactTime, normAnswers.contactTime)
  );

  return p;
}

/* ──────────────────────────────────────────────
 * Public API
 * ────────────────────────────────────────────── */
/**
 * 입력(answers, profile, scores...) → 표준 문서 3종
 * @returns { userDoc, surveyDoc, patientsDoc }
 */
export function normalizeSurveyBundle({
  patientId,
  answers = {},
  meanScores = {},
  stdScores = {},
  riskGroups = {},
  overallFeedback = "",
  additionalFeedback = [],
  profile = {},
  lifestyle = {}, // { alcoholAbstinence, smokingCessation }
  raw = {}, // 원문 백업(선택)
}) {
  // 1) 키 정규화
  const normAnswers = normalizeKeys(answers);
  const normProfile = normalizeKeys(profile);

  // 2) 표시용 프로필 생성 (answers와 profile 합침)
  const mergedProfile = buildProfile({ normAnswers, normProfile });

  // 3) users/{id} 에 들어갈 문서
  //    - Top-level: 주요 필드들(화면에서 바로 쓰는 것들)
  //    - profile: 보조 프로필(동일 내용 보관)
  //    - lifestyle: 파생값(절주/금연)
  //    * lastSurveyId/At 은 saveSurvey.js에서 updateDoc으로 넣음
  const userDoc = {
    name: mergedProfile.name,
    gender: mergedProfile.gender,
    birthDate: mergedProfile.birthDate,
    maritalStatus: mergedProfile.maritalStatus,

    cancerType: mergedProfile.cancerType,
    cancerStage: mergedProfile.cancerStage,
    diagnosisDate: mergedProfile.diagnosisDate,
    hasRecurrence: mergedProfile.hasRecurrence,
    hasSurgery: mergedProfile.hasSurgery,
    surgeryDate: mergedProfile.surgeryDate,
    otherCancerDiagnosis: mergedProfile.otherCancerDiagnosis,
    otherCancerType: mergedProfile.otherCancerType,
    otherCancerDetails: mergedProfile.otherCancerDetails,

    mentalHealthHistory: mergedProfile.mentalHealthHistory,
    mentalHealthDiagnosesText: mergedProfile.mentalHealthDiagnosesText,
    otherMentalDiagnosis: mergedProfile.otherMentalDiagnosis,
    mentalHealthImpact: mergedProfile.mentalHealthImpact,
    otherTreatmentType: mergedProfile.otherTreatmentType,

    phone: mergedProfile.phone,
    contactMethod: mergedProfile.contactMethod,
    contactTime: mergedProfile.contactTime,

    // 프로필 보조
    profile: { ...mergedProfile },

    // 생활습관(파생)
    lifestyle: {
      alcoholAbstinence: asStr(lifestyle.alcoholAbstinence),
      smokingCessation: asStr(lifestyle.smokingCessation),
    },
  };

  // 4) surveyResults 에 들어갈 문서
  //    - answers: 정규화된 응답 전체
  //    - mean/std/risk/feedback/profile/lifestyle/raw 모두 포함
  const surveyDoc = {
    patientId,
    answers: normAnswers,
    meanScores: meanScores || {},
    stdScores: stdScores || {},
    riskGroups: riskGroups || {},
    overallFeedback: asStr(overallFeedback),
    additionalFeedback: Array.isArray(additionalFeedback)
      ? additionalFeedback
      : [],
    profile: { ...mergedProfile },
    lifestyle: {
      alcoholAbstinence: asStr(lifestyle.alcoholAbstinence),
      smokingCessation: asStr(lifestyle.smokingCessation),
    },
    raw: raw && typeof raw === "object" ? raw : {},
  };

  // 5) patients/{id} 에 병합할 문서 (users와 거의 동일, 조회 최적화 목적)
  const patientsDoc = {
    ...userDoc,
    // 환자 카드/리스트에서 빠르게 보려면 여기 캐싱해도 됨.
    // 점수/리스크는 saveSurvey.js에서 덮어써 주입한다(캐싱 일원화).
  };

  return { userDoc, surveyDoc, patientsDoc };
}
