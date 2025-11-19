// src/pages/CommunityPage.js
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import MedicalStaffBadge from "../components/MedicalStaffBadge";
import { CATEGORIES, CANCER_TYPES, CATEGORY_LABELS } from "../utils/constants";
import { formatRelativeTime } from "../utils/helpers";
import theme from "../styles/theme";

// 설문 배너 스타일 - 축소 및 톤다운
const SurveyBanner = styled.div`
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #dbeafe 100%);
  border-radius: 8px;
  padding: ${(props) => (props.expanded ? "1.5rem" : "1rem")};
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(2, 132, 199, 0.1);
  border: 1px solid #bae6fd;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: linear-gradient(90deg, #42a5f5 0%, #1976d2 50%, #42a5f5 100%);
    background-size: 200% 100%;
    animation: shimmer 3s ease-in-out infinite;
  }

  &::after {
    content: "";
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 70%
    );
    pointer-events: none;
  }

  @keyframes shimmer {
    0%,
    100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    border-radius: 12px;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 10px;
  }
`;

const SurveyBannerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(props) => (props.expanded ? "1.5rem" : "0")};
  position: relative;
  z-index: 1;
`;

const SurveyBannerTitle = styled.h2`
  font-size: ${(props) => (props.expanded ? "1.125rem" : "0.9375rem")};
  color: #0369a1;
  margin: 0;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  letter-spacing: -0.01em;
  transition: font-size 0.3s ease;

  &::before {
    content: "📋";
    font-size: ${(props) => (props.expanded ? "1.8rem" : "1.3rem")};
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    transition: font-size 0.3s ease;
  }
`;

const SurveyBannerToggle = styled.button`
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  color: #0d47a1;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: rgba(255, 255, 255, 0.5);
    border-color: rgba(255, 255, 255, 0.7);
  }

  &::after {
    content: "${(props) => (props.expanded ? "▲" : "▼")}";
    font-size: 0.7rem;
    transition: transform 0.3s ease;
  }
`;

const SurveyCards = styled.div`
  display: ${(props) => (props.expanded ? "grid" : "none")};
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
  position: relative;
  z-index: 1;
  opacity: ${(props) => (props.expanded ? "1" : "0")};
  max-height: ${(props) => (props.expanded ? "1000px" : "0")};
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-top: 1rem;
  }

  @media (max-width: 480px) {
    gap: 0.75rem;
    margin-top: 0.75rem;
  }
`;

const SurveyCard = styled.button`
  background: white;
  border: 2px solid #90caf9;
  border-radius: 14px;
  padding: 1.5rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, #42a5f5 0%, #1976d2 100%);
    transform: scaleY(0);
    transition: transform 0.3s ease;
    transform-origin: top;
  }

  &:hover {
    border-color: #42a5f5;
    background: linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%);
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 8px 24px rgba(66, 165, 245, 0.25),
      0 4px 12px rgba(66, 165, 245, 0.15);

    &::before {
      transform: scaleY(1);
    }
  }

  &:active {
    transform: translateY(-2px) scale(1.01);
  }
`;

const SurveyIcon = styled.div`
  font-size: 2.5rem;
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 12px;
  border: 2px solid #90caf9;
  transition: all 0.3s ease;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));

  ${SurveyCard}:hover & {
    background: linear-gradient(135deg, #bbdefb 0%, #90caf9 100%);
    border-color: #42a5f5;
    transform: scale(1.1) rotate(5deg);
    box-shadow: 0 4px 12px rgba(66, 165, 245, 0.3);
  }
`;

const SurveyInfo = styled.div`
  flex: 1;
`;

const SurveyCardTitle = styled.h3`
  font-size: 1.1rem;
  color: #0d47a1;
  margin: 0 0 0.75rem 0;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.4;
  transition: color 0.3s ease;

  ${SurveyCard}:hover & {
    color: #1976d2;
  }
`;

const SurveyCardDescription = styled.p`
  font-size: 0.9rem;
  color: #495057;
  margin: 0;
  line-height: 1.6;
  font-weight: 500;
  transition: color 0.3s ease;

  ${SurveyCard}:hover & {
    color: #1976d2;
  }
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  gap: 1.25rem;
  background-color: #f8fafc;
  min-height: calc(100vh - 200px);

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem 1rem;
  }

  @media (max-width: 768px) {
    padding: 1rem 0.75rem;
    gap: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem 0.5rem;
    gap: 0.75rem;
  }
