// src/components/Layout.js
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

// 전체 레이아웃 컨테이너
const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

// 사이드바 컨테이너
const Sidebar = styled.div`
  width: 250px;
  background-color: #2a5e8c;
  color: white;
  padding: 1.5rem 0;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  
  @media (max-width: 768px) {
    position: fixed;
    left: ${props => props.isOpen ? '0' : '-250px'};
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

// 아이콘 placeholder (실제로는 아이콘 라이브러리 사용 권장)
const Icon = styled.span`
  margin-right: 0.75rem;
  width: 20px;
  text-align: center;
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
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // 경로가 현재 활성화되어 있는지 확인
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error("로그아웃 오류:", error);
    }
  };
  
  // 사용자 이니셜 가져오기
  const getInitials = () => {
    if (!currentUser || !socialWorkerData || !socialWorkerData.name) return '?';
    
    const nameParts = socialWorkerData.name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    
    return socialWorkerData.name[0].toUpperCase();
  };
  
  return (
    <LayoutContainer>
      <MobileToggle onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '×' : '☰'}
      </MobileToggle>
      
      <Sidebar isOpen={sidebarOpen}>
        <Logo>
          <LogoText>암 생존자 케어</LogoText>
        </Logo>
        
        <Nav>
          <NavGroup>
            <NavGroupTitle>환자 관리</NavGroupTitle>
            <NavItem to="/" className={isActive('/') ? 'active' : ''}>
              <Icon>📊</Icon> 환자 대시보드
            </NavItem>
          </NavGroup>
          
          <NavGroup>
            <NavGroupTitle>설정</NavGroupTitle>
            <NavItem to="/profile" className={isActive('/profile') ? 'active' : ''}>
              <Icon>👤</Icon> 내 프로필
            </NavItem>
          </NavGroup>
        </Nav>
        
        <UserProfile>
          <ProfilePic>{getInitials()}</ProfilePic>
          <UserInfo>
            <UserName>{socialWorkerData?.name || '사용자'}</UserName>
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