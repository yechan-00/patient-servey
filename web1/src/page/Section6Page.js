// src/pages/Section6Page.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Alert, AlertTitle,
  LinearProgress
} from '@mui/material';
import Section6Component from '../component/Section6Component';
import { getUserAnswers } from '../utils/firebaseUtils';  // Firestore에서 기존 답변 불러오기

const steps = [
  '암 이후 내 몸의 변화',
  '건강한 삶을 위한 관리',
  '회복하도록 도와주는 사람들',
  '심리적 부담',
  '사회적 삶의 부담',
  '암 이후 탄력성',
  '추가'
];

const Section6Page = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  // SurveyForm 또는 로컬스토리지에서 사용자 이름 가져오기
  const userName = state?.name || localStorage.getItem('userName') || '';

  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(false);

  // 마운트 시 기존 답변 불러오기
  useEffect(() => {
    if (!userName) return;
    getUserAnswers(userName)
      .then(data => {
        setAnswers(data || {});
        console.log('Loaded Section6 answers:', data);
      })
      .catch(err => console.error('Error loading Section6 answers:', err));
  }, [userName]);

  const total = 3;  // Q29~Q31
  const done = ['q29', 'q30', 'q31'].filter((id) => answers[id]).length;
  const progress = (done / total) * 100;
  const currentStep = 5;

  const handleNext = () => {
    if (done < total) {
      setError(true);
      return;
    }
    navigate('/section7', { state: { name: userName, answers } });
  };

  useEffect(() => {
    if (done === total) setError(false);
  }, [done]);

  return (
    <Container maxWidth="md" sx={{ py: 4, background: 'none',
      bgcolor: 'background.default' }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
        암 생존자 건강관리 설문
      </Typography>
      <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom>
        여러분의 건강 상태와 일상생활에 대한 것입니다. 아래 내용을 체크해 주세요.
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        {steps.map((label, idx) => {
          const bg = idx < currentStep
            ? 'success.main'
            : idx === currentStep
            ? 'primary.main'
            : 'grey.300';
          const color = idx <= currentStep ? 'text.primary' : 'text.disabled';
          return (
            <Box key={label} sx={{ flex: 1, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 32, height: 32, mx: 'auto',
                  borderRadius: '50%', bgcolor: bg, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {idx + 1}
              </Box>
              <Typography variant="caption" sx={{ mt: 1, color }}>
                {label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: "center" }}>
          {steps[currentStep]}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2" align="right" sx={{ mt: 1, color: 'text.secondary' }}>
            진행 상황: {done}/{total}
          </Typography>
        </Box>

        <Section6Component   name={userName} answers={answers} setAnswers={setAnswers} />

        {error && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <AlertTitle>경고</AlertTitle>
            모든 문항을 응답해야 다음으로 넘어갈 수 있습니다.
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button variant="outlined"  onClick={() => navigate('/section5', { state: { name: userName } })}>
            이전
          </Button>
          <Button variant="contained" onClick={handleNext}>
            다음
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Section6Page;
