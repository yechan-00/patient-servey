/**
 * mappers.js
 * 폼 상태를 Firestore 저장 스키마(Contract)로 변환하는 어댑터.
 * - 생년월일: "YYYYMMDD" -> "YYYY-MM-DD"
 * - 예/아니오: "예"|"아니오" -> true|false
 * - 치료유형: "없음"은 다른 항목과 상호배타
 *
 * 사용 예시:
 *   import { mapSurveyToPatient, normalizeBirth } from "./mappers";
 *   const mapped = mapSurveyToPatient(formState);
 *   await saveUserData(mapped);
 */

/** 숫자만 남기고 YYYYMMDD 8자리로 자른 뒤 ISO 포맷으로 변환 */
export function normalizeBirth(birthDateDigits) {
  const s = String(birthDateDigits ?? "")
    .replace(/[^\d]/g, "")
    .slice(0, 8);
  if (s.length !== 8) return null; // 유효하지 않은 입력은 null
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

/** 년/월을 받아 YYYY-MM 형태(앞자리 0패딩)로 반환. 유효하지 않으면 null */
/*function toYearMonthISO(year, month) {
  const y = toNumberOrNull(year);
  const m = toNumberOrNull(month);
  if (!y || !m) return null;
  return `${y}-${String(m).padStart(2, "0")}`;
}/*

/** "예"/"아니오" 값을 불리언으로 변환 (그 외 값은 false 취급) */
function yesNoToBool(v) {
  return v === "예";
}

/** 배열 보장 유틸 */
function asArray(v) {
  return Array.isArray(v) ? v : v == null ? [] : [v];
}

/**
 * 치료유형의 "없음" 상호배타 규칙 검사.
 * - "없음"이 포함되면 그 외 항목은 없어야 함.
 * 충돌 시 에러 코드를 반환하고, 아니면 정제된 배열을 반환.
 */
function sanitizeTreatmentTypes(types) {
  const arr = asArray(types).map(String);
  if (arr.includes("없음") && arr.length > 1) {
    return { error: "TREATMENT_TYPES_CONFLICT", types: arr };
  }
  return { error: null, types: arr };
}

/** 숫자 변환 유틸 (빈 값 -> null) */
function toNumberOrNull(v) {
  if (v === "" || v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** 공백 정리 유틸 (빈 문자열 -> "") */
function asTrimmed(v) {
  return String(v ?? "").trim();
}

/**
 * 폼 상태를 표준 환자 스키마로 매핑
 * @param {Object} form 현재 SurveyForm 상태 객체
 * @returns {Object} Firestore에 저장할 표준 객체 또는 {__error: string}
 */
export function mapSurveyToPatient(form) {
  const birthISO = normalizeBirth(form?.birthDate);

  // 치료유형 상호배타 규칙 적용
  const { error: typesError, types } = sanitizeTreatmentTypes(
    form?.treatmentTypes
  );
  if (typesError) {
    return { __error: typesError };
  }

  const hasSurgery = yesNoToBool(form?.hasSurgery);
  const hasOtherCancer = form?.otherCancerDiagnosis
    ? yesNoToBool(form.otherCancerDiagnosis)
    : false;
  const hasRecurrence = yesNoToBool(form?.hasRecurrence);
  const hasMentalHistory = yesNoToBool(form?.mentalHealthHistory);

  const diagnoses = form?.mentalHealthDiagnoses || {
    depression: false,
    anxietyDisorder: false,
    schizophrenia: false,
    other: false,
  };

  // 파생(편의) 필드 계산
  const diagYear = toNumberOrNull(form?.diagnosisYear);
  const diagMonth = toNumberOrNull(form?.diagnosisMonth);
  // 진단일: YYYY-MM 형식만 저장 (일자 제거)
  const diagnosisDateISO =
    diagYear && diagMonth
      ? `${diagYear}-${String(diagMonth).padStart(2, "0")}`
      : null;

  const surgeryYearNum = yesNoToBool(form?.hasSurgery)
    ? toNumberOrNull(form?.surgeryYear)
    : null;
  const surgeryMonthNum = yesNoToBool(form?.hasSurgery)
    ? toNumberOrNull(form?.surgeryMonth)
    : null;
  const surgeryDateYM =
    surgeryYearNum && surgeryMonthNum
      ? `${surgeryYearNum}-${String(surgeryMonthNum).padStart(2, "0")}`
      : null;

  const mapped = {
    // 기본 인적사항
    name: asTrimmed(form?.name),
    birthDate: birthISO, // ISO (YYYY-MM-DD) 또는 null
    gender: form?.gender ?? null,
    maritalStatus: form?.maritalStatus ?? null,

    // 진단 정보
    diagnosis: {
      year: diagYear,
      month: diagMonth,
      cancerType: asTrimmed(form?.cancerType || ""),
      stage: form?.cancerStage ?? null,
    },

    // 파생 편의 필드 (웹2 호환)
    diagnosisDate: diagnosisDateISO, // 예: "2018-06-01" 또는 null
    surgeryDate: surgeryDateYM, // 예: "2020-05" 또는 null
    hasSurgery, // 루트에 미러링 (대시보드 호환)
    hasRecurrence: hasRecurrence, // 루트에 미러링 (대시보드 호환)

    // 타 암 병력
    otherCancer: {
      hasOther: hasOtherCancer,
      details: hasOtherCancer
        ? asTrimmed(form?.otherCancerDetails || "")
        : null,
    },

    // 치료 정보
    treatment: {
      hasSurgery,
      surgery: {
        year: hasSurgery ? surgeryYearNum : null,
        month: hasSurgery ? surgeryMonthNum : null,
      },
      types,
      otherType: types.includes("기타")
        ? asTrimmed(form?.otherTreatmentType || "")
        : null,
    },

    // 재발 여부
    recurrence: hasRecurrence,

    // 정신건강 이력
    mentalHealth: {
      history: hasMentalHistory,
      diagnoses,
      otherName: diagnoses?.other
        ? asTrimmed(form?.otherMentalDiagnosis || "")
        : null,
      impact: hasMentalHistory ? form?.mentalHealthImpact ?? null : null,
    },

    // 생활습관
    lifestyle: {
      alcohol: {
        tried: form?.alcoholReduction
          ? yesNoToBool(form.alcoholReduction)
          : false,
        current:
          form?.alcoholReduction === "예"
            ? {
                soju: asTrimmed(form?.currentAlcoholSoju || ""),
                beer: asTrimmed(form?.currentAlcoholBeer || ""),
                other: asTrimmed(form?.currentAlcoholOther || ""),
              }
            : null,
        barriers:
          form?.alcoholReduction === "예"
            ? asArray(form?.alcoholReductionBarriers)
            : [],
      },
      smoking: {
        tried: form?.smokingCessation
          ? yesNoToBool(form.smokingCessation)
          : false,
        current:
          form?.smokingCessation === "예"
            ? {
                regular: asTrimmed(form?.currentSmokingRegular || ""),
                electronic: asTrimmed(form?.currentSmokingEletronic || ""),
                other: asTrimmed(form?.currentSmokingOther || ""),
              }
            : null,
        barriers:
          form?.smokingCessation === "예"
            ? asArray(form?.smokingCessationBarriers)
            : [],
      },
    },

    // 메타 정보
    meta: {
      familyComposition: asArray(form?.familyComposition),
      caregiver: asTrimmed(form?.caregiver || ""),
      healthConsultant: asTrimmed(form?.healthConsultant || ""),
      workStatus: asTrimmed(form?.workStatus || ""),
      workType: asTrimmed(form?.workType || ""),
    },

    // 스키마 버전은 constants.js에서 관리하되, 안전을 위해 기본값 1 지정
    schemaVersion: 1,
  };

  return mapped;
}

const mappers = {
  normalizeBirth,
  mapSurveyToPatient,
};

export default mappers;
