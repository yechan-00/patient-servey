// src/component/home_ui.js
import React from 'react';
import { Box, Typography, Button, Grid, Paper } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import InsightsIcon from '@mui/icons-material/Insights';
import PeopleIcon from '@mui/icons-material/People';

export const HeaderSection = () => (
  <Box textAlign="center" py={5}>
    <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
      암 치료 여정 설문조사
    </Typography>
    <Typography variant="subtitle1" color="textSecondary">
      치료 과정별 맞춤 지원 필요성 조사
    </Typography>
  </Box>
);

export const InfoCard = ({ icon, title, description }) => (
  <Paper elevation={3} sx={{ p: 3, textAlign: 'center', flex: 1, borderRadius: 3 ,
    minHeight: 200, // ✅ 최소 높이 지정
    }} >
    <Box fontSize="3rem" mb={2} color="primary.main">
      {icon}
    </Box>
    <Typography variant="h6" fontWeight="600" color="primary">
      {title}
    </Typography>
    <Typography variant="body2" color="textSecondary" mt={1}>
      {description}
    </Typography>
  </Paper>
);

export const CardContainer = () => (
  <Grid container spacing={3} mt={3}
    wrap="nowrap" // ✅ 줄바꿈 방지
    sx={{ overflowX: 'auto' ,pb: 2 }} // ✅ 작을 경우 스크롤
  >
    <Grid item xs >
      <InfoCard
        icon={<AssessmentIcon fontSize="inherit" />}
        title="맞춤형 평가"
        description="신체적, 심리적, 사회적 상태를 종합적으로 평가합니다."
      />
    </Grid>
    <Grid item xs>
      <InfoCard
        icon={<InsightsIcon fontSize="inherit" />}
        title="시각화된 결과"
        description="한눈에 확인할 수 있는 시각화된 건강 정보를 제공합니다."
      />
    </Grid>
    <Grid item xs>
      <InfoCard
        icon={<PeopleIcon fontSize="inherit" />}
        title="전문가 상담"
        description="필요시 1:1 사회복지사 상담을 연결해 드립니다."
      />
    </Grid>
  </Grid>
);

export const StartButton = ({ onClick }) => (
  <Box textAlign="center" mt={5}>
    <Button
      onClick={onClick}
      variant="contained"
      size="large"
      sx={{
        px: 5,
        py: 1.5,
        borderRadius: 2,
        backgroundColor: '#4A90E2',
        '&:hover': {
          backgroundColor: '#3b7cd2',
        },
      }}
    >
      설문 시작하기
    </Button>
  </Box>
);

export const FooterCopyright = () => (
  <Box textAlign="center" mt={6} py={2}>
    <Typography variant="caption" color="textSecondary">
      © 2025 암 생존자 건강관리 서비스 | 모든 저작권은 해당기관에 보호됩니다.
    </Typography>
  </Box>
);
