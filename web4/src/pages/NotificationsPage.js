// src/pages/NotificationsPage.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { NOTIFICATION_TYPES } from "../utils/constants";
import { formatDateTime } from "../utils/helpers";

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #2a5e8c;
  margin: 0;
`;

const NotificationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const NotificationCard = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid ${(props) => (props.read ? "transparent" : "#2a5e8c")};
  opacity: ${(props) => (props.read ? 0.7 : 1)};

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
`;

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  gap: 1rem;
`;

const NotificationContent = styled.div`
  color: #495057;
  line-height: 1.6;
`;

const NotificationDate = styled.span`
  font-size: 0.85rem;
  color: #6c757d;
  white-space: nowrap;
`;

const NotificationType = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  background-color: ${(props) => {
    switch (props.type) {
      case "comment":
        return "#e7f3ff";
      case "like":
        return "#fff5f5";
      case "reply":
        return "#f0f9ff";
      default:
        return "#f8f9fa";
    }
  }};
  color: ${(props) => {
    switch (props.type) {
      case "comment":
        return "#2a5e8c";
      case "like":
        return "#dc3545";
      case "reply":
        return "#0ea5e9";
      default:
        return "#6c757d";
    }
  }};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6c757d;
`;

const Loading = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6c757d;
`;

const MarkAllReadButton = styled.button`
  background-color: #2a5e8c;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1rem;

  &:hover {
    background-color: #1d4269;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

function NotificationsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
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
      (snapshot) => {
        const notificationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(notificationsData);
        setLoading(false);
      },
      (error) => {
        console.error("알림 로드 오류:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, navigate]);

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

    // 해당 게시글로 이동
    if (notification.postId) {
      navigate(`/community/post/${notification.postId}`);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.read);
    if (unreadNotifications.length === 0) return;

    try {
      const updates = unreadNotifications.map((notification) =>
        updateDoc(doc(db, "community_notifications", notification.id), {
          read: true,
          readAt: serverTimestamp(),
        })
      );
      await Promise.all(updates);
    } catch (error) {
      console.error("모든 알림 읽음 처리 오류:", error);
    }
  };

  if (loading) {
    return (
      <Container>
        <Loading>로딩 중...</Loading>
      </Container>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Container>
      <Header>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <Title>알림</Title>
          {unreadCount > 0 && (
            <MarkAllReadButton onClick={handleMarkAllRead}>
              모두 읽음 처리
            </MarkAllReadButton>
          )}
        </div>
        {unreadCount > 0 && (
          <p style={{ color: "#6c757d", margin: 0 }}>
            읽지 않은 알림 {unreadCount}개
          </p>
        )}
      </Header>

      {notifications.length === 0 ? (
        <EmptyState>
          <p>알림이 없습니다.</p>
        </EmptyState>
      ) : (
        <NotificationList>
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              read={notification.read}
              onClick={() => handleNotificationClick(notification)}
            >
              <NotificationHeader>
                <div style={{ flex: 1 }}>
                  <NotificationType type={notification.type}>
                    {NOTIFICATION_TYPES[notification.type] || notification.type}
                  </NotificationType>
                  <NotificationContent>
                    {notification.message || "새 알림이 있습니다."}
                  </NotificationContent>
                </div>
                <NotificationDate>
                  {formatDateTime(notification.createdAt)}
                </NotificationDate>
              </NotificationHeader>
            </NotificationCard>
          ))}
        </NotificationList>
      )}
    </Container>
  );
}

export default NotificationsPage;
