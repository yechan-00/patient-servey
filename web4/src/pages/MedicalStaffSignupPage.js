// src/pages/MedicalStaffSignupPage.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
`;

const SignupCard = styled.div`
  width: 100%;
  max-width: 500px;
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

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;
  background-color: white;

  &:focus {
    border-color: #2a5e8c;
    outline: none;
    box-shadow: 0 0 0 3px rgba(42, 94, 140, 0.1);
  }
`;

const FileInput = styled.input`
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

const FilePreview = styled.div`
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #495057;
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

const SuccessMessage = styled.p`
  color: #28a745;
  margin-top: 1rem;
  text-align: center;
  font-size: 0.9rem;
  padding: 0.5rem;
  background-color: #d4edda;
  border-radius: 6px;
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

const PasswordHint = styled.p`
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 0.25rem;
`;

const InfoBox = styled.div`
  background-color: #e3f2fd;
  border: 1px solid #90caf9;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  color: #1565c0;
`;

function MedicalStaffSignupPage() {
  const { medicalStaffSignup, currentUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    licenseType: "",
    licenseNumber: "",
    institution: "",
  });
  const [licenseFile, setLicenseFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // 이미 로그인되어 있으면 홈으로 리디렉션
  useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setSuccess("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("파일 크기는 5MB 이하여야 합니다.");
        return;
      }
      // 이미지 파일만 허용
      if (!file.type.startsWith("image/")) {
        setError("이미지 파일만 업로드 가능합니다.");
        return;
      }
      setLicenseFile(file);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 입력 검증
    if (
      !formData.displayName ||
      !formData.email ||
      !formData.password ||
      !formData.licenseType ||
      !formData.licenseNumber ||
      !formData.institution
    ) {
      return setError("모든 필드를 입력해주세요.");
    }

    if (formData.password.length < 6) {
      return setError("비밀번호는 최소 6자 이상이어야 합니다.");
    }

    if (formData.password !== formData.confirmPassword) {
      return setError("비밀번호가 일치하지 않습니다.");
    }

    if (!licenseFile) {
      return setError("면허증 사진을 업로드해주세요.");
    }

    try {
      setError("");
      setSuccess("");
      setLoading(true);

      // 면허증 파일 업로드
      const fileRef = ref(
        storage,
        `medical_licenses/${Date.now()}_${licenseFile.name}`
      );
      await uploadBytes(fileRef, licenseFile);
      const licenseUrl = await getDownloadURL(fileRef);

      // 회원가입
      await medicalStaffSignup(
        formData.email,
        formData.password,
        formData.displayName,
        {
          licenseType: formData.licenseType,
          licenseNumber: formData.licenseNumber,
          institution: formData.institution,
          licenseUrl: licenseUrl,
        }
      );

      setSuccess(
        "회원가입이 완료되었습니다! 관리자 승인 후 의료 종사자 인증이 완료됩니다. 로그인 페이지로 이동합니다..."
      );
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("회원가입 오류:", error);

      // 에러 메시지 설정
      if (error.code === "auth/email-already-in-use") {
        setError("이미 사용 중인 이메일입니다.");
      } else if (error.code === "auth/invalid-email") {
        setError("올바른 이메일 형식이 아닙니다.");
      } else if (error.code === "auth/weak-password") {
        setError("비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.");
      } else {
        setError(
          error.message || "회원가입 중 오류가 발생했습니다. 다시 시도해주세요."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <SignupCard>
        <LogoArea>
          <LogoText>의료 종사자 회원가입</LogoText>
          <Subtitle>의료 관련 자격증을 보유한 전문가를 위한 회원가입</Subtitle>
        </LogoArea>

        <InfoBox>
          <strong>안내사항:</strong>
          <ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }}>
            <li>의료 종사자 인증은 관리자 검토 후 승인됩니다.</li>
            <li>면허증 사진은 명확하게 보이도록 촬영해주세요.</li>
            <li>허위 정보 제공 시 계정이 제한될 수 있습니다.</li>
          </ul>
        </InfoBox>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="displayName">닉네임</Label>
            <Input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="닉네임을 입력하세요"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="email">이메일</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="이메일 주소를 입력하세요"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">비밀번호</Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요 (최소 6자)"
              required
            />
            <PasswordHint>비밀번호는 최소 6자 이상이어야 합니다.</PasswordHint>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="비밀번호를 다시 입력하세요"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="licenseType">자격증 종류</Label>
            <Select
              id="licenseType"
              name="licenseType"
              value={formData.licenseType}
              onChange={handleChange}
              required
            >
              <option value="">선택하세요</option>
              <option value="doctor">의사</option>
              <option value="nurse">간호사</option>
              <option value="counselor">상담사</option>
              <option value="social_worker">사회복지사</option>
              <option value="pharmacist">약사</option>
              <option value="other">기타</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="licenseNumber">면허번호</Label>
            <Input
              type="text"
              id="licenseNumber"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              placeholder="면허번호를 입력하세요"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="institution">소속 기관</Label>
            <Input
              type="text"
              id="institution"
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              placeholder="소속 병원 또는 기관명을 입력하세요"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="licenseFile">면허증 사진</Label>
            <FileInput
              type="file"
              id="licenseFile"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
            {licenseFile && (
              <FilePreview>
                선택된 파일: {licenseFile.name} (
                {(licenseFile.size / 1024 / 1024).toFixed(2)} MB)
              </FilePreview>
            )}
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}

          <Button type="submit" disabled={loading}>
            {loading ? "가입 중..." : "의료 종사자 회원가입"}
          </Button>

          <LinkContainer>
            <span style={{ color: "#6c757d" }}>
              일반 회원가입이 필요하신가요?{" "}
            </span>
            <StyledLink to="/signup">일반 회원가입</StyledLink>
          </LinkContainer>
          <LinkContainer>
            <span style={{ color: "#6c757d" }}>이미 계정이 있으신가요? </span>
            <StyledLink to="/login">로그인</StyledLink>
          </LinkContainer>
        </Form>
      </SignupCard>
    </Container>
  );
}

export default MedicalStaffSignupPage;
