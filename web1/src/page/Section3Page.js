// src/pages/Section3Page.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Alert,
  AlertTitle,
  LinearProgress
} from '@mui/material';
import Section3Component from '../component/Section3Component';
import { saveUserAnswers } from '../utils/firebaseUtils';

const steps = [
  '암 이후 내 몸의 변화',
  '건강한 삶을 위한 관리',
  '회복하도록 도와주는 사람들',
  '심리적 부담',
  '사회적 삶의 부담',
  '암 이후 탄력성',
  '추가'
];

const Section3Page = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  // SurveyForm 또는 로컬스토리지에서 사용자 이름 가져오기
  const userName = state?.name || localStorage.getItem('userName') || '';

  const [answers, setAnswers] = useState({ q15_reasons: [] });
  const [error, setError] = useState(false);

  // Q14~Q17 진행
  const requiredIds = ['q14', 'q15', 'q16', 'q17'];
  const doneCount = requiredIds.filter(id => answers[id]).length;
  const total = requiredIds.length;
  const progress = (doneCount / total) * 100;
  const currentStep = 2;

  // Q15-1 조건
  const needsReasons = answers.q15 === '1' || answers.q15 === '2';
  const ready = needsReasons
    ? doneCount === total && answers.q15_reasons.length > 0
    : doneCount === total;

  const handleNext = async () => {
    if (!ready) {
      setError(true);
      return;
    }
    try {
      await saveUserAnswers(userName, answers); // 답변 저장
      navigate('/section4', { state: { name: userName, answers } });
    } catch (e) {
      alert('답변 저장에 실패했습니다.');
    }
  };

  useEffect(() => {
    if (ready) setError(false);
  }, [ready]);

  return (
    <Container
      maxWidth="md"
      sx={{ py: 4, background: 'none', bgcolor: 'background.default' }}
    >
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        sx={{ fontWeight: 'bold' }}
      >
        암 생존자 건강관리 설문
      </Typography>
      <Typography
        variant="subtitle1"
        align="center"
        color="textSecondary"
        gutterBottom
      >
        여러분의 건강 상태와 일상생활에 대한 것입니다. 아래 내용을 체크해 주세요.
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        {steps.map((label, idx) => {
          const bg =
            idx < currentStep
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

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}
        >
          {steps[currentStep]}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography
            variant="body2"
            align="right"
            sx={{ mt: 1, color: 'text.secondary' }}
          >
            진행 상황: {doneCount}/{total}
          </Typography>
        </Box>

        <Section3Component name={userName}
          answers={answers}
          setAnswers={setAnswers}
        />

        {/* error가 true일 때만 Alert 보이기 */}
        {error && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <AlertTitle>경고</AlertTitle>
            모든 문항을 응답해야 다음으로 넘어갈 수 있습니다.
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button variant="outlined" onClick={() => navigate('/section2')}>
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

export default Section3Page;
