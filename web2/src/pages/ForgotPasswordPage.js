// src/pages/ForgotPasswordPage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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

// 카드
const Card = styled.div`
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

// 성공 메시지
const SuccessMessage = styled.p`
  color: #28a745;
  margin-top: 1rem;
  text-align: center;
`;

// 링크
const StyledLink = styled(Link)`
  color: #2a5e8c;
  text-decoration: none;
  display: block;
  text-align: center;
  margin-top: 1.5rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      return setError('이메일을 입력해주세요.');
    }
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      await resetPassword(email);
      setSuccess('비밀번호 재설정 이메일을 발송했습니다. 이메일을 확인해주세요.');
    } catch (error) {
      console.error("비밀번호 재설정 오류:", error);
      
      if (error.code === 'auth/user-not-found') {
        setError('해당 이메일을 가진 사용자를 찾을 수 없습니다.');
      } else if (error.code === 'auth/invalid-email') {
        setError('유효하지 않은 이메일 형식입니다.');
      } else {
        setError('비밀번호 재설정 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container>
      <Card>
        <LogoArea>
          <LogoText>암 생존자 케어</LogoText>
          <Subtitle>비밀번호 재설정</Subtitle>
        </LogoArea>
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="email">이메일</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="가입한 이메일 주소를 입력하세요"
            />
          </FormGroup>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}
          
          <Button type="submit" disabled={loading}>
            {loading ? '처리 중...' : '비밀번호 재설정 메일 보내기'}
          </Button>
          
          <StyledLink to="/login">로그인 페이지로 돌아가기</StyledLink>
        </Form>
      </Card>
    </Container>
  );
}

export default ForgotPasswordPage;