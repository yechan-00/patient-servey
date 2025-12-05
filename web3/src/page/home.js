// src/page/home.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper } from '@mui/material';
import {
  HeaderSection,
  CardContainer,
  StartButton,
  FooterCopyright,
} from '../component/home_ui.js';

const Home = () => {
  const navigate = useNavigate();

  const goToSurvey = () => {
    navigate('/info');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
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
            sx={{
              fontSize: { xs: '0.9rem', sm: '1rem' },
              lineHeight: { xs: 1.4, sm: 1.5 },
              px: { xs: 1, sm: 0 }
            }}
          >
            <Box component="span" sx={{ 
              fontSize: { xs: '1rem', sm: '1.1rem' }, 
              fontWeight: 600,
              display: 'block',
              mb: { xs: 1.5, sm: 1 }
            }}>
              암 환자의 사회적 욕구를 파악하고 맞춤 지원을 제공합니다.
            </Box>
            
            {/* 데스크톱용 텍스트 */}
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              이 설문은 암 환자의 사회적 위험요인을 평가하여 필요한 지원을 연계하기 위해 개발되었습니다.
              <br />
              <strong>1단계 스크리닝(12문항)</strong>으로 사회적 욕구를 빠르게 파악하고,
              <br />
              <strong>2단계 위험요인 평가</strong>를 통해 재정, 주거, 건강, 고용 등 세부 영역을 분석합니다.
              <br /><br />
              평가 결과에 따라 사회복지사의 전문 상담을 받으실 수 있습니다.
            </Box>
            
            {/* 모바일용 간결한 텍스트 */}
            <Box sx={{ 
              display: { xs: 'block', sm: 'none' },
              wordBreak: 'keep-all',
              overflowWrap: 'break-word',
              lineHeight: 1.5
            }}>
              암 환자의 사회적 위험요인을 평가합니다.
              <br /><br />
              <strong>1단계:</strong> 스크리닝 (12문항)
              <br />
              <strong>2단계:</strong> 위험요인 평가
              <br /><br />
              결과에 따라 전문 상담을 받으실 수 있습니다.
            </Box>
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
