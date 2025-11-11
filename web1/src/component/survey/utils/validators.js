// web1/src/component/survey/utils/validators.js
// 단일 책임: 값 검증과 날짜/서식 보정 유틸만을 제공
// UI/메시지 렌더링은 상위에서 담당하고, 이 파일은 순수 함수만 export 합니다.

/**
 * 내부: 공백/널 처리
 */
const _trim = (v) => (typeof v === "string" ? v.trim() : v);

/**
 * YYYY-MM-DD / YYYYMMDD / YYYY.MM.DD 형태를 허용하고
 * 표준 형태(YYYY-MM-DD)로 정규화합니다. 실패 시 null.
 */
export function normalizeYMD(input) {
  const v = _trim(input);
  if (!v) return null;

  // 숫자만(YYYYMMDD)
  const pure = String(v).replace(/[^0-9]/g, "");
  if (pure.length !== 8) return null;

  const y = pure.slice(0, 4);
  const m = pure.slice(4, 6);
  const d = pure.slice(6, 8);

  const yyyy = Number(y);
  const mm = Number(m);
  const dd = Number(d);

  if (yyyy < 1900 || yyyy > 2100) return null;
  if (mm < 1 || mm > 12) return null;
  if (dd < 1 || dd > 31) return null;

  // 날짜 유효성(윤년 등) 체크
  const dt = new Date(Date.UTC(yyyy, mm - 1, dd));
  if (
    dt.getUTCFullYear() !== yyyy ||
    dt.getUTCMonth() + 1 !== mm ||
    dt.getUTCDate() !== dd
  ) {
    return null;
  }
  return `${y}-${m}-${d}`; // 표준 포맷
}

/**
 * 유효한 YYYY(-|.|)MM(-|.|)DD 인지 여부
 */
export function isValidYMD(input) {
  return normalizeYMD(input) !== null;
}

/**
 * ymd 문자열(YYYY-MM-DD) 비교
 * @returns -1(a<b) / 0(a=b) / 1(a>b)
 */
export function compareYMD(a, b) {
  const aa = normalizeYMD(a);
  const bb = normalizeYMD(b);
  if (!aa || !bb) return NaN;
  return aa < bb ? -1 : aa > bb ? 1 : 0;
}

/** 현재(로컬) 날짜 YYYY-MM-DD */
export function todayYMD() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 미래 날짜 여부 */
export function isFutureYMD(input) {
  const n = normalizeYMD(input);
  if (!n) return false;
  return compareYMD(n, todayYMD()) === 1;
}

/** 과거/오늘까지만 허용 */
export function ensureNotFuture(
  input,
  message = "미래 날짜는 선택할 수 없습니다."
) {
  const n = normalizeYMD(input);
  if (!n) return { ok: false, error: "날짜 형식이 올바르지 않습니다." };
  if (isFutureYMD(n)) return { ok: false, error: message };
  return { ok: true };
}

/** 필수값 검증 */
export function validateRequired(v, message = "필수 입력입니다.") {
  const val = _trim(v);
  const ok = !(val === undefined || val === null || val === "");
  return ok ? { ok: true } : { ok: false, error: message };
}

/** 한국 휴대전화(하이픈 허용), 10~11자리 */
export function validatePhoneKR(v, message = "전화번호 형식을 확인해주세요.") {
  const s = String(v || "").replace(/[^0-9]/g, "");
  const ok = s.length === 10 || s.length === 11;
  return ok ? { ok: true, value: s } : { ok: false, error: message };
}

/** 1~5 Likert 값 검증 */
export function validateLikert1to5(v, message = "1~5 중 하나를 선택해주세요.") {
  const n = Number(v);
  const ok = Number.isInteger(n) && n >= 1 && n <= 5;
  return ok ? { ok: true } : { ok: false, error: message };
}

/** 예/아니오 */
export function validateYesNo(v, message = "예/아니오 중 선택해주세요.") {
  const ok = v === "yes" || v === "no" || v === true || v === false;
  return ok ? { ok: true } : { ok: false, error: message };
}

/**
 * 교차 필드: 수술일은 진단일보다 빠를 수 없음
 */
export function validateSurgeryAfterDiagnosis(diagnosisYMD, surgeryYMD) {
  const a = normalizeYMD(diagnosisYMD);
  const b = normalizeYMD(surgeryYMD);
  if (!b) return { ok: true }; // 미기입은 여기서 막지 않음(필수 검증은 별도)
  if (!a) return { ok: true };
  if (compareYMD(b, a) === -1) {
    return {
      ok: false,
      error: "수술 날짜가 발병(진단) 시기보다 앞설 수 없습니다.",
    };
  }
  return { ok: true };
}

/** 섹션 필수 문항 완료 여부 */
export function validateSectionRequired(answers, requiredNames = []) {
  const missing = [];
  for (const name of requiredNames) {
    const v = answers?.[name];
    const has = !(v === undefined || v === null || v === "");
    if (!has) missing.push(name);
  }
  return { ok: missing.length === 0, missing };
}

/**
 * 에러 메시지 헬퍼(상위 UI에서 메시지 단일화할 때 사용)
 */
export const MESSAGES = {
  REQUIRED: "필수 입력입니다.",
  DATE_FORMAT: "날짜 형식이 올바르지 않습니다.",
  FUTURE_FORBIDDEN: "미래 날짜는 선택할 수 없습니다.",
  SURGERY_BEFORE_DIAGNOSIS: "수술 날짜가 발병(진단) 시기보다 앞설 수 없습니다.",
  PHONE: "전화번호 형식을 확인해주세요.",
  LIKERT: "1~5 중 하나를 선택해주세요.",
  YESNO: "예/아니오 중 선택해주세요.",
};

export default {
  normalizeYMD,
  isValidYMD,
  compareYMD,
  todayYMD,
  isFutureYMD,
  ensureNotFuture,
  validateRequired,
  validatePhoneKR,
  validateLikert1to5,
  validateYesNo,
  validateSurgeryAfterDiagnosis,
  validateSectionRequired,
  MESSAGES,
};
