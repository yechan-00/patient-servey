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

const Container = styled.div`
  max-width: 800px;
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

const Form = styled.form`
  background-color: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

const RequiredLabel = styled(Label)`
  &::after {
    content: " *";
    color: #dc3545;
  }
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

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  min-height: 300px;
  resize: vertical;
  font-family: inherit;
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
  background-color: white;
  transition: all 0.3s ease;

  &:focus {
    border-color: #2a5e8c;
    outline: none;
    box-shadow: 0 0 0 3px rgba(42, 94, 140, 0.1);
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #495057;
  cursor: pointer;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
`;

const InfoBox = styled.div`
  background-color: #e7f3ff;
  border-left: 4px solid #2a5e8c;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #495057;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`;

const Button = styled.button`
  flex: 1;
  padding: 0.875rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
`;

const SubmitButton = styled(Button)`
  background-color: #2a5e8c;
  color: white;
  border: none;

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

const CancelButton = styled(Button)`
  background-color: white;
  color: #6c757d;
  border: 2px solid #e9ecef;

  &:hover {
    background-color: #f8f9fa;
    border-color: #6c757d;
  }
`;

const ErrorMessage = styled.p`
  color: #dc3545;
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #f8d7da;
  border-radius: 6px;
  font-size: 0.9rem;
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
      </Header>

      <Form onSubmit={handleSubmit}>
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
          <Label htmlFor="cancerType">
            암 종류 (선택사항) - 같은 암 종류 환자들이 찾기 쉽게 합니다
          </Label>
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

        {/* 후기 게시판 특화 필드 */}
        {formData.category === "review" && (
          <>
            <InfoBox>
              💡 후기 게시판에서는 병원, 치료 방법, 부작용 등 구체적인 정보를
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
              <Label htmlFor="treatmentPeriod">치료 기간</Label>
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
              <Label>부작용 (복수 선택 가능)</Label>
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
              <Label htmlFor="satisfaction">만족도</Label>
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
          </>
        )}

        {/* 정보공유 게시판 특화 필드 */}
        {formData.category === "info" && (
          <>
            <InfoBox>
              💡 정보공유 게시판에서는 유용한 정보를 체계적으로 공유해주세요.
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
              <Label htmlFor="region">지역 (선택사항)</Label>
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
              <Label htmlFor="sourceLink">출처/링크 (선택사항)</Label>
              <Input
                type="url"
                id="sourceLink"
                name="sourceLink"
                value={formData.sourceLink}
                onChange={handleChange}
                placeholder="https://..."
              />
            </FormGroup>
          </>
        )}

        {/* 지원 요청 게시판 특화 필드 */}
        {formData.category === "support" && (
          <>
            <InfoBox>
              💡 지원 요청 게시판에서는 필요한 도움을 구체적으로 설명해주세요.
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
              <Label htmlFor="supportRegion">지역 (선택사항)</Label>
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
          </>
        )}

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

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <ButtonGroup>
          <CancelButton type="button" onClick={handleCancel}>
            취소
          </CancelButton>
          <SubmitButton type="submit" disabled={loading}>
            {loading ? "작성 중..." : "작성하기"}
          </SubmitButton>
        </ButtonGroup>
      </Form>
    </Container>
  );
}

export default WritePostPage;
