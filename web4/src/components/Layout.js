// src/components/Layout.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  updateDoc,
  doc,
  writeBatch,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { formatRelativeTime } from "../utils/helpers";

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

// 알림 드롭다운 스타일
const NotificationDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  width: 380px;
  max-height: 500px;
  z-index: 1001;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
`;

const NotificationDropdownHeader = styled.div`
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f9fafb;
`;

const NotificationDropdownTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
`;

const MarkAllReadButton = styled.button`
  background: none;
  border: none;
  color: #2563eb;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.15s ease;

  &:hover {
    background-color: #eff6ff;
  }
`;

const NotificationDropdownContent = styled.div`
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const NotificationDropdownItem = styled.div`
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  background-color: ${(props) => (props.read ? "white" : "#fef3c7")};
  position: relative;

  &:hover {
    background-color: ${(props) => (props.read ? "#f9fafb" : "#fde68a")};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const NotificationItemContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotificationItemText = styled.div`
  font-size: 0.875rem;
  color: #1f2937;
  line-height: 1.5;
  margin-bottom: 0.25rem;
  font-weight: ${(props) => (props.read ? "400" : "500")};
`;

const NotificationItemDate = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const UnreadDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #2563eb;
  flex-shrink: 0;
  margin-top: 0.375rem;
`;

const EmptyNotificationMessage = styled.div`
  padding: 2rem 1.25rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
`;

const ViewAllNotificationsButton = styled.button`
  width: 100%;
  padding: 0.875rem 1.25rem;
  background-color: #f9fafb;
  border: none;
  border-top: 1px solid #e5e7eb;
  color: #2563eb;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background-color: #f3f4f6;
  }
`;

function Layout({ children }) {
  const { currentUser, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);

  // 읽지 않은 알림 수만 가져오기
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

  // 오래된 읽은 알림 자동 삭제 (90일 이상)
  const cleanupOldNotifications = useCallback(async () => {
    if (!currentUser) return;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // 90일 전

      const notificationsRef = collection(db, "community_notifications");
      const q = query(
        notificationsRef,
        where("userId", "==", currentUser.uid),
        where("read", "==", true)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      let deletedCount = 0;

      snapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const readAt = data.readAt;

        // readAt이 있고 90일 이상 지난 경우 삭제
        if (readAt) {
          const readAtDate = readAt.toDate ? readAt.toDate() : new Date(readAt);
          if (readAtDate < cutoffDate) {
            batch.delete(docSnapshot.ref);
            deletedCount++;
          }
        }
        // readAt이 없지만 createdAt이 90일 이상 지난 경우도 삭제 (안전장치)
        else if (data.createdAt) {
          const createdAt = data.createdAt.toDate
            ? data.createdAt.toDate()
            : new Date(data.createdAt);
          if (createdAt < cutoffDate) {
            batch.delete(docSnapshot.ref);
            deletedCount++;
          }
        }
      });

      if (deletedCount > 0) {
        await batch.commit();
        console.log(`${deletedCount}개의 오래된 알림이 삭제되었습니다.`);
      }
    } catch (error) {
      console.error("오래된 알림 삭제 오류:", error);
    }
  }, [currentUser]);

  // 알림 목록 가져오기 (드롭다운용)
  useEffect(() => {
    if (!currentUser || !showNotificationDropdown) {
      return;
    }

    const notificationsRef = collection(db, "community_notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const notificationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(notificationsData);

        // 알림 목록을 불러올 때마다 오래된 알림 정리 (최초 1회만 실행)
        if (notificationsData.length > 0) {
          await cleanupOldNotifications();
        }
      },
      (error) => {
        console.error("알림 목록 로드 오류:", error);
      }
    );

    return () => unsubscribe();
  }, [currentUser, showNotificationDropdown, cleanupOldNotifications]);

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
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target)
      ) {
        setShowNotificationDropdown(false);
      }
    };

    if (showUserDropdown || showNotificationDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserDropdown, showNotificationDropdown]);

  // 알림 클릭 핸들러
  const handleNotificationClick = async (notification) => {
    // 알림 읽음 처리
    if (!notification.read) {
      try {
        const notificationRef = doc(
          db,
          "community_notifications",
          notification.id
        );
        await updateDoc(notificationRef, {
          read: true,
          readAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("알림 읽음 처리 오류:", error);
      }
    }

    // 드롭다운 닫기
    setShowNotificationDropdown(false);

    // 해당 게시글로 이동
    if (notification.postId) {
      navigate(`/community/post/${notification.postId}`);
    }
  };

  // 모든 알림 읽음 처리
  const handleMarkAllNotificationsRead = async () => {
    if (!currentUser) return;

    try {
      const unreadNotifications = notifications.filter((n) => !n.read);
      if (unreadNotifications.length === 0) return;

      const batch = writeBatch(db);
      unreadNotifications.forEach((notification) => {
        const notificationRef = doc(
          db,
          "community_notifications",
          notification.id
        );
        batch.update(notificationRef, {
          read: true,
          readAt: serverTimestamp(),
        });
      });

      await batch.commit();
    } catch (error) {
      console.error("모든 알림 읽음 처리 오류:", error);
    }
  };

  // 알림 날짜 포맷팅
  const formatNotificationDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatRelativeTime(date);
  };

  return (
    <Container>
      <Navbar>
        <NavContent>
          <Logo to="/">암 환자 커뮤니티</Logo>
          <NavLinks>
            {currentUser && (
              <>
                <UserMenu style={{ position: "relative" }}>
                  <NavLink
                    to="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowNotificationDropdown(!showNotificationDropdown);
                    }}
                    style={{ position: "relative" }}
                  >
                    알림
                    {unreadNotificationCount > 0 && (
                      <NotificationBadge>
                        {unreadNotificationCount}
                      </NotificationBadge>
                    )}
                  </NavLink>
                  {showNotificationDropdown && (
                    <NotificationDropdown ref={notificationDropdownRef}>
                      <NotificationDropdownHeader>
                        <NotificationDropdownTitle>
                          알림
                        </NotificationDropdownTitle>
                        {unreadNotificationCount > 0 && (
                          <MarkAllReadButton
                            onClick={handleMarkAllNotificationsRead}
                          >
                            모두 읽음
                          </MarkAllReadButton>
                        )}
                      </NotificationDropdownHeader>
                      <NotificationDropdownContent>
                        {notifications.length === 0 ? (
                          <EmptyNotificationMessage>
                            알림이 없습니다.
                          </EmptyNotificationMessage>
                        ) : (
                          notifications.slice(0, 10).map((notification) => (
                            <NotificationDropdownItem
                              key={notification.id}
                              read={notification.read}
                              onClick={() =>
                                handleNotificationClick(notification)
                              }
                            >
                              <NotificationItemContent>
                                <NotificationItemText>
                                  {notification.message}
                                </NotificationItemText>
                                <NotificationItemDate>
                                  {formatNotificationDate(
                                    notification.createdAt
                                  )}
                                </NotificationItemDate>
                              </NotificationItemContent>
                              {!notification.read && <UnreadDot />}
                            </NotificationDropdownItem>
                          ))
                        )}
                        {notifications.length > 10 && (
                          <ViewAllNotificationsButton
                            onClick={() => {
                              setShowNotificationDropdown(false);
                              navigate("/notifications");
                            }}
                          >
                            모든 알림 보기
                          </ViewAllNotificationsButton>
                        )}
                      </NotificationDropdownContent>
                    </NotificationDropdown>
                  )}
                </UserMenu>
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
