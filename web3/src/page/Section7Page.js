// src/pages/Section7Page.js
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
import Section7Component from '../component/Section7Component';
import { getUserAnswers } from '../utils/firebaseUtils';

const steps = [
  '암 이후 내 몸의 변화',
  '건강한 삶을 위한 관리',
  '회복을 도와주는 사람들',
  '심리적 부담',
  '사회적 삶의 부담',
  '암 이후 탄력성',
  '추가'
];

const Section7Page = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const userName = state?.name || localStorage.getItem('userName') || '';

  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(false);
  const [missingQuestions, setMissingQuestions] = useState([]);

  // 마운트 시 기존 답변 불러오기
  useEffect(() => {
    if (!userName) return;
    getUserAnswers(userName)
      .then(data => {
        setAnswers(data || {});
        console.log('Loaded Section7 answers:', data);
      })
      .catch(err => console.error('Error loading Section7 answers:', err));
  }, [userName]);

  const total = 2;  // Q32~Q33 (추가 질문들은 선택사항)
  const done = ['q32','q33'].filter(id => answers[id]).length;
  const progress = (done / total) * 100;
  const currentStep = 6;

  // 미응답 문항으로 스크롤하는 함수
  const scrollToFirstMissing = (missing) => {
    if (missing.length > 0) {
      const firstMissingElement = document.getElementById(missing[0]);
      if (firstMissingElement) {
        firstMissingElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }
  };

  const handleNext = () => {
    const requiredQuestions = ['q32', 'q33'];
    const missing = requiredQuestions.filter(q => !answers[q]);
    
    if (missing.length > 0) {
      setMissingQuestions(missing);
      setError(true);
      scrollToFirstMissing(missing);
      return;
    }
    
    // navigate 호출 시 answers를 state에 포함하여 전달
    navigate('/survey-result', { state: { name: userName, answers: answers } });
  };

  useEffect(() => {
    if (done === total) {
      setError(false);
      setMissingQuestions([]);
    }
  }, [done]);

  return (
    <Container maxWidth="md" sx={{ py: 4, bgcolor: 'background.default' }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
        암 생존자 건강관리 설문
      </Typography>
      <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom sx={{ mb: 4 }}>
        여러분의 건강 상태와 일상생활에 대한 것입니다. 아래 내용을 체크해 주세요.
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 5 }}>
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
            </Box>
          );
        })}
      </Box>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
          {steps[currentStep]}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2" align="right" sx={{ mt: 1, color: 'text.secondary' }}>
            필수 문항 진행 상황: {done}/{total}
          </Typography>
        </Box>

        {/* 추가 정보 안내 */}
        <Box sx={{ mb: 3, p: 2, backgroundColor: '#e8f5e8', borderRadius: 1, borderLeft: '4px solid #4caf50' }}>
          <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 500 }}>
            💡 <strong>안내:</strong> 32~33번은 필수 문항이며, 34~36번은 선택사항입니다. 
            추가 정보를 제공해 주시면 더 나은 맞춤형 서비스를 제공할 수 있습니다.
          </Typography>
        </Box>

        <Section7Component
          name={userName}
          answers={answers}
          setAnswers={setAnswers}
          missingQuestions={missingQuestions}
        />

        {error && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <AlertTitle>미응답 문항이 있습니다</AlertTitle>
            필수 문항을 모두 응답해야 설문을 완료할 수 있습니다. 빨간색으로 표시된 문항을 확인해 주세요.
            {missingQuestions.length > 0 && (
              <Box sx={{ mt: 1 }}>
                미응답 문항: {missingQuestions.map(q => q.replace('q', '') + '번').join(', ')}
              </Box>
            )}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button variant="outlined" onClick={() => navigate('/section6', { state: { name: userName } })}>
            이전
          </Button>
          <Button variant="contained" onClick={handleNext}>
            완료
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Section7Page;
