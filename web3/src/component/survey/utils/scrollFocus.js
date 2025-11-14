// web1/src/component/survey/utils/scrollFocus.js
// 작은 스크롤/포커스 유틸 모음 (프레임워크 비의존)
// - 폼 유효성 검사 후 첫 에러 필드로 부드럽게 스크롤+포커스
// - 특정 엘리먼트로 스크롤하면서 포커스 이동

/** 엘리먼트가 포커스 가능하지 않다면 임시로 tabindex 부여 */
function ensureFocusable(el) {
  if (!el) return el;
  const isNaturallyFocusable =
    el.tabIndex >= 0 || /^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(el.tagName);

  if (!isNaturallyFocusable) {
    el.setAttribute("tabindex", "-1");
    el.dataset.__tempTabIndex = "1";
  }
  return el;
}

/** 포커스 후 임시 tabindex 정리 */
function cleanupTempFocusable(el) {
  if (el && el.dataset && el.dataset.__tempTabIndex) {
    el.removeAttribute("tabindex");
    delete el.dataset.__tempTabIndex;
  }
}

/** 주어진 엘리먼트로 스크롤 */
export function scrollToElement(
  el,
  { offset = -80, behavior = "smooth", container = null } = {}
) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const top = rect.top + (container ? container.scrollTop : window.pageYOffset);
  const target = top + offset;

  if (container) {
    container.scrollTo({ top: target, behavior });
  } else {
    window.scrollTo({ top: target, behavior });
  }
}

/** 엘리먼트에 포커스(스크롤은 하지 않음) */
export function focusElement(el) {
  if (!el) return;
  const target = ensureFocusable(el);
  try {
    target.focus({ preventScroll: true });
  } catch (_) {
    // 일부 브라우저/컴포넌트에서 옵션 미지원
    target.focus();
  }
  // setTimeout으로 포커스 후 임시 tabindex 정리(다음 틱)
  setTimeout(() => cleanupTempFocusable(target), 0);
}

/** 선택자 또는 엘리먼트로 포커스 + 스크롤 */
export function focusAndScrollIntoView(elOrSelector, opts = {}) {
  const el =
    typeof elOrSelector === "string"
      ? document.querySelector(elOrSelector)
      : elOrSelector;
  if (!el) return false;
  focusElement(el);
  scrollToElement(el, opts);
  return true;
}

/** 화면에 보이는 요소만 필터 */
function isVisible(el) {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  if (style.visibility === "hidden" || style.display === "none") return false;
  // offsetParent가 null이어도 fixed 포지션 등은 남을 수 있음 → 크기로 보조 판단
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/**
 * 루트 내에서 "첫 번째 에러" 후보를 찾아 포커스 & 스크롤
 * @param {Element|Document} root 검색 루트(기본: document)
 * @param {Object} options
 * @param {string[]} options.extraSelectors 추가로 에러로 간주할 선택자 배열
 * @param {number} options.offset 스크롤 보정(px, 기본 -80)
 * @param {Element|null} options.container 스크롤 컨테이너(없으면 window)
 */
export function focusFirstError(
  root = document,
  { extraSelectors = [], offset = -80, container = null } = {}
) {
  const selectors = [
    "[aria-invalid='true']",
    ".Mui-error input, .Mui-error textarea, .Mui-error .MuiSelect-select",
    "[data-error='true']",
    ".error input, .error textarea, .is-error input, .is-error textarea",
    ...extraSelectors,
  ].join(",");

  const nodes = Array.from(root.querySelectorAll(selectors));
  const first = nodes.find(isVisible);
  if (!first) return false;

  // MUI의 경우 라벨/래퍼가 .Mui-error 라면 실제 입력은 자식 input인 경우가 많음 → 포커스 타깃 정제
  const inputCandidate = first.matches(
    "input, textarea, select, [contenteditable='true']"
  )
    ? first
    : first.querySelector("input, textarea, select, [contenteditable='true']");

  const target = inputCandidate || first;
  focusElement(target);
  scrollToElement(target, { offset, container });
  return true;
}

export default {
  scrollToElement,
  focusElement,
  focusAndScrollIntoView,
  focusFirstError,
};
