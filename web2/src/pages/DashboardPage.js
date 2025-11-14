// src/pages/DashboardPage.js
import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import styled from "styled-components";
import Layout from "../components/Layout";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
// import { setPatientArchived } from "../utils/FirebaseUtils"; // 사용되지 않음
import { deletePatientWithCascade } from "../utils/cascadeDelete";
// 통합 기능 (선택적 사용)
import {
  subscribeIntegratedPatients,
  getIntegratedCounselingRequests,
  calculateIntegratedStats,
  SURVEY_TYPES,
} from "../utils/IntegratedFirebaseUtils";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// 페이지 구역
const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

// 섹션 제목
const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSize.heading3};
  color: ${({ theme }) => theme.colors.primary.dark};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: center;

  svg {
    margin-right: ${({ theme }) => theme.spacing.sm};
  }
`;

// 스태틱스틱 카드 그리드
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

// 스태틱스틱 카드
const StatCard = styled.div`
  background-color: ${({ theme }) => theme.colors.neutral.white};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  transition: transform ${({ theme }) => theme.animation.normal} ease,
    box-shadow ${({ theme }) => theme.animation.normal} ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: ${({ theme }) => theme.shadows.large};
  }
`;

// 카드 아이콘
const CardIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.borderRadius.round};
  background-color: ${({ theme, $bgColor }) =>
    $bgColor || theme.colors.primary.light};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};

  svg {
    color: ${({ theme, $iconColor }) =>
      $iconColor || theme.colors.primary.main};
    font-size: 24px;
  }
`;

// 카드 제목
const CardTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.neutral.darkGrey};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

// 카드 값
const CardValue = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xxl};
  font-weight: 700;
  color: ${({ theme, color }) => color || theme.colors.primary.dark};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

// 추가 정보
const CardInfo = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme, $isPositive }) =>
    $isPositive
      ? theme.colors.functional.success
      : $isPositive === false
      ? theme.colors.functional.error
      : theme.colors.neutral.grey};
  display: flex;
  align-items: center;

  svg {
    margin-right: ${({ theme }) => theme.spacing.xs};
  }
`;

// 2열 레이아웃
const TwoColumnLayout = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`;

// 환자 테이블 카드
const TableCard = styled.div`
  background-color: ${({ theme }) => theme.colors.neutral.white};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  overflow: visible;
  position: relative;
  z-index: 2;
`;

// 카드 헤더
const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral.lightGrey};
`;

// 카드 콘텐츠
const CardContent = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  overflow-x: auto; /* 표가 넓어질 때 가로 스크롤 허용 */
  min-width: 0; /* flex 컨텍스트에서 내용 축소 허용 */
  position: relative;
  z-index: 3;
`;

// 필터 바
const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

// 필터 그룹
const FilterGroup = styled.div`
  display: flex;
  align-items: center;
`;

// 필터 라벨
const FilterLabel = styled.label`
  margin-right: ${({ theme }) => theme.spacing.xs};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral.darkGrey};
  font-size: ${({ theme }) => theme.fontSize.sm};
`;

// 필터 선택
const FilterSelect = styled.select`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border: 1px solid ${({ theme }) => theme.colors.neutral.lightGrey};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background-color: ${({ theme }) => theme.colors.neutral.white};
  font-size: ${({ theme }) => theme.fontSize.sm};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary.main};
    outline: none;
    box-shadow: ${({ theme }) => theme.shadows.focused};
  }
`;

// 검색 입력
const SearchInput = styled.input`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border: 1px solid ${({ theme }) => theme.colors.neutral.lightGrey};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  width: 250px;
  font-size: ${({ theme }) => theme.fontSize.sm};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary.main};
    outline: none;
    box-shadow: ${({ theme }) => theme.shadows.focused};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 100%;
    margin-left: 0;
  }
`;

// 환자 테이블
const PatientTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  thead th:nth-child(1),
  tbody td:nth-child(1) {
    width: 3rem;
  } /* 선택 */
  thead th:nth-child(2),
  tbody td:nth-child(2) {
    width: 7rem;
  } /* 이름 */
  thead th:nth-child(3),
  tbody td:nth-child(3) {
    width: 7.5rem;
  } /* 생년월일 */
  thead th:nth-child(4),
  tbody td:nth-child(4) {
    width: 6.5rem;
  } /* 암 종류 */
  thead th:nth-child(5),
  tbody td:nth-child(5) {
    width: 7.5rem;
  } /* 진단 시기 */
  thead th:nth-child(6),
  tbody td:nth-child(6) {
    width: 5.5rem;
  } /* 위험도 */
  thead th:nth-child(7),
  tbody td:nth-child(7) {
    width: 6rem;
  } /* 상담 요청 */
  thead th:nth-child(8),
  tbody td:nth-child(8) {
    width: 6rem;
  } /* 상담 상태 */
  thead th:nth-child(9),
  tbody td:nth-child(9) {
    width: 5.5rem;
  } /* 보관 */

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    thead th:nth-child(2),
    tbody td:nth-child(2) {
      width: 6.5rem;
    }
  }
`;

// 테이블 헤더
const TableHeader = styled.thead`
  background-color: ${({ theme }) => theme.colors.neutral.lighterGrey};
`;

// 헤더 셀
const HeaderCell = styled.th`
  text-align: left;
  padding: ${({ theme }) => theme.spacing.sm};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.neutral.darkGrey};
  font-size: ${({ theme }) => theme.fontSize.sm};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// 테이블 바디
const TableBody = styled.tbody``;

// 테이블 행
const TableRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral.lightGrey};
  transition: background-color ${({ theme }) => theme.animation.normal} ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.neutral.lighterGrey};
  }
`;

// 테이블 셀
const TableCell = styled.td`
  padding: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.neutral.text};
  font-size: ${({ theme }) => theme.fontSize.sm};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: keep-all;
`;

// 링크 스타일
const StyledLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary.main};
  text-decoration: none;
  font-weight: 500;
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    text-decoration: underline;
    color: ${({ theme }) => theme.colors.primary.dark};
  }
`;

// 배지
const Badge = styled.span`
  display: inline-block;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.round};
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: 700;
  background-color: ${({ theme, $variant }) => {
    if ($variant === "high") return theme.colors.functional.error;
    if ($variant === "medium") return theme.colors.functional.warning;
    return theme.colors.functional.success;
  }};
  color: white;
`;

// 차트 카드
const ChartCard = styled.div`
  background-color: ${({ theme }) => theme.colors.neutral.white};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  padding: ${({ theme }) => theme.spacing.lg};
  height: 100%;
`;

// 차트 컨테이너
const ChartContainer = styled.div`
  height: 250px;
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

// 최근 활동 카드
const ActivityCard = styled.div`
  background-color: ${({ theme }) => theme.colors.neutral.white};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  overflow: hidden;
`;

// 활동 목록
const ActivityList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

// 활동 아이템
const ActivityItem = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral.lightGrey};
  display: flex;
  align-items: flex-start;

  &:last-child {
    border-bottom: none;
  }
`;

// 활동 아이콘
const ActivityIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.borderRadius.round};
  background-color: ${({ theme, type }) => {
    if (type === "request") return theme.colors.primary.light;
    if (type === "completed") return theme.colors.functional.success + "20";
    return theme.colors.neutral.lightGrey;
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: ${({ theme }) => theme.spacing.md};

  svg {
    color: ${({ theme, type }) => {
      if (type === "request") return theme.colors.primary.main;
      if (type === "completed") return theme.colors.functional.success;
      return theme.colors.neutral.darkGrey;
    }};
  }
`;

// 활동 내용
const ActivityContent = styled.div`
  flex: 1;
`;

// 활동 제목
const ActivityTitle = styled.div`
  font-weight: 500;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.neutral.black};
`;

// 활동 메타 정보
const ActivityMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.colors.neutral.grey};
`;

// 상담 상태 정규화 (백엔드 원시 상태 → UI 3단계)
const toUiStatus = (raw) => {
  switch ((raw || "").trim()) {
    case "pending":
    case "요청":
    case "대기":
    case "대기중":
    case "대기 중":
      return "요청";
    case "accepted":
    case "진행":
    case "진행중":
      return "진행중";
    case "completed":
    case "완료":
      return "완료";
    default:
      // 취소/미정 등은 다시 요청 가능 상태로 본다
      return "요청";
  }
};
// UI 라벨 → 저장용(현재는 동일 라벨 저장)
const fromUiStatus = (ui) => {
  const s = (ui || "").trim();
  if (s === "진행중") return "진행중";
  if (s === "완료") return "완료";
  return "요청";
};

// UI 라벨 → counselingRequests.raw 상태 값으로 변환
const uiToRawRequestStatus = (ui) => {
  const s = (ui || "요청").trim();
  if (s === "진행중") return "accepted"; // 진행중
  if (s === "완료") return "completed"; // 완료
  return "pending"; // 요청
};

// 생년월일과 날짜 문자열을 연-월-일(YYYY-MM-DD)로 포맷
const formatBirthDate = (birthDate) => {
  if (!birthDate) return "정보 없음";

  // 문자열 처리
  if (typeof birthDate === "string") {
    // 8자리 숫자 -> YYYY-MM-DD
    if (/^\d{8}$/.test(birthDate)) {
      const y = birthDate.slice(0, 4);
      const m = birthDate.slice(4, 6);
      const d = birthDate.slice(6, 8);
      return `${y}-${m}-${d}`;
    }
    // YYYY-MM 형식이면 YYYY-MM-01로 변환 (일자는 기본값 01)
    if (/^\d{4}-\d{2}$/.test(birthDate.trim())) {
      return `${birthDate.trim()}-01`;
    }
    // 이미 YYYY-MM-DD 형식이면 그대로 반환
    if (/^\d{4}-\d{2}-\d{2}$/.test(birthDate.trim())) {
      return birthDate.trim();
    }
    // 다른 하이픈 포함 형식도 그대로 반환 (이미 완전한 형식일 수 있음)
    if (birthDate.includes("-")) {
      return birthDate;
    }
  }

  // Date 객체
  if (birthDate instanceof Date) {
    return birthDate.toISOString().split("T")[0];
  }

  // Firestore Timestamp
  if (birthDate && typeof birthDate.toDate === "function") {
    return birthDate.toDate().toISOString().split("T")[0];
  }

  return "정보 없음";
};

// 진단일은 보정 없이 "YYYY-MM"만 표시 (병원 규격)
const formatYearMonth = (value) => {
  if (!value) return "정보 없음";

  // Firestore Timestamp
  if (value && typeof value.toDate === "function") {
    const d = value.toDate();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }

  // Date 객체
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }

  // 문자열 처리: YYYY-MM-DD | YYYYMMDD | YYYY-MM | YYYYMM
  if (typeof value === "string") {
    const s = value.trim();
    // 1) YYYY-MM-DD → YYYY-MM
    const m1 = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m1) return `${m1[1]}-${String(m1[2]).padStart(2, "0")}`;

    // 2) YYYYMMDD → YYYY-MM
    const m2 = s.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m2) return `${m2[1]}-${m2[2]}`;

    // 3) YYYY-MM → 그대로
    const m3 = s.match(/^(\d{4})-(\d{1,2})$/);
    if (m3) return `${m3[1]}-${String(m3[2]).padStart(2, "0")}`;

    // 4) YYYYMM → YYYY-MM
    const m4 = s.match(/^(\d{4})(\d{2})$/);
    if (m4) return `${m4[1]}-${m4[2]}`;
  }

  return "정보 없음";
};

