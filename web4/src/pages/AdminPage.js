// src/pages/AdminPage.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { REPORT_REASONS, REPORT_STATUS_LABELS } from "../utils/constants";
import { formatDateTime } from "../utils/helpers";

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #2a5e8c;
  margin: 0;
`;

const Tabs = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e9ecef;
`;

const Tab = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: transparent;
  border: none;
  border-bottom: 3px solid
    ${(props) => (props.active ? "#2a5e8c" : "transparent")};
  color: ${(props) => (props.active ? "#2a5e8c" : "#6c757d")};
  font-size: 1rem;
  font-weight: ${(props) => (props.active ? "600" : "500")};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    color: #2a5e8c;
  }
`;

const Content = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background-color: #f8f9fa;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #e9ecef;

  &:hover {
    background-color: #f8f9fa;
  }
`;

const TableHeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
`;

const TableCell = styled.td`
  padding: 1rem;
  color: #495057;
  font-size: 0.9rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  margin-right: 0.5rem;
`;

const ViewButton = styled(Button)`
  background-color: #2a5e8c;
  color: white;

  &:hover {
    background-color: #1d4269;
  }
`;

const ResolveButton = styled(Button)`
  background-color: #28a745;
  color: white;

  &:hover {
    background-color: #218838;
  }
`;

const RejectButton = styled(Button)`
  background-color: #ffc107;
  color: #333;

  &:hover {
    background-color: #e0a800;
  }
`;

const DeleteButton = styled(Button)`
  background-color: #dc3545;
  color: white;

  &:hover {
    background-color: #c82333;
  }
`;

const Badge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${(props) => {
    switch (props.status) {
      case "pending":
        return "#fff3cd";
      case "reviewed":
        return "#d1ecf1";
      case "resolved":
        return "#d4edda";
      case "rejected":
        return "#f8d7da";
      default:
        return "#e9ecef";
    }
  }};
  color: ${(props) => {
    switch (props.status) {
      case "pending":
        return "#856404";
      case "reviewed":
        return "#0c5460";
      case "resolved":
        return "#155724";
      case "rejected":
        return "#721c24";
      default:
        return "#495057";
    }
  }};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6c757d;
`;

const Loading = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6c757d;
`;

const ErrorMessage = styled.div`
  background-color: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

