// src/pages/SurveyResultPage.jsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resultData, setResultData] = useState(null);
  
  const answers = location.state?.answers || {};
  const userName = location.state?.name || localStorage.getItem('userName') || '';

  useEffect(() => {
    const calculateResults = async () => {
      try {
        setIsLoading(true);
        console.log('Starting result calculation with answers:', JSON.stringify(answers, null, 2));

        // 답변이 없는 경우 에러 처리
        if (Object.keys(answers).length === 0) {
          throw new Error('설문 답변을 찾을 수 없습니다. 설문을 다시 진행해주세요.');
        }

        // 1. 역코딩 적용
        const reversed = SurveyUtils.applyReverseScore(answers);
        console.log('Reversed scores:', JSON.stringify(reversed, null, 2));

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
        
        console.log('Raw scores:', JSON.stringify(rawScores, null, 2));
        console.log('Mean scores:', JSON.stringify(meanScores, null, 2));

        // 섹션별 원점수 평균으로 집단 분류
        const riskGroups = {};
        Object.entries(meanScores).forEach(([key, mean]) => {
          riskGroups[key] = (typeof mean === 'number' && !isNaN(mean))
            ? SurveyUtils.getRiskGroup(labelMap[key], mean)
            : '-';
        });
        console.log('Risk groups:', JSON.stringify(riskGroups, null, 2));

        // 4. z-score(T-score) 변환 (미응답은 '-')
        const stdScores = {};
        Object.entries(meanScores).forEach(([key, mean]) => {
          const sectionName = labelMap[key];
          stdScores[key] = (typeof mean === 'number' && !isNaN(mean))
            ? SurveyUtils.newScore(sectionName, mean)
            : '-';
        });
        console.log('Std scores:', JSON.stringify(stdScores, null, 2));

        // 전체 평균 **Mean-점수** → 집단 분류 → 템플릿 문구 (미응답 섹션 제외)
        const validMeans = Object.values(meanScores).filter(v => typeof v === 'number' && !isNaN(v));
        const overallMean = validMeans.length > 0
          ? validMeans.reduce((a, b) => a + b, 0) / validMeans.length
          : null;
        
        console.log('Overall mean:', overallMean);
        
        const overallRiskGroup = (typeof overallMean === 'number' && !isNaN(overallMean))
          ? SurveyUtils.getRiskGroup('전체 평균 (암 생존자 건강관리)', overallMean)
          : '-';
        
        console.log('Overall risk group:', overallRiskGroup);
        
        const overallFeedback = (typeof overallMean === 'number' && !isNaN(overallMean))
          ? SurveyUtils.getPatientComment(overallRiskGroup)
          : '해당 영역(섹션)은 응답하지 않아 점수 산출이 불가합니다.';
        
        console.log('Overall feedback:', overallFeedback);

        // 추가 피드백
        const additionalComments = SurveyUtils.getAdditionalFeedback(
          answers,
          meanScores,
          riskGroups
        );

        // 모든 섹션 key 목록 (응답 여부와 무관하게)
        const allSectionKeys = Object.keys(sectionIds);
        
        // 전달용 객체를 allSectionKeys 기준으로 재구성 (값이 없으면 0)
        const filtered = (src) =>
          Object.fromEntries(allSectionKeys.map(k => [k, src[k] ?? 0]));

        const calculatedData = {
          rawScores: filtered(rawScores),
          meanScores: filtered(meanScores),
          stdScores: filtered(stdScores),
          riskGroups: filtered(riskGroups),
          overallMean,
          overallRiskGroup,
          overallFeedback,
          additionalFeedback: additionalComments,
          answers
        };

        setResultData(calculatedData);

        // Firebase에 결과 저장 (사용자명이 있는 경우에만)
        if (userName) {
          const scoresToSave = {
            stdScores: filtered(stdScores),
            meanScores: filtered(meanScores),
            riskGroups: filtered(riskGroups),
            overallMean,
            overallRiskGroup,
            overallFeedback,
            additionalFeedback: additionalComments
          };

          await saveSurveyScores(userName, scoresToSave);
          console.log('Survey scores saved successfully');
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error calculating results:', err);
        setError(err.message || '결과를 계산하는 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };

    calculateResults();
  }, [answers, userName]);

  // 로딩 중 화면
  if (isLoading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="50vh"
        p={4}
      >
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" align="center" sx={{ mb: 1 }}>
          결과를 분석하고 있습니다...
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary">
          잠시만 기다려주세요.
        </Typography>
      </Box>
    );
  }

  // 에러 화면
  if (error) {
    return (
      <Box p={4} display="flex" flexDirection="column" alignItems="center">
        <Alert severity="error" sx={{ mb: 3, maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom>
            결과 표시 오류
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={() => navigate('/section1')}
          >
            설문 다시하기
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
          >
            홈으로 가기
          </Button>
        </Box>
      </Box>
    );
  }

  // 정상 결과 화면
  return (
    <Box p={4}>
      <SurveyResult
        rawScores={resultData.rawScores}
        meanScores={resultData.meanScores}
        stdScores={resultData.stdScores}
        riskGroups={resultData.riskGroups}
        overallFeedback={resultData.overallFeedback}
        overallRiskGroup={resultData.overallRiskGroup}
        answers={resultData.answers}
        riskByMean={resultData.riskGroups}
      />
      
      <Box mt={4} display="flex" justifyContent="center" gap={2} flexWrap="wrap">
        <Button
          variant="outlined"
          href="https://kimsunggak.github.io/patient_survey/web1/"
          sx={{ 
            px: { xs: 3, sm: 6 }, 
            py: 2, 
            fontSize: { xs: '0.9rem', sm: '1.1rem' }, 
            fontWeight: 'bold', 
            borderRadius: 1 
          }}
        >
          홈으로 가기
        </Button>
        <Button
          variant="contained"
          color="primary"
          sx={{ 
            px: { xs: 3, sm: 6 }, 
            py: 2, 
            fontSize: { xs: '0.9rem', sm: '1.1rem' }, 
            fontWeight: 'bold', 
            borderRadius: 1 
          }}
          onClick={() => navigate('/counseling-request')}
        >
          상담 요청
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          sx={{ 
            px: { xs: 3, sm: 6 }, 
            py: 2, 
            fontSize: { xs: '0.9rem', sm: '1.1rem' }, 
            fontWeight: 'bold', 
            borderRadius: 1 
          }}
          onClick={() => window.print()}
        >
          결과 출력
        </Button>
      </Box>
    </Box>
  );
};

export default SurveyResultPage;
