// 알림 서비스 - 알림 생성 로직 중앙화

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * 알림 생성
 * @param {Object} params
 * @param {string} params.userId - 수신자 ID
 * @param {string} params.type - 알림 유형 (comment, like, reply)
 * @param {string} params.postId - 게시글 ID
 * @param {string} params.postTitle - 게시글 제목
 * @param {string} params.senderName - 발신자 이름
 * @param {string} params.senderId - 발신자 ID (본인 알림 방지용)
 * @param {string} params.targetUserId - 대상 사용자 ID (본인 알림 방지용)
 */
export async function createNotification({
  userId,
  type,
  postId,
  postTitle,
  senderName,
  senderId,
  targetUserId,
}) {
  // 본인에게 알림을 보내지 않음
  if (senderId === targetUserId) {
    return;
  }

  if (!userId || !type || !postId) {
    console.warn("알림 생성 실패: 필수 파라미터 누락", {
      userId,
      type,
      postId,
    });
    return;
  }

  try {
    const messages = {
      comment: `${senderName}님이 댓글을 남겼습니다.`,
      like: `${senderName}님이 좋아요를 눌렀습니다.`,
      reply: `${senderName}님이 답글을 남겼습니다.`,
    };

    await addDoc(collection(db, "community_notifications"), {
      userId,
      type,
      postId,
      postTitle: postTitle || "",
      message: messages[type] || "새 알림이 있습니다.",
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("알림 생성 오류:", error);
    // 알림 생성 실패는 치명적이지 않으므로 에러를 throw하지 않음
  }
}
