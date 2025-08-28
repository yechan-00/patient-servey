// src/page/home.js
import React, { useState } from 'react';
// ⬇️ import 추가
import { useNavigate } from 'react-router-dom';

import { Box, Container, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
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
  const [openConfirm, setOpenConfirm] = useState(false);

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
      <Button
        variant="contained"
        color="secondary"
        size="small"
        onClick={() => setOpenConfirm(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          borderRadius: 2,
          fontSize: '0.8rem',
          fontWeight: 500,
          zIndex: 1000,
        }}
      >
        상담 신청
      </Button>
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)} aria-labelledby="consult-confirm-title">
        <DialogTitle id="consult-confirm-title">상담 신청 전에 안내드립니다</DialogTitle>
        <DialogContent>
          <DialogContentText>
            설문을 먼저 완료하시면 현재 심리·건강 상태를 바탕으로 더 정확한 상담이 가능합니다. 설문 결과는 담당 사회복지사에게 자동으로 전달되어 추가 질문 없이 바로 상담을 시작할 수 있어요.
            설문 없이 바로 상담을 신청하시면 필요한 정보가 없어 확인 질문이 늘어나 상담이 지연될 수 있습니다. 그래도 지금 바로 상담을 신청하시겠어요?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>설문 먼저 하기</Button>
          <Button variant="contained" onClick={() => { setOpenConfirm(false); navigate('/counseling'); }}>바로 상담 신청</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Home;
