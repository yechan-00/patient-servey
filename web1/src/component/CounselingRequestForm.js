import React, { useState } from "react";
import { Box, TextField, Button, MenuItem, Select, InputLabel, FormControl, Typography, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.contact.trim() || !form.timeSlot.trim()) {
      alert("이름, 연락처, 상담 가능 시간은 필수입니다.");
      return;
    }
    // 실제 서비스에서는 API 또는 DB 연동 필요
    setSubmitted(true);
  };

  const handleGoHome = () => {
    navigate("/");
  };

  if (submitted) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" minHeight="100vh" sx={{ backgroundColor: 'background.default' }} px={2} py={4}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 400, borderRadius: 2 }}>
          <Typography variant="h6" color="primary" fontWeight="bold" gutterBottom>
            상담 요청이 정상적으로 접수되었습니다.
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            담당자가 곧 연락드릴 예정입니다.
          </Typography>
          <Button variant="contained" color="primary" onClick={handleGoHome} fullWidth>
            홈으로 가기
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" minHeight="100vh" sx={{ backgroundColor: 'background.default' }} px={2} py={8}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 500, width: "100%", borderRadius: 2 }}>
        <Typography variant="h5" align="center" fontWeight="bold" color="primary" gutterBottom>
          상담 요청
        </Typography>
        <Typography variant="body2" align="center" sx={{ mb: 3 }} color="text.secondary">
          궁금한 점이나 도움이 필요하신 내용을 자유롭게 남겨주세요.
        </Typography>
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
            />
            <TextField
              name="contact"
              label="연락처 (휴대폰 또는 이메일)"
              value={form.contact}
              onChange={handleChange}
              required
              fullWidth
              variant="outlined"
            />
            <TextField
              name="detail"
              label="상담받고 싶은 구체적인 내용 (선택)"
              value={form.detail}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
            />
            <FormControl required fullWidth variant="outlined">
              <InputLabel id="timeslot-label">상담 가능 시간</InputLabel>
              <Select
                labelId="timeslot-label"
                name="timeSlot"
                value={form.timeSlot}
                label="상담 가능 시간"
                onChange={handleChange}
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
              >
                <MenuItem value="">선택안함</MenuItem>
                <MenuItem value="대면">대면</MenuItem>
                <MenuItem value="전화">전화</MenuItem>
                <MenuItem value="화상">화상</MenuItem>
              </Select>
            </FormControl>
            <Box display="flex" gap={2} mt={2}>
              <Button variant="contained" color="primary" fullWidth onClick={handleGoHome}>
                홈으로 가기
              </Button>
              <Button type="submit" variant="contained" color="primary" fullWidth>
                상담 요청 제출
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default CounselingRequestForm;
