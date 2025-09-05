// src/pages/ProfilePage.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  updatePassword 
} from 'firebase/auth';
import { auth } from '../firebase';

// 컨테이너
const Container = styled.div`
  margin-bottom: 2rem;
`;

// 프로필 카드
const ProfileCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  margin-bottom: 1.5rem;
`;

// 섹션 제목
const SectionTitle = styled.h2`
  font-size: 1.25rem;
  margin: 0 0 1.5rem;
  color: #343a40;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e9ecef;
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
  padding: 0.75rem 1.5rem;
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

// 성공 메시지
const SuccessMessage = styled.p`
  color: #28a745;
  margin-top: 1rem;
`;

// 에러 메시지
const ErrorMessage = styled.p`
  color: #dc3545;
  margin-top: 1rem;
`;

function ProfilePage() {
  const { currentUser, socialWorkerData, updateSocialWorkerData } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    organization: '',
    email: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // 사용자 데이터 불러오기
  useEffect(() => {
    if (socialWorkerData) {
      setFormData({
        name: socialWorkerData.name || '',
        phone: socialWorkerData.phone || '',
        organization: socialWorkerData.organization || '',
        email: currentUser.email || ''
      });
    }
  }, [socialWorkerData, currentUser]);
  
  // 폼 입력 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 비밀번호 폼 입력 핸들러
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 프로필 업데이트 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      await updateSocialWorkerData(currentUser.uid, {
        name: formData.name,
        phone: formData.phone,
        organization: formData.organization
      });
      
      setSuccess('프로필이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error("프로필 업데이트 오류:", error);
      setError('프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 비밀번호 변경 핸들러
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordLoading(true);
    
    // 비밀번호 검증
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordLoading(false);
      return setPasswordError('새 비밀번호가 일치하지 않습니다.');
    }
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordLoading(false);
      return setPasswordError('비밀번호는 최소 6자 이상이어야 합니다.');
    }
    
    try {
      // 현재 사용자의 인증 정보 생성
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordForm.currentPassword
      );
      
      // 사용자 재인증
      await reauthenticateWithCredential(currentUser, credential);
      
      // 비밀번호 업데이트
      await updatePassword(currentUser, passwordForm.newPassword);
      
      setPasswordSuccess('비밀번호가 성공적으로 변경되었습니다.');
      
      // 폼 초기화
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error("비밀번호 변경 오류:", error);
      
      if (error.code === 'auth/wrong-password') {
        setPasswordError('현재 비밀번호가 올바르지 않습니다.');
      } else if (error.code === 'auth/too-many-requests') {
        setPasswordError('너무 많은 요청이 있었습니다. 나중에 다시 시도해주세요.');
      } else if (error.code === 'auth/requires-recent-login') {
        setPasswordError('보안을 위해 다시 로그인 후 시도해주세요.');
      } else {
        setPasswordError('비밀번호 변경 중 오류가 발생했습니다.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };
  
  return (
    <Layout title="내 프로필">
      <Container>
        <ProfileCard>
          <SectionTitle>프로필 정보</SectionTitle>
          
          <form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="name">이름</Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="email">이메일</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                disabled
              />
              <small>이메일은 변경할 수 없습니다.</small>
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="phone">연락처</Label>
              <Input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="organization">소속 기관</Label>
              <Input
                type="text"
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
              />
            </FormGroup>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {success && <SuccessMessage>{success}</SuccessMessage>}
            
            <Button type="submit" disabled={loading}>
              {loading ? '업데이트 중...' : '프로필 업데이트'}
            </Button>
          </form>
        </ProfileCard>
        
        <ProfileCard>
          <SectionTitle>비밀번호 변경</SectionTitle>
          
          <form onSubmit={handlePasswordSubmit}>
            <FormGroup>
              <Label htmlFor="currentPassword">현재 비밀번호</Label>
              <Input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="newPassword">새 비밀번호</Label>
              <Input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
              <Input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
              />
            </FormGroup>
            
            {passwordError && <ErrorMessage>{passwordError}</ErrorMessage>}
            {passwordSuccess && <SuccessMessage>{passwordSuccess}</SuccessMessage>}
            
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? '변경 중...' : '비밀번호 변경'}
            </Button>
          </form>
        </ProfileCard>
      </Container>
    </Layout>
  );
}

export default ProfilePage;