import React from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Warning,
  CheckCircle,
  Error as ErrorIcon,
} from "@mui/icons-material";

// Section1 스크리닝 질문 라벨
const section1Labels = {
  q1: "비용 때문에 의사의 진료를 받기 어려운가요?",
  q2: "종종 가까이 지내는 사람이 없다고 느끼나요?",
  q3: "지난 2주 동안, 기분이 가라앉거나, 우울하거나, 희망이 없다고 느끼셨나요?",
  q4: "주거 상황에 대해 걱정이 있습니까?",
  q5: "음식 걱정을 해본 적 있나요?",
  q6: "교통편이 없어서 의료 예약에 늦거나 가지 못한 적이 있나요?",
  q7: "공과금을 내기 어려운 적이 있나요?",
  q8: "학교 교육이 어떤 식으로든 제한되었나요?",
  q9: "폭력의 희생자가 된 적이 있습니까?",
  q10: "고용에 대해 걱정이 있습니까?",
  q11: "도움이 필요할 때 연락할 수 있는 친구나 가족이 있나요?",
  q12: "다른 사람을 돌보는 책임이 있나요?",
};

// Section2 카테고리 정보
const categoryInfo = {
  재정: { icon: "💰", label: "재정" },
  사회적고립: { icon: "👥", label: "사회적 고립" },
  정신건강: { icon: "🧠", label: "정신건강" },
  주거: { icon: "🏠", label: "주거" },
  음식: { icon: "🍎", label: "음식" },
  교통: { icon: "🚗", label: "교통" },
  정보이해: { icon: "📚", label: "정보이해" },
  폭력: { icon: "⚠️", label: "폭력" },
  고용: { icon: "💼", label: "고용" },
  사회적지원: { icon: "🤝", label: "사회적 지원" },
  돌봄책임: { icon: "👨‍👩‍👧", label: "돌봄 책임" },
};

// Section1 점수 계산 (예=1, 아니오=0)
const calculateSection1Score = (section1Answers) => {
  let yesCount = 0;
  const details = [];

  Object.keys(section1Labels).forEach((qId) => {
    const answer = section1Answers[qId];
    const isYes = answer === "예";
    if (isYes) yesCount++;
    details.push({
      id: qId,
      label: section1Labels[qId],
      answer: answer || "미응답",
      isRisk: isYes,
    });
  });

  return {
    total: yesCount,
    isHighRisk: yesCount >= 5,
    details,
  };
};