`;

const LeftSidebar = styled.aside`
  width: 160px;
  flex-shrink: 0;
  background-color: transparent;
  position: sticky;
  top: 2rem;
  align-self: flex-start;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;

  @media (max-width: 1024px) {
    width: 100%;
    position: static;
    max-height: none;
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
`;

const SidebarTitle = styled.h3`
  font-size: 0.875rem;
  color: #334155;
  margin: 0 0 0.875rem 0;
  font-weight: 600;
  padding-bottom: 0.625rem;
  border-bottom: 1px solid #e2e8f0;
  letter-spacing: -0.01em;
  font-family: ${theme.typography.fontFamily.korean};
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
  font-weight: ${(props) => (props.active ? "500" : "400")};
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  line-height: 1.5;
  letter-spacing: -0.01em;
  font-family: ${theme.typography.fontFamily.korean};
  margin-bottom: 0.25rem;

  span:first-child {
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    opacity: ${(props) => (props.active ? "1" : "0.6")};
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

const MainContent = styled.main`
  flex: 1;
  min-width: 0;
  background-color: transparent;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 1rem;
`;

// 타이포그래피 시스템: H1 (24px / Bold)
const Title = styled.h1`
  font-size: 1.5rem; // 24px
  color: #0f172a;
  margin: 0;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.3;
  font-family: ${theme.typography.fontFamily.korean};

  @media (max-width: 768px) {
    font-size: 1.25rem; // 20px
  }

  @media (max-width: 480px) {
    font-size: 1.125rem; // 18px
  }
`;

// 커뮤니티 서브타이틀 (정서적 메시지) - Body (14px / Regular)
const CommunitySubtitle = styled.p`
  font-size: 0.875rem; // 14px - Body
  color: #64748b;
  margin: 0.5rem 0 0 0;
  font-weight: 400;
  line-height: 1.5;
  font-family: ${theme.typography.fontFamily.korean};
`;

// Primary Button (가장 중요한 액션)
const WriteButton = styled.button`
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem; // 14px - Body
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
  font-family: ${theme.typography.fontFamily.korean};

  &:hover {
    background: #1d4ed8;
    box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
    transform: translateY(-1px);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2),
      0 4px 8px rgba(37, 99, 235, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 1rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  background-color: white;
  padding: 0.875rem 1rem;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  transition: all 0.15s ease;

  &:focus-within {
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    border-color: #2563eb;
  }

  @media (max-width: 768px) {
    padding: 1rem;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchInputWrapper = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 0.875rem;
  font-size: 0.875rem;
  color: #9ca3af;
  pointer-events: none;
  z-index: 1;
  transition: color 0.15s ease;

  ${SearchInputWrapper}:focus-within & {
    color: #2563eb;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.625rem 1rem 0.625rem 2.5rem;
  font-size: 0.875rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: white;
  transition: all 0.15s ease;
  font-weight: 400;
  color: #111827;
  width: 100%;
  font-family: ${theme.typography.fontFamily.korean};

  &::placeholder {
    color: #adb5bd;
    font-weight: 400;
  }

  &:focus {
    border-color: #42a5f5;
    outline: none;
    box-shadow: 0 0 0 4px rgba(66, 165, 245, 0.15);
    background-color: white;
    border-width: 2px;
  }
`;

const SearchButton = styled.button`
  padding: 0.625rem 1.25rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem; // 14px - Body
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  letter-spacing: -0.01em;
  font-family: ${theme.typography.fontFamily.korean};

  &::before {
    content: "🔍";
    font-size: 0.875rem;
  }

  &:hover {
    background: #1d4ed8;
    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1),
      0 2px 4px rgba(37, 99, 235, 0.3);
  }
`;

const ClearButton = styled.button`
  padding: 0.625rem 0.75rem;
  background-color: #f8f9fa;
  color: #6c757d;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  line-height: 1;

  &:hover {
    background-color: #e9ecef;
    color: #495057;
    border-color: #dee2e6;
    transform: scale(1.1);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(108, 117, 125, 0.2);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const SortBar = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin: 1.25rem 0; // 위/아래 여백 증가
  padding: 0.875rem 0;
  flex-wrap: wrap;
`;

const FilterLabel = styled.span`
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 500;
  margin-right: 0.5rem;
  letter-spacing: -0.01em;
  white-space: nowrap;
  font-family: ${theme.typography.fontFamily.korean};
`;

// Secondary/Ghost Button (정렬 버튼)
const SortButton = styled.button`
  padding: 0.5rem 0.875rem;
  border: 1px solid ${(props) => (props.active ? "#2563eb" : "#e2e8f0")};
  background-color: ${(props) => (props.active ? "#2563eb" : "white")};
  color: ${(props) => (props.active ? "white" : "#475569")};
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8125rem; // 13px - Caption
  font-weight: ${(props) => (props.active ? "500" : "400")};
  transition: all 0.15s ease;
  letter-spacing: -0.01em;
  position: relative;
  overflow: hidden;
  font-family: ${theme.typography.fontFamily.korean};

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover {
    border-color: ${(props) => (props.active ? "#1d4ed8" : "#2563eb")};
    background-color: ${(props) => (props.active ? "#1d4ed8" : "#f9fafb")};
    color: ${(props) => (props.active ? "white" : "#2563eb")};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  &:active {
    transform: translateY(0);
  }
`;

// 테이블 기반 게시글 목록 컨테이너
const PostListContainer = styled.div`
  width: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
`;

// 게시글 테이블
const PostTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  font-family: ${theme.typography.fontFamily.korean};
`;

// 테이블 헤더
const TableHeader = styled.thead`
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
`;

const TableHeaderRow = styled.tr``;

// 타이포그래피: H3 (16px / Semibold) - 테이블 헤더
const TableHeaderCell = styled.th`
  padding: 0.875rem 1.125rem;
  text-align: left;
  font-weight: 600;
  color: #334155;
  font-size: 0.875rem; // 14px - Body (헤더는 조금 작게)
  letter-spacing: -0.01em;
  white-space: nowrap;
  text-transform: none;
  font-family: ${theme.typography.fontFamily.korean};

  &:first-child {
    padding-left: 1.5rem;
    width: 100px;
  }

  &:nth-child(2) {
    min-width: 300px;
  }

  &:nth-child(3) {
    width: 100px;
  }

  &:nth-child(4) {
    width: 140px;
  }

  &:nth-child(5),
  &:nth-child(6),
  &:nth-child(7) {
    width: 70px;
    text-align: center;
    font-weight: 500;
  }

  @media (max-width: 1024px) {
    &:nth-child(4) {
      display: none;
    }
  }

  @media (max-width: 768px) {
    padding: 0.625rem 0.5rem;
    font-size: 0.75rem;

    &:first-child {
      padding-left: 1rem;
      width: 80px;
    }

    &:nth-child(2) {
      min-width: 200px;
    }

    &:nth-child(3) {
      width: 90px;
    }
  }
`;

// 테이블 바디
const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background-color 0.15s ease;
  height: 52px; // 행 높이 증가 (40px → 52px)

  &:hover {
    background-color: #f0f9ff;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 1rem 1.125rem; // 여백 증가
  vertical-align: middle;
  font-size: 0.875rem; // 14px - Body
  color: #1f2937;

  &:first-child {
    padding-left: 1.5rem;
  }

  &:nth-child(3) {
    font-size: 0.75rem;
  }

  &:nth-child(4) {
    font-size: 0.75rem;
  }

  &:nth-child(5),
  &:nth-child(6),
  &:nth-child(7) {
    text-align: center;
    font-size: 0.75rem;
  }

  @media (max-width: 1024px) {
    &:nth-child(4) {
      display: none;
    }
  }

  @media (max-width: 768px) {
    padding: 0.625rem 0.5rem;
    font-size: 0.8125rem;

    &:first-child {
      padding-left: 1rem;
    }
  }
`;

// 카테고리 배지 (테이블용) - 중성톤 + 패스텔
const CategoryBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: ${(props) => props.bgColor || "#f1f5f9"};
  color: ${(props) => props.textColor || "#475569"};
  padding: 0.1875rem 0.5rem;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 500;
  white-space: nowrap;
  border: none;
  line-height: 1.3;
`;

// 제목 링크 - Body (14px / Medium)
const PostTitleLink = styled.div`
  font-weight: 500;
  color: #0f172a;
  transition: color 0.15s ease;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
  font-size: 0.875rem; // 14px - Body
  font-family: ${theme.typography.fontFamily.korean};

  ${TableRow}:hover & {
    color: #2563eb;
    text-decoration: underline;
  }
`;

// 작성자 정보 - Caption (12px / Regular)
const AuthorCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem; // 12px - Caption
  color: #64748b;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: ${theme.typography.fontFamily.korean};
`;

// 날짜 정보 - Caption (12px / Regular)
const DateCell = styled.div`
  font-size: 0.75rem; // 12px - Caption
  color: #94a3b8;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: ${theme.typography.fontFamily.korean};

  @media (max-width: 1024px) {
    display: none;
  }
`;

// 통계 정보 (조회수, 좋아요, 댓글) - Caption (12px / Regular)
const StatCell = styled.div`
  font-size: 0.75rem; // 12px - Caption
  color: ${(props) => {
    if (props.type === "views") return "#64748b";
    if (props.type === "likes") return "#dc2626";
    if (props.type === "comments") return "#2563eb";
    return "#64748b";
  }};
  font-weight: 400;
  font-family: ${theme.typography.fontFamily.korean};
`;

// 앱 설치 섹션 스타일
const AppInstallSection = styled.div`
  text-align: center;
  padding: 0.75rem 0;
`;

const AppInstallText = styled.p`
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0 0 0.875rem 0;
  line-height: 1.5;
  font-family: ${theme.typography.fontFamily.korean};
`;

const AppDownloadButton = styled.button`
  width: 100%;
  padding: 0.625rem 1rem;
  background: #0284c7;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(2, 132, 199, 0.2);
  font-family: ${theme.typography.fontFamily.korean};

  &:hover {
    background: #0369a1;
    box-shadow: 0 2px 4px rgba(2, 132, 199, 0.3);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1),
      0 2px 4px rgba(2, 132, 199, 0.3);
  }
`;

// 지원 센터 찾기 섹션
const SupportCenterSection = styled(SidebarSection)`
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
`;

const SupportCenterText = styled.p`
  font-size: 0.8125rem;
  color: #475569;
  margin: 0 0 0.875rem 0;
  line-height: 1.5;
  text-align: center;
  font-family: ${theme.typography.fontFamily.korean};
`;

const SupportCenterButton = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  background: #0284c7;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 4px rgba(2, 132, 199, 0.2);
  font-family: ${theme.typography.fontFamily.korean};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &::before {
    content: "🏥";
    font-size: 1.125rem;
  }

  &:hover {
    background: #0369a1;
    box-shadow: 0 4px 8px rgba(2, 132, 199, 0.3);
    transform: translateY(-1px);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1),
      0 4px 8px rgba(2, 132, 199, 0.3);
  }
`;

// 지원 센터 모달 스타일 (ModalContent 정의 후에 이동)

const SupportFilterSection = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FilterGroup = styled.div`
  flex: 1;
  min-width: 200px;
`;

const SupportFilterLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.5rem;
  font-family: ${theme.typography.fontFamily.korean};
`;

const FilterSelect = styled.select`
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  background-color: white;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: ${theme.typography.fontFamily.korean};

  &:focus {
    outline: none;
    border-color: #0284c7;
    box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
  }
`;

const SupportCenterList = styled.div`
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const SupportCenterCard = styled.div`
  padding: 1.25rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.15s ease;

  &:hover {
    border-color: #0284c7;
    box-shadow: 0 2px 8px rgba(2, 132, 199, 0.1);
  }
`;

const SupportCenterName = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
  font-family: ${theme.typography.fontFamily.korean};
`;

const SupportCenterInfo = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.6;
  font-family: ${theme.typography.fontFamily.korean};

  p {
    margin: 0.25rem 0;
  }

  strong {
    color: #475569;
    font-weight: 500;
  }
`;

const EmptySupportMessage = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #94a3b8;
  font-size: 0.9375rem;
  font-family: ${theme.typography.fontFamily.korean};
`;

const RightSidebar = styled.aside`
  width: 280px;
  flex-shrink: 0;
  background-color: transparent;

  @media (max-width: 1024px) {
    width: 100%;
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

const NoticeSection = styled(SidebarSection)`
  margin-bottom: 1rem;
`;

const NoticeList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const NoticeItem = styled.li`
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f5f9;

  &:first-child {
    padding-top: 0;
  }

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const NoticeLink = styled.button`
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  color: #64748b;
  font-size: 0.8125rem;
  font-weight: 400;
  cursor: pointer;
  padding: 0.375rem 0;
  transition: all 0.15s ease;
  line-height: 1.5;
  font-family: ${theme.typography.fontFamily.korean};

  &:hover {
    color: #0284c7;
    padding-left: 0.25rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #6c757d;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
`;

const EmptyStateIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.6;
`;

const EmptyStateTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #212121;
  margin: 0 0 1rem 0;
`;

const EmptyStateMessage = styled.p`
  font-size: 1rem;
  color: #616161;
  margin: 0 0 2rem 0;
  line-height: 1.6;
`;

const EmptyStateGuide = styled.div`
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 2rem;
  text-align: left;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
`;

const GuideTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #212121;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: "💡";
    font-size: 1.2rem;
  }
