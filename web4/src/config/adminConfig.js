// 관리자 설정
// 이 배열에 관리자 이메일을 추가하세요
export const ADMIN_EMAILS = [
  // 여기에 관리자 이메일을 추가하세요
  "admin@example.com",
];

// 관리자 권한 확인 함수
export function isAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}
