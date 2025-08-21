// React : 사용자 인터페이스를 위한 JavaScript 라이브러리
// useState : 컴포넌트 상태 관리 - 상태는 컴포넌트가 기억해야하는 동적인 값 - 이값이 변경되면 컴포넌트가 다시 렌더링됨
// useEffect : 컴포넌트가 렌더링될 때마다 특정 작업을 수행할 수 있도록 해주는 함수
import React, { useState, useEffect } from 'react';
// react-router-dom : react 애플리케이션에서 페이지 이동 및 현재 url정보에 접근하기 위한 라이브러리
import { useNavigate, useLocation } from 'react-router-dom';
// Google이 만든 React UI 프레임워크 컴포넌트들 가져오기기
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Alert, AlertTitle, 
  LinearProgress
} from '@mui/material';
// 섹션 1 컴포넌트 가져오기
import Section1Component from '../component/Section1Component';
// Firebaseutils파일에서 saveUserAnswers함수 가져오기
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
// const : 상수 선언 - 선언한 동시에 값을 할당해야 함
// section1page 함수 정의 
const Section1Page = () => {
  const navigate = useNavigate();
  // useLocation함수를 호출하여 현재 URL의 location 객체를 가져오고 그안에 있는 state를 가져옴
  const { state } = useLocation();
  // ? - 옵셔널 체이닝 : 자바스크립트에서 객체 내부 속성에 접근할 때 중간에 값이 없으면 에러가 발생하지 않고 대신 undefined를 반환하는 안전한 문법 
  // state객체에 userName이 있으면 그 값을 사용하고 없으면 localStorage에 저장된 userName값을 사용, 둘다 없으면 빈 문자열
  const userName = state?.userName || localStorage.getItem('userName') || '';
  // useState함수의 배열 구조 분해 할당 -> [현재 상태 값,해당 상태 값을 업데이트할 수 있는 함수]
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(false);

  const total = 8;  // Q1~Q8
  // Object.keys : 주어진 객체의 키들만 뽑아서 문자열 배열로 반환하는 자바스크립트 내장 메서드
  // 사용자가 질문에 대한 답변을 얼마나 했는지 체크하기 위한 변수 - 답변 개수에 따라 길이 동적으로 설정정
  const done = Object.keys(answers).filter(k => answers[k]).length;
  const progress = (done / total) * 100;
  const currentStep = 0;
  // 다음 버튼 클릭 시 호출되는 함수 
  const handleNext = async () => {
    if (done < total) {
      setError(true);
      return;
    }
    // ...스프레드 연산자 answers객체의 모든 속성을 그대로 복사ㅏ여 updatedAnswers객체에 넣음
    const updatedAnswers = {
      ...answers,
    };


    // Firebase에 사용자 답변 저장
    await saveUserAnswers(userName, updatedAnswers);

    navigate('/section2', { state: { name: userName, answers } });
  };

  useEffect(() => {
    if (done === total) setError(false);
  }, [done]);

  return (
    <Container maxWidth="md" sx={{ py: 4, background: 'none', bgcolor: 'background.default' }}>
      {/* 설문 헤더 */}
      <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
        암 생존자 건강관리 설문
      </Typography>
      <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom>
        여러분의 건강 상태와 일상생활에 대한 것입니다. 아래 내용을 체크해 주세요.
      </Typography>

      {/* 커스텀 스텝바 */}
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

      {/* 질문 카드 */}
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* 섹션 제목 */}
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: "center" }} >
          {steps[currentStep]}
        </Typography>

        {/* 진행바 */}
        <Box sx={{ mb: 3 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2" align="right" sx={{ mt: 1, color: 'text.secondary' }}>
            진행 상황: {done}/{total}
          </Typography>
        </Box>

        {/* 질문 컴포넌트 */}
        <Section1Component name={userName}
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

        {/* 이전/다음 버튼 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button variant="outlined" onClick={() => navigate('/info')}>
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

export default Section1Page;
