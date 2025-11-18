// src/pages/BookmarksPage.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import MedicalStaffBadge from "../components/MedicalStaffBadge";
import { CATEGORY_LABELS } from "../utils/constants";
import { formatDate } from "../utils/helpers";

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

const PostList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PostCard = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
`;

const PostHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const PostTitle = styled.h3`
  font-size: 1.25rem;
  color: #333;
  margin: 0;
  flex: 1;
`;

const PostMeta = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6c757d;
  flex-wrap: wrap;
`;

const PostContent = styled.p`
  color: #495057;
  margin: 0.75rem 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const PostFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
`;

const CategoryBadge = styled.span`
  background-color: #e7f3ff;
  color: #2a5e8c;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
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

function BookmarksPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const loadBookmarks = async () => {
      try {
        setLoading(true);
        const userRef = doc(db, "community_users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setBookmarkedPosts([]);
          setLoading(false);
          return;
        }

        const bookmarks = userSnap.data().bookmarks || [];

        if (bookmarks.length === 0) {
          setBookmarkedPosts([]);
          setLoading(false);
          return;
        }

        // 북마크된 게시글들 가져오기
        const posts = [];

        for (const postId of bookmarks) {
          try {
            const postDoc = await getDoc(doc(db, "community_posts", postId));
            if (postDoc.exists()) {
              posts.push({ id: postDoc.id, ...postDoc.data() });
            }
          } catch (error) {
            console.error(`게시글 ${postId} 로드 오류:`, error);
          }
        }

        // 최신순으로 정렬
        posts.sort((a, b) => {
          const aDate = a.createdAt?.toDate?.() || new Date(0);
          const bDate = b.createdAt?.toDate?.() || new Date(0);
          return bDate - aDate;
        });

        setBookmarkedPosts(posts);
      } catch (error) {
        console.error("북마크 로드 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, [currentUser, navigate]);

  const handlePostClick = (postId) => {
    navigate(`/community/post/${postId}`);
  };

  if (loading) {
    return (
      <Container>
        <Loading>로딩 중...</Loading>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>북마크</Title>
      </Header>

      {bookmarkedPosts.length === 0 ? (
        <EmptyState>
          <p>북마크한 게시글이 없습니다.</p>
          <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
            관심 있는 게시글을 북마크하여 나중에 쉽게 찾아보세요.
          </p>
        </EmptyState>
      ) : (
        <PostList>
          {bookmarkedPosts.map((post) => (
            <PostCard key={post.id} onClick={() => handlePostClick(post.id)}>
              <PostHeader>
                <PostTitle>{post.title}</PostTitle>
                <CategoryBadge>
                  {CATEGORY_LABELS[post.category] || post.category}
                </CategoryBadge>
              </PostHeader>
              <PostContent>{post.content}</PostContent>
              <PostFooter>
                <PostMeta>
                  <span>
                    작성자: {post.authorName || "익명"}
                    {post.authorIsMedicalStaff && <MedicalStaffBadge />}
                  </span>
                  <span>{formatDate(post.createdAt)}</span>
                </PostMeta>
                <PostMeta>
                  <span>조회 {post.viewCount || 0}</span>
                  <span>좋아요 {post.likeCount || 0}</span>
                  <span>댓글 {post.commentCount || 0}</span>
                </PostMeta>
              </PostFooter>
            </PostCard>
          ))}
        </PostList>
      )}
    </Container>
  );
}

export default BookmarksPage;