// createdAt/updatedAt 안전 파서 (Timestamp | string | undefined)
const parseDate = (v) => {
  if (!v) return null;
  if (typeof v?.toDate === "function") return v.toDate();
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

// y, m, [d] -> "YYYY-MM-DD" (d default 1). Returns "" if y or m missing.
const ymdFrom = (yy, mm, dd = 1) => {
  const y = typeof yy === "number" || typeof yy === "string" ? String(yy) : "";
  const m = typeof mm === "number" || typeof mm === "string" ? Number(mm) : NaN;
  const d = typeof dd === "number" || typeof dd === "string" ? Number(dd) : 1;
  if (!y || !Number.isFinite(m)) return "";
  const pad2 = (n) => String(n).padStart(2, "0");
  return `${y}-${pad2(m)}-${pad2(d || 1)}`;
};

// 안전 접근 + 연월 문자열 유틸
const pick = (obj, path, fallback = "") =>
  path
    .split(".")
    .reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj) ??
  fallback;

const ym = (y, m) =>
  (y ?? "") !== "" && (m ?? "") !== ""
    ? `${String(y)}-${String(m).padStart(2, "0")}`
    : "";

// --- 추가: 환자/유저 병합 정규화 유틸 ---
function ymToISO(y, m, d = 1) {
  if (!y || !m) return "";
  const pad2 = (n) => String(n).padStart(2, "0");
  return `${String(y)}-${pad2(Number(m))}-${pad2(Number(d) || 1)}`;
}

function normalizePatientForUI(p = {}, u = {}) {
  // 이름
  const name = p.name || p.basic?.name || u.name || u.basic?.name || "익명";

  // 생년월일
  const birthDate =
    p.birthDate ||
    p.basic?.birthDate ||
    p.profile?.birthDate ||
    p.birth_date ||
    u.birthDate ||
    u.basic?.birthDate ||
    u.profile?.birthDate ||
    u.birth_date ||
    "";

  // 암 종류
  const cancerType =
    p.cancerType ||
    p.diagnosis?.cancerType ||
    p.meta?.cancerType ||
    p["cancer_type"] ||
    u.cancerType ||
    u.diagnosis?.cancerType ||
    u.meta?.cancerType ||
    u["cancer_type"] ||
    "";

  // 진단 시기: p.flat -> u.flat -> u.nested -> p.nested(yy/mm/dd)
  let diagnosisDate =
    p.diagnosisDate || u.diagnosisDate || u.diagnosis?.date || "";
  if (!diagnosisDate) {
    diagnosisDate =
      ymdFrom(
        p.diagnosisYear ??
          p.diagnosis?.year ??
          p.year ??
          u.diagnosisYear ??
          u.diagnosis?.year ??
          u.year,
        p.diagnosisMonth ??
          p.diagnosis?.month ??
          p.month ??
          u.diagnosisMonth ??
          u.diagnosis?.month ??
          u.month,
        p.diagnosisDay ??
          p.diagnosis?.day ??
          p.day ??
          u.diagnosisDay ??
          u.diagnosis?.day ??
          u.day
      ) || "";
  }

  // 위험도
  let riskLevel = p.riskLevel || p.risk || u.riskLevel || u.risk || "low";
  riskLevel = ["high", "medium", "low"].includes(riskLevel) ? riskLevel : "low";

  // 개인/연락
  const gender =
    p.gender ||
    p.basic?.gender ||
    p.profile?.gender ||
    u.gender ||
    u.basic?.gender ||
    u.profile?.gender ||
    "";
  const maritalStatus =
    p.maritalStatus ||
    p.basic?.maritalStatus ||
    p.profile?.maritalStatus ||
    u.maritalStatus ||
    u.basic?.maritalStatus ||
    u.profile?.maritalStatus ||
    "";
  const phone =
    p.phone ||
    p.contact ||
    p.basic?.phone ||
    u.phone ||
    u.contact ||
    u.basic?.phone ||
    "";
  const contactMethod =
    p.contactMethod ||
    p.meta?.contactMethod ||
    u.contactMethod ||
    u.meta?.contactMethod ||
    "";
  const contactTime =
    p.contactTime ||
    p.meta?.contactTime ||
    u.contactTime ||
    u.meta?.contactTime ||
    "";

  // 치료/수술/재발
  const hasSurgery =
    p.hasSurgery ||
    p.treatment?.hasSurgery ||
    u.hasSurgery ||
    u.treatment?.hasSurgery ||
    "";
  let surgeryDate =
    p.surgeryDate ||
    p.treatment?.surgeryDate ||
    u.surgeryDate ||
    u.treatment?.surgeryDate ||
    "";
  if (!surgeryDate) {
    surgeryDate =
      ymToISO(
        p.treatment?.surgery?.year ??
          p.surgeryYear ??
          u.treatment?.surgery?.year ??
          u.surgeryYear,
        p.treatment?.surgery?.month ??
          p.surgeryMonth ??
          u.treatment?.surgery?.month ??
          u.surgeryMonth,
        p.treatment?.surgery?.day ??
          p.surgeryDay ??
          u.treatment?.surgery?.day ??
          u.surgeryDay
      ) || "";
  }
  const hasRecurrence =
    p.hasRecurrence || p.recurrence || u.hasRecurrence || u.recurrence || "";

  // 기타 암
  const otherCancerDiagnosis =
    p.otherCancerDiagnosis ||
    p.otherCancer?.hasOther ||
    u.otherCancerDiagnosis ||
    u.otherCancer?.hasOther ||
    "";
  const otherCancerType =
    p.otherCancerType ||
    p.otherCancer?.type ||
    u.otherCancerType ||
    u.otherCancer?.type ||
    "";
  const otherCancerDetails =
    p.otherCancerDetails ||
    p.otherCancer?.details ||
    u.otherCancerDetails ||
    u.otherCancer?.details ||
    "";

  // 설문 파생/점수
  const q32 =
    p.q32 ||
    p.lifestyle?.alcohol?.current ||
    u.q32 ||
    u.lifestyle?.alcohol?.current ||
    "";
  const q33 =
    p.q33 ||
    p.lifestyle?.smoking?.current ||
    u.q33 ||
    u.lifestyle?.smoking?.current ||
    "";

  // 상담 상태/요청 여부
  const requested = p.requested === true || u.requested === true;
  const counselingStatus = (
    p.counselingStatus ||
    u.counselingStatus ||
    "미요청"
  ).trim();

  // 추가 필드: 병기/정신건강/기타치료/생활습관 시도 여부
  const cancerStage =
    p.diagnosis?.stage || p.stage || u.diagnosis?.stage || u.stage || "";

  const mentalHealthHistory =
    (p.mentalHealth && p.mentalHealth.history) ??
    p.mentalHealthHistory ??
    (u.mentalHealth && u.mentalHealth.history) ??
    u.mentalHealthHistory ??
    "";

  const mentalHealthImpact =
    (p.mentalHealth && p.mentalHealth.impact) ??
    p.mentalHealthImpact ??
    (u.mentalHealth && u.mentalHealth.impact) ??
    u.mentalHealthImpact ??
    "";

  const otherTreatmentType =
    p.treatment?.otherType ||
    p.otherTreatmentType ||
    u.treatment?.otherType ||
    u.otherTreatmentType ||
    "";

  const alcoholAbstinence =
    (p.lifestyle && p.lifestyle.alcohol && p.lifestyle.alcohol.tried) ??
    p.alcoholAbstinence ??
    p.alcoholReduction ??
    (u.lifestyle && u.lifestyle.alcohol && u.lifestyle.alcohol.tried) ??
    u.alcoholAbstinence ??
    u.alcoholReduction ??
    "";

  const smokingCessation =
    (p.lifestyle && p.lifestyle.smoking && p.lifestyle.smoking.tried) ??
    p.smokingCessation ??
    (u.lifestyle && u.lifestyle.smoking && u.lifestyle.smoking.tried) ??
    u.smokingCessation ??
    "";

  return {
    name,
    birthDate,
    cancerType,
    diagnosisDate,
    riskLevel,
    gender,
    maritalStatus,
    phone,
    contactMethod,
    contactTime,
    hasSurgery,
    surgeryDate,
    hasRecurrence,
    otherCancerDiagnosis,
    otherCancerType,
    otherCancerDetails,
    q32,
    q33,
    requested,
    counselingStatus,
    cancerStage,
    mentalHealthHistory,
    mentalHealthImpact,
    otherTreatmentType,
    alcoholAbstinence,
    smokingCessation,
  };
}

