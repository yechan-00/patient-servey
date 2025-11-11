// src/page/home.js
import React from "react";
// ⬇️ import 추가
import { useNavigate } from "react-router-dom";

import { Box, Container, Typography, Paper } from "@mui/material";
import {
  HeaderSection,
  CardContainer,
  StartButton,
  FooterCopyright,
} from "../component/home_ui.js"; // 경로 수정 필요

const Home = () => {
  // ⬇️ 컴포넌트 내부에서 navigate 함수 선언
  const navigate = useNavigate();

  const goToSurvey = () => {
    navigate("/info", { state: { newSurvey: true } }); // 새 설문 시작 플래그 전달
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "background.default", // MUI theme의 단색 배경
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          flexGrow: 1,
          py: 6,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <HeaderSection />
        <Paper elevation={6} sx={{ borderRadius: 4, p: 5 }}>
          <Box
            sx={{
              textAlign: "center",
              color: "text.primary",
              fontSize: { xs: "0.9rem", sm: "1rem" },
              lineHeight: { xs: 1.4, sm: 1.5 },
              px: { xs: 1, sm: 0 },
              mb: 3,
            }}
          >
            <Typography
              component="div"
              variant="body1"
              sx={{
                fontSize: { xs: "1rem", sm: "1.1rem" },
                fontWeight: 600,
                display: "block",
                mb: { xs: 1.5, sm: 1 },
              }}
            >
              당신의 건강한 회복을 함께 지원합니다.
            </Typography>

            {/* 데스크톱용 전체 텍스트 */}
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <Typography variant="body1" component="div">
                이 설문은 암 진단 이후 건강관리와 심리사회적 적응을 평가하여
                맞춤형 지원을 제공하기 위해 개발되었습니다.
                <br />
                설문 결과를 통해 개인별 건강 상태를 확인하고, 필요시
                사회복지사와의 전문 상담을 통해
                <br />
                심리적 지원, 경제적 도움, 사회복귀 계획 등 종합적인 서비스를
                받으실 수 있습니다.
              </Typography>
            </Box>

            {/* 모바일용 간결한 텍스트 */}
            <Box
              sx={{
                display: { xs: "block", sm: "none" },
                wordBreak: "keep-all", // 한글 단어가 중간에 끊어지지 않도록
                overflowWrap: "break-word", // 컨테이너를 넘어가는 긴 단어만 줄바꿈
                lineHeight: 1.5, // 줄간격을 조금 더 여유롭게
              }}
            >
              <Typography variant="body1" component="div">
                암 진단 이후 건강관리와 심리사회적 적응을 평가합니다.
                <br />
                맞춤형 건강 정보 제공 및 사회복지사 전문 상담으로
                <br />
                종합적인 회복 지원 서비스를 받으실 수 있습니다.
              </Typography>
            </Box>
          </Box>

          <CardContainer />
          <StartButton onClick={goToSurvey} />
        </Paper>
        <FooterCopyright />
      </Container>
    </Box>
  );
};

export default Home;
