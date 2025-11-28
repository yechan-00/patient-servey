// src/pages/WritePostPage.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import {
  CATEGORIES,
  CANCER_TYPES,
  TREATMENT_METHODS,
  TREATMENT_RESULTS,
  SIDE_EFFECTS,
  SATISFACTION_LEVELS,
  INFO_TYPES,
  REGIONS,
  SUPPORT_TYPES,
} from "../utils/constants";
import { getDisplayName } from "../utils/helpers";
import { Info, Edit, Hospital, BookOpen, HandHeart } from "lucide-react";

// 브랜드 색상 토큰
const colors = {
  brandBlue: "#3B5CCC",
  brandBlueHover: "#304bb0",
  textPrimary: "#1f2d53",
  textSecondary: "#4b587c",
  border: "#d7dcef",
  borderHover: "#d0d4e3",
  placeholder: "#9ba4bf",
  background: "#f5f7ff",
  error: "#ff5b5b",
};

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  background: linear-gradient(to bottom, #f9faff, #ffffff 40%);
  min-height: calc(100vh - 200px);

  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
  }
`;

const Header = styled.div`
  margin-bottom: 1.5rem;
  padding-top: 0.5rem;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  color: ${colors.textPrimary};
  margin: 0 0 0.375rem 0;
  font-weight: 700;
  text-align: left;
  letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: ${colors.textSecondary};
  margin: 0;
  font-weight: 400;
  line-height: 1.5;
`;

const Form = styled.form`
  background-color: #ffffff;
  border-radius: 14px;
  padding: 32px 28px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    padding: 24px 20px;
  }
`;

const FormSection = styled.div`
  margin-bottom: 32px;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin: 0 0 12px 0;
  padding: 0;
`;

const SectionIcon = styled.div`
  display: flex;
  align-items: center;
  color: ${colors.brandBlue};
  width: 18px;
  height: 18px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const FormRow = styled.div`
  display: flex;
  gap: 1.25rem;
  margin-bottom: 20px;

  & > ${FormGroup} {
    flex: 1;
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.25rem;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: 8px;
  line-height: 1.5;
`;

const RequiredLabel = styled(Label)`
  &::before {
    content: "*";
    color: ${colors.error};
    margin-right: 4px;
  }
`;

const OptionalLabel = styled(Label)`
  /* 선택 필드는 별도 표시 없음 */
`;

const Input = styled.input`
  width: 100%;
  height: 46px;
  padding: 12px 14px;
  font-size: 0.9375rem;
  border: 1px solid ${colors.border};
  border-radius: 10px;
  transition: all 0.2s ease;
  color: ${colors.textPrimary};
  background-color: white;
  line-height: 1.5;

  &::placeholder {
    color: ${colors.placeholder};
    font-weight: 400;
  }

  &:focus {
    border-color: ${colors.brandBlue};
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 92, 204, 0.12);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 14px;
  font-size: 0.9375rem;
  border: 1px solid ${colors.border};
  border-radius: 10px;
  min-height: 160px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s ease;
  color: ${colors.textPrimary};
  background-color: white;
  line-height: 1.6;

  &::placeholder {
    color: ${colors.placeholder};
    font-weight: 400;
  }

  &:focus {
    border-color: ${colors.brandBlue};
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 92, 204, 0.12);
  }
`;

const Select = styled.select`
  width: 100%;
  height: 46px;
  padding: 12px 14px;
  font-size: 0.9375rem;
  border: 1px solid ${colors.border};
  border-radius: 10px;
  background-color: white;
  transition: all 0.2s ease;
  color: ${colors.textPrimary};
  cursor: pointer;
  line-height: 1.5;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ba4bf' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 2.5rem;

  &:focus {
    border-color: ${colors.brandBlue};
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 92, 204, 0.12);
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.875rem 1.25rem;
  margin-top: 8px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: ${colors.textSecondary};
  cursor: pointer;
  font-weight: 500;
  line-height: 1.5;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: ${colors.brandBlue};
  }
`;

const InfoBox = styled.div`
  background-color: ${colors.background};
  padding: 0.875rem 1rem;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 0.875rem;
  color: ${colors.textSecondary};
  line-height: 1.6;
  font-weight: 400;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f1f5f9;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 12px 24px;
  font-size: 0.9375rem;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1.5;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 100px;
  height: 46px;
`;

const SubmitButton = styled(Button)`
  background-color: ${colors.brandBlue};
  color: white;
  border: none;

  &:hover {
    background-color: ${colors.brandBlueHover};
  }

  &:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const CancelButton = styled(Button)`
  background-color: white;
  color: ${colors.textSecondary};
  border: 1px solid ${colors.borderHover};

  &:hover {
    background-color: ${colors.background};
  }
`;

const ErrorMessage = styled.p`
  color: ${colors.error};
  margin-top: 20px;
  padding: 0.875rem 1rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.5;