`;

const GuideList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const GuideItem = styled.li`
  font-size: 0.9rem;
  color: #616161;
  margin-bottom: 0.75rem;
  padding-left: 1.5rem;
  position: relative;
  line-height: 1.5;

  &::before {
    content: "•";
    position: absolute;
    left: 0;
    color: #42a5f5;
    font-weight: bold;
    font-size: 1.2rem;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const EmptyStateButton = styled.button`
  background: linear-gradient(135deg, #42a5f5 0%, #1976d2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1.5rem;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);

  &:hover {
    background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const Loading = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6c757d;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
`;

const SearchResults = styled.div`
  margin-bottom: 1.5rem;
  color: #0d47a1;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 10px;
  border-left: 5px solid #1976d2;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.15);
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: "🔍";
    font-size: 1.1rem;
  }
`;

const PageInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 2px solid #e9ecef;
  color: #6c757d;
  font-size: 0.875rem;
  font-weight: 500;
`;

// 공지사항 모달 스타일
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
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  color: #1565c0;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
  border-bottom: 2px solid #e3f2fd;
  padding-bottom: 0.75rem;
`;

const ModalBody = styled.div`
  color: #495057;
  line-height: 1.8;
  font-size: 0.95rem;
`;

const ModalSection = styled.div`
  margin-bottom: 1.5rem;

  h3 {
    color: #1976d2;
    font-size: 1.1rem;
    margin: 0 0 0.75rem 0;
    font-weight: 600;
  }

  ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  li {
    margin-bottom: 0.5rem;
  }

  p {
    margin: 0.5rem 0;
  }
`;

const ModalCloseButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #42a5f5 0%, #1976d2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1.5rem;

  &:hover {
    background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4);
  }
