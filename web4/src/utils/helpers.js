// 공통 헬퍼 함수

/**
 * Firestore Timestamp를 Date 객체로 변환
 */
export function toDate(timestamp) {
  if (!timestamp) return null;
  if (timestamp.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
}

/**
 * 날짜를 한국어 형식으로 포맷팅
 */
export function formatDate(timestamp, options = {}) {
  const date = toDate(timestamp);
  if (!date) return "날짜 없음";

  const defaultOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  };

  return date.toLocaleDateString("ko-KR", defaultOptions);
}

/**
 * 날짜와 시간을 한국어 형식으로 포맷팅
 */
export function formatDateTime(timestamp) {
  const date = toDate(timestamp);
  if (!date) return "날짜 없음";
  return date.toLocaleString("ko-KR");
}

/**
 * 상대 시간 표시 (예: "3일 전")
 */
export function formatRelativeTime(timestamp) {
  const date = toDate(timestamp);
  if (!date) return "날짜 없음";

  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return formatDate(timestamp);
}

/**
 * 텍스트를 안전하게 잘라내기 (XSS 방지)
 */
export function truncateText(text, maxLength = 100) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * 사용자 표시 이름 가져오기
 */
export function getDisplayName(userProfile, currentUser) {
  return (
    userProfile?.displayName ||
    currentUser?.displayName ||
    currentUser?.email?.split("@")[0] ||
    "익명"
  );
}

/**
 * 안전한 배열 접근
 */
export function safeArray(arr) {
  return Array.isArray(arr) ? arr : [];
}

/**
 * 안전한 객체 접근
 */
export function safeObject(obj) {
  return obj && typeof obj === "object" ? obj : {};
}
