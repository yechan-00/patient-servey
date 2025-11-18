// src/pages/PostDetailPage.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  where,
  getDocs,
  increment,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import MedicalStaffBadge from "../components/MedicalStaffBadge";
import { CATEGORY_LABELS } from "../utils/constants";
import { formatDateTime, getDisplayName } from "../utils/helpers";
import { createNotification } from "../utils/notificationService";

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const BackButton = styled.button`
  background-color: transparent;
  color: #2a5e8c;
  border: none;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const PostCard = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const PostHeader = styled.div`
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
`;

const PostTitle = styled.h1`
  font-size: 1.75rem;
  color: #333;
  margin: 0 0 1rem 0;
`;

const PostMeta = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #6c757d;
  flex-wrap: wrap;
`;

const CategoryBadge = styled.span`
  background-color: #e7f3ff;
  color: #2a5e8c;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const PostContent = styled.div`
  color: #495057;
  line-height: 1.8;
  white-space: pre-wrap;
  margin-bottom: 1.5rem;
`;

const PostActions = styled.div`
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
`;

const EditButton = styled(Button)`
  background-color: #28a745;
  color: white;

  &:hover {
    background-color: #218838;
  }
`;

const DeleteButton = styled(Button)`
  background-color: #dc3545;
  color: white;

  &:hover {
    background-color: #c82333;
  }
`;

const EditForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const EditInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:focus {
    border-color: #2a5e8c;
    outline: none;
    box-shadow: 0 0 0 3px rgba(42, 94, 140, 0.1);
  }
`;

const EditTextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  min-height: 300px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.3s ease;

  &:focus {
    border-color: #2a5e8c;
    outline: none;
    box-shadow: 0 0 0 3px rgba(42, 94, 140, 0.1);
  }
