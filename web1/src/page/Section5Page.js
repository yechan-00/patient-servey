// src/pages/Section5Page.js
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
import Section5Component from '../component/Section5Component';

const steps = [
  '암 이후 내 몸의 변화',
  '건강한 삶을 위한 관리',
  '회복하도록 도와주는 사람들',
  '심리적 부담',
  '사회적 삶의 부담',
  '암 이후 탄력성',
  '추가'
];

const Section5Page = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const userName = state?.name || localStorage.getItem('userName') || '';
  const fromSkip = state?.fromSkip || false;

  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(false);

  const total = 3;  // Q26~Q28
  const done = ['q26', 'q27', 'q28'].filter((id) => answers[id]).length;
  const progress = (done / total) * 100;
  const currentStep = 4;

  const handleNext = () => {
    if (done < total) {
      setError(true);
      return;
    }
    navigate('/section6', { state: { name: userName, answers } });
  };

  useEffect(() => {
    if (done === total) setError(false);
  }, [done, total]);

  return (
    <Container maxWidth="md" sx={{ py: 4, background: 'none', bgcolor: 'background.default' }}>
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
                  width: 32,
                  height: 32,
                  mx: 'auto',
                  borderRadius: '50%',
                  bgcolor: bg,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
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

      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                  {steps[currentStep]}
                </Typography>
        <Box sx={{ mb: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography align="right" variant="body2">{done}/{total}</Typography>
        </Box>

        <Section5Component
          name={userName}
          answers={answers}
          setAnswers={setAnswers}
        />

        {error && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <AlertTitle>경고</AlertTitle>
            모든 문항을 응답해야 다음으로 넘어갈 수 있습니다.
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={() =>
              navigate(
                fromSkip ? '/section2' : '/section4',
                { state: { name: userName } }
              )
            }
          >
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

export default Section5Page;
