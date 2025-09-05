import React from "react";
import {
  Box,
  Grid,
  Typography,
  Container,
  Paper,
  Button,
  Chip,
  Divider,
} from "@mui/material";
import {
  Phone,
  Download,
  LocalHospital,
  Psychology,
  Group,
  Work,
} from "@mui/icons-material";
import * as SurveyUtils from "../utils/SurveyUtils";

// 레이블 및 매핑
const labelMap = {
  physicalChange: "암 이후 내 몸의 변화",
  healthManagement: "건강한 삶을 위한 관리",
  socialSupport: "회복을 도와주는 사람들",
  psychologicalBurden: "심리적 부담",
  socialBurden: "사회적 삶의 부담",
  resilience: "암 이후 탄력성",
};

const maxScores = {
  physicalChange: 40,
  healthManagement: 25,
  socialSupport: 20,
  psychologicalBurden: 40,
  socialBurden: 15,
  resilience: 25,
};

// 영역별 맞춤 지원 정보
const supportInfo = {
  physicalChange: {
    title: "신체적 관리 지원",
    contacts: [
      { name: "의료진 상담", phone: "병원 주치의", icon: <LocalHospital /> },
      { name: "재활치료센터", phone: "1577-0199", icon: <LocalHospital /> },
      { name: "영양상담", phone: "병원 영양과", icon: <LocalHospital /> },
    ],
    resources: "신체 증상 관리 가이드북 다운로드",
  },
  psychologicalBurden: {
    title: "심리적 지원 서비스",
    contacts: [
      { name: "정신건강복지센터", phone: "1577-0199", icon: <Psychology /> },
      {
        name: "의료사회복지사",
        phone: "병원 사회복지팀",
        icon: <Psychology />,
      },
      { name: "암환자 심리상담", phone: "1588-5587", icon: <Psychology /> },
    ],
    resources: "스트레스 관리 가이드 다운로드",
  },
  socialSupport: {
    title: "사회적 지지 네트워크",
    contacts: [
      { name: "암환자 자조모임", phone: "1588-5587", icon: <Group /> },
      { name: "가족상담센터", phone: "1577-9337", icon: <Group /> },
      { name: "종교기관 상담", phone: "해당 종교기관", icon: <Group /> },
    ],
    resources: "가족 소통 가이드 다운로드",
  },
  socialBurden: {
    title: "사회복귀 지원",
    contacts: [
      { name: "직업재활센터", phone: "1588-1919", icon: <Work /> },
      { name: "고용복지플러스센터", phone: "국번없이 1350", icon: <Work /> },
      { name: "산업재해보상", phone: "1588-0075", icon: <Work /> },
    ],
    resources: "직장복귀 준비 가이드 다운로드",
  },
  healthManagement: {
    title: "건강관리 교육",
    contacts: [
      { name: "영양상담실", phone: "병원 영양과", icon: <LocalHospital /> },
      {
        name: "운동처방센터",
        phone: "병원 재활의학과",
        icon: <LocalHospital />,
      },
      { name: "금연상담", phone: "1588-3030", icon: <LocalHospital /> },
    ],
    resources: "건강관리 실천 가이드 다운로드",
  },
  resilience: {
    title: "회복 탄력성 강화",
    contacts: [
      { name: "상담심리센터", phone: "1577-0199", icon: <Psychology /> },
      { name: "명상센터", phone: "지역 명상센터", icon: <Psychology /> },
      { name: "요가/힐링센터", phone: "지역 센터", icon: <Psychology /> },
    ],
    resources: "긍정적 사고 강화 가이드 다운로드",
  },
};

