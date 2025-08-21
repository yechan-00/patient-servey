// src/pages/LoginPage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

// 컨테이너
const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f8f9fa;
`;

// 로그인 카드
const LoginCard = styled.div`
  width: 400px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
`;

// 로고 영역
const LogoArea = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

// 로고 텍스트
const LogoText = styled.h1`
  font-size: 1.8rem;
  color: #2a5e8c;
  margin: 0;
`;

// 부제목
const Subtitle = styled.p`
  color: #6c757d;
  margin: 0.5rem 0 0;
`;

// 폼
const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

// 폼 그룹
const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

// 라벨
const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
`;

// 인풋
const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  transition: border-color 0.15s ease-in-out;
  
  &:focus {
    border-color: #2a5e8c;
    outline: none;
  }
`;

// 버튼
const Button = styled.button`
  background-color: #2a5e8c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
  
  &:hover {
    background-color: #1d4269;
  }
  
  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

// 에러 메시지
const ErrorMessage = styled.p`
  color: #dc3545;
  margin-top: 1rem;
  text-align: center;
`;

// 링크
const StyledLink = styled(Link)`
  color: #2a5e8c;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

// 링크 컨테이너
const LinkContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
  font-size: 0.9rem;
`;

function LoginPage() {
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 이미 로그인되어 있으면 대시보드로 리디렉션
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 입력 검증
    if (!email || !password) {
      return setError('이메일과 비밀번호를 모두 입력해주세요.');
    }
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (error) {
      console.error("로그인 오류:", error);
      
      // 에러 메시지 설정
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container>
      <LoginCard>
        <LogoArea>
          <LogoText>암 생존자 케어</LogoText>
          <Subtitle>사회복지사 전용 포털</Subtitle>
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
            />
          </FormGroup>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <Button type="submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
          
          <LinkContainer>
            <StyledLink to="/forgot-password">비밀번호 찾기</StyledLink>
          </LinkContainer>
        </Form>
      </LoginCard>
    </Container>
  );
}

export default LoginPage;