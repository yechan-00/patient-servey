// src/pages/SurveysPage.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #2a5e8c;
  margin: 0 0 1rem 0;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #6c757d;
  text-align: center;
  margin-bottom: 3rem;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SurveyCard = styled.div`
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 16px;
  padding: 3rem 2rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  text-align: center;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  }
`;

const CardIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;
`;

const CardTitle = styled.h2`
  font-size: 2rem;
  color: #2a5e8c;
  margin: 0 0 1rem 0;
`;

const CardDescription = styled.p`
  color: #495057;
  line-height: 1.8;
  margin: 0 0 2rem 0;
  font-size: 1.1rem;
`;

const CardButton = styled.button`
  background-color: #2a5e8c;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #1d4269;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(42, 94, 140, 0.3);
  }
`;

const InfoSection = styled.section`
  background-color: white;
  border-radius: 12px;
  padding: 2rem;
  margin-top: 3rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const InfoTitle = styled.h3`
  font-size: 1.5rem;
  color: #2a5e8c;
  margin: 0 0 1rem 0;
`;

const InfoList = styled.ul`
  color: #495057;
  line-height: 2;
  padding-left: 1.5rem;
  margin: 0;
`;

const SignupBanner = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  text-align: center;
`;

const BannerTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
`;

const BannerText = styled.p`
  margin: 0 0 1rem 0;
  opacity: 0.9;
`;

const BannerButton = styled.button`
  background-color: white;
  color: #2a5e8c;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const MemberInfo = styled.div`
  background-color: #e7f3ff;
  border-left: 4px solid #2a5e8c;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const MemberInfoText = styled.p`
  margin: 0;
  color: #2a5e8c;
  font-size: 0.9rem;
`;

const HistoryButton = styled.button`
  background-color: transparent;
  color: #2a5e8c;
  border: 2px solid #2a5e8c;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.3s ease;

  &:hover {
    background-color: #2a5e8c;
    color: white;
  }
`;

function SurveysPage() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [surveyHistory, setSurveyHistory] = useState({
    survivor: null,
    patient: null,
  });

  useEffect(() => {
    if (currentUser) {
      // 회원의 설문 이력 조회
      const surveysRef = collection(db, "user_surveys");
      const q = query(
        surveysRef,
        where("userId", "==", currentUser.uid),
        orderBy("completedAt", "desc")
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const surveys = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const lastSurvivor = surveys.find((s) => s.surveyType === "survivor");
          const lastPatient = surveys.find((s) => s.surveyType === "patient");

          setSurveyHistory({
            survivor: lastSurvivor,
            patient: lastPatient,
          });
        },
        (error) => {
          console.error("설문 이력 조회 오류:", error);
        }
      );

      return () => unsubscribe();
    }
  }, [currentUser]);

  const handleSurveyClick = async (surveyType) => {
    const baseUrls = {
      survivor: "https://yechan-00.github.io/patient-servey/web1",
      patient: "https://yechan-00.github.io/patient-servey/web3",
    };

    let surveyUrl = baseUrls[surveyType];

    // 회원인 경우 사용자 정보를 localStorage에 저장 (설문 앱에서 읽을 수 있도록)
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

    // 설문 링크 열기
    const surveyWindow = window.open(surveyUrl, "_blank");

    // 설문 완료 후 돌아왔을 때 처리 (회원인 경우)
    if (currentUser && surveyWindow) {
      // 설문 창이 닫혔는지 확인하는 간단한 방법
      // 실제로는 설문 앱에서 완료 후 postMessage를 보내는 것이 더 정확함
      const checkInterval = setInterval(() => {
        if (surveyWindow.closed) {
          clearInterval(checkInterval);
          // 설문 참여 기록 저장 (실제로는 설문 앱에서 완료 시점에 저장해야 함)
          // 여기서는 참여 시작만 기록
        }
      }, 1000);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return null;
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getSurveyCard = (surveyType, title, description, icon) => {
    const history = surveyHistory[surveyType];
    const isMember = !!currentUser;

    return (
      <SurveyCard>
        <CardIcon>{icon}</CardIcon>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>

        {isMember && history && (
          <MemberInfo>
            <MemberInfoText>
              마지막 참여: {formatDate(history.completedAt)}
            </MemberInfoText>
            <HistoryButton onClick={() => navigate("/survey-history")}>
              내 설문 이력 보기
            </HistoryButton>
          </MemberInfo>
        )}

        {isMember && !history && (
          <MemberInfo>
            <MemberInfoText>
              아직 참여한 설문이 없습니다. 첫 설문을 시작해보세요!
            </MemberInfoText>
          </MemberInfo>
        )}

        <CardButton onClick={() => handleSurveyClick(surveyType)}>
          {title} 참여하기
        </CardButton>
      </SurveyCard>
    );
  };

  return (
    <Container>
      <Title>설문 참여</Title>
      <Subtitle>
        여러분의 소중한 경험과 의견을 공유해주세요. 설문 결과는 더 나은 서비스
        제공에 활용됩니다.
      </Subtitle>

      {!currentUser && (
        <SignupBanner>
          <BannerTitle>회원가입하고 설문 이력을 관리하세요!</BannerTitle>
          <BannerText>
            회원가입을 하시면 설문 결과를 추적하고, 이전 설문 이력을 확인할 수
            있습니다.
          </BannerText>
          <BannerButton onClick={() => navigate("/signup")}>
            지금 회원가입하기
          </BannerButton>
        </SignupBanner>
      )}

      <CardGrid>
        {getSurveyCard(
          "survivor",
          "생존자 설문",
          "암 생존자를 위한 건강 설문입니다. 치료 후 건강 상태, 일상 생활, 심리적 상태 등을 기록하고 관리할 수 있습니다.",
          "📋"
        )}

        {getSurveyCard(
          "patient",
          "환자 설문",
          "현재 치료 중이신 환자분들을 위한 설문입니다. 치료 과정, 증상 관리, 일상 생활 등을 기록하고 관리할 수 있습니다.",
          "🏥"
        )}
      </CardGrid>

      <InfoSection>
        <InfoTitle>설문 안내</InfoTitle>
        <InfoList>
          <li>설문은 새 창에서 열립니다.</li>
          <li>설문은 완료하는 데 약 10-15분이 소요됩니다.</li>
          <li>설문 결과는 익명으로 처리되며, 연구 목적으로만 사용됩니다.</li>
          <li>설문 중간에 저장 기능을 사용할 수 있습니다.</li>
          <li>문의사항이 있으시면 커뮤니티에 글을 남겨주세요.</li>
        </InfoList>
      </InfoSection>
    </Container>
  );
}

export default SurveysPage;
