// src/components/Layout.js
import React, { useState, useEffect, useRef } from "react";
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
  position: relative; /* 드롭다운 메뉴 위치 지정 */
`;

const UserName = styled.button`
  color: white;
  font-weight: 500;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 0.9rem;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
  }
`;

// 드롭다운 메뉴
const UserDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  z-index: 1000;
  overflow: hidden;
  border: 1px solid #e2e8f0;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  background: none;
  border: none;
  color: #1f2937;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background-color: #f9fafb;
    color: #0284c7;
  }

  &:focus {
    outline: none;
    background-color: #f3f4f6;
  }

  &:first-child {
    border-top: none;
  }

  &:last-child {
    border-bottom: 2px solid #e5e7eb;
    margin-bottom: 0.5rem;
  }
`;

const DropdownDivider = styled.div`
  height: 1px;
  background-color: #e5e7eb;
  margin: 0.25rem 0;
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
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);

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
      setShowUserDropdown(false);
      // 로그아웃 후 현재 페이지에 그대로 유지 (커뮤니티 화면)
      // navigate를 호출하지 않으면 현재 페이지에 그대로 남음
    } catch (error) {
      console.error("로그아웃 오류:", error);
    }
  };

  // 드롭다운 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserDropdown]);

  return (
    <Container>
      <Navbar>
        <NavContent>
          <Logo to="/">암 환자 커뮤니티</Logo>
          <NavLinks>
            <NavLink to="/surveys">설문</NavLink>
            {currentUser && (
              <>
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
              <UserMenu ref={dropdownRef}>
                <UserName
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                >
                  {userProfile?.displayName ||
                    currentUser.displayName ||
                    "사용자"}
                  님
                </UserName>
                {showUserDropdown && (
                  <UserDropdown>
                    <DropdownItem
                      onClick={() => {
                        navigate("/survey-history");
                        setShowUserDropdown(false);
                      }}
                    >
                      내 설문 이력
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => {
                        navigate("/bookmarks");
                        setShowUserDropdown(false);
                      }}
                    >
                      북마크
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem
                      onClick={handleSignOut}
                      style={{ color: "#dc2626" }}
                    >
                      로그아웃
                    </DropdownItem>
                  </UserDropdown>
                )}
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
