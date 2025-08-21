// src/pages/Section2Page.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import Section2Component from '../component/Section2Component';

const steps = [
  '암 이후 내 몸의 변화',
  '건강한 삶을 위한 관리',
  '회복하도록 도와주는 사람들',
  '심리적 부담',
  '사회적 삶의 부담',
  '암 이후 탄력성',
  '추가'
];

const Section2Page = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  // SurveyForm 또는 로컬스토리지에서 사용자 이름 가져오기
  const userName = state?.name || localStorage.getItem('userName') || '';

  // answers 초기값을 빈 객체로 변경
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(false);

  const requiredSub12 = ['1', '2'].includes(answers.q12);
  const requiredSub13 = ['4', '5'].includes(answers.q13);

  const mainDone = ['q9','q10','q11'].filter(id => answers[id]).length;
  const sub12Done = requiredSub12 && answers.q12_reasons?.length > 0 ? 1 : 0;
  const sub13Ids = ['q13_1_1','q13_1_2','q13_1_3','q13_1_4','q13_1_5','q13_1_6'];
  const sub13Done = requiredSub13 ? sub13Ids.filter(id => answers[id]).length : 0;
  const doneCount = mainDone + sub12Done + sub13Done;
  const totalCount = 3 + (requiredSub12 ? 1 : 0) + (requiredSub13 ? sub13Ids.length : 0);

  const mainProgressCount = mainDone + (answers.q12 ? 1 : 0) + (answers.q13 ? 1 : 0);
  const progressPercentage = (mainProgressCount / 5) * 100;
  const currentStep = 1;

  const handleNext = () => {
    // 9, 10, 11번 필수 체크 (undefined, 빈 문자열, 공백 모두 막기)
    if (
      !answers.q9 || (typeof answers.q9 === 'string' && answers.q9.trim() === '') ||
      !answers.q10 || (typeof answers.q10 === 'string' && answers.q10.trim() === '') ||
      !answers.q11 || (typeof answers.q11 === 'string' && answers.q11.trim() === '')
    ) {
      setError(true);
      return;
    }
    // 기존의 추가 조건(서브질문 등)도 그대로 유지
    if (doneCount < totalCount) {
      setError(true);
      return;
    }
    navigate('/section3', { state: { name: userName, answers } });
  };

  useEffect(() => {
    if (doneCount === totalCount) setError(false);
  }, [doneCount, totalCount]);

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
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
          {steps[currentStep]}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <LinearProgress variant="determinate" value={progressPercentage} />
          <Typography variant="body2" align="right" sx={{ mt: 1, color: 'text.secondary' }}>
            진행 상황: {mainProgressCount}/5
          </Typography>
        </Box>

        <Section2Component
          name={userName}
          answers={answers}
          setAnswers={setAnswers}
          setValidationError={setError}
          validationError={error}
        />

        {error && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <AlertTitle>경고</AlertTitle>
            모든 문항을 응답해야 다음으로 넘어갈 수 있습니다.
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button variant="outlined" onClick={() => navigate('/section1')}>이전</Button>
          <Button variant="contained" onClick={handleNext}>다음</Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Section2Page;
