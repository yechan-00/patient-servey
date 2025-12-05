import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { getAuth } from "firebase/auth";
import { COLLECTIONS } from "../utils/collectionConfig";

const initialForm = {
  name: "",
  contact: "",
  detail: "",
  preferredMethod: "",
  timeSlot: "",
};

const CounselingRequestForm = () => {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 기본 유효성 검사
    if (!form.name.trim() || !form.contact.trim() || !form.timeSlot.trim()) {
      alert("이름, 연락처, 상담 가능 시간은 필수입니다.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const auth = getAuth();
      const uid = auth.currentUser?.uid || "";

      // 라우팅 state → localStorage → uid 우선순위로 안정 patientId 확보
      const pidFromState =
        location && location.state && location.state.patientId
          ? location.state.patientId
          : "";
      const pidFromStorage =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("patientId") || ""
          : "";
      const patientId = pidFromState || pidFromStorage || uid;

      if (!patientId) {
        console.warn(
          "[CounselingRequestForm] patientId 미확인: userId 저장 불가"
        );
        alert(
          "환자 식별값(patientId)을 확인할 수 없습니다. 설문을 처음부터 다시 시작해주세요."
        );
        setLoading(false);
        return;
      }

      // Firebase Firestore에 상담 요청 데이터 저장
      const counselingRequestData = {
        userId: patientId, // patients 문서ID와 동일 키로 저장
        name: form.name.trim(),
        phone: form.contact.trim(), // contact -> phone (웹2 기대 키)
        detail: form.detail.trim(),
        contactMethod: form.preferredMethod || "", // preferredMethod -> contactMethod
        contactTime: form.timeSlot, // timeSlot -> contactTime
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // counselingRequests 컬렉션에 문서 추가
      const docRef = await addDoc(
        collection(db, COLLECTIONS.COUNSELING_REQUESTS),
        counselingRequestData
      );

      // patients/{patientId} 에 표시용 필드 동기화 (웹2 표시와 조인 안정화)
      const patientRef = doc(db, COLLECTIONS.PATIENTS, patientId);
      await setDoc(
        patientRef,
        {
          name: form.name.trim(),
          phone: form.contact.trim(),
          contactMethod: form.preferredMethod || "",
          contactTime: form.timeSlot,
          lastCounselingRequestAt: serverTimestamp(),
          lastCounselingRequestId: docRef.id,
        },
        { merge: true }
      );

      console.log("상담 요청이 저장되었습니다. Document ID: ", docRef.id);

      // 성공 시 submitted 상태로 변경
      setSubmitted(true);
    } catch (error) {
      console.error("상담 요청 저장 중 오류 발생:", error);
      setError("상담 요청 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    navigate("/");
  };

  if (submitted) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        minHeight="100vh"
        sx={{ backgroundColor: "background.default" }}
        px={2}
        py={4}
      >
        <Paper
          elevation={3}
          sx={{ p: 4, textAlign: "center", maxWidth: 400, borderRadius: 2 }}
        >
          <Typography
            variant="h6"
            color="primary"
            fontWeight="bold"
            gutterBottom
          >
            상담 요청이 정상적으로 접수되었습니다.
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            담당자가 곧 연락드릴 예정입니다.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGoHome}
            fullWidth
          >
            홈으로 가기
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      minHeight="100vh"
      sx={{ backgroundColor: "background.default" }}
      px={2}
      py={8}
    >
      <Paper
        elevation={3}
        sx={{ p: 4, maxWidth: 500, width: "100%", borderRadius: 2 }}
      >
        <Typography
          variant="h5"
          align="center"
          fontWeight="bold"
          color="primary"
          gutterBottom
        >
          상담 요청
        </Typography>
        <Typography
          variant="body2"
          align="center"
          sx={{ mb: 3 }}
          color="text.secondary"
        >
          궁금한 점이나 도움이 필요하신 내용을 자유롭게 남겨주세요.
        </Typography>

        {/* 에러 메시지 표시 */}
        {error && (
          <Typography
            variant="body2"
            color="error"
            sx={{ mb: 2, textAlign: "center" }}
          >
            {error}
          </Typography>
        )}

        <form onSubmit={handleSubmit}>
          <Box display="flex" flexDirection="column" gap={3}>
            <TextField
              name="name"
              label="이름"
              value={form.name}
              onChange={handleChange}
              required
              fullWidth
              variant="outlined"
              disabled={loading}
            />
            <TextField
              name="contact"
              label="연락처 (휴대폰 또는 이메일)"
              value={form.contact}
              onChange={handleChange}
              required
              fullWidth
              variant="outlined"
              disabled={loading}
            />
            <TextField
              name="detail"
              label="상담 내용 (선택사항)"
              placeholder="상담 받고 싶은 내용을 자세히 적어주세요"
              value={form.detail}
              onChange={handleChange}
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              disabled={loading}
            />
            <FormControl required fullWidth variant="outlined">
              <InputLabel id="timeslot-label">전화 상담 가능 시간</InputLabel>
              <Select
                labelId="timeslot-label"
                name="timeSlot"
                value={form.timeSlot}
                label="전화 상담 가능 시간"
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value="08:00 ~ 09:00">08:00 ~ 09:00</MenuItem>
                <MenuItem value="09:00 ~ 10:00">09:00 ~ 10:00</MenuItem>
                <MenuItem value="10:00 ~ 11:00">10:00 ~ 11:00</MenuItem>
                <MenuItem value="11:00 ~ 12:00">11:00 ~ 12:00</MenuItem>
                <MenuItem value="13:00 ~ 14:00">13:00 ~ 14:00</MenuItem>
                <MenuItem value="14:00 ~ 15:00">14:00 ~ 15:00</MenuItem>
                <MenuItem value="15:00 ~ 16:00">15:00 ~ 16:00</MenuItem>
                <MenuItem value="16:00 ~ 17:00">16:00 ~ 17:00</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth variant="outlined">
              <InputLabel>상담 방식(선택)</InputLabel>
              <Select
                name="preferredMethod"
                value={form.preferredMethod}
                label="상담 방식(선택)"
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value="">선택안함</MenuItem>
                <MenuItem value="대면">대면</MenuItem>
                <MenuItem value="전화">전화</MenuItem>
                <MenuItem value="화상">화상</MenuItem>
              </Select>
            </FormControl>
            <Box display="flex" gap={2} mt={2}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleGoHome}
                disabled={loading}
              >
                홈으로 가기
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
              >
                {loading ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={20} color="inherit" />
                    저장 중...
                  </Box>
                ) : (
                  "상담 요청 제출"
                )}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default CounselingRequestForm;
