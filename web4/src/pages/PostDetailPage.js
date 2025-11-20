// src/pages/PostDetailPage.js
import React, { useState, useEffect, useRef } from "react";
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
  deleteDoc,
  serverTimestamp,
  where,
  getDocs,
  increment,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import MedicalStaffBadge from "../components/MedicalStaffBadge";
import { CATEGORY_LABELS, CATEGORIES, CANCER_TYPES } from "../utils/constants";
import { formatDateTime, getDisplayName } from "../utils/helpers";
import { createNotification } from "../utils/notificationService";
import theme from "../styles/theme";

// 암 환자 커뮤니티 전용 디자인 시스템
// 색상 팔레트: Calm Blue + Soft Mint
const COLORS = {
  primary: "#3A74B8",
  primaryLight: "#4D8BD4",
  secondary: "#A7E3D2",
  background: "#F7FAFC",
  backgroundAlt: "#F4F6F9",
  textPrimary: "#1F2D3D",
  textBody: "#3A4A5A",
  textSecondary: "#6B7A8A",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
};

// Spacing Scale (8px 기준)
const SPACING = {
  xs: "0.5rem", // 8px
  sm: "0.75rem", // 12px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  xxl: "2.5rem", // 40px
  xxxl: "3rem", // 48px
};

// 전체 레이아웃: 좌우 사이드바 + 메인 콘텐츠 (넓게, 카드 제거)
const Container = styled.div`
  width: 100%;
  max-width: 1400px; // 1280px → 1400px로 확대
  margin: 0 auto;
  padding: 32px 40px 80px;
  background-color: ${COLORS.background};
  display: grid;
  grid-template-columns: 180px 1fr 260px; // 왼쪽 200px → 180px로 축소
  gap: 32px;
  align-items: start;

  @media (max-width: 1400px) {
    grid-template-columns: 180px 1fr 240px;
    gap: 24px;
    max-width: 1200px;
  }

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    padding: 24px 32px 60px;
    max-width: 100%;
  }

  @media (max-width: 768px) {
    padding: 16px ${SPACING.md} 40px;
  }
`;

// 좌측 사이드바: 커뮤니티 카테고리 (폭 축소)
const LeftSidebar = styled.aside`
  width: 180px; // 200px → 180px로 축소
  position: sticky;
  top: 24px;
  align-self: flex-start;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;

  @media (max-width: 1400px) {
    width: 160px; // 더 작게
  }

  @media (max-width: 1200px) {
    display: none;
  }

  /* 스크롤바 스타일링 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 3px;

    &:hover {
      background: #a0aec0;
    }
  }
`;

// 메인 콘텐츠 영역
const MainContent = styled.div`
  width: 100%;
  min-width: 0;
`;

// 우측 사이드바
const RightSidebar = styled.aside`
  width: 280px;
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: ${SPACING.md};

  @media (max-width: 1400px) {
    width: 260px;
  }

  @media (max-width: 1200px) {
    display: none;
  }
`;

// 사이드바 섹션
const SidebarSection = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.875rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
  transition: all 0.15s ease;

  &:last-child {
    margin-bottom: 0;
  }

  // 섹션 간 간격 (두 번째 섹션부터)
  & + & {
    margin-top: 24px;
  }
`;

const SidebarTitle = styled.h3`
  font-size: 0.875rem;
  color: #334155;
  margin: 0 0 0.875rem 0;
  font-weight: 600;
  padding-bottom: 0.625rem;
  border-bottom: 1px solid #e2e8f0;
  letter-spacing: -0.01em;
`;

const CategoryList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const CategoryItem = styled.li`
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const CategoryLink = styled.button`
  width: 100%;
  text-align: left;
  padding: 0.5rem 0.75rem;
  background-color: ${(props) => (props.active ? "#f0f9ff" : "transparent")};
  color: ${(props) => (props.active ? "#0284c7" : "#64748b")};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: ${(props) => (props.active ? "600" : "400")};
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  line-height: 1.5;
  position: relative;

  // 선택된 메뉴에 왼쪽 인디케이터 바
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: ${(props) => (props.active ? "3px" : "0")};
    height: ${(props) => (props.active ? "60%" : "0")};
    background-color: #0284c7;
    border-radius: 0 2px 2px 0;
    transition: all 0.15s ease;
  }

  span:first-child {
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    opacity: ${(props) => (props.active ? "1" : "0.6")};
    color: ${(props) => (props.active ? "#0284c7" : "inherit")};
  }

  &:hover {
    background-color: ${(props) => (props.active ? "#e0f2fe" : "#f8fafc")};
    color: ${(props) => (props.active ? "#0369a1" : "#0284c7")};

    span:first-child {
      opacity: 1;
    }
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.1);
  }
`;

