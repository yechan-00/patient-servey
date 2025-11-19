// src/pages/ProfilePage.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  doc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { CANCER_TYPES, TREATMENT_STAGES } from "../utils/constants";

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
  align-items: center;
  gap: 0.5rem;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  cursor: pointer;
  color: #495057;
`;

const HelpText = styled.p`
  font-size: 0.85rem;
  color: #6c757d;
  margin-top: 0.25rem;
  margin-bottom: 0;
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

const SuccessMessage = styled.p`
  color: #28a745;
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #d4edda;
  border-radius: 6px;
  font-size: 0.9rem;
`;

const Loading = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6c757d;
`;

function ProfilePage() {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [originalDisplayName, setOriginalDisplayName] = useState("");
  const [lastNicknameChange, setLastNicknameChange] = useState(null);
  const [checkingNickname, setCheckingNickname] = useState(false);
  const [nicknameError, setNicknameError] = useState("");
  const [nicknameAvailable, setNicknameAvailable] = useState(false);
  const nicknameCheckTimeoutRef = useRef(null);
  const [formData, setFormData] = useState({
    displayName: "",
    cancerType: "",
    diagnosisDate: "",
    treatmentStage: "",
    publicProfile: false,
  });

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        const userRef = doc(db, "community_users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          const displayName = data.displayName || "";
          setFormData({
            displayName: displayName,
            cancerType: data.cancerType || "",
            diagnosisDate: data.diagnosisDate || "",
            treatmentStage: data.treatmentStage || "",
            publicProfile: data.publicProfile || false,
          });
          setOriginalDisplayName(displayName);
          setLastNicknameChange(data.lastNicknameChange?.toDate?.() || null);
        } else {
          const displayName = userProfile?.displayName || "";
          setFormData({
            displayName: displayName,
            cancerType: "",
            diagnosisDate: "",
            treatmentStage: "",
            publicProfile: false,
          });
          setOriginalDisplayName(displayName);
          setLastNicknameChange(null);
        }
      } catch (error) {
        console.error("프로필 로드 오류:", error);
        setError("프로필을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser, navigate, userProfile]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (nicknameCheckTimeoutRef.current) {
        clearTimeout(nicknameCheckTimeoutRef.current);
      }
    };
  }, []);

  // 닉네임 중복 체크 (자신의 닉네임 제외)
  const checkNicknameAvailability = async (nickname) => {
    if (!nickname || nickname.trim().length < 2) {
      setNicknameError("");
      setNicknameAvailable(false);
      return false;
    }

    const trimmedNickname = nickname.trim();

    // 원래 닉네임과 같으면 체크 불필요
    if (trimmedNickname === originalDisplayName) {
      setNicknameError("");
      setNicknameAvailable(true);
      return true;
    }

    // 닉네임 길이 체크
    if (trimmedNickname.length < 2 || trimmedNickname.length > 20) {
      setNicknameError("닉네임은 2자 이상 20자 이하여야 합니다.");
      setNicknameAvailable(false);
      return false;
    }

    try {
      setCheckingNickname(true);
      setNicknameError("");

      // Firestore에서 동일한 닉네임 검색 (자신 제외)
      const usersRef = collection(db, "community_users");
      const q = query(usersRef, where("displayName", "==", trimmedNickname));
      const querySnapshot = await getDocs(q);

      // 자신의 닉네임이 아니고 다른 사용자가 사용 중인 경우
      const isUsedByOthers = querySnapshot.docs.some(
        (doc) => doc.id !== currentUser.uid
      );

      if (!isUsedByOthers) {
        setNicknameError("");
        setNicknameAvailable(true);
        return true;
      } else {
        setNicknameError("이미 사용 중인 닉네임입니다.");
        setNicknameAvailable(false);
        return false;
      }
    } catch (error) {
      console.error("닉네임 중복 체크 오류:", error);
      setNicknameError("닉네임 확인 중 오류가 발생했습니다.");
      setNicknameAvailable(false);
      return false;
    } finally {
      setCheckingNickname(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    setError("");
    setSuccess("");

    // 닉네임 입력 시 중복 체크 (디바운싱)
    if (name === "displayName") {
      // 이전 타이머 취소
      if (nicknameCheckTimeoutRef.current) {
        clearTimeout(nicknameCheckTimeoutRef.current);
      }

      // 500ms 후에 체크
      nicknameCheckTimeoutRef.current = setTimeout(() => {
        checkNicknameAvailability(value);
      }, 500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedNickname = formData.displayName.trim();
    if (!trimmedNickname) {
      return setError("닉네임을 입력해주세요.");
    }

    // 닉네임이 변경된 경우
    const isNicknameChanged = trimmedNickname !== originalDisplayName;

    if (isNicknameChanged) {
      // 닉네임 변경 제한 체크 (한 달에 한 번)
      if (lastNicknameChange) {
        const now = new Date();
        const lastChange = new Date(lastNicknameChange);
        const daysSinceLastChange = Math.floor(
          (now - lastChange) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastChange < 30) {
          const remainingDays = 30 - daysSinceLastChange;
          return setError(
            `닉네임은 한 달에 한 번만 변경할 수 있습니다. ${remainingDays}일 후에 변경 가능합니다.`
          );
        }
      }

      // 닉네임 중복 최종 체크
      if (trimmedNickname.length < 2 || trimmedNickname.length > 20) {
        return setError("닉네임은 2자 이상 20자 이하여야 합니다.");
      }

      const isAvailable = await checkNicknameAvailability(trimmedNickname);
      if (!isAvailable) {
        return setError(
          "사용할 수 없는 닉네임입니다. 다른 닉네임을 선택해주세요."
        );
      }
    }

    try {
      setError("");
      setSuccess("");
      setSaving(true);

      const updateData = {
        displayName: trimmedNickname,
        cancerType: formData.cancerType || null,
        diagnosisDate: formData.diagnosisDate || null,
        treatmentStage: formData.treatmentStage || null,
        publicProfile: formData.publicProfile,
        updatedAt: serverTimestamp(),
      };

      // 닉네임이 변경된 경우 lastNicknameChange 업데이트
      if (isNicknameChanged) {
        updateData.lastNicknameChange = serverTimestamp();
      }

      await updateUserProfile(currentUser.uid, updateData);

      // 로컬 상태 업데이트
      setOriginalDisplayName(trimmedNickname);
      if (isNicknameChanged) {
        setLastNicknameChange(new Date());
      }

      setSuccess("프로필이 업데이트되었습니다.");
    } catch (error) {
      console.error("프로필 업데이트 오류:", error);
      setError("프로필 업데이트 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Loading>로딩 중...</Loading>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>프로필 설정</Title>
      </Header>

      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="displayName">닉네임 *</Label>
          <Input
            type="text"
            id="displayName"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            placeholder="닉네임을 입력하세요 (2-20자)"
            required
            maxLength={20}
          />
          {checkingNickname && (
            <HelpText style={{ color: "#2196f3" }}>닉네임 확인 중...</HelpText>
          )}
          {nicknameError && (
            <HelpText style={{ color: "#dc3545" }}>{nicknameError}</HelpText>
          )}
          {nicknameAvailable &&
            formData.displayName.trim() !== originalDisplayName &&
            formData.displayName.trim().length >= 2 && (
              <HelpText style={{ color: "#28a745" }}>
                ✓ 사용 가능한 닉네임입니다.
              </HelpText>
            )}
          {!checkingNickname &&
            !nicknameError &&
            formData.displayName.trim().length >= 2 && (
              <HelpText>
                커뮤니티에서 표시될 이름입니다.
                {formData.displayName.trim() !== originalDisplayName &&
                  lastNicknameChange && (
                    <>
                      <br />
                      <span style={{ color: "#ff9800" }}>
                        ⚠️ 닉네임은 한 달에 한 번만 변경할 수 있습니다.
                      </span>
                    </>
                  )}
              </HelpText>
            )}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="cancerType">암 종류 (선택사항)</Label>
          <Select
            id="cancerType"
            name="cancerType"
            value={formData.cancerType}
            onChange={handleChange}
          >
            {[
              { id: "", name: "선택 안 함" },
              ...CANCER_TYPES.filter((t) => t.id !== "all"),
            ].map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </Select>
          <HelpText>
            같은 암 종류의 환자들과 소통할 때 도움이 됩니다. (비공개 가능)
          </HelpText>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="diagnosisDate">진단일 (선택사항)</Label>
          <Input
            type="date"
            id="diagnosisDate"
            name="diagnosisDate"
            value={formData.diagnosisDate}
            onChange={handleChange}
          />
          <HelpText>진단받은 날짜를 입력하세요. (비공개 가능)</HelpText>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="treatmentStage">치료 단계 (선택사항)</Label>
          <Select
            id="treatmentStage"
            name="treatmentStage"
            value={formData.treatmentStage}
            onChange={handleChange}
          >
            {TREATMENT_STAGES.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </Select>
          <HelpText>
            현재 치료 단계를 선택하세요. 비슷한 상황의 환자들과 소통할 때 도움이
            됩니다. (비공개 가능)
          </HelpText>
        </FormGroup>

        <FormGroup>
          <CheckboxGroup>
            <Checkbox
              type="checkbox"
              id="publicProfile"
              name="publicProfile"
              checked={formData.publicProfile}
              onChange={handleChange}
            />
            <CheckboxLabel htmlFor="publicProfile">
              프로필 정보 공개
            </CheckboxLabel>
          </CheckboxGroup>
          <HelpText>
            체크하면 다른 사용자들이 내 암 종류, 진단일, 치료 단계를 볼 수
            있습니다. 체크하지 않으면 비공개로 유지됩니다.
          </HelpText>
        </FormGroup>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        <ButtonGroup>
          <CancelButton
            type="button"
            onClick={() => navigate("/")}
            disabled={saving}
          >
            취소
          </CancelButton>
          <SubmitButton type="submit" disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </SubmitButton>
        </ButtonGroup>
      </Form>
    </Container>
  );
}

export default ProfilePage;
