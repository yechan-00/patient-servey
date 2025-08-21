// src/page/home.js
import React from 'react';
// ⬇️ import 추가
import { useNavigate } from 'react-router-dom';

import { Box, Container, Typography, Paper } from '@mui/material';
import {
  HeaderSection,
  CardContainer,
  StartButton,
  FooterCopyright,
} from '../component/home_ui.js'; // 경로 수정 필요


const Home = () => {
  const handleStart = () => {
    console.log('설문 시작!');
  };
// ⬇️ 컴포넌트 내부에서 navigate 함수 선언
const navigate = useNavigate();

const goToSurvey = () => {
  navigate('/info'); // "/info" 경로로 이동
};

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default', // MUI theme의 단색 배경
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          flexGrow: 1,
          py: 6,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <HeaderSection />
        <Paper elevation={6} sx={{ borderRadius: 4, p: 5 }}>
          <Typography
            variant="body1"
            align="center"
            color="textPrimary"
            fontWeight={550}
            mb={3}
          >
            <strong>당신은 혼자가 아닙니다.</strong>  <br/>
            이 서비스는 암 진단 이후의 건강 관리, 심리적 회복과 일상 복귀를 지원하기 위해 만들어졌습니다.
            <br />
            간단한 설문을 통해 현재 상태를 파악하고, 맞춤형 건강 관리 가이드를 제공하며 <br/>필요시 전문 상담도 받을 수 있습니다.
          </Typography>

          <CardContainer />
          <StartButton onClick={goToSurvey} />
        </Paper>
        <FooterCopyright />
      </Container>
    </Box>
  );
};

export default Home;