// 포털로 분리한 상담 상태 드롭다운 (버튼 위치에 따라 body 위에 띄움)
function StatusMenuPortal({ anchorEl, open, value, onSelect, onClose }) {
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    function update() {
      if (!anchorEl) return;
      const rect = anchorEl.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX + rect.width / 2,
        width: Math.max(140, rect.width),
      });
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [anchorEl, open]);

  useEffect(() => {
    const closeOnOutside = (e) => {
      if (!open) return;
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        anchorEl &&
        !anchorEl.contains(e.target)
      ) {
        onClose?.();
      }
    };
    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, [open, anchorEl, onClose]);

  if (!open || !anchorEl) return null;

  const options = ["요청", "진행중", "완료"];

  const getStyle = (s) => {
    const t = (s || "요청").trim();
    if (t === "완료")
      return {
        background: "#e8f5e9",
        border: "1px solid #81c784",
        color: "#2e7d32",
      };
    if (t === "진행중")
      return {
        background: "#fff3e0",
        border: "1px solid #ffb74d",
        color: "#ef6c00",
      };
    return {
      background: "#e3f2fd",
      border: "1px solid #90caf9",
      color: "#1976d2",
    };
  };

  return createPortal(
    <div
      ref={menuRef}
      role="listbox"
      data-role="status-menu"
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        transform: "translateX(-50%)",
        minWidth: pos.width,
        background: "#fff",
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
        zIndex: 9999,
        pointerEvents: "auto",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
    >
      {options.map((s, idx) => {
        const active = (value || "요청").trim() === s;
        const st = getStyle(s);
        return (
          <button
            key={s}
            role="option"
            aria-selected={active}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect?.(s);
            }}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 12px",
              background: active ? st.background : "#fff",
              border: "none",
              borderBottom:
                idx === options.length - 1 ? "none" : "1px solid #f1f3f5",
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: st.color,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: 999,
                background:
                  s === "요청"
                    ? "#1976d2"
                    : s === "진행중"
                    ? "#ef6c00"
                    : "#2e7d32",
              }}
            />
            {s}
          </button>
        );
      })}
    </div>,
    document.body
  );
}