`;

function WritePostPage() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "free",
    cancerType: "all",
    // 후기 게시판 필드
    hospitalName: "",
    treatmentMethods: [],
    treatmentPeriod: "",
    sideEffects: [],
    satisfaction: "",
    treatmentResult: "",
    // 정보공유 게시판 필드
    infoType: "",
    region: "",
    sourceLink: "",
    // 지원 요청 게시판 필드
    supportType: "",
    supportRegion: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError("");
  };

  const handleCheckboxChange = (name, value) => {
    setFormData((prev) => {
      const currentArray = prev[name] || [];
      const isChecked = currentArray.includes(value);
      return {
        ...prev,
        [name]: isChecked
          ? currentArray.filter((item) => item !== value)
          : [...currentArray, value],
      };
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      return setError("제목과 내용을 모두 입력해주세요.");
    }

    // 카테고리별 필수 필드 검증
    if (formData.category === "review") {
      if (!formData.hospitalName.trim()) {
        return setError("병원명을 입력해주세요.");
      }
      if (formData.treatmentMethods.length === 0) {
        return setError("치료 방법을 최소 1개 이상 선택해주세요.");
      }
      if (!formData.treatmentResult) {
        return setError("치료 결과를 선택해주세요.");
      }
    }

    if (formData.category === "info") {
      if (!formData.infoType) {
        return setError("정보 유형을 선택해주세요.");
      }
    }

    if (formData.category === "support") {
      if (!formData.supportType) {
        return setError("지원 유형을 선택해주세요.");
      }
    }

    try {
      setError("");
      setLoading(true);

      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        cancerType: formData.cancerType !== "all" ? formData.cancerType : null,
        authorId: currentUser.uid,
        authorName: getDisplayName(userProfile, currentUser),
        authorEmail: currentUser.email,
        authorIsMedicalStaff: userProfile?.isMedicalStaff || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        commentCount: 0,
        viewCount: 0,
        likeCount: 0,
        likedBy: [],
        reportCount: 0,
      };

      // 카테고리별 추가 필드
      if (formData.category === "review") {
        postData.hospitalName = formData.hospitalName.trim();
        postData.treatmentMethods = formData.treatmentMethods;
        postData.treatmentPeriod = formData.treatmentPeriod.trim();
        postData.sideEffects = formData.sideEffects;
        postData.satisfaction = formData.satisfaction;
        postData.treatmentResult = formData.treatmentResult;
      }

      if (formData.category === "info") {
        postData.infoType = formData.infoType;
        postData.region = formData.region;
        postData.sourceLink = formData.sourceLink.trim();
      }

      if (formData.category === "support") {
        postData.supportType = formData.supportType;
        postData.supportRegion = formData.supportRegion;
      }

      await addDoc(collection(db, "community_posts"), postData);

      navigate("/community");
    } catch (error) {
      console.error("게시글 작성 오류:", error);
      setError("게시글 작성 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/community");
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Container>
      <Header>
        <Title>게시글 작성</Title>
        <Subtitle>커뮤니티 구성원들과 경험을 나누어 보세요.</Subtitle>
      </Header>

      <Form onSubmit={handleSubmit}>
        <FormSection>
          <SectionTitle>
            <SectionIcon>
              <Info size={18} />
            </SectionIcon>
            기본 정보
          </SectionTitle>
          <FormRow>
            <FormGroup>
              <RequiredLabel htmlFor="category">카테고리</RequiredLabel>
              <Select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <OptionalLabel htmlFor="cancerType">암 종류</OptionalLabel>
              <Select
                id="cancerType"
                name="cancerType"
                value={formData.cancerType}
                onChange={handleChange}
              >
                {CANCER_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </Select>
            </FormGroup>
          </FormRow>
        </FormSection>

        {/* 후기 게시판 특화 필드 */}
        {formData.category === "review" && (
          <FormSection>
            <SectionTitle>
              <SectionIcon>
                <Hospital size={18} />
              </SectionIcon>
              후기 정보
            </SectionTitle>
            <InfoBox>
              후기 게시판에서는 병원, 치료 방법, 부작용 등 구체적인 정보를
              공유해주세요. 다른 환자분들에게 도움이 됩니다.
            </InfoBox>

            <FormGroup>
              <RequiredLabel htmlFor="hospitalName">병원명</RequiredLabel>
              <Input
                type="text"
                id="hospitalName"
                name="hospitalName"
                value={formData.hospitalName}
                onChange={handleChange}
                placeholder="예: 서울대학교병원"
              />
            </FormGroup>

            <FormGroup>
              <RequiredLabel>치료 방법 (복수 선택 가능)</RequiredLabel>
              <CheckboxGroup>
                {TREATMENT_METHODS.map((method) => (
                  <CheckboxLabel key={method.id}>
                    <input
                      type="checkbox"
                      checked={formData.treatmentMethods.includes(method.id)}
                      onChange={() =>
                        handleCheckboxChange("treatmentMethods", method.id)
                      }
                    />
                    {method.name}
                  </CheckboxLabel>
                ))}
              </CheckboxGroup>
            </FormGroup>

            <FormGroup>
              <OptionalLabel htmlFor="treatmentPeriod">치료 기간</OptionalLabel>
              <Input
                type="text"
                id="treatmentPeriod"
                name="treatmentPeriod"
                value={formData.treatmentPeriod}
                onChange={handleChange}
                placeholder="예: 2023년 1월 ~ 2023년 6월 (6개월)"
              />
            </FormGroup>

            <FormGroup>
              <OptionalLabel>부작용 (복수 선택 가능)</OptionalLabel>
              <CheckboxGroup>
                {SIDE_EFFECTS.map((effect) => (
                  <CheckboxLabel key={effect.id}>
                    <input
                      type="checkbox"
                      checked={formData.sideEffects.includes(effect.id)}
                      onChange={() =>
                        handleCheckboxChange("sideEffects", effect.id)
                      }
                    />
                    {effect.name}
                  </CheckboxLabel>
                ))}
              </CheckboxGroup>
            </FormGroup>

            <FormGroup>
              <OptionalLabel htmlFor="satisfaction">만족도</OptionalLabel>
              <Select
                id="satisfaction"
                name="satisfaction"
                value={formData.satisfaction}
                onChange={handleChange}
              >
                <option value="">선택 안 함</option>
                {SATISFACTION_LEVELS.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <RequiredLabel htmlFor="treatmentResult">치료 결과</RequiredLabel>
              <Select
                id="treatmentResult"
                name="treatmentResult"
                value={formData.treatmentResult}
                onChange={handleChange}
                required
              >
                <option value="">선택해주세요</option>
                {TREATMENT_RESULTS.map((result) => (
                  <option key={result.id} value={result.id}>
                    {result.name}
                  </option>
                ))}
              </Select>
            </FormGroup>
          </FormSection>
        )}

        {/* 정보공유 게시판 특화 필드 */}
        {formData.category === "info" && (
          <FormSection>
            <SectionTitle>
              <SectionIcon>
                <BookOpen size={18} />
              </SectionIcon>
              정보 상세
            </SectionTitle>
            <InfoBox>
              정보공유 게시판에서는 유용한 정보를 체계적으로 공유해주세요.
              출처를 명시하면 신뢰도가 높아집니다.
            </InfoBox>

            <FormGroup>
              <RequiredLabel htmlFor="infoType">정보 유형</RequiredLabel>
              <Select
                id="infoType"
                name="infoType"
                value={formData.infoType}
                onChange={handleChange}
                required
              >
                <option value="">선택해주세요</option>
                {INFO_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <OptionalLabel htmlFor="region">지역</OptionalLabel>
              <Select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
              >
                <option value="">선택 안 함</option>
                {REGIONS.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <OptionalLabel htmlFor="sourceLink">출처/링크</OptionalLabel>
              <Input
                type="url"
                id="sourceLink"
                name="sourceLink"
                value={formData.sourceLink}
                onChange={handleChange}
                placeholder="https://..."
              />
            </FormGroup>
          </FormSection>
        )}

        {/* 지원 요청 게시판 특화 필드 */}
        {formData.category === "support" && (
          <FormSection>
            <SectionTitle>
              <SectionIcon>
                <HandHeart size={18} />
              </SectionIcon>
              지원 요청 정보
            </SectionTitle>
            <InfoBox>
              지원 요청 게시판에서는 필요한 도움을 구체적으로 설명해주세요.
              구체적인 내용을 작성할수록 더 정확한 도움을 받을 수 있습니다.
            </InfoBox>

            <FormGroup>
              <RequiredLabel htmlFor="supportType">지원 유형</RequiredLabel>
              <Select
                id="supportType"
                name="supportType"
                value={formData.supportType}
                onChange={handleChange}
                required
              >
                <option value="">선택해주세요</option>
                {SUPPORT_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <OptionalLabel htmlFor="supportRegion">지역</OptionalLabel>
              <Select
                id="supportRegion"
                name="supportRegion"
                value={formData.supportRegion}
                onChange={handleChange}
              >
                <option value="">선택 안 함</option>
                {REGIONS.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </Select>
            </FormGroup>
          </FormSection>
        )}

        <FormSection>
          <SectionTitle>
            <SectionIcon>
              <Edit size={18} />
            </SectionIcon>
            게시글 내용
          </SectionTitle>
          <FormGroup>
            <RequiredLabel htmlFor="title">제목</RequiredLabel>
            <Input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="제목을 입력하세요"
              required
              maxLength={100}
            />
          </FormGroup>

          <FormGroup>
            <RequiredLabel htmlFor="content">내용</RequiredLabel>
            <TextArea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="내용을 입력하세요"
              required
            />
          </FormGroup>
        </FormSection>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <ButtonGroup>
          <CancelButton type="button" onClick={handleCancel}>
            취소
          </CancelButton>
          <SubmitButton type="submit" disabled={loading}>
            <Edit size={18} />
            {loading ? "작성 중..." : "작성하기"}
          </SubmitButton>
        </ButtonGroup>
      </Form>
    </Container>
  );
}

export default WritePostPage;
