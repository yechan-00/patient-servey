// src/component/home_ui.js
import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SecurityIcon from "@mui/icons-material/Security";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";

export const HeaderSection = () => (
  <Box textAlign="center" py={5}>
    <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
      암 환자 사회적 스크리닝 설문
    </Typography>
    <Typography variant="subtitle1" color="textSecondary">
      사회적 욕구 평가 및 위험요인 분석
    </Typography>
  </Box>
);

export const InfoCard = ({ icon, title, description }) => (
  <Paper
    elevation={3}
    sx={{
      p: { xs: 1.5, sm: 3 },
      textAlign: "center",
      flex: 1,
      borderRadius: 3,
      minHeight: { xs: 140, sm: 200 },
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
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
        display: { xs: "none", sm: "block" },
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
      gap: { xs: 0.8, sm: 2, md: 3 },
      mt: 3,
      pb: 2,
      px: { xs: 0.5, sm: 0 },
      "& > *": {
        flex: "1 1 0",
        minWidth: 0,
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
      title="사회적 스크리닝"
      description="12개 항목으로 사회적 욕구를 빠르게 평가합니다."
    />
    <InfoCard
      icon={<SecurityIcon fontSize="inherit" />}
      title="위험요인 분석"
      description="재정, 주거, 건강, 고용 등 11개 영역의 위험요인을 분석합니다."
    />
    <InfoCard
      icon={<SupportAgentIcon fontSize="inherit" />}
      title="맞춤 상담 연계"
      description="평가 결과에 따라 사회복지사의 전문 상담을 받으실 수 있습니다."
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
      © 2025 암 환자 사회적 스크리닝 설문 서비스 | 모든 저작권은 해당기관에
      보호됩니다.
    </Typography>
  </Box>
);
