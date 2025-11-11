// src/component/home_ui.js
import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import InsightsIcon from "@mui/icons-material/Insights";
import PeopleIcon from "@mui/icons-material/People";

export const HeaderSection = () => (
  <Box textAlign="center" py={5}>
    <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
      암 생존자 건강관리 설문
    </Typography>
    <Typography variant="subtitle1" color="textSecondary">
      암경험자 건강행동 및 사회적 지지 평가 조사
    </Typography>
  </Box>
);

export const InfoCard = ({ icon, title, description }) => (
  <Paper
    elevation={3}
    sx={{
      p: { xs: 1.5, sm: 3 }, // 모바일에서 패딩 적절히 조정
      textAlign: "center",
      flex: 1,
      borderRadius: 3,
      minHeight: { xs: 140, sm: 200 }, // 모바일에서 높이 더 줄임
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between", // 내용 간격 조정
    }}
  >
    <Box
      fontSize={{ xs: "1.8rem", sm: "3rem" }}
      mb={{ xs: 0.2, sm: 1 }}
      color="primary.main"
    >
      {icon}
    </Box>
    <Typography
      variant={{ xs: "body2", sm: "h6" }}
      fontWeight="600"
      color="primary"
      mb={{ xs: 0.5, sm: 1 }}
    >
      {title}
    </Typography>
    <Typography
      variant="caption"
      color="textSecondary"
      sx={{
        fontSize: { xs: "0.65rem", sm: "0.875rem" },
        lineHeight: { xs: 1.1, sm: 1.43 },
        display: { xs: "none", sm: "block" }, // 모바일에서는 설명 숨김
      }}
    >
      {description}
    </Typography>
  </Paper>
);

export const CardContainer = () => (
  <Box
    sx={{
      display: "flex",
      gap: { xs: 0.8, sm: 2, md: 3 }, // 모바일에서 간격 더 줄림
      mt: 3,
      pb: 2,
      px: { xs: 0.5, sm: 0 }, // 모바일에서 좌우 여백 최소화
      "& > *": {
        flex: "1 1 0", // 균등하게 3등분
        minWidth: 0, // 최소 너비 제한 제거
        maxWidth: {
          xs: "calc(33.333% - 4px)",
          sm: "calc(33.333% - 16px)",
          md: "none",
        },
      },
    }}
  >
    <InfoCard
      icon={<AssessmentIcon fontSize="inherit" />}
      title="종합 건강평가"
      description="신체적, 심리적, 사회적 상태를 종합적으로 평가합니다."
    />
    <InfoCard
      icon={<InsightsIcon fontSize="inherit" />}
      title="맞춤형 결과"
      description="개인별 건강 상태에 맞는 시각화된 결과를 제공합니다."
    />
    <InfoCard
      icon={<PeopleIcon fontSize="inherit" />}
      title="사회복지사 상담"
      description="심리사회적 상담, 경제적 지원, 사회복귀 계획 등 전문 상담을 제공합니다."
    />
  </Box>
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
        backgroundColor: "#4A90E2",
        "&:hover": {
          backgroundColor: "#3b7cd2",
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