function AdminPage() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("reports");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // 관리자 권한 확인
    const isAdmin = userProfile?.isAdmin || userProfile?.role === "admin";
    if (!isAdmin) {
      setError("관리자만 접근할 수 있습니다.");
      setLoading(false);
      return;
    }

    // 신고 목록 로드
    const reportsRef = collection(db, "community_reports");
    const q = query(reportsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reportsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReports(reportsData);
        setLoading(false);
      },
      (error) => {
        console.error("신고 목록 로드 오류:", error);
        setError("신고 목록을 불러오는 중 오류가 발생했습니다.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, navigate, userProfile]);

  const handleViewPost = (postId) => {
    navigate(`/community/post/${postId}`);
  };

  const handleResolveReport = async (
    reportId,
    postId,
    targetType,
    targetId
  ) => {
    if (!window.confirm("이 신고를 처리 완료로 표시하시겠습니까?")) {
      return;
    }

    try {
      const reportRef = doc(db, "community_reports", reportId);
      await updateDoc(reportRef, {
        status: "resolved",
        resolvedAt: serverTimestamp(),
        resolvedBy: currentUser.uid,
      });

      // 게시글/댓글 삭제 (선택사항)
      if (targetType === "post") {
        // 게시글 삭제는 별도 확인 필요
      }
    } catch (error) {
      console.error("신고 처리 오류:", error);
      setError("신고 처리 중 오류가 발생했습니다.");
    }
  };

  const handleRejectReport = async (reportId) => {
    if (!window.confirm("이 신고를 기각하시겠습니까?")) {
      return;
    }

    try {
      const reportRef = doc(db, "community_reports", reportId);
      await updateDoc(reportRef, {
        status: "rejected",
        rejectedAt: serverTimestamp(),
        rejectedBy: currentUser.uid,
      });
    } catch (error) {
      console.error("신고 기각 오류:", error);
      setError("신고 기각 중 오류가 발생했습니다.");
    }
  };

  const handleDeletePost = async (postId) => {
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

      // 관련 신고도 업데이트
      const relatedReports = reports.filter(
        (r) => r.postId === postId && r.status === "pending"
      );
      for (const report of relatedReports) {
        await updateDoc(doc(db, "community_reports", report.id), {
          status: "resolved",
          resolvedAt: serverTimestamp(),
          resolvedBy: currentUser.uid,
        });
      }
    } catch (error) {
      console.error("게시글 삭제 오류:", error);
      setError("게시글 삭제 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <Container>
        <Loading>로딩 중...</Loading>
      </Container>
    );
  }

  const isAdmin = userProfile?.isAdmin || userProfile?.role === "admin";
  if (!isAdmin) {
    return (
      <Container>
        <ErrorMessage>
          관리자만 접근할 수 있습니다. 관리자 이메일을 확인하세요.
        </ErrorMessage>
      </Container>
    );
  }

  const pendingReports = reports.filter((r) => r.status === "pending");
  const allReports = reports;

  const displayReports = activeTab === "pending" ? pendingReports : allReports;

  return (
    <Container>
      <Header>
        <Title>관리자 페이지</Title>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <Tabs>
        <Tab
          active={activeTab === "pending"}
          onClick={() => setActiveTab("pending")}
        >
          대기 중 ({pendingReports.length})
        </Tab>
        <Tab active={activeTab === "all"} onClick={() => setActiveTab("all")}>
          전체 신고 ({allReports.length})
        </Tab>
      </Tabs>

      <Content>
        {displayReports.length === 0 ? (
          <EmptyState>
            <p>
              {activeTab === "pending"
                ? "대기 중인 신고가 없습니다."
                : "신고가 없습니다."}
            </p>
          </EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>신고 유형</TableHeaderCell>
                <TableHeaderCell>대상</TableHeaderCell>
                <TableHeaderCell>신고 사유</TableHeaderCell>
                <TableHeaderCell>신고자</TableHeaderCell>
                <TableHeaderCell>상태</TableHeaderCell>
                <TableHeaderCell>날짜</TableHeaderCell>
                <TableHeaderCell>작업</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <tbody>
              {displayReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    {report.targetType === "post" ? "게시글" : "댓글"}
                  </TableCell>
                  <TableCell>
                    {report.postTitle ? (
                      <span
                        style={{
                          maxWidth: "200px",
                          display: "inline-block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {report.postTitle}
                      </span>
                    ) : (
                      "제목 없음"
                    )}
                  </TableCell>
                  <TableCell>
                    {REPORT_REASONS[report.reason] || report.reason}
                    {report.detail && (
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#6c757d",
                          marginTop: "0.25rem",
                        }}
                      >
                        {report.detail}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{report.reporterName || "익명"}</TableCell>
                  <TableCell>
                    <Badge status={report.status}>
                      {REPORT_STATUS_LABELS[report.status] || report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(report.createdAt)}</TableCell>
                  <TableCell>
                    {report.postId && (
                      <ViewButton onClick={() => handleViewPost(report.postId)}>
                        보기
                      </ViewButton>
                    )}
                    {report.status === "pending" && (
                      <>
                        <ResolveButton
                          onClick={() =>
                            handleResolveReport(
                              report.id,
                              report.postId,
                              report.targetType,
                              report.targetId
                            )
                          }
                        >
                          처리
                        </ResolveButton>
                        <RejectButton
                          onClick={() => handleRejectReport(report.id)}
                        >
                          기각
                        </RejectButton>
                        {report.targetType === "post" && report.postId && (
                          <DeleteButton
                            onClick={() => handleDeletePost(report.postId)}
                          >
                            삭제
                          </DeleteButton>
                        )}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}
      </Content>
    </Container>
  );
}

export default AdminPage;
