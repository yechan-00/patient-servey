import React from 'react';
import { Box, Grid, Typography, Container, Paper, Button } from '@mui/material';
import { Radar, Bar } from 'react-chartjs-2';
import {
  Chart,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Legend,
  Tooltip,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import * as SurveyUtils from '../utils/SurveyUtils';

// 차트 요소 등록
Chart.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Legend,
  Tooltip,
  CategoryScale,
  LinearScale,
  BarElement
);
Chart.register(ChartDataLabels);

// 레이블 및 매핑
const labelMap = {
  physicalChange: '암 이후 내 몸의 변화',
  healthManagement: '건강한 삶을 위한 관리',
  socialSupport: '회복을 도와주는 사람들',
  psychologicalBurden: '심리적 부담',
  socialBurden: '사회적 삶의 부담',
  resilience: '암 이후 탄력성',
  lifestyle: '생활 습관'
};
const maxScores = {
  physicalChange: 40,
  healthManagement: 25,
  socialSupport: 20,
  psychologicalBurden: 40,
  socialBurden: 15,
  resilience: 25,
  lifestyle: 10
};

const SurveyResult = ({
  rawScores = {},
  meanScores = {},
  stdScores = {},
    riskGroups = {},
  overallFeedback = "",
  overallRiskGroup = "",
  answers = {},
  riskByMean = {}
}) => {  // 1) 데이터 전처리 - 실제 응답이 있는 섹션만 포함
  const processed = Object.keys(rawScores)
    .filter(key => typeof meanScores[key] === 'number' && !isNaN(meanScores[key])) // 응답이 있는 섹션만
    .map((key) => {
      const value = rawScores[key] ?? 0;
      const mean = meanScores[key];
      const included = key !== 'lifestyle';
      const sectionName = labelMap[key];
      // stdScores 프롭에서 직접 가져오고, 숫자가 아닌 경우 0으로 처리
      const stdScore = included && typeof stdScores[key] === 'number' && !isNaN(stdScores[key]) 
        ? stdScores[key] 
        : 0;
      return {
        key,
        label: sectionName,
        value,
        mean,
        max: maxScores[key],
        stdScore: stdScore,
        level: included ? SurveyUtils.getRiskGroup(sectionName, mean) : '저위험집단',
        included
      };
    });// 1-1) 미응답(제외)된 섹션 안내 메시지 생성
  const allSectionKeys = ['physicalChange','healthManagement','socialSupport','psychologicalBurden','socialBurden','resilience'];
  const answeredKeys = processed.map(p => p.key); // 실제 응답이 있는 섹션들
  const excludedSections = allSectionKeys.filter(k => !answeredKeys.includes(k));
  const excludedLabels = excludedSections.map(k => labelMap[k]);

  // 전체 점수 계산
  const totalScore = processed
    .filter((p) => p.included)
    .reduce((sum, p) => sum + p.stdScore, 0) /
    processed.filter((p) => p.included).length;

  // 디버깅: mean, stdScore 값 콘솔 출력
  console.table(
    processed.map(({ key, mean, stdScore }) => ({ key, mean, stdScore }))
  );

  // 2) 레이더 차트 데이터
  const radarData = {
    labels: processed.filter((p) => p.included).map((p) => p.label),
    datasets: [
      {
        label: '표준화 점수',
        data: processed.filter((p) => p.included).map((p) => p.stdScore),
        backgroundColor: 'rgba(25, 118, 210, 0.2)',
        borderColor: 'rgba(25, 118, 210, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(25, 118, 210, 1)'
      }
    ]
  };

  // 3) 막대 차트 데이터
  const cats = processed.filter((p) => p.included);
  const labels = cats.map((p) => p.label);
  const myScores = cats.map((p) => p.stdScore ?? 0);
  const avgScores = cats.map(() => 50);
  const barData = {
    labels,
    datasets: [
      {
        label: '나의 T-점수',
        data: myScores,
        backgroundColor: 'rgba(54,162,235,0.6)'
      },
      {
        label: '집단 평균(T=50)',
        data: avgScores,
        backgroundColor: 'rgba(200,200,200,0.5)'
      }
    ]
  };
  const barOptions = {
    responsive: true,
    indexAxis: 'x', // 세로 막대
    plugins: {
      legend: { position: 'top' },
      datalabels: {
        anchor: 'end',
        align: 'end',
        offset: 2,
        color: '#000',
        clip: false,
        formatter: (v, ctx) => (ctx.datasetIndex === 0 ? `${Math.round(v)}점` : ''),
        font: { weight: '700' }
      }
    },
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { stepSize: 10 } },
      x: { ticks: { autoSkip: false } }
    }
  };

  // 4) 추가 피드백: answers 전체를 통째로 함수에 전달
  const additionalComments = SurveyUtils.getAdditionalFeedback(
    answers,
    meanScores,
    riskByMean
  );

  return (
    <Box sx={{ backgroundColor: 'background.default', py: 6 }}>
      <Container maxWidth="lg">
        {/* 전체를 감싸는 하얀 배경 */}
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          {/* 타이틀 & 설명 */}
          <Typography
            variant="h5"
            align="center"
            sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}
          >
            건강 관리 결과
          </Typography>
          <Typography
            variant="body2"
            align="center"
            sx={{ mb: 4 }}
            color="text.secondary"
          >
            현재 상태를 시각적으로 확인하고, 집중 관리가 필요한 영역과 추천 사항을 확인하세요.
          </Typography>

          {/* 1. 영역별 점수 비교 */}
          <Paper elevation={2} sx={{ p: 5, mb: 4 }}>
            <Typography
              variant="h6"
              align="center"
              sx={{ fontWeight: 'bold', mb: 3, color: 'primary.dark' }}
            >
              영역별 점수 비교
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                mx: 'auto',
                height: 400,
                maxWidth: 800,
                position: 'relative'
              }}
            >
              <Radar
                data={radarData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: { r: { suggestedMin: 0, suggestedMax: 100 } }
                }}
              />
            </Box>
          </Paper>

          {/* 2. 카테고리별 점수 */}
          <Paper elevation={2} sx={{ p: 5, mb: 4 }}>
            <Typography
              variant="h6"
              align="center"
              sx={{ fontWeight: 'bold', mb: 3, color: 'primary.dark' }}
            >
              카테고리별 점수
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: 400,
                maxWidth: 800,
                mx: 'auto'
              }}
            >
              <Bar data={barData} options={barOptions} />
            </Box>
          </Paper>

          {/* 전체 점수 표시 */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 4,
              width: '100%'
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 3,
                backgroundColor: 'white',
                borderRadius: 2,
                width: '100%',
                textAlign: 'center'
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold', color: 'primary.dark', mb: 1 }}
              >
                전체 점수
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', color: 'text.primary' }}
              >
                {Math.round(totalScore)}점
              </Typography>
              {/* 미응답(제외) 섹션 안내 */}
              {excludedLabels.length > 0 && (
                <Typography variant="body2" sx={{ mt: 2, color: 'warning.main', fontWeight: 500 }}>
                  {excludedLabels.join(', ')} 영역은 응답하지 않아 결과에서 제외되었습니다.
                </Typography>
              )}
            </Paper>
          </Box>

          {/* 점수 해석 기준 */}
          <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.dark', mb: 1 }}>
              점수 해석 기준
            </Typography>
            <Typography variant="body2" color="text.secondary">
              이 화면의 점수는 T-점수(집단 평균 50, 표준편차 10) 기준으로 표현됩니다. 막대가 길수록 해당 영역의 위험 또는 부담이 상대적으로 높음을 의미합니다.
              위험도 분류는 설문 알고리즘과 동일한 규칙이 적용됩니다. (세부 기준은 알고리즘에 준함)
            </Typography>
          </Paper>

          {/* 3. 피드백 카드 그리드 */}
          <Grid container spacing={2} direction="column">
            {/* 전체 피드백 카드 */}
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 3, borderLeft: '4px solid #ffffff', height: '100%' }}>
                <Typography
                  variant="subtitle1"
                  align="center"
                  sx={{ fontWeight: 'bold', mb: 1, color: 'primary.dark' }}
                >
                  전체 피드백
                </Typography>
                <Typography variant="subtitle2" align="center" sx={{ mb: 0.5 }}>
                  {overallRiskGroup}
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary">
                  {overallFeedback}
                </Typography>
              </Paper>
            </Grid>

            {/* 추가 피드백 카드 */}
            {additionalComments.length > 0 && (
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 3, borderLeft: '4px solid #ffffff' }}>
                  <Typography
                    variant="subtitle1"
                    align="center"
                    sx={{ fontWeight: 'bold', mb: 1, color: 'primary.dark' }}
                  >
                    추가 피드백
                  </Typography>
                  {additionalComments.map(({ text, style }, idx) => (
  <Typography
    key={idx}
    variant="body2"
    align="center"
    sx={{
      mb: 0.5,
      color:
        style === 'error'
          ? 'error.main'
          : style === 'info'
          ? 'primary.main'
          : style === 'success'
          ? 'success.main'
          : 'text.primary',
      fontWeight: 'bold'
    }}
  >
    {text}
  </Typography>
))}
                </Paper>
              </Grid>
            )}
            {/* 맞춤 지원 서비스: 고위험 집단만 노출 */}
            {overallRiskGroup === '고위험' && (
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 3, borderLeft: '4px solid #d32f2f' }}>
                  <Typography
                    variant="subtitle1"
                    align="center"
                    sx={{ fontWeight: 'bold', mb: 1, color: 'error.dark' }}
                  >
                    맞춤 지원 서비스 (고위험)
                  </Typography>
                  <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 2 }}>
                    현재 결과에 따라 우선적인 상담 연계를 권장합니다. 아래 버튼을 통해 상담을 신청하시거나, 지역 자원을 확인해 주세요.
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      href={`${process.env.PUBLIC_URL}/counseling`}
                    >
                      상담 신청 바로가기
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      href="https://www.ncmh.go.kr/kor/index.do"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      정신건강복지센터 안내
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default SurveyResult;