function DashboardPage() {
  // 상담 상태 드롭다운 트리거 버튼 ref map
  const triggerRefs = useRef(new Map());
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [statsData, setStatsData] = useState({
    totalPatients: 0,
    newPatients: 0,
    pendingRequests: 0,
    highRiskPatients: 0,
  });
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    riskLevel: "all",
    cancerType: "all",
    treatmentStatus: "all",
    searchTerm: "",
  });

  // 보관 환자 보기 토글
  const [showArchived, setShowArchived] = useState(false);

  // 페이지네이션 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 5; // 한 페이지당 5명의 환자만 표시

  // 통합 모드: 설문 유형 선택 (기본값: "survivor" - 기존 동작 유지)
  const [surveyType, setSurveyType] = useState(SURVEY_TYPES.SURVIVOR);
  const useIntegratedMode = surveyType !== SURVEY_TYPES.SURVIVOR; // 생존자만이면 기존 모드

  // 보조 상태: 원본 patients와 최신 요청 맵을 분리 보관
  const [patientsRaw, setPatientsRaw] = useState([]);
  const [latestRequestByUser, setLatestRequestByUser] = useState(new Map());
  // users/{id} 보조 소스 (설문/결과가 users에 분산 저장된 경우 보강)
  const [usersById, setUsersById] = useState(new Map());
  const [selectedIds, setSelectedIds] = useState(new Set());

  // 통합 모드: 통합 users 구독 (환자 또는 전체 선택 시)
  useEffect(() => {
    if (!useIntegratedMode) return;

    const unsubscribers = [];
    let survivorsUsersMap = new Map();
    let patientsUsersMap = new Map();

    // 두 맵을 합치는 헬퍼
    const mergeAndSet = () => {
      const merged = new Map();
      survivorsUsersMap.forEach((v, k) => {
        merged.set(k, { ...v, type: SURVEY_TYPES.SURVIVOR });
      });
      patientsUsersMap.forEach((v, k) => {
        merged.set(k, { ...v, type: SURVEY_TYPES.PATIENT });
      });
      setUsersById(merged);
    };

    // 생존자 users 구독
    if (
      surveyType === SURVEY_TYPES.ALL ||
      surveyType === SURVEY_TYPES.SURVIVOR
    ) {
      const unsubSurvivors = onSnapshot(collection(db, "users"), (snap) => {
        survivorsUsersMap = new Map();
        snap.forEach((d) => {
          survivorsUsersMap.set(d.id, d.data() || {});
        });
        mergeAndSet();
      });
      unsubscribers.push(unsubSurvivors);
    }

    // 환자 users 구독
    if (
      surveyType === SURVEY_TYPES.ALL ||
      surveyType === SURVEY_TYPES.PATIENT
    ) {
      const unsubPatients = onSnapshot(
        collection(db, "patients_users"),
        (snap) => {
          patientsUsersMap = new Map();
          snap.forEach((d) => {
            patientsUsersMap.set(d.id, d.data() || {});
          });
          mergeAndSet();
        }
      );
      unsubscribers.push(unsubPatients);
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [surveyType, useIntegratedMode]);

  // 기존 모드: 생존자 users만 구독 (기존 로직 그대로 유지)
  // 실시간: users (설문/결과 분산 저장 보정용)
  useEffect(() => {
    if (useIntegratedMode) return; // 통합 모드면 이 useEffect는 실행 안 함

    const unsub = onSnapshot(
      collection(db, "users"),
      (snap) => {
        const map = new Map();
        snap.forEach((d) => {
          const v = d.data() || {};
          map.set(d.id, v);
        });
        setUsersById(map);
        console.log("[Dashboard] users snapshot:", { count: map.size });
      },
      (err) => {
        console.error("users 구독 오류:", err);
      }
    );
    return () => unsub();
  }, [useIntegratedMode]);
  // 상담 상태 드롭다운 열림 대상(환자 id)
  const [openStatusMenuId, setOpenStatusMenuId] = useState(null);
  // 상태 칩 클릭: 항상 열기 (중복 클릭으로 즉시 닫히는 현상 방지)
  const handleStatusTriggerClick = (e, id) => {
    try {
      if (e && typeof e.preventDefault === "function") e.preventDefault();
      if (e && typeof e.stopPropagation === "function") e.stopPropagation();
      setOpenStatusMenuId(id);
    } catch (err) {
      console.error("[StatusChip] click handler error:", err);
    }
  };

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    const onDocMouseDown = (e) => {
      const target = e.target;
      // 트리거/메뉴 내부 클릭은 무시
      if (
        target.closest?.(
          '[data-role="status-trigger"], [data-role="status-menu"]'
        )
      ) {
        return;
      }
      if (openStatusMenuId !== null) {
        setOpenStatusMenuId(null);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [openStatusMenuId]);

  // 상담 상태 칩 스타일 매핑
  function getStatusChipStyle(status) {
    const s = (status || "요청").trim();
    if (s === "완료") {
      return {
        background: "#e8f5e9",
        border: "1px solid #81c784",
        color: "#2e7d32",
      };
    }
    if (s === "진행중") {
      return {
        background: "#fff3e0",
        border: "1px solid #ffb74d",
        color: "#ef6c00",
      };
    }
    // 기본: 요청
    return {
      background: "#e3f2fd",
      border: "1px solid #90caf9",
      color: "#1976d2",
    };
  }

  // 통합 모드: 통합 환자 구독 (환자 또는 전체 선택 시)
  useEffect(() => {
    if (!useIntegratedMode) return; // 생존자만이면 기존 useEffect 사용

    setLoading(true);
    const unsub = subscribeIntegratedPatients(
      { surveyType, showArchived },
      (integratedPatients) => {
        // 한 달 전 (신규 환자 계산용)
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        // 통합 환자 데이터 처리 (기존 로직과 유사하게)
        const processed = integratedPatients
          .filter((p) => {
            if (!showArchived && p.archived === true) return false;
            if (!p.lastSurveyAt) return false;
            return true;
          })
          .map((p) => ({
            ...p,
            type: p.type || SURVEY_TYPES.SURVIVOR, // 타입 필드 보장
          }));

        // 정렬: createdAt desc
        processed.sort((a, b) => {
          const ad = a.createdAt ? a.createdAt.getTime() : -Infinity;
          const bd = b.createdAt ? b.createdAt.getTime() : -Infinity;
          return bd - ad;
        });

        // 통합 모드에서는 patientsRaw에 직접 저장 (기존 병합 로직과 동일하게)
        setPatientsRaw(processed);

        // 통계 계산 (통합 통계 사용)
        const stats = calculateIntegratedStats(processed);
        const targetStats =
          surveyType === SURVEY_TYPES.ALL
            ? stats.all
            : surveyType === SURVEY_TYPES.SURVIVOR
            ? stats.survivors
            : stats.patients;

        setStatsData((prev) => ({
          ...prev,
          totalPatients: targetStats.total,
          newPatients: processed.filter(
            (p) => p.createdAt && p.createdAt > oneMonthAgo
          ).length,
          highRiskPatients: targetStats.highRisk,
        }));

        setLoading(false);
      }
    );

    return () => unsub();
  }, [surveyType, showArchived, useIntegratedMode]);

  // 기존 모드: 생존자만 구독 (기존 로직 그대로 유지)
  // 실시간: patients (모든 문서 구독 후 클라이언트에서 archived 필터)
  // 기존에는 where("archived","==",false)로 쿼리하여 archived 필드가 없는 문서가 전부 제외됨.
  // 과거 문서는 archived 필드가 없기 때문에 목록에서 빠졌고, 그 결과 "patients가 안 뜨는" 현상이 발생.
  // 해결: 전체 컬렉션을 구독하고, 화면에서는 archived !== true 인 것만 노출.
  useEffect(() => {
    if (useIntegratedMode) return; // 통합 모드면 이 useEffect는 실행 안 함

    setLoading(true);
    const patientsRef = collection(db, "patients");

    const unsubPatients = onSnapshot(
      patientsRef,
      (snap) => {
        // 한 달 전 (신규 환자 계산용)
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        console.log("[Dashboard] Firestore snapshot received:", {
          docsCount: snap.docs.length,
          empty: snap.empty,
        });

        // 문서 변경 감지 (추가/삭제/수정)
        if (snap.metadata) {
          console.log("[Dashboard] Snapshot metadata:", {
            fromCache: snap.metadata.fromCache,
            hasPendingWrites: snap.metadata.hasPendingWrites,
          });
        }

        const raw = snap.docs.map((d) => {
          const v = d.data() || {};

          // 디버깅: 첫 번째 문서 로그 출력
          if (snap.docs.indexOf(d) === 0) {
            console.log("[Dashboard] First patient document sample:", {
              id: d.id,
              name: v.name,
              cancerType: v.cancerType,
              archived: v.archived,
              rawData: v,
            });
          }

          // createdAt 안전 파싱
          const createdAt =
            parseDate(v.createdAt) || parseDate(v.updatedAt) || null;

          // 필드 호환: 과거/현재 스키마 모두 커버

          // 생년월일 (patients 스키마 우선)
          const birthDateRaw =
            pick(v, "birthDate") ||
            pick(v, "basic.birthDate") ||
            pick(v, "profile.birthDate") ||
            v.birth_date ||
            v["생년월일"] ||
            "";

          // 암 종류 (patients.diagnosis.cancerType 우선)
          const cancerTypeRaw =
            pick(v, "diagnosis.cancerType") ||
            v.cancerType ||
            pick(v, "meta.cancerType") ||
            v["cancer_type"] ||
            "";

          // 진단 시기: YYYY-MM (보정 없이 병원 규격)
          let diagnosisDateRaw = ym(
            pick(v, "diagnosis.year", null),
            pick(v, "diagnosis.month", null)
          );
          if (!diagnosisDateRaw) {
            // 보조: 기존 평면/레거시 키 지원
            diagnosisDateRaw =
              ym(v.diagnosisYear ?? v.year, v.diagnosisMonth ?? v.month) ||
              (typeof v.diagnosisDate === "string"
                ? v.diagnosisDate
                : v.diagnosis?.date || "");
          }

          // 연락/개인
          const genderRaw =
            v.gender ?? v.basic?.gender ?? v.profile?.gender ?? "";
          const maritalStatusRaw =
            v.maritalStatus ??
            v.basic?.maritalStatus ??
            v.profile?.maritalStatus ??
            "";
          const phoneRaw = v.phone ?? v.contact ?? v.basic?.phone ?? "";
          const contactMethodRaw =
            v.contactMethod ?? v.meta?.contactMethod ?? "";
          const contactTimeRaw = v.contactTime ?? v.meta?.contactTime ?? "";

          // 치료/재발
          const hasSurgeryRaw = v.hasSurgery ?? v.treatment?.hasSurgery ?? "";
          // 수술 시기: YYYY-MM (보정 없이 병원 규격)
          let surgeryDateRaw = ym(
            pick(v, "treatment.surgery.year", null),
            pick(v, "treatment.surgery.month", null)
          );
          if (!surgeryDateRaw) {
            surgeryDateRaw =
              ym(v.surgeryYear, v.surgeryMonth) ||
              (typeof v.surgeryDate === "string"
                ? v.surgeryDate
                : pick(v, "treatment.surgeryDate", ""));
          }
          const hasRecurrenceRaw = v.hasRecurrence ?? v.recurrence ?? "";

          // 기타 암
          const otherCancerDiagnosisRaw =
            v.otherCancerDiagnosis ?? v.otherCancer?.hasOther ?? "";
          const otherCancerTypeRaw =
            v.otherCancerType ?? v.otherCancer?.type ?? "";
          const otherCancerDetailsRaw =
            v.otherCancerDetails ?? v.otherCancer?.details ?? "";

          // 설문/피드백
          const lastSurveyAt = parseDate(v.lastSurveyAt) || null;
          const lastSurveyId = v.lastSurveyId || "";
          const lastOverallFeedback = v.lastOverallFeedback || "";

          // 생활습관 점수(q32/q33)
          const q32Raw = v.q32 ?? v.lifestyle?.alcohol?.current ?? "";
          const q33Raw = v.q33 ?? v.lifestyle?.smoking?.current ?? "";

          const riskLevelRaw = v.riskLevel || v.risk || "low";
          const archived = v.archived === true; // undefined는 false로 처리

          return {
            id: d.id,
            name: v.name || v.basic?.name || "익명",
            birthDate: birthDateRaw || "",
            cancerType: cancerTypeRaw || "정보 없음",
            diagnosisDate: diagnosisDateRaw || "",
            riskLevel: ["high", "medium", "low"].includes(riskLevelRaw)
              ? riskLevelRaw
              : "low",
            requested: v.requested === true, // web1 업서트에서 저장된 요청 여부 신뢰
            counselingStatus: v.counselingStatus || "미요청",
            archived,
            createdAt,
            gender: genderRaw || "",
            maritalStatus: maritalStatusRaw || "",
            phone: phoneRaw || "",
            contactMethod: contactMethodRaw || "",
            contactTime: contactTimeRaw || "",
            hasSurgery: hasSurgeryRaw || "",
            surgeryDate: surgeryDateRaw || "",
            hasRecurrence: hasRecurrenceRaw || "",
            otherCancerDiagnosis: otherCancerDiagnosisRaw || "",
            otherCancerType: otherCancerTypeRaw || "",
            otherCancerDetails: otherCancerDetailsRaw || "",
            lastSurveyAt,
            lastSurveyId,
            lastOverallFeedback,
            q32: q32Raw || "",
            q33: q33Raw || "",
            originalPatientId: v.originalPatientId || null, // 중복 제거용
          };
        });

        // 중복 제거: originalPatientId가 있으면 그것을 기준으로, 없으면 이름+생년월일 기준
        const deduplicated = [];
        const seen = new Map(); // key: originalPatientId 또는 name+birthDate

        raw.forEach((patient) => {
          // originalPatientId가 있으면 그것을 기준으로
          const key =
            patient.originalPatientId || `${patient.name}_${patient.birthDate}`;

          if (!seen.has(key)) {
            seen.set(key, patient);
            deduplicated.push(patient);
          } else {
            // 이미 있는 경우, 더 최신 문서로 교체 (lastSurveyAt 비교)
            const existing = seen.get(key);
            const existingDate = existing.lastSurveyAt || existing.createdAt;
            const currentDate = patient.lastSurveyAt || patient.createdAt;

            if (currentDate && (!existingDate || currentDate > existingDate)) {
              // 현재 문서가 더 최신이면 교체
              const index = deduplicated.findIndex((p) => p.id === existing.id);
              if (index !== -1) {
                deduplicated[index] = patient;
                seen.set(key, patient);
              }
            }
          }
        });

        console.log("[Dashboard] Deduplication:", {
          before: raw.length,
          after: deduplicated.length,
          duplicates: raw.length - deduplicated.length,
        });

        // 화면용 가시 목록: showArchived 토글에 따라 보관 제외/포함 (중복 제거 후)
        // 설문을 완료한 환자만 표시 (lastSurveyAt가 있는 환자만)
        const visiblePatients = deduplicated.filter((p) => {
          // 보관 환자 필터
          if (!showArchived && p.archived === true) return false;
          // 설문 완료 필터: lastSurveyAt가 있는 환자만 표시 (설문을 완료한 환자만)
          if (!p.lastSurveyAt) return false;
          return true;
        });

        // 정렬: createdAt desc
        visiblePatients.sort((a, b) => {
          const ad = a.createdAt ? a.createdAt.getTime() : -Infinity;
          const bd = b.createdAt ? b.createdAt.getTime() : -Infinity;
          return bd - ad;
        });

        // 중복 제거 완료
        const uniquePatients = visiblePatients;

        // 통계 업데이트
        const totalPatients = uniquePatients.length;
        const highRiskPatients = uniquePatients.filter(
          (p) => p.riskLevel === "high"
        ).length;
        const newPatients = uniquePatients.filter(
          (p) => p.createdAt && p.createdAt > oneMonthAgo
        ).length;

        setPatientsRaw(uniquePatients);
        setStatsData((prev) => ({
          ...prev,
          totalPatients,
          newPatients,
          highRiskPatients,
        }));
        console.log("[Dashboard] patients snapshot:", {
          received: raw.length,
          visible: visiblePatients.length,
          unique: uniquePatients.length,
          showArchived,
        });
        console.log(
          "[Dashboard] Sample patients:",
          uniquePatients.slice(0, 3).map((p) => ({
            id: p.id,
            name: p.name,
            cancerType: p.cancerType,
            archived: p.archived,
          }))
        );
        setLoading(false);
      },
      (err) => {
        console.error("patients 구독 오류:", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
        setLoading(false);
      }
    );

    return () => unsubPatients();
  }, [showArchived, useIntegratedMode]);

  // 통합 모드: 통합 상담 요청 구독
  useEffect(() => {
    if (!useIntegratedMode) return;

    (async () => {
      try {
        const integratedRequests = await getIntegratedCounselingRequests({
          surveyType,
        });

        const activities = integratedRequests.slice(0, 5).map((r) => ({
          id: r.id,
          ...r,
          createdAt: r.createdAt?.toDate?.() || new Date(r.createdAt || 0),
        }));

        setRecentActivities(activities);

        // 최신 요청 맵 생성
        const latest = new Map();
        for (const a of integratedRequests) {
          const uid = a.userId;
          if (uid && uid.trim() !== "") {
            const existing = latest.get(uid);
            const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
            const existingTime = existing?.createdAt?.getTime() || 0;
            if (!existing || aTime > existingTime) {
              latest.set(uid, {
                id: a.id,
                status: a.status || "pending",
                createdAt: a.createdAt?.toDate?.() || new Date(0),
                name: a.name || "",
              });
            }
          }
        }

        const pendingUsers = Array.from(latest.values()).filter(
          (v) => (v.status || "pending") === "pending"
        ).length;

        setLatestRequestByUser(new Map(latest));
        setStatsData((prev) => ({ ...prev, pendingRequests: pendingUsers }));
      } catch (error) {
        console.error(
          "[Dashboard] Integrated counseling requests error:",
          error
        );
      }
    })();
  }, [surveyType, useIntegratedMode]);

  // 기존 모드: 생존자 상담 요청만 구독 (기존 로직 그대로 유지)
  // 실시간: counselingRequests (최근 요청/활동/대기 건수)
  useEffect(() => {
    if (useIntegratedMode) return; // 통합 모드면 이 useEffect는 실행 안 함

    const q = query(collection(db, "counselingRequests")); // 서버 정렬 제거
    const unsubReq = onSnapshot(
      q,
      (snap) => {
        const activities = [];

        // snap.forEach는 현재 존재하는 문서만 순회 (삭제된 문서는 자동 제외)
        snap.forEach((d) => {
          const r = d.data() || {};
          const createdAt = parseDate(r.createdAt) || new Date(0);
          activities.push({ id: d.id, ...r, createdAt });
        });

        // 클라이언트 정렬: 최신 순
        activities.sort((a, b) => {
          const ad = a.createdAt ? a.createdAt.getTime() : -Infinity;
          const bd = b.createdAt ? b.createdAt.getTime() : -Infinity;
          return bd - ad;
        });

        // 최신 요청 맵 (userId별 가장 최신 하나)
        // userId가 유효한 경우만 포함
        const latest = new Map();
        for (const a of activities) {
          const uid = a.userId;
          // userId가 유효하고, 아직 없거나 더 최신인 경우에만 추가
          if (uid && uid.trim() !== "") {
            const existing = latest.get(uid);
            const aTime = a.createdAt ? a.createdAt.getTime() : 0;
            const existingTime = existing?.createdAt
              ? existing.createdAt.getTime()
              : 0;
            if (!existing || aTime > existingTime) {
              latest.set(uid, {
                id: a.id,
                status: a.status || "pending",
                createdAt: a.createdAt,
                name: a.name || "",
              });
            }
          }
        }

        // Compute unique pending count from latest
        let pendingUsers = 0;
        latest.forEach((v) => {
          const status = v.status || "pending";
          if (status === "pending") pendingUsers += 1;
        });

        console.log("[Dashboard] counselingRequests snapshot:", {
          received: activities.length,
          latestUsers: latest.size,
          pendingUsers,
          snapshotMetadata: {
            hasPendingWrites: snap.metadata.hasPendingWrites,
            fromCache: snap.metadata.fromCache,
          },
        });
        // Map을 새로 생성하여 참조 변경 (React가 변경 감지하도록)
        setLatestRequestByUser(new Map(latest));
        setRecentActivities(activities.slice(0, 5));
        // onSnapshot에서 직접 카운트 설정 (가장 확실한 방법)
        setStatsData((prev) => ({ ...prev, pendingRequests: pendingUsers }));
      },
      (err) => {
        console.error("counselingRequests 구독 오류:", err);
      }
    );

    return () => unsubReq();
  }, [useIntegratedMode]);

  // latestRequestByUser 변경 시 pendingRequests 카운트 재계산
  // Map의 내용을 기반으로 한 키를 생성하여 변경 감지
  const latestRequestKey = useMemo(() => {
    const entries = Array.from(latestRequestByUser.entries())
      .map(([k, v]) => `${k}:${v.status || "pending"}`)
      .sort()
      .join("|");
    return `${latestRequestByUser.size}|${entries}`;
  }, [latestRequestByUser]);

  useEffect(() => {
    let pendingCount = 0;
    latestRequestByUser.forEach((v) => {
      const status = v.status || "pending";
      if (status === "pending") {
        pendingCount += 1;
      }
    });
    console.log(
      "[Dashboard] latestRequestByUser changed, recalculating pending:",
      {
        mapSize: latestRequestByUser.size,
        pendingCount,
        key: latestRequestKey,
      }
    );
    setStatsData((prev) => {
      if (prev.pendingRequests !== pendingCount) {
        console.log(
          "[Dashboard] Updating pendingRequests:",
          prev.pendingRequests,
          "->",
          pendingCount
        );
        return { ...prev, pendingRequests: pendingCount };
      }
      return prev;
    });
  }, [latestRequestKey, latestRequestByUser]);

  // 파생: patientsRaw + latestRequestByUser -> patients / filteredPatients
  useEffect(() => {
    const merged = patientsRaw.map((p) => {
      const u = usersById.get(p.id);
      // 정규화 유틸로 병합
      const base = normalizePatientForUI(p, u || {});
      // 상담 요청/상태 병합
      const latest = latestRequestByUser.get(p.id);
      const requested = base.requested || !!latest;
      const counselingStatus = toUiStatus(
        latest ? latest.status : base.counselingStatus
      );
      return { ...p, ...base, requested, counselingStatus };
    });

    console.log("[Merge] merged patients+users snapshot:", merged);
    setPatients(merged);
    setFilteredPatients(merged);
    setCurrentPage(1);
  }, [patientsRaw, latestRequestByUser, usersById]);

  // 필터링 로직
  useEffect(() => {
    let filtered = [...patients];

    // 위험도 필터
    if (filters.riskLevel !== "all") {
      filtered = filtered.filter(
        (patient) => patient.riskLevel === filters.riskLevel
      );
    }

    // 암 종류 필터 - 이제 한글 값을 직접 비교
    if (filters.cancerType !== "all") {
      filtered = filtered.filter((patient) => {
        // 한글 암 종류로 직접 비교
        if (filters.cancerType === "breast")
          return patient.cancerType === "유방암";
        if (filters.cancerType === "colorectal")
          return patient.cancerType === "대장암";
        if (filters.cancerType === "lung") return patient.cancerType === "폐암";
        if (filters.cancerType === "gastric")
          return patient.cancerType === "위암";
        if (filters.cancerType === "liver")
          return patient.cancerType === "간암";
        if (filters.cancerType === "thyroid")
          return patient.cancerType === "갑상선암";
        if (filters.cancerType === "prostate")
          return patient.cancerType === "전립선암";
        // 기타 또는 기타암 처리
        return patient.cancerType === "기타" || patient.cancerType === "기타암";
      });
    }

    // 치료 상태 필터 - 한글 값 직접 비교 (null-safe)
    if (filters.treatmentStatus !== "all") {
      filtered = filtered.filter((patient) => {
        const ct = patient.currentTreatment || "";
        if (filters.treatmentStatus === "ongoing")
          return ct.includes("치료 중");
        if (filters.treatmentStatus === "completed")
          return ct.includes("치료 완료");
        if (filters.treatmentStatus === "recurrence")
          return ct.includes("재발");
        return ct.includes("경과 확인");
      });
    }

    // 검색어 필터
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (patient) =>
          (patient.name && patient.name.toLowerCase().includes(term)) ||
          `${patient.id}`.includes(term)
      );
    }

    setFilteredPatients(filtered);
    // 필터링이 변경될 때마다 첫 번째 페이지로 리셋
    setCurrentPage(1);
  }, [filters, patients]);

  // 필터 변경 핸들러
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 현재 페이지에 표시되는 환자 ID 목록 계산
  const getCurrentPageIds = () => {
    const start = (currentPage - 1) * patientsPerPage;
    const end = currentPage * patientsPerPage;
    return filteredPatients.slice(start, end).map((p) => p.id);
  };

  const toggleSelectAllOnPage = (checked) => {
    const pageIds = getCurrentPageIds();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) pageIds.forEach((id) => next.add(id));
      else pageIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const toggleSelectOne = (id, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  // CSV 내보내기 (선택 없는 경우 전체 내보내기 여부 확인)
  const handleExportCSV = () => {
    try {
      const headers = [
        "id",
        "name",
        "birthDate",
        "cancerType",
        "diagnosisDate",
        "riskLevel",
        "requested",
        "counselingStatus",
      ];

      // 선택된 항목이 없으면 전체 내보내기 여부를 확인
      let source = [];
      if (selectedIds.size === 0) {
        const ok = window.confirm(
          "선택된 환자가 없습니다.\n현재 필터 결과 전체를 CSV로 다운로드할까요?"
        );
        if (!ok) return;
        source = filteredPatients;
      } else {
        source = filteredPatients.filter((p) => selectedIds.has(p.id));
      }

      const rows = source.map((p) => [
        p.id,
        p.name || "",
        typeof p.birthDate === "string"
          ? p.birthDate
          : p.birthDate?.toISOString?.().split("T")[0] || "",
        p.cancerType || "",
        p.diagnosisDate || "",
        p.riskLevel || "",
        p.requested ? "Y" : "N",
        p.counselingStatus || "",
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((r) =>
          r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        selectedIds.size > 0 ? "patients_selected.csv" : "patients_all.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("CSV export failed:", e);
      alert("CSV 내보내기에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  // 일괄 삭제 핸들러 (선택 없으면 전체 삭제 확인)
  const handleBulkDelete = async () => {
    try {
      let targetIds = [];

      if (selectedIds.size === 0) {
        const ok = window.confirm(
          "선택된 환자가 없습니다.\n현재 테이블의 '필터 결과 전체'를 삭제할까요?\n⚠️ 되돌릴 수 없습니다."
        );
        if (!ok) return;
        targetIds = filteredPatients.map((p) => p.id);
      } else {
        targetIds = Array.from(selectedIds);
        const ok = window.confirm(
          `선택한 ${targetIds.length}명의 환자를 삭제할까요?\n⚠️ 되돌릴 수 없습니다.`
        );
        if (!ok) return;
      }

      // 삭제 실행 (연쇄 삭제 유틸 사용)
      for (const id of targetIds) {
        await deletePatientWithCascade(id);
      }

      // UI 반영
      setPatients((prev) => prev.filter((p) => !targetIds.includes(p.id)));
      setFilteredPatients((prev) =>
        prev.filter((p) => !targetIds.includes(p.id))
      );
      setSelectedIds(new Set());
      alert("삭제가 완료되었습니다.");
    } catch (err) {
      console.error("Bulk delete failed:", err);
      alert(
        "삭제 중 오류가 발생했습니다. 일부 항목이 삭제되지 않았을 수 있습니다."
      );
    }
  };

  // 암 종류별 환자 수 차트 데이터 - 한글 데이터 사용
  const cancerTypeData = {
    labels: [
      "유방암",
      "대장암",
      "폐암",
      "위암",
      "간암",
      "갑상선암",
      "전립선암",
      "기타",
    ],
    datasets: [
      {
        label: "환자 수",
        data: [
          patients.filter((p) => p.cancerType === "유방암").length,
          patients.filter((p) => p.cancerType === "대장암").length,
          patients.filter((p) => p.cancerType === "폐암").length,
          patients.filter((p) => p.cancerType === "위암").length,
          patients.filter((p) => p.cancerType === "간암").length,
          patients.filter((p) => p.cancerType === "갑상선암").length,
          patients.filter((p) => p.cancerType === "전립선암").length,
          patients.filter(
            (p) => p.cancerType === "기타" || p.cancerType === "기타암"
          ).length,
        ],
        backgroundColor: [
          "#4e73df",
          "#1cc88a",
          "#36b9cc",
          "#f6c23e",
          "#e74a3b",
          "#5a5c69",
          "#6f42c1",
          "#fd7e14",
        ],
      },
    ],
  };

  const riskTypeData = {
    labels: ["위험", "주의", "양호"],
    datasets: [
      {
        label: "환자 수",
        data: [
          patients.filter((p) => p.riskLevel === "high").length,
          patients.filter((p) => p.riskLevel === "medium").length,
          patients.filter((p) => p.riskLevel === "low").length,
        ],
        backgroundColor: ["#e74a3b", "#f6c23e", "#1cc88a"],
      },
    ],
  };

  return (
    <Layout title="대시보드">
      <Section>
        <SectionTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          환자 현황
        </SectionTitle>

        <StatsGrid>
          <StatCard>
            <CardIcon $bgColor="#E3F2FD">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </CardIcon>
            <CardTitle>총 환자 수</CardTitle>
            <CardValue>{statsData.totalPatients}</CardValue>
            <CardInfo $isPositive={true}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
              {statsData.newPatients} 신규 환자
            </CardInfo>
          </StatCard>

          <StatCard>
            <CardIcon $bgColor="#E8F5E9" $iconColor="#388E3C">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </CardIcon>
            <CardTitle>완료된 설문</CardTitle>
            <CardValue color="#388E3C">{patients.length}</CardValue>
            <CardInfo>
              {statsData.totalPatients > 0
                ? Math.round((patients.length / statsData.totalPatients) * 100)
                : 0}
              % 완료율
            </CardInfo>
          </StatCard>

          <StatCard>
            <CardIcon $bgColor="#FFF3E0" $iconColor="#F57C00">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </CardIcon>
            <CardTitle>상담 요청</CardTitle>
            <CardValue color="#F57C00">{statsData.pendingRequests}</CardValue>
            <CardInfo>대기 중</CardInfo>
          </StatCard>

          <StatCard>
            <CardIcon $bgColor="#FFEBEE" $iconColor="#D32F2F">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </CardIcon>
            <CardTitle>위험군 환자</CardTitle>
            <CardValue color="#D32F2F">{statsData.highRiskPatients}</CardValue>
            <CardInfo $isPositive={false}>
              {statsData.totalPatients > 0
                ? Math.round(
                    (statsData.highRiskPatients / statsData.totalPatients) * 100
                  )
                : 0}
              % 비율
            </CardInfo>
          </StatCard>
        </StatsGrid>
      </Section>

      <TwoColumnLayout>
        <Section>
          <SectionTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
            환자 목록
          </SectionTitle>

          <TableCard>
            <CardHeader>
              <FilterBar>
                <FilterGroup>
                  <FilterLabel htmlFor="surveyType">설문 유형:</FilterLabel>
                  <FilterSelect
                    id="surveyType"
                    value={surveyType}
                    onChange={(e) => setSurveyType(e.target.value)}
                  >
                    <option value={SURVEY_TYPES.SURVIVOR}>생존자 설문</option>
                    <option value={SURVEY_TYPES.PATIENT}>환자 설문</option>
                    <option value={SURVEY_TYPES.ALL}>전체</option>
                  </FilterSelect>
                </FilterGroup>

                <FilterGroup>
                  <input
                    id="toggleArchived"
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    style={{ marginRight: 6 }}
                  />
                  <FilterLabel htmlFor="toggleArchived">보관 포함</FilterLabel>
                </FilterGroup>

                <FilterGroup>
                  <FilterLabel htmlFor="riskLevel">위험도:</FilterLabel>
                  <FilterSelect
                    id="riskLevel"
                    name="riskLevel"
                    value={filters.riskLevel}
                    onChange={handleFilterChange}
                  >
                    <option value="all">전체</option>
                    <option value="high">위험</option>
                    <option value="medium">주의</option>
                    <option value="low">양호</option>
                  </FilterSelect>
                </FilterGroup>

                <FilterGroup>
                  <FilterLabel htmlFor="cancerType">암 종류:</FilterLabel>
                  <FilterSelect
                    id="cancerType"
                    name="cancerType"
                    value={filters.cancerType}
                    onChange={handleFilterChange}
                  >
                    <option value="all">전체</option>
                    <option value="breast">유방암</option>
                    <option value="colorectal">대장암</option>
                    <option value="lung">폐암</option>
                    <option value="gastric">위암</option>
                    <option value="liver">간암</option>
                    <option value="thyroid">갑상선암</option>
                    <option value="prostate">전립선암</option>
                    <option value="other">기타</option>
                  </FilterSelect>
                </FilterGroup>

                <FilterGroup>
                  <FilterLabel htmlFor="treatmentStatus">
                    치료 상태:
                  </FilterLabel>
                  <FilterSelect
                    id="treatmentStatus"
                    name="treatmentStatus"
                    value={filters.treatmentStatus}
                    onChange={handleFilterChange}
                  >
                    <option value="all">전체</option>
                    <option value="ongoing">치료 중</option>
                    <option value="completed">치료 완료</option>
                    <option value="recurrence">재발/추가 치료</option>
                    <option value="maintenance">경과 확인 중</option>
                  </FilterSelect>
                </FilterGroup>

                <Link
                  to="/archived"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    height: 36,
                    padding: "0 12px",
                    border: "1px solid #d0d7de",
                    background: "#fff",
                    borderRadius: 6,
                    cursor: "pointer",
                    textDecoration: "none",
                    color: "#111",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                  title="보관된 환자 목록 페이지로 이동"
                >
                  보관 환자 목록
                </Link>
                <button
                  onClick={handleExportCSV}
                  style={{
                    height: 36,
                    padding: "0 12px",
                    border: "1px solid #d0d7de",
                    background: "#fff",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                  title="현재 필터가 적용된 환자 목록을 CSV로 저장"
                >
                  CSV 다운로드
                </button>
                <button
                  onClick={handleBulkDelete}
                  style={{
                    height: 36,
                    padding: "0 12px",
                    border: "1px solid #dc3545",
                    background: "#fff5f5",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 500,
                    marginLeft: 6,
                    color: "#dc3545",
                  }}
                  title={
                    selectedIds.size > 0
                      ? "선택한 환자만 삭제"
                      : "선택이 없으면 필터 결과 전체 삭제(확인 필요)"
                  }
                >
                  선택 삭제
                </button>
              </FilterBar>

              <div style={{ marginTop: 16 }}>
                <SearchInput
                  type="text"
                  name="searchTerm"
                  value={filters.searchTerm}
                  onChange={handleFilterChange}
                  placeholder="환자 이름 검색..."
                />
              </div>
            </CardHeader>

            <CardContent>
              <PatientTable>
                <TableHeader>
                  <tr>
                    <HeaderCell>
                      <input
                        type="checkbox"
                        aria-label="현재 페이지 전체 선택"
                        checked={
                          getCurrentPageIds().every((id) =>
                            selectedIds.has(id)
                          ) && getCurrentPageIds().length > 0
                        }
                        onChange={(e) =>
                          toggleSelectAllOnPage(e.target.checked)
                        }
                      />
                    </HeaderCell>
                    <HeaderCell>이름</HeaderCell>
                    {useIntegratedMode && <HeaderCell>유형</HeaderCell>}
                    <HeaderCell>생년월일</HeaderCell>
                    <HeaderCell>암 종류</HeaderCell>
                    <HeaderCell>진단 시기</HeaderCell>
                    <HeaderCell>위험도</HeaderCell>
                    <HeaderCell>상담 요청</HeaderCell>
                    <HeaderCell>상담 상태</HeaderCell>
                    <HeaderCell>보관</HeaderCell>
                  </tr>
                </TableHeader>
                <TableBody>
                  {filteredPatients.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={useIntegratedMode ? 10 : 9}
                        style={{ textAlign: "center" }}
                      >
                        {loading
                          ? "데이터를 불러오는 중..."
                          : "환자 데이터가 없습니다."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    // 현재 페이지에 해당하는 환자만 표시 (5명씩)
                    filteredPatients
                      .slice(
                        (currentPage - 1) * patientsPerPage,
                        currentPage * patientsPerPage
                      )
                      .map((patient) => (
                        <TableRow key={patient.id}>
                          <TableCell style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              aria-label={`${patient.name || "익명"} 선택`}
                              checked={selectedIds.has(patient.id)}
                              onChange={(e) =>
                                toggleSelectOne(patient.id, e.target.checked)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <StyledLink to={`/patients/${patient.id}`}>
                              {patient.name || "익명"}
                            </StyledLink>
                          </TableCell>
                          {useIntegratedMode && (
                            <TableCell>
                              <Badge
                                $variant={
                                  patient.type === SURVEY_TYPES.PATIENT
                                    ? "medium"
                                    : "low"
                                }
                                style={{
                                  backgroundColor:
                                    patient.type === SURVEY_TYPES.PATIENT
                                      ? "#fff3e0"
                                      : "#e8f5e9",
                                  border:
                                    patient.type === SURVEY_TYPES.PATIENT
                                      ? "1px solid #ffb74d"
                                      : "1px solid #81c784",
                                  color:
                                    patient.type === SURVEY_TYPES.PATIENT
                                      ? "#ef6c00"
                                      : "#2e7d32",
                                }}
                              >
                                {patient.type === SURVEY_TYPES.PATIENT
                                  ? "환자"
                                  : "생존자"}
                              </Badge>
                            </TableCell>
                          )}
                          <TableCell>
                            {formatBirthDate(patient.birthDate)}
                          </TableCell>
                          <TableCell>
                            {patient.cancerType || "정보 없음"}
                          </TableCell>
                          <TableCell>
                            {formatYearMonth(patient.diagnosisDate)}
                          </TableCell>
                          <TableCell>
                            <Badge $variant={patient.riskLevel}>
                              {patient.riskLevel === "high"
                                ? "위험"
                                : patient.riskLevel === "medium"
                                ? "주의"
                                : "양호"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {patient.requested ? (
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "4px 8px",
                                  borderRadius: 999,
                                  background: "#1976d2",
                                  color: "#fff",
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                요청됨
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "4px 8px",
                                  borderRadius: 999,
                                  background: "#e9ecef",
                                  color: "#555",
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                미요청
                              </span>
                            )}
                          </TableCell>
                          <TableCell
                            style={{
                              textAlign: "center",
                              position: "relative",
                            }}
                          >
                            {!patient.requested ? (
                              <span style={{ color: "#adb5bd" }}>—</span>
                            ) : (
                              <div
                                style={{
                                  display: "inline-block",
                                  position: "relative",
                                }}
                              >
                                <button
                                  data-role="status-trigger"
                                  data-patient-id={patient.id}
                                  ref={(el) => {
                                    if (el)
                                      triggerRefs.current.set(patient.id, el);
                                    else triggerRefs.current.delete(patient.id);
                                  }}
                                  onClick={(e) =>
                                    handleStatusTriggerClick(e, patient.id)
                                  }
                                  type="button"
                                  tabIndex={0}
                                  style={{
                                    padding: "4px 10px",
                                    borderRadius: 16,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    pointerEvents: "auto",
                                    position: "relative",
                                    zIndex: 5,
                                    ...getStatusChipStyle(
                                      patient.counselingStatus || "요청"
                                    ),
                                    outline: "none",
                                  }}
                                  aria-haspopup="listbox"
                                  aria-expanded={
                                    openStatusMenuId === patient.id
                                  }
                                  title="상담 상태 변경"
                                >
                                  {patient.counselingStatus || "요청"}
                                </button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell style={{ textAlign: "center" }}>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation?.();
                                if (
                                  !window.confirm(
                                    "이 환자를 보관 목록으로 이동할까요?"
                                  )
                                )
                                  return;
                                try {
                                  // 통합 모드: 타입에 따라 컬렉션 선택
                                  const patientType =
                                    patient.type || SURVEY_TYPES.SURVIVOR;
                                  const patientsCollection =
                                    patientType === SURVEY_TYPES.PATIENT
                                      ? "patients_patients"
                                      : "patients";

                                  await updateDoc(
                                    doc(db, patientsCollection, patient.id),
                                    {
                                      archived: true,
                                      archivedAt: serverTimestamp(),
                                      updatedAt: serverTimestamp(),
                                    }
                                  );

                                  if (!showArchived) {
                                    setPatients((prev) =>
                                      prev.filter((p) => p.id !== patient.id)
                                    );
                                    setFilteredPatients((prev) =>
                                      prev.filter((p) => p.id !== patient.id)
                                    );
                                  } else {
                                    setPatients((prev) =>
                                      prev.map((p) =>
                                        p.id === patient.id
                                          ? { ...p, archived: true }
                                          : p
                                      )
                                    );
                                    setFilteredPatients((prev) =>
                                      prev.map((p) =>
                                        p.id === patient.id
                                          ? { ...p, archived: true }
                                          : p
                                      )
                                    );
                                  }
                                } catch (err) {
                                  console.error("보관 처리 실패:", err);
                                  alert(
                                    "보관 처리에 실패했습니다. 잠시 후 다시 시도해주세요."
                                  );
                                }
                              }}
                              style={{
                                padding: "4px 10px",
                                borderRadius: 4,
                                border: "1px solid #1976d2",
                                background: "#e3f2fd",
                                color: "#1976d2",
                                fontSize: 12,
                                cursor: "pointer",
                              }}
                              title="이 환자를 보관 목록으로 이동합니다"
                            >
                              보관
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </PatientTable>

              {/* StatusMenuPortal: 상담 상태 드롭다운 포털 */}
              <StatusMenuPortal
                anchorEl={
                  openStatusMenuId
                    ? triggerRefs.current.get(openStatusMenuId)
                    : null
                }
                open={!!openStatusMenuId}
                value={
                  filteredPatients.find((p) => p.id === openStatusMenuId)
                    ?.counselingStatus || "요청"
                }
                onSelect={async (s) => {
                  const targetId = openStatusMenuId;
                  if (!targetId) return;

                  const prevUi = (
                    filteredPatients.find((p) => p.id === targetId)
                      ?.counselingStatus || "요청"
                  ).trim();
                  const nextUi = fromUiStatus(s); // normalized label we persist to patients
                  console.log("[StatusSelect] select:", {
                    targetId,
                    selected: s,
                    prevUi,
                    nextUi,
                  });

                  // 1) Optimistic UI for rendered lists
                  setPatients((prev) =>
                    prev.map((p) =>
                      p.id === targetId ? { ...p, counselingStatus: s } : p
                    )
                  );
                  setFilteredPatients((prev) =>
                    prev.map((p) =>
                      p.id === targetId ? { ...p, counselingStatus: s } : p
                    )
                  );

                  // 1-1) Optimistic for raw list too, so merge effect won't bounce back
                  setPatientsRaw((prev) =>
                    prev.map((p) =>
                      p.id === targetId ? { ...p, counselingStatus: nextUi } : p
                    )
                  );

                  // 1-2) Optimistic for latest map so it won't override via merge
                  const latestPrev = latestRequestByUser.get(targetId);
                  let prevRawStatus = null;
                  if (latestPrev) {
                    prevRawStatus = latestPrev.status || "pending";
                    const nextRawStatus = uiToRawRequestStatus(nextUi);
                    const wasPending = prevRawStatus === "pending";
                    const isPending = nextRawStatus === "pending";

                    // Map을 새로 생성하여 참조 변경 (React가 변경 감지하도록)
                    setLatestRequestByUser((prev) => {
                      const next = new Map(prev);
                      next.set(targetId, {
                        ...latestPrev,
                        status: nextRawStatus,
                      });
                      return next;
                    });

                    // 상담 상태 변경 시 즉시 카운트 업데이트
                    if (wasPending !== isPending) {
                      setStatsData((prev) => {
                        const newCount = isPending
                          ? prev.pendingRequests + 1
                          : Math.max(0, prev.pendingRequests - 1);
                        console.log(
                          "[StatusSelect] Updating pendingRequests:",
                          {
                            wasPending,
                            isPending,
                            oldCount: prev.pendingRequests,
                            newCount,
                          }
                        );
                        return { ...prev, pendingRequests: newCount };
                      });
                    }
                  }

                  setOpenStatusMenuId(null);

                  try {
                    // 2) Persist to patients/{id} (타입에 따라 컬렉션 선택)
                    const targetPatient = filteredPatients.find(
                      (p) => p.id === targetId
                    );
                    const patientType =
                      targetPatient?.type || SURVEY_TYPES.SURVIVOR;
                    const patientsCollection =
                      patientType === SURVEY_TYPES.PATIENT
                        ? "patients_patients"
                        : "patients";

                    await updateDoc(doc(db, patientsCollection, targetId), {
                      counselingStatus: nextUi,
                      updatedAt: new Date().toISOString(),
                    });
                    console.log("[StatusSelect] patients updated", {
                      id: targetId,
                      collection: patientsCollection,
                      counselingStatus: nextUi,
                    });

                    // 3) Best-effort sync to latest counselingRequests (타입에 따라 컬렉션 선택)
                    const latest = latestRequestByUser.get(targetId);
                    if (latest && latest.id) {
                      try {
                        const raw = uiToRawRequestStatus(nextUi);
                        const requestsCollection =
                          patientType === SURVEY_TYPES.PATIENT
                            ? "patients_counselingRequests"
                            : "counselingRequests";

                        await updateDoc(
                          doc(db, requestsCollection, latest.id),
                          {
                            status: raw,
                            updatedAt: new Date().toISOString(),
                          }
                        );
                        console.log(
                          "[StatusSelect] counselingRequests updated",
                          {
                            requestId: latest.id,
                            collection: requestsCollection,
                            status: raw,
                          }
                        );
                        setLatestRequestByUser((prev) => {
                          const next = new Map(prev);
                          const cur = next.get(targetId);
                          if (cur) next.set(targetId, { ...cur, status: raw });
                          return next;
                        });
                      } catch (e) {
                        console.warn(
                          "[StatusSelect] counselingRequests sync failed (non-fatal)",
                          e
                        );
                      }
                    }
                  } catch (err) {
                    console.error(
                      "[StatusSelect] Firestore update failed. Rollback.",
                      err
                    );

                    // Rollback lists
                    setPatients((prev) =>
                      prev.map((p) =>
                        p.id === targetId
                          ? { ...p, counselingStatus: prevUi }
                          : p
                      )
                    );
                    setFilteredPatients((prev) =>
                      prev.map((p) =>
                        p.id === targetId
                          ? { ...p, counselingStatus: prevUi }
                          : p
                      )
                    );
                    setPatientsRaw((prev) =>
                      prev.map((p) =>
                        p.id === targetId
                          ? { ...p, counselingStatus: prevUi }
                          : p
                      )
                    );

                    // Rollback latest map
                    if (typeof prevRawStatus === "string" && latestPrev) {
                      setLatestRequestByUser((prev) => {
                        const next = new Map(prev);
                        next.set(targetId, {
                          ...latestPrev,
                          status: prevRawStatus,
                        });
                        return next;
                      });
                    }

                    alert(
                      "상태 변경에 실패했습니다. 권한 또는 네트워크 문제를 확인해주세요."
                    );
                  }
                }}
                onClose={() => setOpenStatusMenuId(null)}
              />

              {/* 페이지네이션 컨트롤 추가 */}
              {filteredPatients.length > patientsPerPage && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "1rem",
                    gap: "0.5rem",
                  }}
                >
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "4px",
                      border: "1px solid #dee2e6",
                      background: currentPage === 1 ? "#f8f9fa" : "white",
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      color: currentPage === 1 ? "#adb5bd" : "#2a5e8c",
                    }}
                  >
                    이전
                  </button>

                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                    }}
                  >
                    {/* 페이지 번호 버튼 생성 */}
                    {[
                      ...Array(
                        Math.ceil(filteredPatients.length / patientsPerPage)
                      ),
                    ].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        style={{
                          padding: "0.5rem 1rem",
                          borderRadius: "4px",
                          border: "1px solid #dee2e6",
                          background:
                            currentPage === i + 1 ? "#2a5e8c" : "white",
                          color: currentPage === i + 1 ? "white" : "#212529",
                          cursor: "pointer",
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(
                          prev + 1,
                          Math.ceil(filteredPatients.length / patientsPerPage)
                        )
                      )
                    }
                    disabled={
                      currentPage ===
                      Math.ceil(filteredPatients.length / patientsPerPage)
                    }
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "4px",
                      border: "1px solid #dee2e6",
                      background:
                        currentPage ===
                        Math.ceil(filteredPatients.length / patientsPerPage)
                          ? "#f8f9fa"
                          : "white",
                      cursor:
                        currentPage ===
                        Math.ceil(filteredPatients.length / patientsPerPage)
                          ? "not-allowed"
                          : "pointer",
                      color:
                        currentPage ===
                        Math.ceil(filteredPatients.length / patientsPerPage)
                          ? "#adb5bd"
                          : "#2a5e8c",
                    }}
                  >
                    다음
                  </button>
                </div>
              )}
            </CardContent>
          </TableCard>
        </Section>

        <div>
          <Section>
            <SectionTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              암 종류별 통계
            </SectionTitle>

            <ChartCard>
              <ChartContainer>
                <Bar
                  data={cancerTypeData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </ChartContainer>
            </ChartCard>
          </Section>

          <Section>
            <SectionTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="7" y1="12" x2="17" y2="12"></line>
              </svg>
              위험도 분포
            </SectionTitle>

            <ChartCard>
              <ChartContainer>
                <Bar
                  data={riskTypeData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                  }}
                />
              </ChartContainer>
            </ChartCard>
          </Section>

          <Section>
            <SectionTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              최근 활동
            </SectionTitle>

            <ActivityCard>
              <CardHeader>
                <h3 style={{ margin: 0, fontSize: "1rem" }}>최근 상담 요청</h3>
              </CardHeader>

              <ActivityList>
                {recentActivities.length === 0 ? (
                  <div style={{ padding: "1.5rem", textAlign: "center" }}>
                    최근 활동이 없습니다.
                  </div>
                ) : (
                  recentActivities.map((activity) => (
                    <ActivityItem key={activity.id}>
                      <ActivityIcon type={activity.status}>
                        {activity.status === "pending" ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
                            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
                          </svg>
                        ) : activity.status === "completed" ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                        )}
                      </ActivityIcon>

                      <ActivityContent>
                        <ActivityTitle>
                          {activity.name || "익명"} 님이 상담을 요청했습니다.
                        </ActivityTitle>
                        <ActivityMeta>
                          <span>
                            {activity.createdAt.toLocaleDateString()}{" "}
                            {activity.createdAt.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <StyledLink to={`/counseling-record/${activity.id}`}>
                            상세보기
                          </StyledLink>
                        </ActivityMeta>
                      </ActivityContent>
                    </ActivityItem>
                  ))
                )}
              </ActivityList>
            </ActivityCard>
          </Section>
        </div>
      </TwoColumnLayout>
    </Layout>
  );
}

export default DashboardPage;
