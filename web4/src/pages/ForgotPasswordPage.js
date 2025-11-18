// src/pages/ForgotPasswordPage.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
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

const Card = styled.div`
  width: 100%;
  max-width: 400px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 2.5rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #2a5e8c;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
  text-align: center;
`;

const Subtitle = styled.p`
  color: #6c757d;
  margin: 0 0 2rem 0;
  font-size: 0.9rem;
  text-align: center;
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

const Message = styled.p`
  margin-top: 1rem;
  text-align: center;
  font-size: 0.9rem;
  padding: 0.75rem;
  border-radius: 6px;
`;

const ErrorMessage = styled(Message)`
  color: #dc3545;
  background-color: #f8d7da;
`;

const SuccessMessage = styled(Message)`
  color: #28a745;
  background-color: #d4edda;
`;

const LinkContainer = styled.div`
  display: flex;
  justify-content: center;
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

function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      return setError("이메일을 입력해주세요.");
    }

    try {
      setError("");
      setSuccess("");
      setLoading(true);
      await resetPassword(email);
      setSuccess(
        "비밀번호 재설정 이메일을 발송했습니다. 이메일을 확인해주세요."
      );
    } catch (error) {
      console.error("비밀번호 재설정 오류:", error);

      if (error.code === "auth/user-not-found") {
        setError("등록되지 않은 이메일입니다.");
      } else if (error.code === "auth/invalid-email") {
        setError("올바른 이메일 형식이 아닙니다.");
      } else {
        setError("오류가 발생했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Card>
        <Title>비밀번호 찾기</Title>
        <Subtitle>이메일로 비밀번호 재설정 링크를 보내드립니다</Subtitle>

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

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}

          <Button type="submit" disabled={loading}>
            {loading ? "전송 중..." : "이메일 전송"}
          </Button>

          <LinkContainer>
            <StyledLink to="/login">로그인으로 돌아가기</StyledLink>
          </LinkContainer>
        </Form>
      </Card>
    </Container>
  );
}

export default ForgotPasswordPage;
