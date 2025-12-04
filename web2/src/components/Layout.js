// src/components/Layout.js
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";

// 전체 레이아웃 컨테이너
const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

// 사이드바 컨테이너
const Sidebar = styled.div`
  width: 240px;
  min-width: 240px;
  background-color: #2a5e8c;
  color: white;
  padding: 1.5rem 0;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  overflow: hidden; /* 내부 요소가 넘칠 때 깔끔하게 */

  @media (max-width: 768px) {
    position: fixed;
    left: ${(props) => (props.isOpen ? "0" : "-240px")};
    z-index: 1000;
    height: 100vh;
  }
`;

// 메인 콘텐츠 영역
const MainContent = styled.div`
  flex: 1;
  background-color: #f8f9fa;
  padding: 1.5rem;

  @media (max-width: 768px) {
    margin-left: 0;
    width: 100%;
  }
`;

// 로고 영역
const Logo = styled.div`
  padding: 0 1.5rem 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
`;

// 로고 텍스트
const LogoText = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
  white-space: nowrap; /* 한 줄 유지 */
  word-break: keep-all; /* 한국어 단어 중간 줄바꿈 방지 */
  overflow: hidden;
  text-overflow: ellipsis;
`;

// 내비게이션 메뉴
const Nav = styled.nav`
  margin-bottom: 2rem;
  flex: 1;
`;

// 메뉴 그룹
const NavGroup = styled.div`
  margin-bottom: 1.5rem;
`;

// 그룹 제목
const NavGroupTitle = styled.h2`
  font-size: 0.75rem;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 1.5rem 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  white-space: nowrap;
  word-break: keep-all;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// 메뉴 아이템
const NavItem = styled(Link)`
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
  }

  &.active {
    background-color: rgba(255, 255, 255, 0.1);
    border-left-color: white;
    color: white;
  }
`;

// 외부 링크용 NavItem (a 태그로 사용)
const ExternalNavItem = styled.a`
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

// 아이콘 placeholder (실제로는 아이콘 라이브러리 사용 권장)
const Icon = styled.span`
  margin-right: 0.75rem;
  width: 20px;
  text-align: center;
`;

// 메뉴 텍스트: 한국어 단어 중간 줄바꿈 방지 + 길면 말줄임
const MenuText = styled.span`
  display: inline-block;
  max-width: 180px; /* 사이드바 폭(250px) - 아이콘/패딩 고려 */
  white-space: nowrap; /* 줄바꿈 금지 */
  word-break: keep-all; /* 한국어 단어 중간 끊김 방지 */
  overflow: hidden; /* 넘치면 숨김 */
  text-overflow: ellipsis; /* 말줄임표 */
  line-height: 1.2;
`;

// 사용자 프로필 영역
const UserProfile = styled.div`
  padding: 1rem 1.5rem;
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
`;

// 프로필 이미지
const ProfilePic = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  font-weight: bold;
`;

// 사용자 정보
const UserInfo = styled.div`
  flex: 1;
`;

// 사용자 이름
const UserName = styled.p`
  margin: 0;
  font-weight: 500;
`;

// 사용자 역할
const UserRole = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
`;

// 로그아웃 버튼
const LogoutButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0;
  font-size: 0.9rem;
  margin-left: 0.5rem;

  &:hover {
    color: white;
  }
`;

// 모바일 토글 버튼
const MobileToggle = styled.button`
  display: none;
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 1001;
  background-color: #2a5e8c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;

  @media (max-width: 768px) {
    display: block;
  }
`;

// 헤더 컴포넌트
const Header = styled.header`
  background-color: white;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

// 페이지 제목
const PageTitle = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  color: #333;
`;

// 액션 버튼 그룹
const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
`;

function Layout({ children, title }) {
  const { currentUser, socialWorkerData, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 경로가 현재 활성화되어 있는지 확인
  const isActive = (path) => {
    return location.pathname === path;
  };

  // web5 로그인 페이지 URL 생성 함수
  const getWeb5LoginUrl = () => {
    // 로컬 환경인지 확인
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "";

    if (isLocalhost) {
      // 로컬 환경: web5는 일반적으로 3000번 포트에서 실행
      return "http://localhost:3000/#/login";
    }

    // 프로덕션 환경
    return "https://yechan-00.github.io/patient-servey/web5/#/login";
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await signOut();
      // web5 로그인 페이지로 리디렉션
      window.location.href = getWeb5LoginUrl();
    } catch (error) {
      console.error("로그아웃 오류:", error);
    }
  };

  // 사용자 이니셜 가져오기
  const getInitials = () => {
    if (!currentUser || !socialWorkerData || !socialWorkerData.name) return "?";

    const nameParts = socialWorkerData.name.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }

    return socialWorkerData.name[0].toUpperCase();
  };

  return (
    <LayoutContainer>
      <MobileToggle onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? "×" : "☰"}
      </MobileToggle>

      <Sidebar isOpen={sidebarOpen}>
        <Logo>
          <LogoText>암 생존자 케어</LogoText>
        </Logo>

        <Nav>
          <NavGroup>
            <NavGroupTitle>환자 관리</NavGroupTitle>
            <NavItem to="/" className={isActive("/") ? "active" : ""}>
              <Icon>📊</Icon> <MenuText>환자 대시보드</MenuText>
            </NavItem>
          </NavGroup>
          <NavGroup>
            <NavGroupTitle>보관</NavGroupTitle>
            <NavItem
              to="/archived"
              className={isActive("/archived") ? "active" : ""}
            >
              <Icon>🗂️</Icon> <MenuText>보관 환자</MenuText>
            </NavItem>
          </NavGroup>

          <NavGroup>
            <NavGroupTitle>커뮤니티</NavGroupTitle>
            <ExternalNavItem
              href="https://yechan-00.github.io/patient-servey/web4"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon>💬</Icon> <MenuText>환자 커뮤니티</MenuText>
            </ExternalNavItem>
          </NavGroup>
          <NavGroup>
            <NavGroupTitle>설정</NavGroupTitle>
            <NavItem
              to="/profile"
              className={isActive("/profile") ? "active" : ""}
            >
              <Icon>👤</Icon> <MenuText>내 프로필</MenuText>
            </NavItem>
          </NavGroup>
        </Nav>

        <UserProfile>
          <ProfilePic>{getInitials()}</ProfilePic>
          <UserInfo>
            <UserName>{socialWorkerData?.name || "사용자"}</UserName>
            <UserRole>사회복지사</UserRole>
          </UserInfo>
          <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
        </UserProfile>
      </Sidebar>

      <MainContent>
        <Header>
          <PageTitle>{title}</PageTitle>
          <ActionButtons>
            {/* 필요한 경우 여기에 액션 버튼 추가 */}
          </ActionButtons>
        </Header>

        {children}
      </MainContent>
    </LayoutContainer>
  );
}

export default Layout;