// 뒤로가기 버튼: 전체 카드 밖, 좌측 사이드바 위
const BackButton = styled.button`
  background-color: transparent;
  color: ${COLORS.primary};
  border: none;
  padding: 0;
  margin: 0 0 ${SPACING.md} 0;
  cursor: pointer;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: all 0.2s ease;
  grid-column: 1 / -1; // 전체 그리드 영역에 걸치도록
  width: fit-content;

  &:hover {
    color: ${COLORS.primaryLight};
    text-decoration: underline;
  }
`;

// 메인 콘텐츠 영역: 카드 제거, 플랫하게 (링커리어 스타일)
const PostCard = styled.div`
  background-color: white;
  border-radius: 0; // 20px → 0 (카드 제거)
  padding: 0; // 40px → 0
  box-shadow: none; // 그림자 제거
  margin-top: 0;
  margin-bottom: 0;
  border: none; // 테두리 제거
  border-bottom: 1px solid #e2e8f0; // 아래 회색 1px 라인만

  @media (max-width: 768px) {
    padding: 0;
    border-bottom: 1px solid #e2e8f0;
  }
`;

// 헤더: 제목 중심 구조 (플랫하게)
const PostHeader = styled.div`
  margin-bottom: ${SPACING.lg};
  padding: ${SPACING.xl} 0; // 상하 패딩만
`;

// 메타 정보 행: 작고 옅게 (시각 우선순위 낮춤)
const PostMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px; // 16px → 12px
  font-size: 12px; // 13px → 12px
  color: #9ca3af; // #6b7280 → #9ca3af (더 옅게)
  margin-bottom: ${SPACING.lg};
  flex-wrap: wrap;
`;

// 메타 구분자
const MetaDivider = styled.span`
  color: #d1d5db;
  font-size: 13px;
`;

// 제목: H1 - 강력한 타이포그라피 (시각 우선순위 강화)
const PostTitle = styled.h1`
  font-size: 2rem; // 28px → 32px로 증가
  color: ${COLORS.textPrimary};
  margin: 0 0 16px 0; // 아래 16px
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: 1.75rem; // 28px
  }
`;

// 메타 정보 아이템: 작고 얇은 텍스트
const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #9ca3af; // #6b7280 → #9ca3af (더 옅게)
  font-size: 12px; // 13px → 12px
  font-weight: 400;

  // 작성자명도 옅게
  strong {
    font-weight: 400; // 500 → 400
    color: #6b7280; // #475569 → #6b7280 (옅게)
  }
`;

// 카테고리 배지: 아주 가볍게 (시각 우선순위 낮춤)
const CategoryBadge = styled.span`
  background: ${(props) =>
    props.bgColor ? props.bgColor : theme.categoryColors.all.bg};
  color: ${(props) => props.textColor || theme.categoryColors.all.text};
  padding: 3px 8px; // 4px → 3px
  border-radius: 4px; // 6px → 4px
  font-size: 0.6875rem; // 11px
  font-weight: 500; // 600 → 500 (가볍게)
  display: inline-block;
  white-space: nowrap;
  flex-shrink: 0;
  box-shadow: none; // 그림자 제거
  border: 1px solid
    ${(props) => props.borderColor || theme.categoryColors.all.border};
  opacity: 0.8; // 약간 투명하게
`;