`;

const EditSelect = styled.select`
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background-color: white;
  transition: all 0.3s ease;

  &:focus {
    border-color: #2a5e8c;
    outline: none;
    box-shadow: 0 0 0 3px rgba(42, 94, 140, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const CancelButton = styled(Button)`
  background-color: #6c757d;
  color: white;

  &:hover {
    background-color: #5a6268;
  }
`;

const LikeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid ${(props) => (props.liked ? "#dc3545" : "#e9ecef")};
  background-color: ${(props) => (props.liked ? "#fff5f5" : "white")};
  color: ${(props) => (props.liked ? "#dc3545" : "#6c757d")};

  &:hover {
    border-color: #dc3545;
    background-color: #fff5f5;
    color: #dc3545;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const BookmarkButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid ${(props) => (props.bookmarked ? "#ff9800" : "#e9ecef")};
  background-color: ${(props) => (props.bookmarked ? "#fff3e0" : "white")};
  color: ${(props) => (props.bookmarked ? "#ff9800" : "#6c757d")};

  &:hover {
    border-color: #ff9800;
    background-color: #fff3e0;
    color: #ff9800;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CommentsSection = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const CommentsTitle = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin: 0 0 1.5rem 0;
`;

const CommentForm = styled.form`
  margin-bottom: 2rem;
`;

const CommentTextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  margin-bottom: 1rem;
  transition: all 0.3s ease;

  &:focus {
    border-color: #2a5e8c;
    outline: none;
    box-shadow: 0 0 0 3px rgba(42, 94, 140, 0.1);
  }
`;

const SubmitButton = styled(Button)`
  background-color: #2a5e8c;
  color: white;

  &:hover {
    background-color: #1d4269;
  }

  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const CommentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CommentCard = styled.div`
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #2a5e8c;
  margin-bottom: 1rem;
`;

const ReplyCard = styled.div`
  padding: 0.75rem;
  background-color: #ffffff;
  border-radius: 6px;
  border-left: 2px solid #c3cfe2;
  margin-left: 2rem;
  margin-top: 0.5rem;
`;

const ReplyForm = styled.form`
  margin-top: 0.75rem;
  margin-left: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ReplyTextArea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  font-size: 0.9rem;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  min-height: 60px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.3s ease;

  &:focus {
    border-color: #2a5e8c;
    outline: none;
    box-shadow: 0 0 0 3px rgba(42, 94, 140, 0.1);
  }
`;

const SmallButton = styled.button`
  background-color: transparent;
  border: none;
  color: #6c757d;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.3s ease;

  &:hover {
    background-color: #f8f9fa;
    color: #495057;
  }
`;

const ReplyButton = styled(SmallButton)`
  color: #2a5e8c;
  font-size: 0.85rem;

  &:hover {
    color: #1d4269;
    background-color: #e7f3ff;
  }
`;

const RepliesList = styled.div`
  margin-top: 0.5rem;
  margin-left: 2rem;
`;

const ReplyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
  flex-wrap: wrap;
  gap: 0.25rem;
`;

const ReplyAuthor = styled.span`
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
`;

const ReplyDate = styled.span`
  font-size: 0.75rem;
  color: #6c757d;
`;

const ReplyContent = styled.p`
  color: #495057;
  margin: 0;
  line-height: 1.5;
  font-size: 0.9rem;
  white-space: pre-wrap;
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const CommentAuthor = styled.span`
  font-weight: 600;
  color: #2a5e8c;
`;

const CommentDate = styled.span`
  font-size: 0.85rem;
  color: #6c757d;
`;

const CommentContent = styled.p`
  color: #495057;
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
`;

const CommentActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const CommentEditTextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.3s ease;
  margin-bottom: 0.5rem;

  &:focus {
    border-color: #2a5e8c;
    outline: none;
    box-shadow: 0 0 0 3px rgba(42, 94, 140, 0.1);
  }
`;

const CommentEditButton = styled(SmallButton)`
  color: #2a5e8c;

  &:hover {
    color: #1d4269;
    background-color: #e7f3ff;
  }
`;

const CommentDeleteButton = styled(SmallButton)`
  color: #dc3545;

  &:hover {
    color: #c82333;
    background-color: #f8d7da;
  }
`;

const ReportButton = styled(SmallButton)`
  color: #ff9800;

  &:hover {
    color: #f57c00;
    background-color: #fff3e0;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin: 0 0 1.5rem 0;
`;

const ModalForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f8f9fa;
  }

  input[type="radio"] {
    cursor: pointer;
  }
`;

const ModalTextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.3s ease;

  &:focus {
    border-color: #2a5e8c;
    outline: none;
    box-shadow: 0 0 0 3px rgba(42, 94, 140, 0.1);
  }
`;

const ModalButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const ModalButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
`;

const ModalSubmitButton = styled(ModalButton)`
  background-color: #ff9800;
  color: white;

  &:hover {
    background-color: #f57c00;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ModalCancelButton = styled(ModalButton)`
  background-color: #6c757d;
  color: white;

  &:hover {
    background-color: #5a6268;
  }
`;

const ErrorMessage = styled.p`
  color: #dc3545;
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #f8d7da;
  border-radius: 6px;
  font-size: 0.9rem;
`;

const Loading = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6c757d;
`;

function PostDetailPage() {
  const { postId } = useParams();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    content: "",
    category: "free",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [commentEditLoading, setCommentEditLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null); // { type: 'post' | 'comment', id: string }
  const [reportReason, setReportReason] = useState("");
  const [reportDetail, setReportDetail] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // comment.id
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState({}); // { commentId: [replies] }
  const [replyLoading, setReplyLoading] = useState({}); // { commentId: boolean }

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // 게시글 로드
    const loadPost = async () => {
      try {
        const postDoc = await getDoc(doc(db, "community_posts", postId));
        if (postDoc.exists()) {
          const postData = { id: postDoc.id, ...postDoc.data() };
          setPost(postData);
          setEditFormData({
            title: postData.title || "",
            content: postData.content || "",
            category: postData.category || "free",
          });

          // 조회수 증가 (본인 게시글이 아니고, 조회수 증가가 아직 안 된 경우)
          if (currentUser && postData.authorId !== currentUser.uid) {
            const viewCount = postData.viewCount || 0;
            await updateDoc(doc(db, "community_posts", postId), {
              viewCount: viewCount + 1,
            });
          } else if (!currentUser) {
            // 비회원도 조회수 증가
            const viewCount = postData.viewCount || 0;
            await updateDoc(doc(db, "community_posts", postId), {
              viewCount: viewCount + 1,
            });
          }
        } else {
          setError("게시글을 찾을 수 없습니다.");
        }
        setLoading(false);
      } catch (error) {
        console.error("게시글 로드 오류:", error);
        setError("게시글을 불러오는 중 오류가 발생했습니다.");
        setLoading(false);
      }
    };

    loadPost();

    // 북마크 상태 확인
    const checkBookmark = async () => {
      if (!currentUser || !postId) return;
      try {
        const userRef = doc(db, "community_users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const bookmarks = userSnap.data().bookmarks || [];
          setBookmarked(bookmarks.includes(postId));
        }
      } catch (error) {
        console.error("북마크 확인 오류:", error);
      }
    };

    if (currentUser) {
      checkBookmark();
    }

    // 댓글 실시간 업데이트
    const commentsRef = collection(db, "community_posts", postId, "comments");
    const q = query(commentsRef, orderBy("createdAt", "asc"));

    const unsubscribeComments = onSnapshot(
      q,
      async (snapshot) => {
        const commentsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments(commentsData);

        // 각 댓글의 답글 로드
        const repliesData = {};
        for (const comment of commentsData) {
          try {
            const repliesRef = collection(
              db,
              "community_posts",
              postId,
              "comments",
              comment.id,
              "replies"
            );
            const repliesQuery = query(repliesRef, orderBy("createdAt", "asc"));
            const repliesSnapshot = await getDocs(repliesQuery);
            repliesData[comment.id] = repliesSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
          } catch (error) {
            console.error(`댓글 ${comment.id}의 답글 로드 오류:`, error);
            repliesData[comment.id] = [];
          }
        }
        setReplies(repliesData);
      },
      (error) => {
        console.error("댓글 로드 오류:", error);
      }
    );

    return () => unsubscribeComments();
  }, [postId, currentUser, navigate]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) {
      return setError("댓글을 입력해주세요.");
    }

    try {
      setError("");
      setCommentLoading(true);

      const authorName = getDisplayName(userProfile, currentUser);
      const commentsRef = collection(db, "community_posts", postId, "comments");
      await addDoc(commentsRef, {
        content: commentText.trim(),
        authorId: currentUser.uid,
        authorName,
        authorEmail: currentUser.email,
        authorIsMedicalStaff: userProfile?.isMedicalStaff || false,
        createdAt: serverTimestamp(),
      });

      // 댓글 수 업데이트 (increment 사용으로 동시성 문제 해결)
      const postRef = doc(db, "community_posts", postId);
      await updateDoc(postRef, {
        commentCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      // 게시글 작성자에게 알림 전송
      await createNotification({
        userId: post.authorId,
        type: "comment",
        postId: postId,
        postTitle: post.title,
        senderName: authorName,
        senderId: currentUser.uid,
        targetUserId: post.authorId,
      });

      setCommentText("");
    } catch (error) {
      console.error("댓글 작성 오류:", error);
      setError("댓글 작성 중 오류가 발생했습니다.");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.content);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentText("");
  };

  const handleSaveEditComment = async (commentId) => {
    if (!editCommentText.trim()) {
      return setError("댓글을 입력해주세요.");
    }

    try {
      setError("");
      setCommentEditLoading(true);

      const commentRef = doc(
        db,
        "community_posts",
        postId,
        "comments",
        commentId
      );
      await updateDoc(commentRef, {
        content: editCommentText.trim(),
        updatedAt: serverTimestamp(),
      });

      setEditingCommentId(null);
      setEditCommentText("");
    } catch (error) {
      console.error("댓글 수정 오류:", error);
      setError("댓글 수정 중 오류가 발생했습니다.");
    } finally {
      setCommentEditLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (
      !window.confirm(
        "정말 이 댓글을 삭제하시겠습니까? 답글도 함께 삭제됩니다."
      )
    ) {
      return;
    }

    try {
      // 댓글의 모든 답글 삭제
      const repliesRef = collection(
        db,
        "community_posts",
        postId,
        "comments",
        commentId,
        "replies"
      );
      const repliesSnapshot = await getDocs(repliesRef);
      const replyCount = repliesSnapshot.size;

      // 배치로 댓글과 답글 삭제
      const batch = writeBatch(db);

      // 답글 삭제
      repliesSnapshot.docs.forEach((replyDoc) => {
        batch.delete(replyDoc.ref);
      });

      // 댓글 삭제
      const commentRef = doc(
        db,
        "community_posts",
        postId,
        "comments",
        commentId
      );
      batch.delete(commentRef);

      // 댓글 수 업데이트 (댓글 1개 + 답글 개수만큼 감소)
      const postRef = doc(db, "community_posts", postId);
      batch.update(postRef, {
        commentCount: increment(-1 - replyCount),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
    } catch (error) {
      console.error("댓글 삭제 오류:", error);
      setError("댓글 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleReport = (type, id) => {
    if (!currentUser) {
      setError("로그인이 필요합니다.");
      return;
    }
    setReportTarget({ type, id });
    setShowReportModal(true);
    setReportReason("");
    setReportDetail("");
    setHasReported(false);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setReportTarget(null);
    setReportReason("");
    setReportDetail("");
  };

  const checkExistingReport = async () => {
    if (!currentUser || !reportTarget) return false;

    try {
      const reportsRef = collection(db, "community_reports");
      const q = query(
        reportsRef,
        where("reporterId", "==", currentUser.uid),
        where("targetType", "==", reportTarget.type),
        where("targetId", "==", reportTarget.id)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error("신고 확인 오류:", error);
      return false;
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();

    if (!reportReason) {
      setError("신고 사유를 선택해주세요.");
      return;
    }

    if (!currentUser || !reportTarget) {
      setError("신고 정보가 올바르지 않습니다.");
      return;
    }

    try {
      setError("");
      setReportLoading(true);

      // 중복 신고 확인
      const alreadyReported = await checkExistingReport();
      if (alreadyReported) {
        setHasReported(true);
        setError("이미 신고한 항목입니다.");
        setReportLoading(false);
        return;
      }

      // 신고 데이터 저장
      const reportData = {
        reporterId: currentUser.uid,
        reporterName:
          userProfile?.displayName || currentUser.displayName || "익명",
        reporterEmail: currentUser.email,
        targetType: reportTarget.type, // 'post' or 'comment'
        targetId: reportTarget.id,
        postId: reportTarget.type === "post" ? reportTarget.id : postId,
        reason: reportReason,
        detail: reportDetail.trim(),
        status: "pending", // pending, reviewed, resolved, rejected
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "community_reports"), reportData);

      // 게시글/댓글에 신고 수 증가
      if (reportTarget.type === "post") {
        await updateDoc(doc(db, "community_posts", reportTarget.id), {
          reportCount: increment(1),
        });
      } else {
        // 댓글 신고는 나중에 관리자가 확인할 수 있도록만 저장
      }

      setShowReportModal(false);
      setReportTarget(null);
      setReportReason("");
      setReportDetail("");
      alert("신고가 접수되었습니다. 검토 후 조치하겠습니다.");
    } catch (error) {
      console.error("신고 처리 오류:", error);
      setError("신고 처리 중 오류가 발생했습니다.");
    } finally {
      setReportLoading(false);
    }
  };

  const handleReply = (commentId) => {
    setReplyingTo(commentId);
    setReplyText("");
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText("");
  };

  const handleSubmitReply = async (commentId) => {
    if (!replyText.trim()) {
      return setError("답글을 입력해주세요.");
    }

    if (!currentUser) {
      setError("로그인이 필요합니다.");
      return;
    }

    try {
      setError("");
      setReplyLoading({ ...replyLoading, [commentId]: true });

      const authorName = getDisplayName(userProfile, currentUser);
      const repliesRef = collection(
        db,
        "community_posts",
        postId,
        "comments",
        commentId,
        "replies"
      );
      await addDoc(repliesRef, {
        content: replyText.trim(),
        authorId: currentUser.uid,
        authorName,
        authorEmail: currentUser.email,
        authorIsMedicalStaff: userProfile?.isMedicalStaff || false,
        createdAt: serverTimestamp(),
      });

      // 댓글 수 업데이트 (답글도 댓글 수에 포함, increment 사용)
      const postRef = doc(db, "community_posts", postId);
      await updateDoc(postRef, {
        commentCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      // 댓글 작성자에게 알림 전송
      const parentComment = comments.find((c) => c.id === commentId);
      if (parentComment) {
        await createNotification({
          userId: parentComment.authorId,
          type: "reply",
          postId: postId,
          postTitle: post.title,
          senderName: authorName,
          senderId: currentUser.uid,
          targetUserId: parentComment.authorId,
        });
      }

      setReplyingTo(null);
      setReplyText("");
    } catch (error) {
      console.error("답글 작성 오류:", error);
      setError("답글 작성 중 오류가 발생했습니다.");
    } finally {
      setReplyLoading({ ...replyLoading, [commentId]: false });
    }
  };

  const handleBookmark = async () => {
    if (!currentUser) {
      setError("로그인이 필요합니다.");
      return;
    }

    try {
      setBookmarkLoading(true);
      const userRef = doc(db, "community_users", currentUser.uid);
      const userSnap = await getDoc(userRef);

      let bookmarks = [];
      if (userSnap.exists()) {
        bookmarks = userSnap.data().bookmarks || [];
      }

      if (bookmarked) {
        // 북마크 제거
        bookmarks = bookmarks.filter((id) => id !== postId);
        await updateDoc(userRef, {
          bookmarks: bookmarks,
          updatedAt: serverTimestamp(),
        });
        setBookmarked(false);
      } else {
        // 북마크 추가
        if (!bookmarks.includes(postId)) {
          bookmarks.push(postId);
          await updateDoc(userRef, {
            bookmarks: bookmarks,
            updatedAt: serverTimestamp(),
          });
        }
        setBookmarked(true);
      }
    } catch (error) {
      console.error("북마크 처리 오류:", error);
      setError("북마크 처리 중 오류가 발생했습니다.");
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleEditPost = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({
      title: post?.title || "",
      content: post?.content || "",
      category: post?.category || "free",
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!editFormData.title.trim() || !editFormData.content.trim()) {
      return setError("제목과 내용을 모두 입력해주세요.");
    }

    try {
      setError("");
      setEditLoading(true);

      await updateDoc(doc(db, "community_posts", postId), {
        title: editFormData.title.trim(),
        content: editFormData.content.trim(),
        category: editFormData.category,
        updatedAt: serverTimestamp(),
      });

      setPost({
        ...post,
        title: editFormData.title.trim(),
        content: editFormData.content.trim(),
        category: editFormData.category,
      });

      setIsEditing(false);
    } catch (error) {
      console.error("게시글 수정 오류:", error);
      setError("게시글 수정 중 오류가 발생했습니다.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (
      !window.confirm(
        "정말 이 게시글을 삭제하시겠습니까? 댓글과 답글도 모두 삭제됩니다."
      )
    ) {
      return;
    }

    try {
      // 모든 댓글과 답글 삭제
      const commentsRef = collection(db, "community_posts", postId, "comments");
      const commentsSnapshot = await getDocs(commentsRef);

      const batch = writeBatch(db);

      // 각 댓글의 답글 삭제
      for (const commentDoc of commentsSnapshot.docs) {
        const repliesRef = collection(
          db,
          "community_posts",
          postId,
          "comments",
          commentDoc.id,
          "replies"
        );
        const repliesSnapshot = await getDocs(repliesRef);
        repliesSnapshot.docs.forEach((replyDoc) => {
          batch.delete(replyDoc.ref);
        });

        // 댓글 삭제
        batch.delete(commentDoc.ref);
      }

      // 게시글 삭제
      const postRef = doc(db, "community_posts", postId);
      batch.delete(postRef);

      await batch.commit();
      navigate("/community");
    } catch (error) {
      console.error("게시글 삭제 오류:", error);
      setError("게시글 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleLikePost = async () => {
    if (!currentUser) {
      setError("로그인이 필요합니다.");
      return;
    }

    try {
      const postRef = doc(db, "community_posts", postId);
      const likedBy = post.likedBy || [];
      const isLiked = likedBy.includes(currentUser.uid);

      if (isLiked) {
        // 좋아요 취소
        const newLikedBy = likedBy.filter((id) => id !== currentUser.uid);
        await updateDoc(postRef, {
          likedBy: newLikedBy,
          likeCount: increment(-1),
          updatedAt: serverTimestamp(),
        });
        setPost({
          ...post,
          likedBy: newLikedBy,
          likeCount: Math.max(0, (post.likeCount || 0) - 1),
        });
      } else {
        // 좋아요 추가
        const newLikedBy = [...likedBy, currentUser.uid];
        await updateDoc(postRef, {
          likedBy: newLikedBy,
          likeCount: increment(1),
          updatedAt: serverTimestamp(),
        });
        setPost({
          ...post,
          likedBy: newLikedBy,
          likeCount: (post.likeCount || 0) + 1,
        });

        // 게시글 작성자에게 알림 전송
        const authorName = getDisplayName(userProfile, currentUser);
        await createNotification({
          userId: post.authorId,
          type: "like",
          postId: postId,
          postTitle: post.title,
          senderName: authorName,
          senderId: currentUser.uid,
          targetUserId: post.authorId,
        });
      }
    } catch (error) {
      console.error("좋아요 처리 오류:", error);
      setError("좋아요 처리 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <Container>
        <Loading>로딩 중...</Loading>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container>
        <ErrorMessage>{error || "게시글을 찾을 수 없습니다."}</ErrorMessage>
      </Container>
    );
  }

  const isAuthor = currentUser && post.authorId === currentUser.uid;
  const isAdmin = userProfile?.isAdmin || userProfile?.role === "admin";
  const canEdit = isAuthor || isAdmin;
  const categoryOptions = [
    { id: "free", name: CATEGORY_LABELS.free },
    { id: "question", name: CATEGORY_LABELS.question },
    { id: "review", name: CATEGORY_LABELS.review },
    { id: "info", name: CATEGORY_LABELS.info },
    { id: "support", name: CATEGORY_LABELS.support },
  ];

  return (
    <Container>
      <BackButton onClick={() => navigate("/community")}>← 목록으로</BackButton>

      <PostCard>
        <PostHeader>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <CategoryBadge>
              {CATEGORY_LABELS[post.category] || post.category}
            </CategoryBadge>
            {canEdit && !isEditing && (
              <ButtonGroup>
                <EditButton onClick={handleEditPost}>수정</EditButton>
                <DeleteButton onClick={handleDeletePost}>삭제</DeleteButton>
              </ButtonGroup>
            )}
          </div>
          {isEditing ? (
            <EditForm onSubmit={handleSaveEdit}>
              <EditSelect
                value={editFormData.category}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, category: e.target.value })
                }
              >
                {categoryOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </EditSelect>
              <EditInput
                type="text"
                value={editFormData.title}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, title: e.target.value })
                }
                placeholder="제목을 입력하세요"
                required
                maxLength={100}
              />
              <EditTextArea
                value={editFormData.content}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, content: e.target.value })
                }
                placeholder="내용을 입력하세요"
                required
              />
              {error && <ErrorMessage>{error}</ErrorMessage>}
              <ButtonGroup>
                <CancelButton
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={editLoading}
                >
                  취소
                </CancelButton>
                <SubmitButton type="submit" disabled={editLoading}>
                  {editLoading ? "저장 중..." : "저장"}
                </SubmitButton>
              </ButtonGroup>
            </EditForm>
          ) : (
            <>
              <PostTitle>{post.title}</PostTitle>
              <PostMeta>
                <span>
                  작성자: {post.authorName || "익명"}
                  {post.authorIsMedicalStaff && <MedicalStaffBadge />}
                </span>
                <span>{formatDateTime(post.createdAt)}</span>
                {post.viewCount !== undefined && (
                  <span>조회 {post.viewCount || 0}</span>
                )}
              </PostMeta>
            </>
          )}
        </PostHeader>
        {!isEditing && (
          <>
            <PostContent>{post.content}</PostContent>
            <PostActions>
              <LikeButton
                liked={
                  currentUser && (post.likedBy || []).includes(currentUser.uid)
                }
                onClick={handleLikePost}
                disabled={!currentUser}
              >
                <span>❤️</span>
                <span>좋아요 {post.likeCount || 0}</span>
              </LikeButton>
              {currentUser && (
                <BookmarkButton
                  bookmarked={bookmarked}
                  onClick={handleBookmark}
                  disabled={bookmarkLoading}
                >
                  <span>{bookmarked ? "🔖" : "📌"}</span>
                  <span>{bookmarked ? "북마크됨" : "북마크"}</span>
                </BookmarkButton>
              )}
              {currentUser && post.authorId !== currentUser.uid && (
                <ReportButton onClick={() => handleReport("post", post.id)}>
                  신고
                </ReportButton>
              )}
            </PostActions>
          </>
        )}
      </PostCard>

      <CommentsSection>
        <CommentsTitle>댓글 ({comments.length})</CommentsTitle>

        <CommentForm onSubmit={handleCommentSubmit}>
          <CommentTextArea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="댓글을 입력하세요..."
            required
          />
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <SubmitButton type="submit" disabled={commentLoading}>
            {commentLoading ? "작성 중..." : "댓글 작성"}
          </SubmitButton>
        </CommentForm>

        <CommentList>
          {comments.length === 0 ? (
            <p
              style={{ color: "#6c757d", textAlign: "center", padding: "2rem" }}
            >
              아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
            </p>
          ) : (
            comments.map((comment) => {
              const isCommentAuthor =
                currentUser && comment.authorId === currentUser.uid;
              const isCommentAdmin =
                userProfile?.isAdmin || userProfile?.role === "admin";
              const canEditComment = isCommentAuthor || isCommentAdmin;

              return (
                <CommentCard key={comment.id}>
                  <CommentHeader>
                    <CommentAuthor>
                      {comment.authorName || "익명"}
                      {comment.authorIsMedicalStaff && <MedicalStaffBadge />}
                    </CommentAuthor>
                    <CommentDate>
                      {formatDateTime(comment.createdAt)}
                      {comment.updatedAt &&
                        comment.updatedAt !== comment.createdAt && (
                          <span style={{ marginLeft: "0.5rem", color: "#999" }}>
                            (수정됨)
                          </span>
                        )}
                    </CommentDate>
                  </CommentHeader>
                  {editingCommentId === comment.id ? (
                    <div>
                      <CommentEditTextArea
                        value={editCommentText}
                        onChange={(e) => setEditCommentText(e.target.value)}
                        placeholder="댓글을 입력하세요..."
                      />
                      <CommentActions>
                        <CommentEditButton
                          onClick={() => handleSaveEditComment(comment.id)}
                          disabled={commentEditLoading}
                        >
                          {commentEditLoading ? "저장 중..." : "저장"}
                        </CommentEditButton>
                        <CommentDeleteButton
                          onClick={handleCancelEditComment}
                          disabled={commentEditLoading}
                        >
                          취소
                        </CommentDeleteButton>
                      </CommentActions>
                    </div>
                  ) : (
                    <>
                      <CommentContent>{comment.content}</CommentContent>
                      <CommentActions>
                        {currentUser && (
                          <ReplyButton onClick={() => handleReply(comment.id)}>
                            답글
                          </ReplyButton>
                        )}
                        {canEditComment && (
                          <>
                            <CommentEditButton
                              onClick={() => handleEditComment(comment)}
                            >
                              수정
                            </CommentEditButton>
                            <CommentDeleteButton
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              삭제
                            </CommentDeleteButton>
                          </>
                        )}
                        {currentUser &&
                          comment.authorId !== currentUser.uid && (
                            <ReportButton
                              onClick={() =>
                                handleReport("comment", comment.id)
                              }
                            >
                              신고
                            </ReportButton>
                          )}
                      </CommentActions>
                      {replyingTo === comment.id && (
                        <ReplyForm
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmitReply(comment.id);
                          }}
                        >
                          <ReplyTextArea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="답글을 입력하세요..."
                            required
                          />
                          <CommentActions>
                            <CommentEditButton
                              type="submit"
                              disabled={replyLoading[comment.id]}
                            >
                              {replyLoading[comment.id]
                                ? "작성 중..."
                                : "답글 작성"}
                            </CommentEditButton>
                            <CommentDeleteButton
                              type="button"
                              onClick={handleCancelReply}
                              disabled={replyLoading[comment.id]}
                            >
                              취소
                            </CommentDeleteButton>
                          </CommentActions>
                        </ReplyForm>
                      )}
                      {replies[comment.id] &&
                        replies[comment.id].length > 0 && (
                          <RepliesList>
                            {replies[comment.id].map((reply) => (
                              <ReplyCard key={reply.id}>
                                <ReplyHeader>
                                  <ReplyAuthor>
                                    {reply.authorName || "익명"}
                                    {reply.authorIsMedicalStaff && (
                                      <MedicalStaffBadge />
                                    )}
                                  </ReplyAuthor>
                                  <ReplyDate>
                                    {formatDateTime(reply.createdAt)}
                                  </ReplyDate>
                                </ReplyHeader>
                                <ReplyContent>{reply.content}</ReplyContent>
                              </ReplyCard>
                            ))}
                          </RepliesList>
                        )}
                    </>
                  )}
                </CommentCard>
              );
            })
          )}
        </CommentList>
      </CommentsSection>

      {showReportModal && (
        <ModalOverlay onClick={handleCloseReportModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              {reportTarget?.type === "post" ? "게시글" : "댓글"} 신고
            </ModalTitle>
            <ModalForm onSubmit={handleSubmitReport}>
              <RadioGroup>
                <RadioLabel>
                  <input
                    type="radio"
                    name="reason"
                    value="spam"
                    checked={reportReason === "spam"}
                    onChange={(e) => setReportReason(e.target.value)}
                  />
                  <span>스팸 또는 광고</span>
                </RadioLabel>
                <RadioLabel>
                  <input
                    type="radio"
                    name="reason"
                    value="inappropriate"
                    checked={reportReason === "inappropriate"}
                    onChange={(e) => setReportReason(e.target.value)}
                  />
                  <span>부적절한 내용</span>
                </RadioLabel>
                <RadioLabel>
                  <input
                    type="radio"
                    name="reason"
                    value="harassment"
                    checked={reportReason === "harassment"}
                    onChange={(e) => setReportReason(e.target.value)}
                  />
                  <span>욕설 또는 괴롭힘</span>
                </RadioLabel>
                <RadioLabel>
                  <input
                    type="radio"
                    name="reason"
                    value="false_info"
                    checked={reportReason === "false_info"}
                    onChange={(e) => setReportReason(e.target.value)}
                  />
                  <span>잘못된 의료 정보</span>
                </RadioLabel>
                <RadioLabel>
                  <input
                    type="radio"
                    name="reason"
                    value="other"
                    checked={reportReason === "other"}
                    onChange={(e) => setReportReason(e.target.value)}
                  />
                  <span>기타</span>
                </RadioLabel>
              </RadioGroup>
              <div>
                <label
                  htmlFor="reportDetail"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 500,
                    color: "#495057",
                  }}
                >
                  상세 사유 (선택사항)
                </label>
                <ModalTextArea
                  id="reportDetail"
                  value={reportDetail}
                  onChange={(e) => setReportDetail(e.target.value)}
                  placeholder="신고 사유를 자세히 설명해주세요..."
                />
              </div>
              {error && <ErrorMessage>{error}</ErrorMessage>}
              {hasReported && (
                <ErrorMessage>
                  이미 신고한 항목입니다. 관리자가 검토 중입니다.
                </ErrorMessage>
              )}
              <ModalButtonGroup>
                <ModalCancelButton
                  type="button"
                  onClick={handleCloseReportModal}
                  disabled={reportLoading}
                >
                  취소
                </ModalCancelButton>
                <ModalSubmitButton type="submit" disabled={reportLoading}>
                  {reportLoading ? "신고 중..." : "신고하기"}
                </ModalSubmitButton>
              </ModalButtonGroup>
            </ModalForm>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}

export default PostDetailPage;