// Section2 카테고리별 위험 판단
const calculateSection2Risks = (answers, section1Answers) => {
  const risks = {};

  // Section1 답변에 따른 카테고리 활성화 여부
  const showCategory = {
    재정: section1Answers.q1 === "예" || section1Answers.q7 === "예",
    사회적고립: section1Answers.q2 === "예",
    정신건강: section1Answers.q3 === "예",
    주거: section1Answers.q4 === "예",
    음식: section1Answers.q5 === "예",
    교통: section1Answers.q6 === "예",
    정보이해: section1Answers.q8 === "예",
    폭력: section1Answers.q9 === "예",
    고용: section1Answers.q10 === "예",
    사회적지원: section1Answers.q11 === "예",
    돌봄책임: section1Answers.q12 === "예",
  };

  // 1) 재정
  if (showCategory.재정) {
    const incomeRisk = ["lt40", "lt50", "lt75"].includes(answers.q1);
    const paymentRisk = answers.q2 && Array.isArray(answers.q2) && 
      answers.q2.length > 0 && !answers.q2.every(v => v === "none");
    risks.재정 = {
      isRisk: incomeRisk || paymentRisk,
      details: [
        incomeRisk ? "중위소득 75% 미만" : null,
        paymentRisk ? "지불 어려움 있음" : null,
      ].filter(Boolean),
    };
  }

  // 2) 사회적 고립
  if (showCategory.사회적고립) {
    const q3Risk = ["often", "always"].includes(answers.q3);
    const q4Risk = answers.q4 === "m1";
    risks.사회적고립 = {
      isRisk: q3Risk || q4Risk,
      details: [
        q3Risk ? "자주/항상 외로움 느낌" : null,
        q4Risk ? "월 1회 미만 사회적 연결" : null,
      ].filter(Boolean),
    };
  }

  // 3) 정신건강
  if (showCategory.정신건강) {
    const score = parseInt(answers.q5) || 0;
    risks.정신건강 = {
      isRisk: score >= 6,
      details: score >= 6 ? [`디스트레스 점수 ${score}점 (6점 이상)`] : [],
    };
  }

  // 4) 주거
  if (showCategory.주거) {
    const housingRiskValues = ["relativeTemp", "shelter", "facility"];
    const q6Risk = housingRiskValues.includes(answers.q6);
    const q7Risk = answers.q7 === "Y";
    risks.주거 = {
      isRisk: q6Risk || q7Risk,
      details: [
        q6Risk ? "불안정한 주거 상황" : null,
        q7Risk ? "주거 환경에 대한 염려 있음" : null,
      ].filter(Boolean),
    };
  }

  // 5) 음식
  if (showCategory.음식) {
    const foodRisk = answers.q7_food === "N";
    risks.음식 = {
      isRisk: foodRisk,
      details: foodRisk ? ["건강한 식품 접근 어려움"] : [],
    };
  }

  // 6) 교통
  if (showCategory.교통) {
    const transportRisk = answers.q8 && Array.isArray(answers.q8) && 
      answers.q8.length > 0 && !answers.q8.every(v => v === "none");
    risks.교통 = {
      isRisk: transportRisk,
      details: transportRisk ? ["교통편 부족 경험"] : [],
    };
  }

  // 7) 정보이해
  if (showCategory.정보이해) {
    const eduRisk = ["무학", "초졸", "중졸"].includes(answers.q9);
    const readRisk = ["2", "3", "4"].includes(answers.q10);
    const digitalRisk = answers.q11 === "제한적";
    risks.정보이해 = {
      isRisk: eduRisk || readRisk || digitalRisk,
      details: [
        eduRisk ? "학력: 중졸 이하" : null,
        readRisk ? "의료 문서 읽기 도움 필요" : null,
        digitalRisk ? "디지털 숙련도 제한적" : null,
      ].filter(Boolean),
    };
  }

  // 8) 폭력
  if (showCategory.폭력) {
    const noViolence = "없다";
    const q12Risk = answers.q12 && answers.q12 !== noViolence;
    const q13Risk = answers.q13 && answers.q13 !== noViolence;
    const q14Risk = answers.q14 && answers.q14 !== noViolence;
    risks.폭력 = {
      isRisk: q12Risk || q13Risk || q14Risk,
      details: [
        q12Risk ? "신체적 폭력 경험" : null,
        q13Risk ? "언어적 폭력 경험" : null,
        q14Risk ? "위협 경험" : null,
      ].filter(Boolean),
    };
  }

  // 9) 고용
  if (showCategory.고용) {
    let employmentRisk = false;
    const details = [];
    
    if (answers.q15 === "working") {
      const riskDetails = ["leave_or_sick", "contract_end", "quit_planned"];
      if (riskDetails.includes(answers.q15_working_detail)) {
        employmentRisk = true;
        details.push("암 진단 후 고용 상태 변화");
      }
    } else if (answers.q15 === "notWorking") {
      const riskReasons = ["quit_after_dx", "other"];
      if (riskReasons.includes(answers.q15_notWorking_reasons)) {
        employmentRisk = true;
        details.push("암 진단 후 퇴사/자영업 중단");
      }
    }
    
    risks.고용 = {
      isRisk: employmentRisk,
      details,
    };
  }

  // 10) 사회적 지원
  if (showCategory.사회적지원) {
    const q16Risk = answers.q16 === "N";
    const q17Risk = answers.q17 === "N";
    risks.사회적지원 = {
      isRisk: q16Risk || q17Risk,
      details: [
        q16Risk ? "연락할 수 있는 사람 없음" : null,
        q17Risk ? "통원/간병 도움 받을 사람 없음" : null,
      ].filter(Boolean),
    };
  }

  // 11) 돌봄 책임
  if (showCategory.돌봄책임) {
    const careRisk = answers.q18 === "Y";
    risks.돌봄책임 = {
      isRisk: careRisk,
      details: careRisk ? ["가족 돌봄 제공자"] : [],
    };
  }

  return risks;
};

