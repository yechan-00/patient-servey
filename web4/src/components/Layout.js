// src/components/Layout.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Navbar = styled.nav`
  background-color: #2a5e8c;
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const NavContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  text-decoration: none;

  &:hover {
    opacity: 0.9;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
  flex-wrap: wrap;
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.3s ease;
  position: relative;

  &:hover {
    opacity: 0.8;
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #dc3545;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
`;

const UserMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserName = styled.span`
  color: white;
  font-weight: 500;
`;

const Button = styled.button`
  background-color: transparent;
  color: white;
  border: 2px solid white;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: white;
    color: #2a5e8c;
  }
`;

const Main = styled.main`
  flex: 1;
  background-color: #f8f9fa;
`;

function Layout({ children }) {
  const { currentUser, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      setUnreadNotificationCount(0);
      return;
    }

    const notificationsRef = collection(db, "community_notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", currentUser.uid),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUnreadNotificationCount(snapshot.size);
      },
      (error) => {
        console.error("알림 카운트 로드 오류:", error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("로그아웃 오류:", error);
    }
  };

  return (
    <Container>
      <Navbar>
        <NavContent>
          <Logo to="/">암 환자 커뮤니티</Logo>
          <NavLinks>
            <NavLink to="/">커뮤니티</NavLink>
            <NavLink to="/surveys">설문</NavLink>
            {currentUser && (
              <>
                <NavLink to="/survey-history">내 설문 이력</NavLink>
                <NavLink to="/bookmarks">북마크</NavLink>
                <NavLink to="/notifications">
                  알림
                  {unreadNotificationCount > 0 && (
                    <NotificationBadge>
                      {unreadNotificationCount}
                    </NotificationBadge>
                  )}
                </NavLink>
                {(userProfile?.isAdmin || userProfile?.role === "admin") && (
                  <NavLink to="/admin">관리자</NavLink>
                )}
              </>
            )}
            {currentUser ? (
              <UserMenu>
                <NavLink to="/profile" style={{ fontSize: "0.9rem" }}>
                  <UserName>
                    {userProfile?.displayName ||
                      currentUser.displayName ||
                      "사용자"}
                    님
                  </UserName>
                </NavLink>
                <Button onClick={handleSignOut}>로그아웃</Button>
              </UserMenu>
            ) : (
              <UserMenu>
                <NavLink to="/login">로그인</NavLink>
                <Button
                  onClick={() => navigate("/signup")}
                  style={{ background: "white", color: "#2a5e8c" }}
                >
                  회원가입
                </Button>
              </UserMenu>
            )}
          </NavLinks>
        </NavContent>
      </Navbar>
      <Main>{children}</Main>
    </Container>
  );
}

export default Layout;