// 본문: 널찍하게 (플랫하게) - 좌우 패딩 추가
const PostContent = styled.div`
  color: #111827;
  line-height: 1.7;
  white-space: pre-wrap;
  margin-top: 0;
  margin-bottom: ${SPACING.xl};
  padding: ${SPACING.xl} ${SPACING.xxl}; /* 상하 32px, 좌우 40px (24-32px 요구사항 반영) */
  font-size: 16px; // 15px → 16px
  max-width: 100%;
  word-break: break-word;
  font-weight: 400;

  // 단락 간 간격
  p {
    margin: 0 0 20px 0; // 16px → 20px
  }

  p:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    font-size: 15px;
    line-height: 1.7;
  }
`;

// 액션 영역: 플랫하게
const PostActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-start;
  padding: ${SPACING.lg} 0; // 상하 패딩만
  border-top: 1px solid #e2e8f0; // 얇은 구분선
  margin-top: 0;
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

// EditButton과 DeleteButton은 드롭다운 메뉴로 대체됨

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

// 좋아요 버튼 - 가벼운 디자인
// 좋아요 버튼: 작고 깔끔하게
const LikeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${(props) => (props.liked ? "#FFB3BA" : COLORS.border)};
  background-color: ${(props) => (props.liked ? "#FFF0F1" : "transparent")};
  color: ${(props) => (props.liked ? "#E63946" : "#6b7280")};

  span:first-child {
    font-size: 14px;
    transition: transform 0.2s ease;
  }

  // 숫자는 작고 회색으로
  span:last-child {
    font-size: 12px;
    color: #9ca3af;
    font-weight: 400;
  }

  &:hover {
    border-color: ${(props) => (props.liked ? "#FFB3BA" : COLORS.border)};
    background-color: ${(props) =>
      props.liked ? "#FFF0F1" : COLORS.borderLight};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// 북마크 버튼: 작고 깔끔하게
const BookmarkButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${(props) => (props.bookmarked ? "#FFD89B" : COLORS.border)};
  background-color: ${(props) =>
    props.bookmarked ? "#FFF8E7" : "transparent"};
  color: ${(props) => (props.bookmarked ? "#F59E0B" : "#6b7280")};

  span:first-child {
    font-size: 14px;
    transition: transform 0.2s ease;
  }

  &:hover {
    border-color: ${(props) => (props.bookmarked ? "#FFD89B" : COLORS.border)};
    background-color: ${(props) =>
      props.bookmarked ? "#FFF8E7" : COLORS.borderLight};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// 댓글 섹션: 카드 제거, 플랫하게
const CommentsSection = styled.div`
  background-color: transparent; // white → transparent
  border-radius: 0; // 20px → 0
  padding: ${SPACING.xl} 0; // 40px → 상하 패딩만
  box-shadow: none; // 그림자 제거
  border: none; // 테두리 제거
  margin-top: ${SPACING.xl};

  @media (max-width: 768px) {
    padding: ${SPACING.lg} 0;
    margin-top: ${SPACING.lg};
  }
`;

// 댓글 제목: 간격 축소 (구분 줄이기)
const CommentsTitle = styled.h2`
  font-size: 1.25rem; // 20px
  color: ${COLORS.textPrimary};
  margin: 0 0 ${SPACING.sm} 0; // md → sm으로 줄이기
  font-weight: 600;
  padding-bottom: ${SPACING.xs}; // sm → xs로 줄이기
  border-bottom: 1px solid ${COLORS.borderLight};
`;

// 댓글 입력 폼: 작게 + 자동확장
const CommentForm = styled.form`
  margin-bottom: ${SPACING.lg};
  padding: 0; // 패딩 제거
  background-color: transparent; // 배경 제거
  border-radius: 0; // 둥글게 제거
  border: none; // 테두리 제거
  display: flex;
  flex-direction: column;
  gap: ${SPACING.sm};
`;

const CommentFormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${SPACING.xs};
  margin-top: ${SPACING.xs};
`;

// 댓글 입력창: 작게 + 자동확장
const CommentTextArea = styled.textarea`
  width: 100%;
  padding: ${SPACING.sm} ${SPACING.md};
  font-size: 0.9375rem; // 15px
  border: 1px solid #e2e8f0;
  border-radius: 4px; // 8px → 4px
  min-height: 50px; // 80px → 50px (기본 작게)
  max-height: 200px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s ease;
  background-color: white;
  color: ${COLORS.textBody};
  line-height: 1.5;

  &:focus {
    border-color: ${COLORS.primary};
    outline: none;
    box-shadow: 0 0 0 2px rgba(58, 116, 184, 0.08);
  }

  &::placeholder {
    color: ${COLORS.textSecondary};
    font-size: 0.9375rem;
  }
`;

// 빈 댓글 메시지: 따뜻한 톤
const EmptyCommentMessage = styled.div`
  text-align: center;
  padding: ${SPACING.xxxl} ${SPACING.xl};
  color: ${COLORS.textSecondary};
  background: linear-gradient(135deg, ${COLORS.backgroundAlt} 0%, white 100%);
  border-radius: 12px;
  border: 2px dashed ${COLORS.border};

  p {
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.7;
  }

  p:first-child {
    font-size: 1.125rem; // 18px
    font-weight: 600;
    color: ${COLORS.textPrimary};
    margin-bottom: ${SPACING.xs};
  }

  p:last-child {
    color: ${COLORS.textSecondary};
    font-weight: 400;
  }
`;

// 제출 버튼: 링커리어 스타일 - 작고 컴팩트
const SubmitButton = styled(Button)`
  background-color: ${COLORS.primary};
  color: white;
  border-radius: 6px;
  padding: ${SPACING.xs} ${SPACING.md}; // 더 작은 패딩
  font-weight: 500;
  font-size: 0.875rem; // 14px
  transition: all 0.2s ease;
  min-width: 80px;

  &:hover {
    background-color: ${COLORS.primaryLight};
    box-shadow: 0 2px 6px rgba(58, 116, 184, 0.2);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background-color: ${COLORS.textSecondary};
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const CommentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

// 댓글 카드: 플랫하게 (카드 느낌 제거)
const CommentCard = styled.div`
  padding: ${SPACING.md} 0; // 좌우 패딩 제거
  background-color: transparent; // 배경 제거
  border-radius: 0; // 둥글게 제거
  border-left: none; // 왼쪽 테두리 제거
  border-bottom: 1px solid #f1f5f9; // 아래 얇은 구분선만
  margin-bottom: ${SPACING.md};
  padding-bottom: ${SPACING.md};
  transition: all 0.2s ease;

  &:hover {
    background-color: transparent;
  }

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

// 암 환자 커뮤니티 정체성 배너: 위로 이동, 가볍게
const CommunityBanner = styled.div`
  background: linear-gradient(
    135deg,
    ${COLORS.secondary}08 0%,
    ${COLORS.primary}05 100%
  ); // 더 옅게
  border-left: 3px solid ${COLORS.primary}; // 4px → 3px
  border-radius: 6px; // 12px → 6px
  padding: ${SPACING.sm} ${SPACING.md};
  margin-bottom: ${SPACING.lg}; // PostCard와 간격
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    padding: ${SPACING.xs} ${SPACING.sm};
    font-size: 0.75rem;
  }
`;

// 배너 아이콘: 원형 배경 (한 줄용으로 작게)
const BannerIcon = styled.div`
  width: 24px; // 32px → 24px로 줄이기
  height: 24px; // 32px → 24px로 줄이기
  border-radius: 50%;
  background: rgba(58, 116, 184, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1rem; // 1.25rem → 1rem로 줄이기
`;

// 배너 내용: 한 줄로 표현
const BannerContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 4px;
`;

// 배너 제목: 한 줄로 표현
const BannerTitle = styled.div`
  font-size: 0.75rem; // 12px
  font-weight: 600;
  color: ${COLORS.primary};
  margin-bottom: 0; // 제거
  letter-spacing: -0.01em;
  display: inline; // 인라인으로 변경
  margin-right: 8px; // 텍스트와 간격
`;

// 배너 본문: 마침표 기준 두 줄로 표현
const BannerText = styled.p`
  margin: 0;
  font-size: 0.8125rem; // 0.9375rem → 0.8125rem (13px)
  color: ${COLORS.textBody};
  line-height: 1.4; // 1.5 → 1.4로 줄여서 두 줄이 더 컴팩트하게
  font-weight: 400;
`;

// 답글 카드: depth 구조 지원
const ReplyCard = styled.div`
  padding: ${SPACING.md};
  background-color: white;
  border-radius: 10px;
  border-left: 3px solid ${COLORS.secondary};
  margin-left: ${SPACING.xl}; // 32px 들여쓰기
  margin-top: ${SPACING.sm};
  box-shadow: 0 1px 4px rgba(58, 116, 184, 0.05);
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

// 댓글 헤더: 작성자와 날짜를 양쪽에 배치
const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

// 댓글 작성자: bold
const CommentAuthor = styled.span`
  font-weight: 600;
  color: ${COLORS.primary};
  font-size: 14px;
`;

// 댓글 날짜: 오른쪽 상단, 작고 회색
const CommentDate = styled.span`
  font-size: 12px;
  color: #9ca3af;
  font-weight: 400;
`;

// 댓글 본문: 작은 회색
const CommentContent = styled.p`
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
  font-size: 14px;
  font-weight: 400;
`;

// 댓글 액션: 오른쪽 정렬
const CommentActions = styled.div`
  display: flex;
  gap: ${SPACING.xs};
  margin-top: ${SPACING.sm};
  justify-content: flex-end;
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

// 드롭다운 메뉴 스타일
const PostMenuButton = styled.button`
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  font-size: 1.25rem;
  color: #64748b;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background-color: #f8fafc;
    border-color: #cbd5e1;
    color: #475569;
  }
`;

const PostMenuDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 120px;
  z-index: 100;
  overflow: hidden;
`;

const PostMenuItem = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  background: transparent;
  border: none;
  font-size: 0.875rem;
  color: ${(props) => (props.danger ? "#dc2626" : "#475569")};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: ${(props) => (props.danger ? "#fef2f2" : "#f8fafc")};
  }

  &:first-child {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }

  &:last-child {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
  }
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
  const [editingReplyId, setEditingReplyId] = useState(null); // { commentId: replyId }
  const [editReplyText, setEditReplyText] = useState("");
  const [replyEditLoading, setReplyEditLoading] = useState(false);
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
  const [showPostMenu, setShowPostMenu] = useState(false);
  const menuButtonRef = useRef(null);
  const menuDropdownRef = useRef(null);

  useEffect(() => {
    // 게시글 로드 (로그인 없이도 가능)
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
  }, [postId, currentUser]);

  // 드롭다운 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuDropdownRef.current &&
        !menuDropdownRef.current.contains(event.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setShowPostMenu(false);
      }
    };

    if (showPostMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPostMenu]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    // 로그인 체크
    if (!currentUser) {
      const currentPath = `/community/post/${postId}`;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

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
    // 로그인 체크
    if (!currentUser) {
      const currentPath = `/community/post/${postId}`;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    setReplyingTo(commentId);
    setReplyText("");
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText("");
  };

  const handleSubmitReply = async (commentId) => {
    // 로그인 체크
    if (!currentUser) {
      const currentPath = `/community/post/${postId}`;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (!replyText.trim()) {
      return setError("답글을 입력해주세요.");
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

      // 답글 목록 즉시 업데이트 (onSnapshot이 자동 업데이트하지만 즉시 반영을 위해)
      try {
        const updatedRepliesRef = collection(
          db,
          "community_posts",
          postId,
          "comments",
          commentId,
          "replies"
        );
        const updatedRepliesQuery = query(
          updatedRepliesRef,
          orderBy("createdAt", "asc")
        );
        const updatedRepliesSnapshot = await getDocs(updatedRepliesQuery);
        const updatedRepliesData = updatedRepliesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReplies({ ...replies, [commentId]: updatedRepliesData });
      } catch (updateError) {
        console.error("답글 목록 업데이트 오류:", updateError);
        // 에러가 나도 답글 작성은 성공했으므로 계속 진행
      }
    } catch (error) {
      console.error("답글 작성 오류:", error);
      setError("답글 작성 중 오류가 발생했습니다.");
    } finally {
      setReplyLoading({ ...replyLoading, [commentId]: false });
    }
  };

  // 답글 수정/삭제 핸들러
  const handleEditReply = (commentId, reply) => {
    setEditingReplyId({ commentId, replyId: reply.id });
    setEditReplyText(reply.content);
  };

  const handleCancelEditReply = () => {
    setEditingReplyId(null);
    setEditReplyText("");
  };

  const handleSaveEditReply = async (commentId, replyId) => {
    if (!editReplyText.trim()) {
      return setError("답글을 입력해주세요.");
    }

    try {
      setError("");
      setReplyEditLoading(true);

      const replyRef = doc(
        db,
        "community_posts",
        postId,
        "comments",
        commentId,
        "replies",
        replyId
      );
      await updateDoc(replyRef, {
        content: editReplyText.trim(),
        updatedAt: serverTimestamp(),
      });

      setEditingReplyId(null);
      setEditReplyText("");
    } catch (error) {
      console.error("답글 수정 오류:", error);
      setError("답글 수정 중 오류가 발생했습니다.");
    } finally {
      setReplyEditLoading(false);
    }
  };

  const handleDeleteReply = async (commentId, replyId) => {
    if (!window.confirm("정말 이 답글을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const replyRef = doc(
        db,
        "community_posts",
        postId,
        "comments",
        commentId,
        "replies",
        replyId
      );

      // 답글 삭제
      await deleteDoc(replyRef);

      // 댓글 수 업데이트 (답글 삭제 시 댓글 수 감소)
      const postRef = doc(db, "community_posts", postId);
      await updateDoc(postRef, {
        commentCount: increment(-1),
        updatedAt: serverTimestamp(),
      });

      // 답글 목록 즉시 업데이트
      const updatedRepliesRef = collection(
        db,
        "community_posts",
        postId,
        "comments",
        commentId,
        "replies"
      );
      const updatedRepliesQuery = query(
        updatedRepliesRef,
        orderBy("createdAt", "asc")
      );
      const updatedRepliesSnapshot = await getDocs(updatedRepliesQuery);
      const updatedRepliesData = updatedRepliesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReplies({ ...replies, [commentId]: updatedRepliesData });
    } catch (error) {
      console.error("답글 삭제 오류:", error);
      setError("답글 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleBookmark = async () => {
    if (!currentUser) {
      const currentPath = `/community/post/${postId}`;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
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
      const currentPath = `/community/post/${postId}`;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
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

      <LeftSidebar>
        <SidebarSection>
          <SidebarTitle>커뮤니티</SidebarTitle>
          <CategoryList>
            <CategoryItem>
              <CategoryLink active={false} onClick={() => navigate("/")}>
                <span>{theme.categoryIcons.all}</span>
                <span>전체글</span>
              </CategoryLink>
            </CategoryItem>
            {CATEGORIES.filter((c) => c.id !== "all").map((category) => (
              <CategoryItem key={category.id}>
                <CategoryLink
                  active={post?.category === category.id}
                  onClick={() => navigate(`/community/${category.id}`)}
                >
                  <span>{theme.categoryIcons[category.id] || "📋"}</span>
                  <span>{category.name}</span>
                </CategoryLink>
              </CategoryItem>
            ))}
          </CategoryList>
        </SidebarSection>

        <SidebarSection>
          <SidebarTitle>암 종류별</SidebarTitle>
          <CategoryList>
            {CANCER_TYPES.slice(0, 8).map((type) => (
              <CategoryItem key={type.id}>
                <CategoryLink
                  active={false}
                  onClick={() => {
                    // 암 종류별 필터링 (추후 구현)
                    navigate(`/?cancerType=${type.id}`);
                  }}
                >
                  {type.name}
                </CategoryLink>
              </CategoryItem>
            ))}
          </CategoryList>
        </SidebarSection>
      </LeftSidebar>

      <MainContent>
        {/* 커뮤니티 안내 배너: 위로 이동 */}
        <CommunityBanner>
          <BannerIcon>💙</BannerIcon>
          <BannerContent>
            <BannerTitle>커뮤니티 안내</BannerTitle>
            <BannerText>
              여기는 암 환자와 생존자들이 함께 경험을 나누고 서로를 응원하는
              따뜻한 공간입니다.
              <br />
              여러분의 이야기가 누군가에게 희망이 됩니다.
            </BannerText>
          </BannerContent>
        </CommunityBanner>

        <PostCard>
          <PostHeader>
            {isEditing ? (
              <EditForm onSubmit={handleSaveEdit}>
                <EditSelect
                  value={editFormData.category}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      category: e.target.value,
                    })
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
                    setEditFormData({
                      ...editFormData,
                      content: e.target.value,
                    })
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
                {/* 1. 제목이 먼저 (주인공) */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "8px",
                  }}
                >
                  <PostTitle>{post.title}</PostTitle>
                  {canEdit && (
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <PostMenuButton
                        onClick={() => setShowPostMenu(!showPostMenu)}
                        ref={menuButtonRef}
                      >
                        ⋯
                      </PostMenuButton>
                      {showPostMenu && (
                        <PostMenuDropdown ref={menuDropdownRef}>
                          <PostMenuItem
                            onClick={() => {
                              handleEditPost();
                              setShowPostMenu(false);
                            }}
                          >
                            수정
                          </PostMenuItem>
                          <PostMenuItem
                            danger
                            onClick={() => {
                              handleDeletePost();
                              setShowPostMenu(false);
                            }}
                          >
                            삭제
                          </PostMenuItem>
                        </PostMenuDropdown>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. 메타 정보 행: 카테고리 + 작성자 + 날짜 + 조회수 */}
                <PostMetaRow>
                  <CategoryBadge
                    bgColor={
                      theme.categoryColors[post.category]?.bg ||
                      theme.categoryColors.all.bg
                    }
                    textColor={
                      theme.categoryColors[post.category]?.text ||
                      theme.categoryColors.all.text
                    }
                    borderColor={
                      theme.categoryColors[post.category]?.border ||
                      theme.categoryColors.all.border
                    }
                  >
                    {CATEGORY_LABELS[post.category] || post.category}
                  </CategoryBadge>
                  <MetaDivider>|</MetaDivider>
                  <MetaItem>
                    ✍ <strong>{post.authorName || "익명"}</strong>
                    {post.authorIsMedicalStaff && <MedicalStaffBadge />}
                  </MetaItem>
                  <MetaDivider>·</MetaDivider>
                  <MetaItem>🕒 {formatDateTime(post.createdAt)}</MetaItem>
                  {post.viewCount !== undefined && (
                    <>
                      <MetaDivider>·</MetaDivider>
                      <MetaItem>👁 조회 {post.viewCount || 0}</MetaItem>
                    </>
                  )}
                </PostMetaRow>
              </>
            )}
          </PostHeader>

          {!isEditing && (
            <>
              {/* 본문 */}
              <PostContent>{post.content}</PostContent>

              {/* 5. 액션 버튼들 */}
              <PostActions>
                <LikeButton
                  liked={
                    currentUser &&
                    (post.likedBy || []).includes(currentUser.uid)
                  }
                  onClick={handleLikePost}
                  disabled={!currentUser}
                >
                  <span>❤️</span>
                  <span>좋아요</span>
                  {post.likeCount > 0 && <span>{post.likeCount}</span>}
                  {!currentUser && (
                    <span
                      style={{
                        color: "#9ca3af",
                        fontSize: "11px",
                        marginLeft: "4px",
                      }}
                    >
                      (로그인 필요)
                    </span>
                  )}
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
              placeholder="댓글을 입력하세요"
              required
            />
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <CommentFormActions>
              <SubmitButton type="submit" disabled={commentLoading}>
                {commentLoading ? "등록 중..." : "등록"}
              </SubmitButton>
            </CommentFormActions>
          </CommentForm>

          <CommentList>
            {comments.length === 0 ? (
              <EmptyCommentMessage>
                <p>아직 댓글이 없어요</p>
                <p>첫 댓글의 주인공이 되어보세요! 💬</p>
              </EmptyCommentMessage>
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
                            <span
                              style={{
                                marginLeft: "4px",
                                color: "#9ca3af",
                                fontSize: "11px",
                              }}
                            >
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
                            <ReplyButton
                              onClick={() => handleReply(comment.id)}
                            >
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
                              {replies[comment.id].map((reply) => {
                                const isReplyAuthor =
                                  currentUser &&
                                  reply.authorId === currentUser.uid;
                                const isEditingReply =
                                  editingReplyId?.commentId === comment.id &&
                                  editingReplyId?.replyId === reply.id;

                                return (
                                  <ReplyCard key={reply.id}>
                                    {isEditingReply ? (
                                      <div>
                                        <ReplyTextArea
                                          value={editReplyText}
                                          onChange={(e) =>
                                            setEditReplyText(e.target.value)
                                          }
                                          placeholder="답글을 입력하세요..."
                                        />
                                        <CommentActions>
                                          <CommentEditButton
                                            onClick={() =>
                                              handleSaveEditReply(
                                                comment.id,
                                                reply.id
                                              )
                                            }
                                            disabled={replyEditLoading}
                                          >
                                            {replyEditLoading
                                              ? "저장 중..."
                                              : "저장"}
                                          </CommentEditButton>
                                          <CommentDeleteButton
                                            type="button"
                                            onClick={handleCancelEditReply}
                                            disabled={replyEditLoading}
                                          >
                                            취소
                                          </CommentDeleteButton>
                                        </CommentActions>
                                      </div>
                                    ) : (
                                      <>
                                        <ReplyHeader>
                                          <ReplyAuthor>
                                            {reply.authorName || "익명"}
                                            {reply.authorIsMedicalStaff && (
                                              <MedicalStaffBadge />
                                            )}
                                          </ReplyAuthor>
                                          <ReplyDate>
                                            {formatDateTime(reply.createdAt)}
                                            {reply.updatedAt &&
                                              reply.updatedAt !==
                                                reply.createdAt && (
                                                <span
                                                  style={{
                                                    marginLeft: "4px",
                                                    color: "#9ca3af",
                                                    fontSize: "11px",
                                                  }}
                                                >
                                                  (수정됨)
                                                </span>
                                              )}
                                          </ReplyDate>
                                        </ReplyHeader>
                                        <ReplyContent>
                                          {reply.content}
                                        </ReplyContent>
                                        {isReplyAuthor && (
                                          <CommentActions>
                                            <CommentEditButton
                                              onClick={() =>
                                                handleEditReply(
                                                  comment.id,
                                                  reply
                                                )
                                              }
                                            >
                                              수정
                                            </CommentEditButton>
                                            <CommentDeleteButton
                                              onClick={() =>
                                                handleDeleteReply(
                                                  comment.id,
                                                  reply.id
                                                )
                                              }
                                            >
                                              삭제
                                            </CommentDeleteButton>
                                          </CommentActions>
                                        )}
                                      </>
                                    )}
                                  </ReplyCard>
                                );
                              })}
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
      </MainContent>

      <RightSidebar>
        {/* 지원 센터 찾기 */}
        <SidebarSection>
          <SidebarTitle>지원 센터 찾기</SidebarTitle>
          <div style={{ marginBottom: "0.875rem" }}>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "#475569",
                margin: "0 0 0.5rem 0",
                lineHeight: "1.5",
              }}
            >
              현재 위치 기준 가까운 암 전문 병원/심리 상담 센터를 찾아드려요.
            </p>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                margin: "0",
                lineHeight: "1.5",
              }}
            >
              국가 암 상담 전화, 경제적 지원 기관 정보까지 한 번에 확인
            </p>
          </div>
          <button
            onClick={() => {
              // 지원 센터 모달 열기 (CommunityPage의 기능 참고)
              alert(
                "지원 센터 찾기 기능은 커뮤니티 페이지에서 이용하실 수 있습니다."
              );
            }}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              background: "#0284c7",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            🏥 센터 찾기
          </button>
        </SidebarSection>

        {/* 앱 설치 */}
        <SidebarSection>
          <SidebarTitle>앱 설치</SidebarTitle>
          <div style={{ marginBottom: "0.875rem" }}>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "#475569",
                margin: "0 0 0.5rem 0",
                lineHeight: "1.5",
              }}
            >
              정기검진·복약 알림을 놓치지 마세요.
            </p>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                margin: "0",
                lineHeight: "1.5",
              }}
            >
              새로운 답글, 응원 댓글이 달리면 바로 알림
            </p>
          </div>
          <button
            style={{
              width: "100%",
              padding: "0.625rem 1rem",
              background: "#0284c7",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.8125rem",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            앱 다운로드
          </button>
        </SidebarSection>
      </RightSidebar>

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