const SurveyResult = ({
  answers = {},
  section1Answers = {},
}) => {
  // Section1 점수 계산
  const section1Result = calculateSection1Score(section1Answers);
  
  // Section2 위험 요인 계산
  const section2Risks = calculateSection2Risks(answers, section1Answers);
  
  // 위험 카테고리 수 계산
  const riskCategories = Object.values(section2Risks).filter(r => r.isRisk);
  const totalRiskCount = riskCategories.length;

  return (
    <Box sx={{ backgroundColor: "background.default", py: { xs: 3, sm: 6 } }}>
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3 }}>
          {/* 타이틀 */}
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
            사회적 위험요인 평가 결과
          </Typography>
          <Typography
            variant="body2"
            align="center"
            sx={{ mb: 4 }}
            color="text.secondary"
          >
            귀하의 사회적 욕구와 위험 요인을 분석한 결과입니다.
          </Typography>

          {/* Section1: 전체 스크리닝 결과 */}
          <Paper
            elevation={2}
            sx={{
              p: 3,
              mb: 4,
              backgroundColor: section1Result.isHighRisk ? "#ffebee" : "#e8f5e9",
              borderLeft: `4px solid ${section1Result.isHighRisk ? "#f44336" : "#4caf50"}`,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", mb: 2, display: "flex", alignItems: "center", gap: 1 }}
            >
              {section1Result.isHighRisk ? <ErrorIcon color="error" /> : <CheckCircle color="success" />}
              1. 사회적 스크리닝 결과
            </Typography>
            
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {section1Result.total}개 / 12개
              </Typography>
              <Chip
                label={section1Result.isHighRisk ? "고위험 집단" : "저위험 집단"}
                color={section1Result.isHighRisk ? "error" : "success"}
                sx={{ fontWeight: "bold", fontSize: "1rem", py: 2 }}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              {section1Result.isHighRisk 
                ? "사회적 욕구가 5개 이상으로 고위험 집단에 해당합니다. 아래 세부 위험 요인을 확인해주세요."
                : "사회적 욕구가 5개 미만으로 저위험 집단에 해당합니다."}
            </Typography>
          </Paper>

          {/* Section2: 카테고리별 위험 요인 */}
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", mb: 3, display: "flex", alignItems: "center", gap: 1 }}
            >
              <Warning color="warning" />
              2. 세부 위험 요인 분석
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Typography variant="body1">
                위험 요인이 있는 영역: 
              </Typography>
              <Chip
                label={`${totalRiskCount}개 영역`}
                color={totalRiskCount > 0 ? "warning" : "success"}
                sx={{ fontWeight: "bold" }}
              />
            </Box>

            {Object.keys(section2Risks).length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
                스크리닝에서 "예"로 응답한 항목이 없어 세부 위험 요인 분석이 없습니다.
              </Typography>
            ) : (
              <List>
                {Object.entries(section2Risks).map(([category, data]) => {
                  const info = categoryInfo[category];
                  return (
                    <ListItem
                      key={category}
                      sx={{
                        mb: 1,
                        borderRadius: 1,
                        backgroundColor: data.isRisk ? "#fff3e0" : "#f5f5f5",
                        border: data.isRisk ? "1px solid #ff9800" : "1px solid #e0e0e0",
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, fontSize: "1.5rem" }}>
                        {info?.icon || "📋"}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                              {info?.label || category}
                            </Typography>
                            <Chip
                              size="small"
                              label={data.isRisk ? "위험" : "양호"}
                              color={data.isRisk ? "warning" : "success"}
                            />
                          </Box>
                        }
                        secondary={
                          data.isRisk && data.details.length > 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              • {data.details.join(" • ")}
                            </Typography>
                          ) : null
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>

          {/* Section1 상세 응답 */}
          <Paper elevation={1} sx={{ p: 3, backgroundColor: "#fafafa" }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "bold", mb: 2, color: "text.secondary" }}
            >
              📋 스크리닝 응답 상세
            </Typography>
            <List dense>
              {section1Result.details.map((item) => (
                <ListItem key={item.id} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {item.isRisk ? (
                      <Warning fontSize="small" color="warning" />
                    ) : (
                      <CheckCircle fontSize="small" color="success" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    secondary={item.answer}
                    primaryTypographyProps={{ variant: "body2" }}
                    secondaryTypographyProps={{ 
                      variant: "caption",
                      color: item.isRisk ? "warning.main" : "success.main",
                      fontWeight: "bold"
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Divider sx={{ my: 4 }} />

          {/* 안내 메시지 */}
          <Paper
            elevation={1}
            sx={{ p: 3, backgroundColor: "#e3f2fd", textAlign: "center" }}
          >
            <Typography
              variant="body2"
              sx={{ color: "primary.dark", fontWeight: 500 }}
            >
              💙 위험 요인이 있는 영역에 대해 전문 상담을 원하시면
              <br />
              아래 <strong>상담 요청</strong> 버튼을 눌러주세요.
            </Typography>
          </Paper>
        </Paper>
      </Container>
    </Box>
  );
};

export default SurveyResult;
