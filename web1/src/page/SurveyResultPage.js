// src/pages/SurveyResultPage.jsx
import React, { useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom'; // useNavigate 추가
import SurveyResult from '../component/SurveyResult';
import * as SurveyUtils from '../utils/SurveyUtils';
import { saveSurveyScores } from '../utils/firebaseUtils';

const labelMap = {
  physicalChange: '암 이후 내 몸의 변화',
  healthManagement: '건강한 삶을 위한 관리',
  socialSupport: '회복을 도와주는 사람들',
  psychologicalBurden: '심리적 부담',
  socialBurden: '사회적 삶의 부담',
  resilience: '암 이후 탄력성'
};

const sectionIds = {
  physicalChange: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'],
  healthManagement: ['q9', 'q10', 'q11', 'q12', 'q13'],
  socialSupport: ['q14', 'q15', 'q16', 'q17'],
  psychologicalBurden: ['q18', 'q19', 'q20', 'q21', 'q22', 'q23', 'q24', 'q25'],
  socialBurden: ['q26', 'q27', 'q28'],
  resilience: ['q29', 'q30', 'q31']
};

const SurveyResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate(); // useNavigate 훅 추가
  const answers = location.state?.answers || {};
  const userName = location.state?.name || localStorage.getItem('userName') || '';
  console.log('answers:', JSON.stringify(answers, null, 2));

  // 1. 역코딩 적용
  const reversed = SurveyUtils.applyReverseScore(answers);
  console.log('reversed:', JSON.stringify(reversed, null, 2));

  // 2. 영역별 합계(원점수) 및 3. 평균 산출 (미응답 제외)
  const rawScores = {};
  const meanScores = {};
  Object.entries(sectionIds).forEach(([key, ids]) => {
    // 실제 응답(숫자)만 추출
    const validAnswers = ids
      .map(id => reversed[id])
      .filter(v => typeof v === 'number' && !isNaN(v));
    rawScores[key] = validAnswers.reduce((sum, v) => sum + v, 0);
    meanScores[key] = validAnswers.length > 0 ? rawScores[key] / validAnswers.length : null;
  });
  console.log('rawScores:', JSON.stringify(rawScores, null, 2));
  console.log('meanScores:', JSON.stringify(meanScores, null, 2));

  // ★ 섹션별 원점수 평균으로 집단 분류 (한 번만 계산, 미응답은 '-')
  const riskGroups = {};
  Object.entries(meanScores).forEach(([key, mean]) => {
    riskGroups[key] = (typeof mean === 'number' && !isNaN(mean))
      ? SurveyUtils.getRiskGroup(labelMap[key], mean)
      : '-';
  });
  console.log('riskGroups:', JSON.stringify(riskGroups, null, 2));
  // 필요하다면 riskByMean 별칭으로 재활용
  const riskByMean = riskGroups;

  // 4. z-score(T-score) 변환 (미응답은 '-')
  const stdScores = {};
  Object.entries(meanScores).forEach(([key, mean]) => {
    const sectionName = labelMap[key];
    stdScores[key] = (typeof mean === 'number' && !isNaN(mean))
      ? SurveyUtils.newScore(sectionName, mean)
      : '-';
  });
  console.log('stdScores:', JSON.stringify(stdScores, null, 2));

  // 6. 전체 평균 **Mean-점수** → 집단 분류 → 템플릿 문구 (미응답 섹션 제외)
  const validMeans = Object.values(meanScores).filter(v => typeof v === 'number' && !isNaN(v));
  const overallMean = validMeans.length > 0
    ? validMeans.reduce((a, b) => a + b, 0) / validMeans.length
    : null;
  console.log('overallMean:', JSON.stringify(overallMean, null, 2));
  const overallRiskGroup = (typeof overallMean === 'number' && !isNaN(overallMean))
    ? SurveyUtils.getRiskGroup('전체 평균 (암 생존자 건강관리)', overallMean)
    : '-';
  console.log('overallRiskGroup:', JSON.stringify(overallRiskGroup, null, 2));
  const overallFeedback = (typeof overallMean === 'number' && !isNaN(overallMean))
    ? SurveyUtils.getPatientComment(overallRiskGroup)
    : '해당 영역(섹션)은 응답하지 않아 점수 산출이 불가합니다.';
  console.log('overallFeedback:', JSON.stringify(overallFeedback, null, 2));

  // 4) 추가 피드백: answers 전체를 통째로 함수에 전달
  const additionalComments = SurveyUtils.getAdditionalFeedback(
    answers,
    meanScores,
    riskByMean
  );

  // ❶ 모든 섹션 key 목록 (응답 여부와 무관하게)
  const allSectionKeys = Object.keys(sectionIds);
  // ❷ 전달용 객체를 allSectionKeys 기준으로 재구성 (값이 없으면 0)
  const filtered = (src) =>
    Object.fromEntries(allSectionKeys.map(k => [k, src[k] ?? 0]));

  // 7. SurveyResult에 전달 (응답 섹션만)
  // Firebase에 결과 저장
  useEffect(() => {
    if (!userName) {
      console.log('SurveyResultPage: No userName provided, skipping save');
      return;
    }

    const scoresToSave = {
      stdScores: filtered(stdScores),
      meanScores: filtered(meanScores),
      riskGroups: filtered(riskGroups),
      overallMean,
      overallRiskGroup,
      overallFeedback,
      additionalFeedback: additionalComments
    };

    saveSurveyScores(userName, scoresToSave)
      .then(() => console.log('Survey scores saved successfully'))
      .catch(err => console.error('Error saving survey scores:', err));
  }, [userName, stdScores, meanScores, riskGroups, overallMean, overallRiskGroup, overallFeedback, additionalComments]);

  // 홈으로 이동하는 함수
  const handleGoHome = () => {
    navigate('/'); // React Router를 사용해 홈으로 이동
  };

  return (
    <Box p={4}>
      <SurveyResult
        rawScores={filtered(rawScores)}
        meanScores={filtered(meanScores)}
        stdScores={filtered(stdScores)}
        riskGroups={filtered(riskGroups)}
        overallFeedback={overallFeedback}
        overallRiskGroup={overallRiskGroup}
        answers={answers}
        riskByMean={filtered(riskGroups)}
      />
      <Box mt={4} display="flex" justifyContent="center">
        <Button
          variant="contained"
          onClick={handleGoHome} // href 대신 onClick 사용
          sx={{ px: 6, py: 2, fontSize: '1.1rem', fontWeight: 'bold', borderRadius: 1 }}
        >
          홈으로 가기
        </Button>
      </Box>
    </Box>
  );
};

export default SurveyResultPage;