const SurveyResult = ({
  rawScores = {},
  meanScores = {},
  stdScores = {},
  riskGroups = {},
  overallFeedback = "",
  overallRiskGroup = "",
  answers = {},
  riskByMean = {},
}) => {
  // 1) 데이터 전처리 - 실제 응답이 있는 섹션만 포함
  const processed = Object.keys(rawScores)
    .filter(
      (key) => typeof meanScores[key] === "number" && !isNaN(meanScores[key])
    )
    .map((key) => {
      const value = rawScores[key] ?? 0;
      const mean = meanScores[key];
      const included = key !== "lifestyle";
      const sectionName = labelMap[key];
      const stdScore =
        included && typeof stdScores[key] === "number" && !isNaN(stdScores[key])
          ? stdScores[key]
          : 0;
      return {
        key,
        label: sectionName,
        value,
        mean,
        max: maxScores[key],
        stdScore: stdScore,
        level: included
          ? SurveyUtils.getRiskGroup(sectionName, mean)
          : "저위험집단",
        included,
      };
    });

  // 미응답(제외)된 섹션 안내 메시지 생성
  const allSectionKeys = [
    "physicalChange",
    "healthManagement",
    "socialSupport",
    "psychologicalBurden",
    "socialBurden",
    "resilience",
  ];
  const answeredKeys = processed.map((p) => p.key);
  const excludedSections = allSectionKeys.filter(
    (k) => !answeredKeys.includes(k)
  );
  const excludedLabels = excludedSections.map((k) => labelMap[k]);

  // 전체 점수 계산
  const totalScore =
    processed
      .filter((p) => p.included)
      .reduce((sum, p) => sum + p.stdScore, 0) /
    processed.filter((p) => p.included).length;

  // 추가 피드백
  const additionalComments = SurveyUtils.getAdditionalFeedback(
    answers,
    meanScores,
    riskByMean
  );

  // 고위험 집단인 영역만 지원 서비스 표시
  const needsSupportAreas = processed.filter(
    (p) =>
      p.included &&
      p.stdScore < 40 &&
      typeof p.stdScore === "number" &&
      !isNaN(p.stdScore)
  );

  // 가로 막대 그래프 컴포넌트
  const HorizontalBarChart = ({ data }) => (
    <Box sx={{ width: "100%" }}>
      {data.map((item, index) => {
        const score = Math.round(item.stdScore);
        const percentage = Math.min(Math.max(score, 0), 100);

        // 색상 결정 (점수에 따라)
        let barColor;
        if (score >= 60) {
          barColor = "#4caf50"; // 초록색 (양호)
        } else if (score >= 50) {
          barColor = "#2196f3"; // 파란색 (보통)
        } else if (score >= 40) {
          barColor = "#ff9800"; // 주황색 (주의)
        } else {
          barColor = "#f44336"; // 빨간색 (위험)
        }

        return (
          <Box key={index} sx={{ mb: 3 }}>
            {/* 제목과 점수 */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {item.label}
              </Typography>
              <Box sx={{ textAlign: "right" }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: barColor }}
                >
                  {score}점
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {item.level}
                </Typography>
              </Box>
            </Box>

            {/* 막대 그래프 */}
            <Box
              sx={{
                position: "relative",
                height: 20,
                bgcolor: "#e0e0e0",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {/* 진행 막대 */}
              <Box
                sx={{
                  height: "100%",
                  width: `${percentage}%`,
                  bgcolor: barColor,
                  borderRadius: 10,
                  transition: "width 1s ease-out",
                }}
              />

              {/* 평균선 (50점) */}
              <Box
                sx={{
                  position: "absolute",
                  left: "50%",
                  top: -2,
                  bottom: -2,
                  width: 2,
                  bgcolor: "#333",
                  transform: "translateX(-50%)",
                }}
              />
            </Box>

            {/* 점수 눈금 */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mt: 0.5,
                px: 0.5,
              }}
            >
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                0
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                25
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#333", fontWeight: "bold" }}
              >
                50
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                75
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                100
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );

  return (
    <Box sx={{ backgroundColor: "background.default", py: { xs: 3, sm: 6 } }}>
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3 }}>
          {/* 타이틀 & 설명 */}
          <Typography
            variant="h5"
            align="center"
            sx={{
              fontWeight: "bold",
              mb: 1,
              color: "primary.main",
              fontSize: { xs: "1.3rem", sm: "1.5rem" },
            }}
          >
            건강 관리 결과
          </Typography>
          <Typography
            variant="body2"
            align="center"
            sx={{ mb: 4 }}
            color="text.secondary"
          >
            현재 상태를 확인하고 필요한 지원 서비스를 안내해드립니다.
          </Typography>

          {/* 점수 기준 설명 */}
          <Paper
            elevation={1}
            sx={{
              p: 2,
              mb: 4,
              backgroundColor: "#e3f2fd",
              borderLeft: "4px solid #1976d2",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: "bold", color: "#1976d2", mb: 1 }}
            >
              📊 점수 해석 기준
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#1565c0",
                fontSize: { xs: "0.8rem", sm: "0.9rem" },
              }}
            >
              • <strong>50점</strong>이 일반 집단 평균입니다
              <br />• <strong>50점 이상</strong>: 양호한 상태 (저위험집단)
              <br />• <strong>40-49점</strong>: 관심이 필요한 상태 (주의집단)
              <br />• <strong>40점 미만</strong>: 적극적인 지원이 필요한 상태
              (고위험집단)
            </Typography>
          </Paper>

          {/* 영역별 T점수 막대 그래프 */}
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 4 }, mb: 4 }}>
            <Typography
              variant="h6"
              align="center"
              sx={{
                fontWeight: "bold",
                mb: 3,
                color: "primary.dark",
                fontSize: { xs: "1.1rem", sm: "1.25rem" },
              }}
            >
              영역별 건강 상태
            </Typography>
            <HorizontalBarChart data={processed.filter((p) => p.included)} />
          </Paper>

          {/* 전체 평균 점수 & 종합 피드백 : CSS Grid 1:1 고정 카드 */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
              mb: 3,
            }}
          >
            {/* LEFT: 전체 평균 점수 */}
            <Paper
              elevation={3}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                minHeight: 220,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", color: "primary.dark", mb: 1 }}
              >
                전체 평균 점수
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "text.primary", mb: 1 }}
              >
                {Math.round(totalScore)}점
              </Typography>
              <Chip
                label={overallRiskGroup}
                color={
                  overallRiskGroup === "저위험집단"
                    ? "success"
                    : overallRiskGroup === "주의집단"
                    ? "warning"
                    : "error"
                }
                sx={{ fontWeight: "bold" }}
              />
              {/* 미응답(제외) 섹션 안내 */}
              {excludedLabels.length > 0 && (
                <Typography
                  variant="body2"
                  sx={{ mt: 2, color: "warning.main", fontWeight: 500 }}
                >
                  {excludedLabels.join(", ")} 영역은 응답하지 않아 결과에서
                  제외되었습니다.
                </Typography>
              )}
            </Paper>

            {/* RIGHT: 종합 피드백 */}
            <Paper
              elevation={3}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                minHeight: 220,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "primary.dark" }}
              >
                종합 피드백
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{ mb: 0.5, fontWeight: "bold" }}
              >
                {overallRiskGroup}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  maxWidth: 520,
                  px: { xs: 0.5, sm: 1 },
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {overallFeedback}
              </Typography>
            </Paper>
          </Box>

          {/* 피드백 카드 그리드 */}
          <Grid container spacing={2} direction="column">
            {/* 추가 피드백 카드 */}
            {additionalComments.length > 0 && (
              <Grid item xs={12}>
                <Paper
                  elevation={1}
                  sx={{ p: 3, borderLeft: "4px solid #4caf50" }}
                >
                  <Typography
                    variant="subtitle1"
                    align="center"
                    sx={{ fontWeight: "bold", mb: 1, color: "success.dark" }}
                  >
                    맞춤 건강 조언
                  </Typography>
                  {additionalComments.map(({ text, style }, idx) => (
                    <Typography
                      key={idx}
                      variant="body2"
                      align="center"
                      sx={{
                        mb: 0.5,
                        color:
                          style === "error"
                            ? "error.main"
                            : style === "info"
                            ? "primary.main"
                            : style === "success"
                            ? "success.main"
                            : "text.primary",
                        fontWeight: "bold",
                      }}
                    >
                      {text}
                    </Typography>
                  ))}
                </Paper>
              </Grid>
            )}
          </Grid>

          {/* 지원 서비스 안내 - 40점 미만인 영역만 표시 */}
          {needsSupportAreas.length > 0 && (
            <Paper
              elevation={2}
              sx={{
                p: { xs: 2, sm: 4 },
                mt: 4,
                borderLeft: "4px solid #ff9800",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  mb: 3,
                  color: "warning.dark",
                  fontSize: { xs: "1.1rem", sm: "1.25rem" },
                }}
              >
                🔔 맞춤 지원 서비스 안내
              </Typography>
              <Typography
                variant="body2"
                sx={{ mb: 3, color: "text.secondary" }}
              >
                고위험 집단으로 적극적인 지원이 필요한 영역에 대한 전문 지원
                서비스를 안내해드립니다.
              </Typography>

              {needsSupportAreas.map((area) => {
                const support = supportInfo[area.key];
                if (!support) return null;

                return (
                  <Box
                    key={area.key}
                    sx={{
                      mb: 4,
                      p: 3,
                      backgroundColor: "#f9f9f9",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: "bold", mb: 2, color: "primary.dark" }}
                    >
                      {area.label} - {support.title} (점수:{" "}
                      {Math.round(area.stdScore)}점)
                    </Typography>

                    <Grid container spacing={2}>
                      {support.contacts.map((contact, idx) => (
                        <Grid item xs={12} sm={6} md={4} key={idx}>
                          <Box
                            sx={{
                              p: 2,
                              backgroundColor: "white",
                              borderRadius: 1,
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              minHeight: 60,
                            }}
                          >
                            {contact.icon}
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: "bold", fontSize: "0.85rem" }}
                              >
                                {contact.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.secondary",
                                  fontSize: "0.75rem",
                                }}
                              >
                                {contact.phone}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>

                    <Button
                      startIcon={<Download />}
                      variant="outlined"
                      size="small"
                      sx={{ mt: 2, fontSize: "0.8rem" }}
                      onClick={() => alert("준비 중인 서비스입니다.")}
                    >
                      {support.resources}
                    </Button>
                  </Box>
                );
              })}
            </Paper>
          )}

          <Divider sx={{ my: 4 }} />

          {/* 추가 안내 */}
          <Paper
            elevation={1}
            sx={{ p: 3, backgroundColor: "#e8f5e8", textAlign: "center" }}
          >
            <Typography
              variant="body2"
              sx={{ color: "success.dark", fontWeight: 500 }}
            >
              💚 더 자세한 상담을 원하시면 아래 상담 요청 버튼을 눌러주세요.
              <br />
              전문 사회복지사가 맞춤형 지원 서비스를 제공해드립니다.
            </Typography>
          </Paper>
        </Paper>
      </Container>
    </Box>
  );
};

export default SurveyResult;
