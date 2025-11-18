// src/pages/HomePage.js
import React from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1rem;
`;

const Hero = styled.section`
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  margin-bottom: 4rem;
`;

const HeroTitle = styled.h1`
  font-size: 3rem;
  margin: 0 0 1rem 0;
  font-weight: 700;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  margin: 0;
  opacity: 0.9;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const Section = styled.section`
  margin-bottom: 4rem;
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  color: #2a5e8c;
  margin: 0 0 2rem 0;
  text-align: center;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
`;

const CardIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h3`
  font-size: 1.5rem;
  color: #2a5e8c;
  margin: 0 0 1rem 0;
`;

const CardDescription = styled.p`
  color: #6c757d;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
`;

const CardButton = styled.button`
  width: 100%;
  background-color: #2a5e8c;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.875rem;
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

const SurveyCard = styled(Card)`
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
`;

function HomePage() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

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

  return (
    <Container>
      <Hero>
        <HeroTitle>함께하는 힐링 공간</HeroTitle>
        <HeroSubtitle>
          암 환자와 생존자들이 서로 소통하고 정보를 공유하는 커뮤니티
        </HeroSubtitle>
      </Hero>

      <Section>
        <SectionTitle>설문 참여</SectionTitle>
        <CardGrid>
          <SurveyCard onClick={() => handleSurveyClick("survivor")}>
            <CardIcon>📋</CardIcon>
            <CardTitle>생존자 설문</CardTitle>
            <CardDescription>
              암 생존자를 위한 건강 설문에 참여하세요. 여러분의 경험이
              소중합니다.
            </CardDescription>
            <CardButton>설문 참여하기</CardButton>
          </SurveyCard>

          <SurveyCard onClick={() => handleSurveyClick("patient")}>
            <CardIcon>🏥</CardIcon>
            <CardTitle>환자 설문</CardTitle>
            <CardDescription>
              현재 치료 중이신 환자분들을 위한 설문입니다. 건강 상태를 기록하고
              관리하세요.
            </CardDescription>
            <CardButton>설문 참여하기</CardButton>
          </SurveyCard>
        </CardGrid>
      </Section>

      <Section>
        <SectionTitle>커뮤니티 기능</SectionTitle>
        <CardGrid>
          <Card onClick={() => navigate("/community")}>
            <CardIcon>💬</CardIcon>
            <CardTitle>커뮤니티</CardTitle>
            <CardDescription>
              다른 환자들과 경험을 공유하고, 정보를 나누며, 서로를 응원하는
              공간입니다.
            </CardDescription>
            <CardButton>커뮤니티 가기</CardButton>
          </Card>

          <Card>
            <CardIcon>📝</CardIcon>
            <CardTitle>게시글 작성</CardTitle>
            <CardDescription>
              자유롭게 글을 작성하고 다른 회원들과 소통할 수 있습니다.
            </CardDescription>
            <CardButton onClick={() => navigate("/community/write")}>
              글쓰기
            </CardButton>
          </Card>

          <Card>
            <CardIcon>🤝</CardIcon>
            <CardTitle>정보 공유</CardTitle>
            <CardDescription>
              유용한 정보와 경험을 공유하여 함께 성장하는 커뮤니티를 만들어가요.
            </CardDescription>
            <CardButton onClick={() => navigate("/community")}>
              더 알아보기
            </CardButton>
          </Card>
        </CardGrid>
      </Section>

      {!currentUser && (
        <Section>
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2 style={{ color: "#2a5e8c", marginBottom: "1rem" }}>
              지금 가입하세요
            </h2>
            <p style={{ color: "#6c757d", marginBottom: "2rem" }}>
              커뮤니티에 가입하여 더 많은 기능을 이용해보세요.
            </p>
            <CardButton
              onClick={() => navigate("/signup")}
              style={{ maxWidth: "200px", margin: "0 auto" }}
            >
              회원가입
            </CardButton>
          </div>
        </Section>
      )}
    </Container>
  );
}

export default HomePage;
