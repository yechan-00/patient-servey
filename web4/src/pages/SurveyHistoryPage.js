// src/pages/SurveyHistoryPage.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #2a5e8c;
  margin: 0;
`;

const BackButton = styled.button`
  background-color: transparent;
  color: #2a5e8c;
  border: 2px solid #2a5e8c;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #2a5e8c;
    color: white;
  }
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const FilterTab = styled.button`
  padding: 0.5rem 1rem;
  border: 2px solid #e9ecef;
  background-color: ${(props) => (props.active ? "#2a5e8c" : "white")};
  color: ${(props) => (props.active ? "white" : "#495057")};
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: #2a5e8c;
    background-color: ${(props) => (props.active ? "#1d4269" : "#f8f9fa")};
  }
`;

const SurveyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SurveyCard = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
`;

const SurveyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const SurveyTitle = styled.h3`
  font-size: 1.25rem;
  color: #2a5e8c;
  margin: 0;
`;

const SurveyType = styled.span`
  background-color: #e7f3ff;
  color: #2a5e8c;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const SurveyMeta = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #6c757d;
  flex-wrap: wrap;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyText = styled.p`
  color: #6c757d;
  font-size: 1.1rem;
  margin: 0 0 1.5rem 0;
`;

const EmptyButton = styled.button`
  background-color: #2a5e8c;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #1d4269;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(42, 94, 140, 0.3);
  }
`;

const Loading = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6c757d;
`;

function SurveyHistoryPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const surveysRef = collection(db, "user_surveys");
    let q;

    if (filter === "all") {
      q = query(
        surveysRef,
        where("userId", "==", currentUser.uid),
        orderBy("completedAt", "desc")
      );
    } else {
      q = query(
        surveysRef,
        where("userId", "==", currentUser.uid),
        where("surveyType", "==", filter),
        orderBy("completedAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const surveysData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSurveys(surveysData);
        setLoading(false);
      },
      (error) => {
        console.error("설문 이력 조회 오류:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, navigate, filter]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "날짜 없음";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSurveyTypeName = (type) => {
    return type === "survivor" ? "생존자 설문" : "환자 설문";
  };

  const handleSurveyClick = (surveyType) => {
    const baseUrls = {
      survivor: "https://yechan-00.github.io/patient-servey/web1",
      patient: "https://yechan-00.github.io/patient-servey/web3",
    };
    window.open(baseUrls[surveyType], "_blank");
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
        <Title>내 설문 이력</Title>
        <BackButton onClick={() => navigate("/surveys")}>
          설문 페이지로
        </BackButton>
      </Header>

      <FilterTabs>
        <FilterTab active={filter === "all"} onClick={() => setFilter("all")}>
          전체
        </FilterTab>
        <FilterTab
          active={filter === "survivor"}
          onClick={() => setFilter("survivor")}
        >
          생존자 설문
        </FilterTab>
        <FilterTab
          active={filter === "patient"}
          onClick={() => setFilter("patient")}
        >
          환자 설문
        </FilterTab>
      </FilterTabs>

      {surveys.length === 0 ? (
        <EmptyState>
          <EmptyIcon>📋</EmptyIcon>
          <EmptyText>
            {filter === "all"
              ? "아직 참여한 설문이 없습니다."
              : `아직 ${getSurveyTypeName(filter)}에 참여하지 않았습니다.`}
          </EmptyText>
          <EmptyButton onClick={() => navigate("/surveys")}>
            설문 참여하기
          </EmptyButton>
        </EmptyState>
      ) : (
        <SurveyList>
          {surveys.map((survey) => (
            <SurveyCard
              key={survey.id}
              onClick={() => handleSurveyClick(survey.surveyType)}
            >
              <SurveyHeader>
                <SurveyTitle>
                  {getSurveyTypeName(survey.surveyType)}
                </SurveyTitle>
                <SurveyType>{getSurveyTypeName(survey.surveyType)}</SurveyType>
              </SurveyHeader>
              <SurveyMeta>
                <span>완료일: {formatDate(survey.completedAt)}</span>
                {survey.patientId && (
                  <span>환자 ID: {survey.patientId.substring(0, 8)}...</span>
                )}
              </SurveyMeta>
            </SurveyCard>
          ))}
        </SurveyList>
      )}
    </Container>
  );
}

export default SurveyHistoryPage;
