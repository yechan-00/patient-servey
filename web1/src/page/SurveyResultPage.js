// src/pages/SurveyResultPage.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import SurveyResult from "../component/SurveyResult";
import * as SurveyUtils from "../utils/SurveyUtils";
import { saveSurveySnapshot, saveSurveySummary } from "../utils/firebaseUtils";
import { useSurveyForm } from "../context/SurveyFormContext";

const labelMap = {
  physicalChange: "암 이후 내 몸의 변화",
  healthManagement: "건강한 삶을 위한 관리",
  socialSupport: "회복을 도와주는 사람들",
  psychologicalBurden: "심리적 부담",
  socialBurden: "사회적 삶의 부담",
  resilience: "암 이후 탄력성",
};

const sectionIds = {
  physicalChange: ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"],
  healthManagement: ["q9", "q10", "q11", "q12", "q13"],
  socialSupport: ["q14", "q15", "q16", "q17"],
  psychologicalBurden: ["q18", "q19", "q20", "q21", "q22", "q23", "q24", "q25"],
  socialBurden: ["q26", "q27", "q28"],
  resilience: ["q29", "q30", "q31"],
};

// 이름+생년월일 기반으로 브라우저 crypto를 이용해 안정적인 환자 ID 생성
async function makeStablePatientId(name, birthDate) {
  try {
    const text = `${(name || "").trim()}|${(birthDate || "").trim()}`; // 예: "한영준|1990-01-01"
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-1", enc);
    const hex = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `p-${hex.slice(0, 16)}`; // p-xxxxxxxxxxxxxxxx (항상 동일)
  } catch (e) {
    // crypto 불가 환경 대비: 타임스탬프 폴백
    return `p-${Date.now()}`;
  }
}

const SurveyResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { answers: contextAnswers } = useSurveyForm();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resultData, setResultData] = useState(null);

  // SurveyFormContext의 answers를 우선 사용, 없으면 location.state에서 가져오기
  const answers =
    Object.keys(contextAnswers).length > 0
      ? contextAnswers
      : location.state?.answers || {};

  const userName =
    location.state?.name || localStorage.getItem("userName") || "";

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const calculateResults = async () => {
      try {
        setIsLoading(true);

        // 답변이 없는 경우 에러 처리
        if (Object.keys(answers).length === 0) {
          throw new Error(
            "설문 답변을 찾을 수 없습니다. 설문을 다시 진행해주세요."
          );
        }

        // 1. 역코딩 적용
        const reversed = SurveyUtils.applyReverseScore(answers);

        // 2. 영역별 합계(원점수) 및 3. 평균 산출 (미응답 제외)
        const rawScores = {};
        const meanScores = {};

        Object.entries(sectionIds).forEach(([key, ids]) => {
          const validAnswers = ids
            .map((id) => reversed[id])
            .filter((v) => typeof v === "number" && !isNaN(v));

          rawScores[key] = validAnswers.reduce((sum, v) => sum + v, 0);
          meanScores[key] =
            validAnswers.length > 0
              ? rawScores[key] / validAnswers.length
              : null;
        });

        // 섹션별 원점수 평균으로 집단 분류
        const riskGroups = {};
        Object.entries(meanScores).forEach(([key, mean]) => {
          riskGroups[key] =
            typeof mean === "number" && !isNaN(mean)
              ? SurveyUtils.getRiskGroup(labelMap[key], mean)
              : "-";
        });
        // 4. z-score(T-score) 변환 (미응답은 '-')
        const stdScores = {};
        Object.entries(meanScores).forEach(([key, mean]) => {
          const sectionName = labelMap[key];
          stdScores[key] =
            typeof mean === "number" && !isNaN(mean)
              ? SurveyUtils.newScore(sectionName, mean)
              : "-";
        });
        // 전체 평균 **Mean-점수** → 집단 분류 → 템플릿 문구 (미응답 섹션 제외)
        const validMeans = Object.values(meanScores).filter(
          (v) => typeof v === "number" && !isNaN(v)
        );
        const overallMean =
          validMeans.length > 0
            ? validMeans.reduce((a, b) => a + b, 0) / validMeans.length
            : null;

        const overallRiskGroup =
          typeof overallMean === "number" && !isNaN(overallMean)
            ? SurveyUtils.getRiskGroup(
                "전체 평균 (암 생존자 건강관리)",
                overallMean
              )
            : null; // "-" 대신 null 사용

        const overallFeedback =
          typeof overallMean === "number" && !isNaN(overallMean)
            ? SurveyUtils.getPatientComment(overallRiskGroup)
            : "해당 영역(섹션)은 응답하지 않아 점수 산출이 불가합니다.";

        // 모든 섹션 key 목록 (응답 여부와 무관하게)
        const allSectionKeys = Object.keys(sectionIds);

        // 전달용 객체를 allSectionKeys 기준으로 재구성
        // "-" 문자열은 null로 변환하여 SurveyResult 컴포넌트가 올바르게 처리하도록 함
        const filtered = (src) =>
          Object.fromEntries(
            allSectionKeys.map((k) => {
              const val = src[k];
              // "-" 문자열은 null로 변환 (응답 없음을 나타냄)
              if (val === "-") {
                return [k, null];
              }
              // undefined나 null은 그대로 유지
              if (val === undefined || val === null) {
                return [k, val];
              }
              // 숫자는 그대로 전달
              return [k, typeof val === "number" ? val : val];
            })
          );

        // riskGroups 필터링: "-" 문자열은 null로 변환, 문자열 값은 그대로 유지
        const filteredRiskGroups = (src) =>
          Object.fromEntries(
            allSectionKeys.map((k) => {
              const val = src[k];
              // "-" 문자열은 null로 변환 (응답 없음을 나타냄)
              if (val === "-") {
                return [k, null];
              }
              // 문자열 값("고위험집단", "주의집단", "저위험집단")은 그대로 전달
              return [k, val];
            })
          );

        // 추가 피드백 (필터링된 riskGroups 사용)
        const filteredRiskGroupsData = filteredRiskGroups(riskGroups);
        const additionalComments = SurveyUtils.getAdditionalFeedback(
          answers,
          filtered(meanScores),
          filteredRiskGroupsData
        );

        const calculatedData = {
          rawScores: filtered(rawScores),
          meanScores: filtered(meanScores),
          stdScores: filtered(stdScores),
          riskGroups: filteredRiskGroupsData,
          overallMean,
          overallRiskGroup,
          overallFeedback,
          additionalFeedback: additionalComments,
          answers,
        };

        setResultData(calculatedData);

        // Firebase에 결과 저장 (사용자명이 있는 경우에만)
        if (userName) {
          // 설문 시작 시 입력했던 메타값: state 우선 → localStorage 보조
          const nameVal =
            userName || localStorage.getItem("userName") || "익명";
          const birthDateVal =
            location.state?.birthDate ||
            localStorage.getItem("birthDate") ||
            "";
          const cancerTypeVal =
            location.state?.cancerType ||
            localStorage.getItem("cancerType") ||
            "";
          const diagnosisDateVal =
            location.state?.diagnosisDate ||
            localStorage.getItem("diagnosisDate") ||
            "";

          // 우선순위: 라우팅 state → (이름+생일 해시)
          /**
           * ID 통일 원칙:
           * - 설문 결과는 로그인 여부와 무관하게 동일한 patientId에 적재되도록 한다.
           * - patientId는 항상 현재 입력된 이름+생년월일 기반으로 생성 (localStorage 재사용 금지)
           * - localStorage의 patientId는 재사용하지 않음 (다른 사람 설문 시 덮어쓰기 방지)
           */
          const pidFromState = location.state?.patientId || "";
          // 항상 현재 입력된 이름+생년월일로 새로 생성 (localStorage 재사용 안 함)
          const patientId =
            pidFromState || (await makeStablePatientId(nameVal, birthDateVal));

          // 로컬에 보관(현재 설문 세션 동안만 사용, 다음 설문에서는 재사용 안 함)
          try {
            localStorage.setItem("patientId", patientId);
          } catch (e) {
            // localStorage 접근 불가한 환경 대비: 무시
          }

          const scoresToSave = {
            stdScores: filtered(stdScores),
            meanScores: filtered(meanScores),
            riskGroups: filteredRiskGroupsData,
            overallMean,
            overallRiskGroup,
            overallFeedback,
            additionalFeedback: additionalComments,
          };

          // 1) 개별 설문 스냅샷 저장 (원자료 중심)
          const snapshotData = {
            answers,
            meanScores: filtered(meanScores),
            stdScores: filtered(stdScores),
            riskGroups: filteredRiskGroupsData,
            overallMean,
            overallRiskGroup,
            overallFeedback,
            createdAt: new Date().toISOString(),
          };

          // 2) 요약본 업데이트 (최근 값만)
          const summary = {
            lastSurveyCompletedAt: new Date().toISOString(),
            lastOverallMean: overallMean,
            lastOverallRiskGroup: overallRiskGroup,
            lastOverallFeedback: overallFeedback,
          };

          // 설문 결과 스냅샷 저장
          await saveSurveySnapshot(patientId, snapshotData);
          await saveSurveySummary(patientId, summary);

          // savePatientSnapshot 제거: 중복 문서 생성 방지
          // saveSurveyScores가 이미 patients/{patientId}에 merge로 저장하므로 중복 방지됨

          // 전용 데이터 수집 모듈 사용 (기존 기능에 영향 없이 데이터만 확실하게 수집)
          const { collectProfileData, readLocalStorageProfile } = await import(
            "../utils/surveyDataCollector"
          );
          const { saveSurveyDataWithProfile } = await import(
            "../utils/surveyDataSaver"
          );

          // localStorage에서 개인 정보 읽기
          const localStorageData = readLocalStorageProfile();

          // 모든 소스에서 데이터 수집 (우선순위: location.state > answers > localStorage)
          const profileData = collectProfileData({
            locationState: location.state || {},
            answers: answers || {},
            localStorage: localStorageData,
          });

          // 기본 정보는 이미 계산된 값 사용 (더 정확함)
          profileData.name = nameVal || profileData.name;
          profileData.birthDate = birthDateVal || profileData.birthDate;
          profileData.cancerType = cancerTypeVal || profileData.cancerType;
          profileData.diagnosisDate =
            diagnosisDateVal || profileData.diagnosisDate;

          // 전용 저장 모듈 사용 (profileData를 확실하게 저장)
          await saveSurveyDataWithProfile(
            patientId,
            scoresToSave,
            profileData,
            answers
          );

          // 설문 완료 후 SurveyFormContext 초기화는 하지 않음
          // 결과 페이지를 다시 볼 수 있도록 answers를 유지
          // resetSurvey()는 사용자가 홈으로 돌아가거나 새 설문을 시작할 때만 호출
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error calculating results:", err);
        setError(err.message || "결과를 계산하는 중 오류가 발생했습니다.");
        setIsLoading(false);
      }
    };

    calculateResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <Typography variant="body2">{error}</Typography>
        </Alert>
        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={() => navigate("/section1")}>
            설문 다시하기
          </Button>
          <Button variant="contained" onClick={() => navigate("/")}>
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
      />

      <Box
        mt={4}
        display="flex"
        justifyContent="center"
        gap={2}
        flexWrap="wrap"
      >
        <Button
          variant="outlined"
          onClick={() => navigate("/")}
          sx={{
            px: { xs: 3, sm: 6 },
            py: 2,
            fontSize: { xs: "0.9rem", sm: "1.1rem" },
            fontWeight: "bold",
            borderRadius: 1,
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
            fontSize: { xs: "0.9rem", sm: "1.1rem" },
            fontWeight: "bold",
            borderRadius: 1,
          }}
          onClick={() => navigate("/counseling-request")}
        >
          상담 요청
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          sx={{
            px: { xs: 3, sm: 6 },
            py: 2,
            fontSize: { xs: "0.9rem", sm: "1.1rem" },
            fontWeight: "bold",
            borderRadius: 1,
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
