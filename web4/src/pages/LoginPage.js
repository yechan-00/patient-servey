// src/pages/LoginPage.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
`;

const LoginCard = styled.div`
  width: 100%;
  max-width: 400px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 2.5rem;
`;

const LogoArea = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const LogoText = styled.h1`
  font-size: 2rem;
  color: #2a5e8c;
  margin: 0;
  font-weight: 700;
`;

const Subtitle = styled.p`
  color: #6c757d;
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:focus {
    border-color: #2a5e8c;
    outline: none;
    box-shadow: 0 0 0 3px rgba(42, 94, 140, 0.1);
  }
`;

const Button = styled.button`
  background-color: #2a5e8c;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.875rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;

  &:hover {
    background-color: #1d4269;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(42, 94, 140, 0.3);
  }

  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.p`
  color: #dc3545;
  margin-top: 1rem;
  text-align: center;
  font-size: 0.9rem;
  padding: 0.5rem;
  background-color: #f8d7da;
  border-radius: 6px;
`;

const LinkContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
  font-size: 0.9rem;
`;

const StyledLink = styled(Link)`
  color: #2a5e8c;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const Divider = styled.div`
  text-align: center;
  margin: 1.5rem 0;
  color: #6c757d;
  font-size: 0.9rem;
  position: relative;

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    width: 40%;
    height: 1px;
    background-color: #dee2e6;
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }
`;

function LoginPage() {
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 이미 로그인되어 있으면 redirect URL 또는 홈으로 리디렉션
  useEffect(() => {
    if (currentUser) {
      const redirect = searchParams.get("redirect") || "/";
      navigate(redirect);
    }
  }, [currentUser, navigate, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 입력 검증
    if (!email || !password) {
      return setError("이메일과 비밀번호를 모두 입력해주세요.");
    }

    try {
      setError("");
      setLoading(true);
      await login(email, password);

      // 로그인 성공 후 redirect URL로 이동
      const redirect = searchParams.get("redirect") || "/";
      navigate(redirect);
    } catch (error) {
      console.error("로그인 오류:", error);

      // 에러 메시지 설정
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (error.code === "auth/too-many-requests") {
        setError("로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.");
      } else if (error.code === "auth/invalid-email") {
        setError("올바른 이메일 형식이 아닙니다.");
      } else {
        setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <LoginCard>
        <LogoArea>
          <LogoText>암 환자 커뮤니티</LogoText>
          <Subtitle>함께하는 힐링 공간</Subtitle>
        </LogoArea>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="email">이메일</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소를 입력하세요"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">비밀번호</Label>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <Button type="submit" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </Button>

          <Divider>또는</Divider>

          <LinkContainer>
            <StyledLink to="/forgot-password">비밀번호 찾기</StyledLink>
            <StyledLink to="/signup">회원가입</StyledLink>
          </LinkContainer>
        </Form>
      </LoginCard>
    </Container>
  );
}

export default LoginPage;
