// web1/src/context/SurveyFormContext.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * 설문 상태 전역 저장 + 자동 임시저장(Context)
 * - answers: 문항/개인정보 해시 { [name]: value }
 * - setAnswer(name, value): 단일 값 갱신
 * - bulkSet(obj): 여러 값 일괄 갱신
 * - reset(): 전부 초기화(로컬스토리지 포함)
 *
 * ✅ 안정성 개선
 *  - schemaVersion 으로 구조 변경 시 자동 분리 저장
 *  - storageKey 는 내부적으로 `${storageKey}@v${schemaVersion}` 로 네임스페이스 관리
 */

const SurveyFormContext = createContext(null);
SurveyFormContext.displayName = "SurveyFormContext";

export function SurveyFormProvider({
  storageKey = "survey-draft",
  schemaVersion = 1,
  children,
  initialAnswers = {},
}) {
  // 실제 로컬스토리지 키 (버전 포함)
  const effectiveKey = useMemo(
    () => `${storageKey}@v${schemaVersion}`,
    [storageKey, schemaVersion]
  );

  const loadedRef = useRef(false);
  const saveTimer = useRef(null);

  const [answers, setAnswers] = useState(() => {
    // 초기 로드: localStorage → props.initialAnswers 순
    try {
      const raw = window.localStorage.getItem(effectiveKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    return initialAnswers || {};
  });

  // 임시저장: 300ms 디바운스
  const scheduleSave = useCallback(
    (next) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        try {
          window.localStorage.setItem(effectiveKey, JSON.stringify(next));
        } catch {}
      }, 300);
    },
    [effectiveKey]
  );

  const setAnswer = useCallback(
    (name, value) => {
      setAnswers((prev) => {
        const next = { ...prev, [name]: value };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  const bulkSet = useCallback(
    (obj) => {
      if (!obj || typeof obj !== "object") return;
      setAnswers((prev) => {
        const next = { ...prev, ...obj };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  const clearField = useCallback((name) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[name];
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const reset = useCallback(() => {
    setAnswers({});
    try {
      window.localStorage.removeItem(effectiveKey);
    } catch {}
  }, [effectiveKey]);

  // 다른 탭/윈도우에서 동일 키가 변경되면 동기화
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === effectiveKey && typeof e.newValue === "string") {
        try {
          const parsed = JSON.parse(e.newValue || "{}");
          setAnswers(parsed || {});
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [effectiveKey]);

  // 최초 마운트 시점 로드 표시(필요 시 로직 분기용)
  useEffect(() => {
    loadedRef.current = true;
  }, []);

  const value = useMemo(
    () => ({
      answers,
      setAnswer,
      bulkSet,
      clearField,
      reset,
      storageKey: effectiveKey,
    }),
    [answers, setAnswer, bulkSet, clearField, reset, effectiveKey]
  );

  return (
    <SurveyFormContext.Provider value={value}>
      {children}
    </SurveyFormContext.Provider>
  );
}

export function useSurveyForm() {
  const ctx = useContext(SurveyFormContext);
  if (!ctx)
    throw new Error(
      "useSurveyForm must be used inside <SurveyFormProvider>"
    );
  return ctx;
}

/**
 * 문항 바인딩 헬퍼 훅
 * - name: 문항 키
 * - defaultValue: 기본값(초기 한 번만 적용)
 * 사용법:
 *   const field = useFormField("q1", "");
 *   <input value={field.value} onChange={e => field.onChange(e.target.value)} />
 */
export function useFormField(name, defaultValue = "") {
  const { answers, setAnswer } = useSurveyForm();
  const hasValue = Object.prototype.hasOwnProperty.call(answers, name);
  const value = hasValue ? answers[name] : defaultValue;
  const onChange = useCallback(
    (v) => setAnswer(name, v),
    [name, setAnswer]
  );
  return { value, onChange };
}

// 기본(default) 내보내기도 유지 — 어느 방식으로 임포트해도 안전
export default SurveyFormProvider;