`;

// 지원 센터 모달 스타일
const SupportModalContent = styled(ModalContent)`
  max-width: 800px;
  padding: 2rem;
`;

function CommunityPage() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const { category: categoryParam } = useParams();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [selectedCancerType, setSelectedCancerType] = useState("all");
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [surveyBannerExpanded, setSurveyBannerExpanded] = useState(true);
  const [showSupportCenterModal, setShowSupportCenterModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedSupportCancerType, setSelectedSupportCancerType] =
    useState("all");

  // URL 파라미터에서 카테고리 읽기
  useEffect(() => {
    if (categoryParam) {
      // 유효한 카테고리인지 확인
      const validCategories = [
        "all",
        "free",
        "question",
        "review",
        "info",
        "support",
      ];
      if (validCategories.includes(categoryParam)) {
        // 카테고리 설정 전에 이전 값과 비교하여 실제로 변경되었을 때만 업데이트
        setSelectedCategory((prev) => {
          if (prev !== categoryParam) {
            console.log("카테고리 변경:", prev, "->", categoryParam);
            return categoryParam;
          }
          return prev;
        });
        // 카테고리 변경 시 검색 쿼리와 암 종류 필터 초기화
        setSearchQuery("");
        setSelectedCancerType("all");
        // 카테고리 변경 시 스크롤을 맨 위로 이동
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        // 유효하지 않은 카테고리면 전체글로 리다이렉트
        navigate("/", { replace: true });
      }
    } else {
      // 카테고리 파라미터가 없으면 전체글
      setSelectedCategory("all");
    }
  }, [categoryParam, navigate]);

  const handleSurveyClick = async (surveyType) => {
    const baseUrls = {
      survivor: "https://yechan-00.github.io/patient-servey/web1",
      patient: "https://yechan-00.github.io/patient-servey/web3",
    };

    let surveyUrl = baseUrls[surveyType];

    // 회원인 경우 사용자 정보를 localStorage에 저장
    if (currentUser) {
      try {
        localStorage.setItem("community_userId", currentUser.uid);
        localStorage.setItem("community_userEmail", currentUser.email || "");
        localStorage.setItem(
          "community_userName",
          userProfile?.displayName || currentUser.displayName || ""
        );
        localStorage.setItem("community_surveyType", surveyType);
        localStorage.setItem(
          "community_surveyTimestamp",
          new Date().toISOString()
        );
      } catch (error) {
        console.error("localStorage 저장 오류:", error);
      }
    } else {
      // 비회원인 경우
      try {
        localStorage.setItem("community_guest", "true");
        localStorage.removeItem("community_userId");
      } catch (error) {
        console.error("localStorage 저장 오류:", error);
      }
    }

    window.open(surveyUrl, "_blank");
  };

  useEffect(() => {
    // 게시글 로드 (로그인 없이도 가능)
    const postsRef = collection(db, "community_posts");
    let q;

    if (selectedCategory === "all") {
      q = query(postsRef, orderBy("createdAt", "desc"));
    } else {
      // 카테고리 필터링 - 정확히 일치하는 게시글만 가져오기
      q = query(
        postsRef,
        where("category", "==", selectedCategory),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const postsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 클라이언트 측에서도 한 번 더 카테고리 필터링 (이중 체크)
        const filteredPostsData =
          selectedCategory === "all"
            ? postsData
            : postsData.filter((post) => {
                const matches = post.category === selectedCategory;
                if (!matches && post.category) {
                  console.warn(
                    `카테고리 불일치: 게시글 ID ${post.id}, 게시글 카테고리: ${post.category}, 선택된 카테고리: ${selectedCategory}`
                  );
                }
                return matches;
              });

        console.log(
          `카테고리 "${selectedCategory}" 필터링 결과: ${filteredPostsData.length}개 게시글`
        );

        setPosts(filteredPostsData);
        setLoading(false);
      },
      (error) => {
        console.error("게시글 로드 오류:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, navigate, selectedCategory]);

  // 검색 및 정렬 필터링
  useEffect(() => {
    let filtered = [...posts];

    // 카테고리 필터링 (추가 안전장치)
    if (selectedCategory !== "all") {
      filtered = filtered.filter((post) => post.category === selectedCategory);
    }

    // 암 종류 필터링
    if (selectedCancerType !== "all") {
      filtered = filtered.filter(
        (post) => post.cancerType === selectedCancerType
      );
    }

    // 검색 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (post) =>
          post.title?.toLowerCase().includes(query) ||
          post.content?.toLowerCase().includes(query) ||
          post.authorName?.toLowerCase().includes(query)
      );
    }

    // "내가 쓴 글" 필터는 먼저 적용
    if (sortBy === "myPosts" && currentUser) {
      filtered = filtered.filter((post) => post.authorId === currentUser.uid);
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "popular":
          // 좋아요 수 기준 (같으면 최신순)
          const likeDiff = (b.likeCount || 0) - (a.likeCount || 0);
          if (likeDiff !== 0) return likeDiff;
          const aDate1 = a.createdAt?.toDate
            ? a.createdAt.toDate()
            : new Date(0);
          const bDate1 = b.createdAt?.toDate
            ? b.createdAt.toDate()
            : new Date(0);
          return bDate1 - aDate1;
        case "recommended":
          // 추천순: 좋아요 + 댓글 수 합산 (같으면 최신순)
          const aScore = (a.likeCount || 0) * 2 + (a.commentCount || 0);
          const bScore = (b.likeCount || 0) * 2 + (b.commentCount || 0);
          const scoreDiff = bScore - aScore;
          if (scoreDiff !== 0) return scoreDiff;
          const aDate2 = a.createdAt?.toDate
            ? a.createdAt.toDate()
            : new Date(0);
          const bDate2 = b.createdAt?.toDate
            ? b.createdAt.toDate()
            : new Date(0);
          return bDate2 - aDate2;
        case "comments":
          return (b.commentCount || 0) - (a.commentCount || 0);
        case "views":
          return (b.viewCount || 0) - (a.viewCount || 0);
        case "myPosts":
          // 내가 쓴 글은 최신순 정렬
          const aDate3 = a.createdAt?.toDate
            ? a.createdAt.toDate()
            : new Date(0);
          const bDate3 = b.createdAt?.toDate
            ? b.createdAt.toDate()
            : new Date(0);
          return bDate3 - aDate3;
        case "latest":
        default:
          const aDate = a.createdAt?.toDate
            ? a.createdAt.toDate()
            : new Date(0);
          const bDate = b.createdAt?.toDate
            ? b.createdAt.toDate()
            : new Date(0);
          return bDate - aDate;
      }
    });

    setFilteredPosts(filtered);
  }, [
    posts,
    searchQuery,
    sortBy,
    selectedCategory,
    selectedCancerType,
    currentUser,
  ]);

  const handlePostClick = (postId) => {
    navigate(`/community/post/${postId}`);
  };

  const handleWritePost = () => {
    // 로그인 체크
    if (!currentUser) {
      const currentPath = window.location.pathname + window.location.search;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    navigate("/community/write");
  };

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleSortChange = (sortType) => {
    setSortBy(sortType);
  };

  const handleNoticeClick = (noticeType) => {
    setSelectedNotice(noticeType);
    setShowNoticeModal(true);
  };

  const handleCloseNoticeModal = () => {
    setShowNoticeModal(false);
    setSelectedNotice(null);
  };

  const handleSupportCenterClick = () => {
    setShowSupportCenterModal(true);
  };

  const handleCloseSupportCenterModal = () => {
    setShowSupportCenterModal(false);
    setSelectedRegion("all");
    setSelectedSupportCancerType("all");
  };

  // 지원 센터 데이터 (샘플 - 실제로는 Firebase나 API에서 가져올 수 있음)
  const supportCenters = [
    {
      id: 1,
      name: "서울아산병원 암센터",
      region: "서울",
      cancerTypes: ["all", "breast", "lung"],
      address: "서울특별시 송파구 올림픽로43길 88",
      phone: "02-3010-3114",
      services: ["치료", "상담", "재활"],
    },
    {
      id: 2,
      name: "세브란스병원 암센터",
      region: "서울",
      cancerTypes: ["all", "stomach", "colon"],
      address: "서울특별시 서대문구 연세로 50-1",
      phone: "02-2228-5800",
      services: ["치료", "상담", "지원"],
    },
    {
      id: 3,
      name: "삼성서울병원 암센터",
      region: "서울",
      cancerTypes: ["all", "liver", "pancreas"],
      address: "서울특별시 강남구 일원로 81",
      phone: "02-3410-2114",
      services: ["치료", "상담", "재활"],
    },
    {
      id: 4,
      name: "국립암센터",
      region: "경기",
      cancerTypes: ["all"],
      address: "경기도 고양시 일산동구 일산로 323",
      phone: "031-920-0114",
      services: ["치료", "상담", "연구", "교육"],
    },
    {
      id: 5,
      name: "부산대학교병원 암센터",
      region: "부산",
      cancerTypes: ["all", "breast", "thyroid"],
      address: "부산광역시 남구 용소로 179",
      phone: "051-240-7114",
      services: ["치료", "상담"],
    },
  ];

  // 필터링된 지원 센터 목록
  const filteredSupportCenters = supportCenters.filter((center) => {
    const regionMatch =
      selectedRegion === "all" || center.region === selectedRegion;
    const cancerMatch =
      selectedSupportCancerType === "all" ||
      center.cancerTypes.includes(selectedSupportCancerType) ||
      center.cancerTypes.includes("all");
    return regionMatch && cancerMatch;
  });

  // 지역 목록
  const regions = [
    "all",
    "서울",
    "경기",
    "인천",
    "부산",
    "대구",
    "광주",
    "대전",
    "울산",
  ];

  // 암 종류 목록 (지원 센터용)
  const supportCancerTypes = [
    { value: "all", label: "전체" },
    { value: "breast", label: "유방암" },
    { value: "lung", label: "폐암" },
    { value: "stomach", label: "위암" },
    { value: "colon", label: "대장암" },
    { value: "liver", label: "간암" },
    { value: "pancreas", label: "췌장암" },
    { value: "thyroid", label: "갑상선암" },
  ];

  const noticeContents = {
    community: {
      title: "커뮤니티 이용 안내",
      content: (
        <>
          <ModalSection>
            <h3>환영합니다! 👋</h3>
            <p>
              암 환자와 생존자들이 서로 소통하고 정보를 공유하는 따뜻한
              공간입니다.
            </p>
          </ModalSection>
          <ModalSection>
            <h3>주요 기능</h3>
            <ul>
              <li>
                <strong>자유 게시판:</strong> 자유롭게 이야기를 나눌 수 있습니다
              </li>
              <li>
                <strong>질문 게시판:</strong> 궁금한 점을 질문하고 답변을 받을
                수 있습니다
              </li>
              <li>
                <strong>후기 게시판:</strong> 치료 경험과 후기를 공유할 수
                있습니다
              </li>
            </ul>
          </ModalSection>
          <ModalSection>
            <h3>이용 방법</h3>
            <ul>
              <li>회원가입 후 로그인하여 이용하실 수 있습니다</li>
              <li>글쓰기 버튼을 클릭하여 게시글을 작성할 수 있습니다</li>
              <li>댓글과 좋아요로 다른 회원들과 소통할 수 있습니다</li>
              <li>북마크 기능으로 관심 있는 게시글을 저장할 수 있습니다</li>
            </ul>
          </ModalSection>
          <ModalSection>
            <h3>주의사항</h3>
            <ul>
              <li>
                의료 정보는 참고용이며, 진단 및 치료는 전문의와 상담하시기
                바랍니다
              </li>
              <li>타인을 존중하는 마음으로 소통해주세요</li>
              <li>부적절한 내용은 신고 기능을 이용해주세요</li>
            </ul>
          </ModalSection>
        </>
      ),
    },
    rules: {
      title: "게시판 운영 규칙",
      content: (
        <>
          <ModalSection>
            <h3>기본 원칙</h3>
            <p>
              모든 회원이 편안하고 안전하게 이용할 수 있도록 다음 규칙을
              준수해주세요.
            </p>
          </ModalSection>
          <ModalSection>
            <h3>금지 사항</h3>
            <ul>
              <li>
                <strong>욕설 및 비방:</strong> 타인을 비방하거나 욕설을 사용하는
                행위
              </li>
              <li>
                <strong>스팸 및 광고:</strong> 상업적 광고나 스팸 게시글 작성
              </li>
              <li>
                <strong>허위 정보:</strong> 잘못된 의료 정보나 허위 사실 유포
              </li>
              <li>
                <strong>개인정보 공개:</strong> 본인 또는 타인의 개인정보 공개
              </li>
              <li>
                <strong>저작권 침해:</strong> 타인의 저작물 무단 사용
              </li>
            </ul>
          </ModalSection>
          <ModalSection>
            <h3>게시글 작성 가이드</h3>
            <ul>
              <li>제목은 내용을 잘 나타내도록 작성해주세요</li>
              <li>카테고리를 올바르게 선택해주세요</li>
              <li>의료 정보를 공유할 때는 출처를 명시해주세요</li>
              <li>개인적인 경험은 개인 경험임을 명시해주세요</li>
            </ul>
          </ModalSection>
          <ModalSection>
            <h3>댓글 작성 가이드</h3>
            <ul>
              <li>건설적이고 격려하는 댓글을 작성해주세요</li>
              <li>의료 조언은 전문의와 상담하도록 안내해주세요</li>
              <li>토론은 존중하는 자세로 진행해주세요</li>
            </ul>
          </ModalSection>
          <ModalSection>
            <h3>제재 조치</h3>
            <p>
              규칙을 위반한 경우 경고, 게시글 삭제, 일시적 이용 제한, 영구 이용
              제한 등의 조치가 취해질 수 있습니다.
            </p>
          </ModalSection>
        </>
      ),
    },
    medical: {
      title: "의료 종사자 인증 안내",
      content: (
        <>
          <ModalSection>
            <h3>의료 종사자 인증이란? 🏥</h3>
            <p>
              의사, 간호사, 상담사 등 의료 관련 종사자분들을 인증하여 파란색
              체크 표시로 표시하는 기능입니다.
            </p>
          </ModalSection>
          <ModalSection>
            <h3>인증 대상</h3>
            <ul>
              <li>의사 (전문의, 일반의)</li>
              <li>간호사 (간호사, 간호조무사)</li>
              <li>상담사 (심리상담사, 사회복지사 등)</li>
              <li>기타 의료 관련 자격증을 보유한 전문가</li>
            </ul>
          </ModalSection>
          <ModalSection>
            <h3>인증 방법</h3>
            <ol>
              <li>프로필 페이지에서 "의료 종사자 인증" 메뉴를 선택합니다</li>
              <li>자격증 사진 또는 증명서를 업로드합니다</li>
              <li>관리자 검토 후 인증이 완료됩니다</li>
              <li>인증 완료 시 닉네임 옆에 파란색 체크 표시가 나타납니다</li>
            </ol>
          </ModalSection>
          <ModalSection>
            <h3>인증 혜택</h3>
            <ul>
              <li>커뮤니티에서 전문가로서 인정받을 수 있습니다</li>
              <li>의료 정보 제공 시 신뢰도가 높아집니다</li>
              <li>다른 회원들이 전문가의 의견을 쉽게 구분할 수 있습니다</li>
            </ul>
          </ModalSection>
          <ModalSection>
            <h3>주의사항</h3>
            <ul>
              <li>인증은 관리자가 검토 후 승인합니다</li>
              <li>허위 인증 시도는 영구 이용 제한 조치가 취해질 수 있습니다</li>
              <li>
                의료 종사자 인증은 의료 행위를 의미하지 않으며, 온라인 상담은
                진단 및 처방을 대체할 수 없습니다
              </li>
            </ul>
          </ModalSection>
        </>
      ),
    },
    report: {
      title: "신고 기능 안내",
      content: (
        <>
          <ModalSection>
            <h3>신고 기능이란? 🚨</h3>
            <p>
              부적절한 게시글이나 댓글을 발견했을 때 관리자에게 신고할 수 있는
              기능입니다.
            </p>
          </ModalSection>
          <ModalSection>
            <h3>신고 가능한 사유</h3>
            <ul>
              <li>
                <strong>스팸 또는 광고:</strong> 상업적 광고나 스팸 게시글
              </li>
              <li>
                <strong>부적절한 내용:</strong> 성적이거나 폭력적인 내용
              </li>
              <li>
                <strong>욕설 또는 괴롭힘:</strong> 타인을 비방하거나 괴롭히는
                내용
              </li>
              <li>
                <strong>잘못된 의료 정보:</strong> 위험할 수 있는 잘못된 의료
                정보
              </li>
              <li>
                <strong>기타:</strong> 기타 커뮤니티 규칙 위반 사항
              </li>
            </ul>
          </ModalSection>
          <ModalSection>
            <h3>신고 방법</h3>
            <ol>
              <li>
                신고하고 싶은 게시글 또는 댓글에서 "신고" 버튼을 클릭합니다
              </li>
              <li>신고 사유를 선택합니다</li>
              <li>필요한 경우 상세 사유를 입력합니다</li>
              <li>"신고하기" 버튼을 클릭하여 신고를 완료합니다</li>
            </ol>
          </ModalSection>
          <ModalSection>
            <h3>신고 처리 과정</h3>
            <ul>
              <li>신고 접수 후 관리자가 검토합니다</li>
              <li>
                검토 결과에 따라 게시글/댓글 삭제, 경고, 이용 제한 등의 조치가
                취해집니다
              </li>
              <li>신고자에게는 처리 결과가 알림으로 전달됩니다</li>
            </ul>
          </ModalSection>
          <ModalSection>
            <h3>주의사항</h3>
            <ul>
              <li>같은 게시글/댓글은 한 번만 신고할 수 있습니다</li>
              <li>악의적인 신고는 제재 대상이 될 수 있습니다</li>
              <li>
                신고 내용은 익명으로 처리되며, 신고자 정보는 관리자만 확인할 수
                있습니다
              </li>
            </ul>
          </ModalSection>
        </>
      ),
    },
  };

  if (loading) {
    return (
      <Container>
        <MainContent>
          <Loading>로딩 중...</Loading>
        </MainContent>
      </Container>
    );
  }

  return (
    <Container>
      <LeftSidebar>
        <SidebarSection>
          <SidebarTitle>커뮤니티</SidebarTitle>
          <CategoryList>
            <CategoryItem>
              <CategoryLink
                active={selectedCategory === "all"}
                onClick={() => navigate("/")}
              >
                <span>{theme.categoryIcons.all}</span>
                <span>전체글</span>
              </CategoryLink>
            </CategoryItem>
            {CATEGORIES.filter((c) => c.id !== "all").map((category) => (
              <CategoryItem key={category.id}>
                <CategoryLink
                  active={selectedCategory === category.id}
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
            {CANCER_TYPES.map((type) => (
              <CategoryItem key={type.id}>
                <CategoryLink
                  active={selectedCancerType === type.id}
                  onClick={() => setSelectedCancerType(type.id)}
                >
                  {type.name}
                </CategoryLink>
              </CategoryItem>
            ))}
          </CategoryList>
        </SidebarSection>
      </LeftSidebar>

      <MainContent>
        <SurveyBanner expanded={surveyBannerExpanded}>
          <SurveyBannerHeader expanded={surveyBannerExpanded}>
            <SurveyBannerTitle expanded={surveyBannerExpanded}>
              설문 참여
            </SurveyBannerTitle>
            <SurveyBannerToggle
              expanded={surveyBannerExpanded}
              onClick={() => setSurveyBannerExpanded(!surveyBannerExpanded)}
              title={surveyBannerExpanded ? "접기" : "펼치기"}
            >
              {surveyBannerExpanded ? "접기" : "펼치기"}
            </SurveyBannerToggle>
          </SurveyBannerHeader>
          <SurveyCards expanded={surveyBannerExpanded}>
            <SurveyCard onClick={() => handleSurveyClick("survivor")}>
              <SurveyIcon>📋</SurveyIcon>
              <SurveyInfo>
                <SurveyCardTitle>암 생존자를 위한 건강관리</SurveyCardTitle>
                <SurveyCardDescription>
                  치료를 완료한 암 생존자분들의 건강 상태와 삶의 질을 파악하기
                  위한 설문입니다
                </SurveyCardDescription>
              </SurveyInfo>
            </SurveyCard>
            <SurveyCard onClick={() => handleSurveyClick("patient")}>
              <SurveyIcon>🏥</SurveyIcon>
              <SurveyInfo>
                <SurveyCardTitle>암 환자의 사회적 욕구</SurveyCardTitle>
                <SurveyCardDescription>
                  현재 암 치료를 받고 계신 환자분들의 증상, 치료 경험, 일상생활
                  등 전반적인 사회적 욕구를 조사하는 설문입니다
                </SurveyCardDescription>
              </SurveyInfo>
            </SurveyCard>
          </SurveyCards>
        </SurveyBanner>

        <Header>
          <div>
            <Title>
              {selectedCategory === "all"
                ? "전체글"
                : CATEGORY_LABELS[selectedCategory] || selectedCategory}
            </Title>
            {selectedCategory === "all" && (
              <CommunitySubtitle>
                여기는 암 환자와 보호자들이 함께 경험을 나누고 서로를 응원하는
                공간입니다
              </CommunitySubtitle>
            )}
          </div>
          <WriteButton onClick={handleWritePost}>글쓰기</WriteButton>
        </Header>

        <SearchContainer>
          <form
            onSubmit={handleSearch}
            style={{ flex: 1, display: "flex", gap: "0.5rem" }}
          >
            <SearchInputWrapper>
              <SearchIcon>🔍</SearchIcon>
              <SearchInput
                type="text"
                placeholder="제목, 내용, 작성자로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </SearchInputWrapper>
            {searchQuery && (
              <ClearButton type="button" onClick={handleClearSearch}>
                ✕
              </ClearButton>
            )}
            <SearchButton type="submit">검색</SearchButton>
          </form>
        </SearchContainer>

        <SortBar>
          <FilterLabel>정렬:</FilterLabel>
          <SortButton
            active={sortBy === "latest"}
            onClick={() => handleSortChange("latest")}
          >
            최신순
          </SortButton>
          <SortButton
            active={sortBy === "popular"}
            onClick={() => handleSortChange("popular")}
          >
            인기순
          </SortButton>
          <SortButton
            active={sortBy === "comments"}
            onClick={() => handleSortChange("comments")}
          >
            댓글순
          </SortButton>
          <SortButton
            active={sortBy === "views"}
            onClick={() => handleSortChange("views")}
          >
            조회순
          </SortButton>
          <SortButton
            active={sortBy === "recommended"}
            onClick={() => handleSortChange("recommended")}
          >
            추천순
          </SortButton>
          {currentUser && (
            <SortButton
              active={sortBy === "myPosts"}
              onClick={() => handleSortChange("myPosts")}
            >
              내가 쓴 글
            </SortButton>
          )}
        </SortBar>

        {searchQuery && (
          <SearchResults>검색 결과: {filteredPosts.length}개</SearchResults>
        )}

        {filteredPosts.length === 0 ? (
          <EmptyState>
            {searchQuery ? (
              <>
                <EmptyStateIcon>🔍</EmptyStateIcon>
                <EmptyStateTitle>검색 결과가 없습니다</EmptyStateTitle>
                <EmptyStateMessage>
                  다른 검색어로 시도해보시거나, 필터 조건을 변경해보세요.
                </EmptyStateMessage>
                <EmptyStateButton onClick={handleClearSearch}>
                  검색 초기화
                </EmptyStateButton>
              </>
            ) : (
              <>
                <EmptyStateIcon>📝</EmptyStateIcon>
                <EmptyStateTitle>
                  {selectedCategory === "all"
                    ? "아직 게시글이 없습니다"
                    : `${
                        CATEGORY_LABELS[selectedCategory] || selectedCategory
                      }에 게시글이 없습니다`}
                </EmptyStateTitle>
                <EmptyStateMessage>
                  {selectedCategory === "all"
                    ? "커뮤니티의 첫 번째 게시글을 작성해보세요!"
                    : "이 게시판의 첫 번째 게시글을 작성해보세요!"}
                </EmptyStateMessage>
                <EmptyStateGuide>
                  <GuideTitle>시작하기 가이드</GuideTitle>
                  <GuideList>
                    <GuideItem>
                      "글쓰기" 버튼을 클릭하여 게시글을 작성할 수 있습니다
                    </GuideItem>
                    <GuideItem>
                      카테고리를 선택하여 적절한 게시판에 글을 작성하세요
                    </GuideItem>
                    <GuideItem>
                      다른 회원들과 소통하며 정보를 공유해보세요
                    </GuideItem>
                    <GuideItem>
                      의료 종사자 인증을 받으면 전문가 배지가 표시됩니다
                    </GuideItem>
                  </GuideList>
                </EmptyStateGuide>
                <EmptyStateButton onClick={handleWritePost}>
                  첫 게시글 작성하기
                </EmptyStateButton>
              </>
            )}
          </EmptyState>
        ) : (
          <>
            <PostListContainer>
              <PostTable>
                <TableHeader>
                  <TableHeaderRow>
                    <TableHeaderCell>카테고리</TableHeaderCell>
                    <TableHeaderCell>제목</TableHeaderCell>
                    <TableHeaderCell>작성자</TableHeaderCell>
                    <TableHeaderCell>날짜</TableHeaderCell>
                    <TableHeaderCell>조회</TableHeaderCell>
                    <TableHeaderCell>좋아요</TableHeaderCell>
                    <TableHeaderCell>댓글</TableHeaderCell>
                  </TableHeaderRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => {
                    const categoryColors =
                      theme.categoryColors[post.category] ||
                      theme.categoryColors.all;
                    const categoryIcon =
                      theme.categoryIcons[post.category] ||
                      theme.categoryIcons.all;

                    return (
                      <TableRow
                        key={post.id}
                        onClick={() => handlePostClick(post.id)}
                      >
                        <TableCell>
                          <CategoryBadge
                            bgColor={categoryColors.bg}
                            textColor={categoryColors.text}
                            borderColor={categoryColors.border}
                          >
                            <span>{categoryIcon}</span>
                            <span>
                              {CATEGORY_LABELS[post.category] || post.category}
                            </span>
                          </CategoryBadge>
                        </TableCell>
                        <TableCell>
                          <PostTitleLink>{post.title}</PostTitleLink>
                        </TableCell>
                        <TableCell>
                          <AuthorCell>
                            {post.authorName || "익명"}
                            {post.authorIsMedicalStaff && <MedicalStaffBadge />}
                          </AuthorCell>
                        </TableCell>
                        <TableCell>
                          <DateCell>
                            {formatRelativeTime(post.createdAt)}
                          </DateCell>
                        </TableCell>
                        <TableCell>
                          <StatCell type="views">
                            {post.viewCount || 0}
                          </StatCell>
                        </TableCell>
                        <TableCell>
                          <StatCell type="likes">
                            {post.likeCount || 0}
                          </StatCell>
                        </TableCell>
                        <TableCell>
                          <StatCell type="comments">
                            {post.commentCount || 0}
                          </StatCell>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </PostTable>
            </PostListContainer>
            <PageInfo>
              <span>전체 {filteredPosts.length}개</span>
              <span>1 페이지</span>
            </PageInfo>
          </>
        )}
      </MainContent>

      <RightSidebar>
        <NoticeSection>
          <SidebarTitle>공지사항</SidebarTitle>
          <NoticeList>
            <NoticeItem>
              <NoticeLink onClick={() => handleNoticeClick("community")}>
                커뮤니티 이용 안내
              </NoticeLink>
            </NoticeItem>
            <NoticeItem>
              <NoticeLink onClick={() => handleNoticeClick("rules")}>
                게시판 운영 규칙
              </NoticeLink>
            </NoticeItem>
            <NoticeItem>
              <NoticeLink onClick={() => handleNoticeClick("medical")}>
                의료 종사자 인증 안내
              </NoticeLink>
            </NoticeItem>
            <NoticeItem>
              <NoticeLink onClick={() => handleNoticeClick("report")}>
                신고 기능 안내
              </NoticeLink>
            </NoticeItem>
          </NoticeList>
        </NoticeSection>

        <SupportCenterSection>
          <SidebarTitle>지원 센터 찾기</SidebarTitle>
          <SupportCenterText>
            지역별 암 전문 병원 및
            <br />
            지원 센터 정보를 확인하세요
          </SupportCenterText>
          <SupportCenterButton onClick={handleSupportCenterClick}>
            센터 찾기
          </SupportCenterButton>
        </SupportCenterSection>

        <SidebarSection>
          <SidebarTitle>앱 설치</SidebarTitle>
          <AppInstallSection>
            <AppInstallText>
              앱을 설치하고
              <br />
              알림을 받아보세요!
            </AppInstallText>
            <AppDownloadButton>앱 다운로드</AppDownloadButton>
          </AppInstallSection>
        </SidebarSection>
      </RightSidebar>

      {showNoticeModal && selectedNotice && noticeContents[selectedNotice] && (
        <ModalOverlay onClick={handleCloseNoticeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{noticeContents[selectedNotice].title}</ModalTitle>
            <ModalBody>{noticeContents[selectedNotice].content}</ModalBody>
            <ModalCloseButton onClick={handleCloseNoticeModal}>
              확인
            </ModalCloseButton>
          </ModalContent>
        </ModalOverlay>
      )}

      {showSupportCenterModal && (
        <ModalOverlay onClick={handleCloseSupportCenterModal}>
          <SupportModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>🏥 지원 센터 찾기</ModalTitle>
            <ModalBody>
              <SupportFilterSection>
                <FilterGroup>
                  <SupportFilterLabel>지역 선택</SupportFilterLabel>
                  <FilterSelect
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                  >
                    <option value="all">전체 지역</option>
                    {regions
                      .filter((r) => r !== "all")
                      .map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                  </FilterSelect>
                </FilterGroup>
                <FilterGroup>
                  <SupportFilterLabel>암 종류</SupportFilterLabel>
                  <FilterSelect
                    value={selectedSupportCancerType}
                    onChange={(e) =>
                      setSelectedSupportCancerType(e.target.value)
                    }
                  >
                    {supportCancerTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </FilterSelect>
                </FilterGroup>
              </SupportFilterSection>

              <SupportCenterList>
                {filteredSupportCenters.length > 0 ? (
                  filteredSupportCenters.map((center) => (
                    <SupportCenterCard key={center.id}>
                      <SupportCenterName>{center.name}</SupportCenterName>
                      <SupportCenterInfo>
                        <p>
                          <strong>📍 지역:</strong> {center.region}
                        </p>
                        <p>
                          <strong>📞 전화:</strong> {center.phone}
                        </p>
                        <p>
                          <strong>📍 주소:</strong> {center.address}
                        </p>
                        <p>
                          <strong>💼 제공 서비스:</strong>{" "}
                          {center.services.join(", ")}
                        </p>
                      </SupportCenterInfo>
                    </SupportCenterCard>
                  ))
                ) : (
                  <EmptySupportMessage>
                    선택하신 조건에 맞는 지원 센터가 없습니다.
                    <br />
                    다른 조건으로 검색해보세요.
                  </EmptySupportMessage>
                )}
              </SupportCenterList>
            </ModalBody>
            <ModalCloseButton onClick={handleCloseSupportCenterModal}>
              닫기
            </ModalCloseButton>
          </SupportModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}

export default CommunityPage;
