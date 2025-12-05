

// web1/src/component/survey/parts/NavButtons.jsx
import React, { useCallback } from "react";
import { Stack, Button, CircularProgress } from "@mui/material";
import { focusFirstError } from "../utils/scrollFocus";

/**
 * NavButtons
 *
 * 섹션 하단의 [이전] [다음] [제출] 버튼 묶음.
 * - validateSection: () => { ok: boolean, errors?: Record<string,string> } 형태를 기대
 *   - ok=false 이면 첫 에러 필드로 스크롤/포커스 이동
 * - onPrev/onNext/onSubmit: 클릭 시 실행할 콜백
 * - canGoPrev/canGoNext: 버튼 활성화 제어
 * - isSubmitting: 제출 중 로딩 스피너 표시
 * - 라벨 커스터마이징: prevLabel/nextLabel/submitLabel
 */

/**
 * @param {Object} props
 * @param {function=} props.onPrev
 * @param {function=} props.onNext
 * @param {function=} props.onSubmit
 * @param {function=} props.validateSection
 * @param {boolean=} props.canGoPrev
 * @param {boolean=} props.canGoNext
 * @param {boolean=} props.isLastSection
 * @param {boolean=} props.isSubmitting
 * @param {string=} props.prevLabel
 * @param {string=} props.nextLabel
 * @param {string=} props.submitLabel
 */
function NavButtons({
  onPrev,
  onNext,
  onSubmit,
  validateSection,
  canGoPrev = true,
  canGoNext = true,
  isLastSection = false,
  isSubmitting = false,
  prevLabel = "이전",
  nextLabel = "다음",
  submitLabel = "제출",
}) {
  const tryProceed = useCallback(
    async (action) => {
      // 유효성 검사 있으면 먼저 수행
      if (typeof validateSection === "function") {
        try {
          const res = await validateSection();
          if (res && res.ok === false) {
            // 에러 맵이 오면 첫 에러 포커스
            if (res.errors && typeof res.errors === "object") {
              focusFirstError(res.errors);
            }
            return; // 진행 중단
          }
        } catch (e) {
          // validate에서 예외 발생 시도 진행 중단
          return;
        }
      }

      // 액션 실행
      if (action === "next" && typeof onNext === "function") onNext();
      if (action === "submit" && typeof onSubmit === "function") onSubmit();
    },
    [onNext, onSubmit, validateSection]
  );

  return (
    <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
      <Button variant="outlined" onClick={onPrev} disabled={!canGoPrev || isSubmitting}>
        {prevLabel}
      </Button>

      {isLastSection ? (
        <Button
          variant="contained"
          onClick={() => tryProceed("submit")}
          disabled={!canGoNext || isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
          {submitLabel}
        </Button>
      ) : (
        <Button
          variant="contained"
          onClick={() => tryProceed("next")}
          disabled={!canGoNext || isSubmitting}
        >
          {nextLabel}
        </Button>
      )}
    </Stack>
  );
}

export default NavButtons;