// src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import Layout from '../components/Layout';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Chart.js 등록
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
  background-color: ${({ theme, bgColor }) => bgColor || theme.colors.primary.light};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  
  svg {
    color: ${({ theme, iconColor }) => iconColor || theme.colors.primary.main};
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
  color: ${({ theme, isPositive }) => 
    isPositive ? theme.colors.functional.success : 
    isPositive === false ? theme.colors.functional.error : 
    theme.colors.neutral.grey
  };
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
  overflow: hidden;
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
  margin-left: auto;
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
`;

// 테이블 헤더
const TableHeader = styled.thead`
  background-color: ${({ theme }) => theme.colors.neutral.lighterGrey};
`;

// 헤더 셀
const HeaderCell = styled.th`
  text-align: left;
  padding: ${({ theme }) => theme.spacing.md};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.neutral.darkGrey};
  font-size: ${({ theme }) => theme.fontSize.sm};
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
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.neutral.text};
  font-size: ${({ theme }) => theme.fontSize.sm};
`;

// 링크 스타일
const StyledLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary.main};
  text-decoration: none;
  font-weight: 500;
  
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
  background-color: ${({ theme, type }) => {
    if (type === 'high') return theme.colors.functional.error;
    if (type === 'medium') return theme.colors.functional.warning;
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
    if (type === 'request') return theme.colors.primary.light;
    if (type === 'completed') return theme.colors.functional.success + '20';
    return theme.colors.neutral.lightGrey;
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: ${({ theme }) => theme.spacing.md};
  
  svg {
    color: ${({ theme, type }) => {
      if (type === 'request') return theme.colors.primary.main;
      if (type === 'completed') return theme.colors.functional.success;
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

// 상담 요청 상태를 한글로 변환
const getRequestStatusText = (status) => {
  const statuses = {
    'pending': '대기 중',
    'accepted': '예약 확정',
    'completed': '완료',
    'cancelled': '취소됨'
  };
  return statuses[status] || '알 수 없음';
};

// 영역별 평균 및 표준편차 정보
const domainStats = {
  physical: { mean: 3.09, sd: 0.95 },
  selfcare: { mean: 3.63, sd: 0.76 },
  support: { mean: 3.84, sd: 0.94 },
  psychological: { mean: 3.08, sd: 0.91 },
  social: { mean: 3.39, sd: 1.20 },
  resilience: { mean: 4.28, sd: 0.72 }
};

// 생년월일을 연-월-일 형식으로 포맷하는 함수
const formatBirthDate = (birthDate) => {
  if (!birthDate) return '정보 없음';
  
  // 이미 포맷된 문자열인 경우 (YYYY-MM-DD)
  if (typeof birthDate === 'string' && birthDate.includes('-')) {
    return birthDate;
  }
  
  // Date 객체인 경우
  if (birthDate instanceof Date) {
    return birthDate.toISOString().split('T')[0];
  }
  
  // Firestore Timestamp인 경우
  if (birthDate && typeof birthDate.toDate === 'function') {
    return birthDate.toDate().toISOString().split('T')[0];
  }
  
  return '정보 없음';
};

function DashboardPage() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [statsData, setStatsData] = useState({
    totalPatients: 0,
    newPatients: 0,
    pendingRequests: 0,
    highRiskPatients: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    riskLevel: 'all',
    cancerType: 'all',
    treatmentStatus: 'all',
    searchTerm: ''
  });
  
  // 페이지네이션 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 5; // 한 페이지당 5명의 환자만 표시
  
  // 환자 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        // users 컬렉션에서 환자 데이터 불러오기
        const usersSnapshot = await getDocs(collection(db, "users"));
        const patientsData = [];
        let totalPatients = 0;
        let highRiskPatients = 0;
        
        // 한 달 전 날짜
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        let newPatients = 0;
        
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          
          // 유저 데이터가 있는 경우만 추가
          if (userData) {
            const patient = {
              id: doc.id,
              name: userData.name || '익명',
              age: userData.age || '',
              gender: userData.gender || '',
              cancerType: userData.cancerType || '',
              currentTreatment: userData.currentTreatment || '',
              diagnosisDate: userData.diagnosisDate || '',
              birthDate: userData.birthDate || '',
              mentalHealthHistory: userData.mentalHealthHistory || '',
              physicalLimitations: userData.physicalLimitations || '',
              treatmentTypes: userData.treatmentTypes || [],
              otherCancerType: userData.otherCancerType || '',
              otherTreatmentType: userData.otherTreatmentType || '',
              createdAt: userData.createdAt?.toDate?.() || new Date()
            };
            
            // 위험도 계산 - newScore 기반
            let riskLevel = 'low'; // 기본값
            let averageNewScore = 0;
            
            // 설문 데이터가 있는 경우에만 newScore 기반 위험도 계산
            if (userData.answers) {
              // 모든 카테고리의 평균 newScore 계산을 위한 준비
              const categoryQuestions = {
                physical: [1, 2, 3, 4, 5, 6, 7, 8],
                selfcare: [9, 10, 11, 12, 13],
                support: [14, 15, 16, 17],
                psychological: [18, 19, 20, 21, 22, 23, 24, 25],
                social: [26, 27, 28],
                resilience: [29, 30, 31]
              };
              
              // 각 카테고리별 newScore 계산
              let totalNewScore = 0;
              let categoriesWithScores = 0;
              
              Object.entries(categoryQuestions).forEach(([category, questions]) => {
                let totalScore = 0;
                let answeredQuestions = 0;
                
                questions.forEach(questionNum => {
                  const answerKey = `q${questionNum}`;
                  if (userData.answers[answerKey]) {
                    // 역코딩이 필요한 문항 처리 (일부 질문은 점수가 높을수록 부정적)
                    const needsReverseScoring = [1, 2, 3, 4, 5, 6, 7, 8, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28];
                    const score = parseInt(userData.answers[answerKey]);
                    
                    if (needsReverseScoring.includes(questionNum)) {
                      // 역코딩 (1->5, 2->4, 3->3, 4->2, 5->1)
                      totalScore += (6 - score); 
                    } else {
                      totalScore += score;
                    }
                    answeredQuestions++;
                  }
                });
                
                // 5점 척도 평균 점수
                const scaleScore = answeredQuestions > 0 ? totalScore / answeredQuestions : 0;
                
                // NewScore 계산 (Z 점수 기반)
                if (answeredQuestions > 0 && domainStats[category]) {
                  // Z 점수 계산
                  const zScore = (scaleScore - domainStats[category].mean) / domainStats[category].sd;
                  // NewScore 계산: (Z점수 * 16.67) + 50
                  const newScore = Math.round((zScore * 16.67) + 50);
                  totalNewScore += newScore;
                  categoriesWithScores++;
                }
              });
              
              // 전체 평균 newScore 계산
              averageNewScore = categoriesWithScores > 0 ? totalNewScore / categoriesWithScores : 0;
              
              // 평균 newScore 기준으로 위험도 결정
              if (averageNewScore < 40) {
                riskLevel = 'high'; // 40점 미만은 위험
                highRiskPatients++;
              } else if (averageNewScore < 50) {
                riskLevel = 'medium'; // 40~49점은 주의
              } else {
                riskLevel = 'low'; // 50점 이상은 양호호
              }
            } else {
              // 설문 데이터가 없는 경우 기존 로직으로 대체
              if (userData.mentalHealthHistory && userData.mentalHealthHistory !== "아니오") {
                riskLevel = 'high';
                highRiskPatients++;
              } else if (userData.physicalLimitations) {
                riskLevel = 'medium';
              }
            }
            
            // 신규 환자 판별
            if (patient.createdAt > oneMonthAgo) {
              newPatients++;
            }
            
            patientsData.push({
              ...patient,
              riskLevel,
              averageNewScore
            });
            
            totalPatients++;
          }
        });
        
        // 상담 요청 데이터 불러오기
        const counselingSnapshot = await getDocs(
          query(collection(db, "counselingRequests"), where("status", "==", "pending"))
        );
        
        // 최근 활동 데이터 불러오기
        const activitiesQuery = query(
          collection(db, "counselingRequests"),
          orderBy("createdAt", "desc")
        );
        
        const activitiesSnapshot = await getDocs(activitiesQuery);
        const activitiesData = [];
        
        activitiesSnapshot.forEach(doc => {
          const activity = {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          };
          
          activitiesData.push(activity);
        });
        
        setPatients(patientsData);
        setFilteredPatients(patientsData);
        setRecentActivities(activitiesData.slice(0, 5));
        setStatsData({
          totalPatients,
          newPatients,
          pendingRequests: counselingSnapshot.size,
          highRiskPatients
        });
        setLoading(false);
      } catch (error) {
        console.error("데이터 불러오기 오류:", error);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // 필터링 로직
  useEffect(() => {
    let filtered = [...patients];
    
    // 위험도 필터
    if (filters.riskLevel !== 'all') {
      filtered = filtered.filter(patient => patient.riskLevel === filters.riskLevel);
    }
    
    // 암 종류 필터 - 이제 한글 값을 직접 비교
    if (filters.cancerType !== 'all') {
      filtered = filtered.filter(patient => {
        // 한글 암 종류로 직접 비교
        if (filters.cancerType === 'breast') return patient.cancerType === '유방암';
        if (filters.cancerType === 'colorectal') return patient.cancerType === '대장암';
        if (filters.cancerType === 'lung') return patient.cancerType === '폐암';
        if (filters.cancerType === 'gastric') return patient.cancerType === '위암';
        if (filters.cancerType === 'liver') return patient.cancerType === '간암';
        if (filters.cancerType === 'thyroid') return patient.cancerType === '갑상선암';
        if (filters.cancerType === 'prostate') return patient.cancerType === '전립선암';
        // 기타 또는 기타암 처리
        return patient.cancerType === '기타' || patient.cancerType === '기타암';
      });
    }
    
    // 치료 상태 필터 - 한글 값 직접 비교
    if (filters.treatmentStatus !== 'all') {
      filtered = filtered.filter(patient => {
        // 치료 상태 한글값으로 직접 비교
        if (filters.treatmentStatus === 'ongoing') return patient.currentTreatment.includes('치료 중');
        if (filters.treatmentStatus === 'completed') return patient.currentTreatment.includes('치료 완료');
        if (filters.treatmentStatus === 'recurrence') return patient.currentTreatment.includes('재발');
        return patient.currentTreatment.includes('경과 확인');
      });
    }
    
    // 검색어 필터
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(patient => 
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
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 암 종류별 환자 수 차트 데이터 - 한글 데이터 사용
  const cancerTypeData = {
    labels: ['유방암', '대장암', '폐암', '위암', '간암', '갑상선암', '전립선암', '기타'],
    datasets: [
      {
        label: '환자 수',
        data: [
          patients.filter(p => p.cancerType === '유방암').length,
          patients.filter(p => p.cancerType === '대장암').length,
          patients.filter(p => p.cancerType === '폐암').length,
          patients.filter(p => p.cancerType === '위암').length,
          patients.filter(p => p.cancerType === '간암').length,
          patients.filter(p => p.cancerType === '갑상선암').length,
          patients.filter(p => p.cancerType === '전립선암').length,
          patients.filter(p => p.cancerType === '기타' || p.cancerType === '기타암').length
        ],
        backgroundColor: [
          '#4e73df',
          '#1cc88a',
          '#36b9cc',
          '#f6c23e',
          '#e74a3b',
          '#5a5c69',
          '#6f42c1',
          '#fd7e14'
        ],
      }
    ],
  };
  
  return (
    <Layout title="대시보드">
      <Section>
        <SectionTitle>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          환자 현황
        </SectionTitle>
        
        <StatsGrid>
          <StatCard>
            <CardIcon bgColor="#E3F2FD">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </CardIcon>
            <CardTitle>총 환자 수</CardTitle>
            <CardValue>{statsData.totalPatients}</CardValue>
            <CardInfo isPositive={true}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
              {statsData.newPatients} 신규 환자
            </CardInfo>
          </StatCard>
          
          <StatCard>
            <CardIcon bgColor="#E8F5E9" iconColor="#388E3C">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </CardIcon>
            <CardTitle>완료된 설문</CardTitle>
            <CardValue color="#388E3C">
              {patients.length}
            </CardValue>
            <CardInfo>
              {statsData.totalPatients > 0 ? Math.round((patients.length / statsData.totalPatients) * 100) : 0}% 완료율
            </CardInfo>
          </StatCard>
          
          <StatCard>
            <CardIcon bgColor="#FFF3E0" iconColor="#F57C00">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </CardIcon>
            <CardTitle>상담 요청</CardTitle>
            <CardValue color="#F57C00">{statsData.pendingRequests}</CardValue>
            <CardInfo>대기 중</CardInfo>
          </StatCard>
          
          <StatCard>
            <CardIcon bgColor="#FFEBEE" iconColor="#D32F2F">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </CardIcon>
            <CardTitle>위험군 환자</CardTitle>
            <CardValue color="#D32F2F">{statsData.highRiskPatients}</CardValue>
            <CardInfo isPositive={false}>
              {statsData.totalPatients > 0 ? Math.round((statsData.highRiskPatients / statsData.totalPatients) * 100) : 0}% 비율
            </CardInfo>
          </StatCard>
        </StatsGrid>
      </Section>
      
      <TwoColumnLayout>
        <Section>
          <SectionTitle>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
            환자 목록
          </SectionTitle>
          
          <TableCard>
            <CardHeader>
              <FilterBar>
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
                  <FilterLabel htmlFor="treatmentStatus">치료 상태:</FilterLabel>
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
                
                <SearchInput
                  type="text"
                  name="searchTerm"
                  value={filters.searchTerm}
                  onChange={handleFilterChange}
                  placeholder="환자 이름 검색..."
                /></FilterBar>
            </CardHeader>
            
            <CardContent>
              <PatientTable>
                <TableHeader>
                  <tr>
                    <HeaderCell>ID</HeaderCell>
                    <HeaderCell>이름</HeaderCell>
                    <HeaderCell>암 종류</HeaderCell>
                    <HeaderCell>생년월일</HeaderCell>
                    <HeaderCell>진단 시기</HeaderCell>
                    <HeaderCell>위험도</HeaderCell>
                    <HeaderCell>상담 기록</HeaderCell>
                  </tr>
                </TableHeader>
                <TableBody>
                  {filteredPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan="7" style={{ textAlign: 'center' }}>
                        {loading ? '데이터를 불러오는 중...' : '환자 데이터가 없습니다.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    // 현재 페이지에 해당하는 환자만 표시 (5명씩)
                    filteredPatients
                      .slice((currentPage - 1) * patientsPerPage, currentPage * patientsPerPage)
                      .map(patient => (
                        <TableRow key={patient.id}>
                          <TableCell>{patient.id.substring(0, 8)}...</TableCell>
                          <TableCell>
                            <StyledLink to={`/patients/${patient.id}`}>
                              {patient.name || '익명'}
                            </StyledLink>
                          </TableCell>
                          <TableCell>
                            {patient.cancerType}
                          </TableCell>
                          <TableCell>
                            {formatBirthDate(patient.birthDate)}
                          </TableCell>
                          <TableCell>
                            {patient.diagnosisDate || '정보 없음'}
                          </TableCell>
                          <TableCell>
                            <Badge type={patient.riskLevel}>
                              {patient.riskLevel === 'high' ? '위험' : 
                              patient.riskLevel === 'medium' ? '주의' : '양호'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <StyledLink to={`/patients/${patient.id}?tab=counseling`}>
                              상세 보기
                            </StyledLink>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </PatientTable>
              
              {/* 페이지네이션 컨트롤 추가 */}
              {filteredPatients.length > patientsPerPage && (
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '1rem',
                  gap: '0.5rem'
                }}>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      border: '1px solid #dee2e6',
                      background: currentPage === 1 ? '#f8f9fa' : 'white',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      color: currentPage === 1 ? '#adb5bd' : '#2a5e8c'
                    }}
                  >
                    이전
                  </button>
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem' 
                  }}>
                    {/* 페이지 번호 버튼 생성 */}
                    {[...Array(Math.ceil(filteredPatients.length / patientsPerPage))].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '4px',
                          border: '1px solid #dee2e6',
                          background: currentPage === i + 1 ? '#2a5e8c' : 'white',
                          color: currentPage === i + 1 ? 'white' : '#212529',
                          cursor: 'pointer'
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredPatients.length / patientsPerPage)))}
                    disabled={currentPage === Math.ceil(filteredPatients.length / patientsPerPage)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      border: '1px solid #dee2e6',
                      background: currentPage === Math.ceil(filteredPatients.length / patientsPerPage) ? '#f8f9fa' : 'white',
                      cursor: currentPage === Math.ceil(filteredPatients.length / patientsPerPage) ? 'not-allowed' : 'pointer',
                      color: currentPage === Math.ceil(filteredPatients.length / patientsPerPage) ? '#adb5bd' : '#2a5e8c'
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                        display: false
                      }
                    }
                  }} 
                />
              </ChartContainer>
            </ChartCard>
          </Section>
          
          <Section>
            <SectionTitle>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              최근 활동
            </SectionTitle>
            
            <ActivityCard>
              <CardHeader>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>최근 상담 요청</h3>
              </CardHeader>
              
              <ActivityList>
                {recentActivities.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                    최근 활동이 없습니다.
                  </div>
                ) : (
                  recentActivities.map(activity => (
                    <ActivityItem key={activity.id}>
                      <ActivityIcon type={activity.status}>
                        {activity.status === 'pending' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
                            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
                          </svg>
                        ) : activity.status === 'completed' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                        )}
                      </ActivityIcon>
                      
                      <ActivityContent>
                        <ActivityTitle>
                          {activity.name || '익명'} 님이 상담을 요청했습니다.
                        </ActivityTitle>
                        <ActivityMeta>
                          <span>
                            {activity.createdAt.toLocaleDateString()} {activity.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
