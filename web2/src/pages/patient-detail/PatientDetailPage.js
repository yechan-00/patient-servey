// src/pages/patient-detail/PatientDetailPage.js
import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import Layout from "../../components/Layout";
import { updatePatientStatus, setArchived } from "../../utils/FirebaseUtils";
import {
  loadPatientCore,
  loadUserForPatient,
  loadSurveyBundle,
  loadCounselingBundle,
} from "../../models/patientData";

// 하위 섹션 컴포넌트
import PatientBasicInfo from "./PatientBasicInfo";
import PatientHealthStatus from "./PatientHealthStatus";
import PatientSurveyResult from "./PatientSurveyResult";
import PatientCounseling from "./PatientCounseling";

/** ===================== Styles (필요한 것만) ===================== */
const Container = styled.div`
  margin-bottom: 2rem;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  font-size: 0.9rem;
  color: #6c757d;
  text-decoration: none;
  margin-bottom: 1rem;
  &:hover {
    color: #495057;
  }
`;

const PatientInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  .patient-details {
    display: flex;
    align-items: center;
  }
`;

const PatientAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #2a5e8c;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin-right: 1rem;
`;

const PatientNameContainer = styled.div``;

const PatientNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0.5rem;
`;

const PatientName = styled.h2`
  font-size: 1.5rem;
  margin: 0;
`;

const RiskBadge = styled.span`
  display: inline-block !important;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff !important;
  background: ${(p) =>
    p.$level === "high"
      ? "#e74c3c"
      : p.$level === "medium"
      ? "#f39c12"
      : "#27ae60"} !important;
  margin-left: 8px;
  white-space: nowrap;
  visibility: visible !important;
  opacity: 1 !important;
`;

const PatientId = styled.p`
  color: #6c757d;
  margin: 0;
  font-size: 0.9rem;
`;

const Button = styled.button`
  background-color: ${(p) => (p.$secondary ? "#6c757d" : "#2a5e8c")};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;

  &:hover {
    background-color: ${(p) => (p.$secondary ? "#5a6268" : "#1d4269")};
  }
`;

const TabNav = styled.div`
  display: flex;
  border-bottom: 1px solid #dee2e6;
  margin-bottom: 2rem;
`;

const TabButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 2px solid ${(p) => (p.$active ? "#2a5e8c" : "transparent")};
  color: ${(p) => (p.$active ? "#2a5e8c" : "#6c757d")};
  font-weight: ${(p) => (p.$active ? 600 : 400)};
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    color: #2a5e8c;
  }
`;

/** ===================== Component ===================== */
function PatientDetailPage() {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const switchTab = (tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(location.search);
    params.set("tab", tab);
    navigate({ search: params.toString() }, { replace: true });
  };

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [core, setCore] = useState(null);
  const [survey, setSurvey] = useState(null);
  const [counseling, setCounseling] = useState(null);

  // URL 쿼리파라미터로 초기 탭 설정 (?tab=overview|survey|responses|counseling)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tabParam = queryParams.get("tab");
    if (
      tabParam &&
      ["overview", "survey", "responses", "counseling"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [location]);

  // 환자 코어/설문/상담을 한 번에 로드하여 하위 탭으로 전달
  useEffect(() => {
    let alive = true;
    async function run() {
      try {
        setLoading(true);
        // 최적화: users와 patients 문서를 한 번만 읽고 공유
        const [userSnap, metaSnap] = await Promise.all([
          getDoc(doc(db, "users", patientId)),
          getDoc(doc(db, "patients", patientId)),
        ]);

        if (!userSnap.exists() && !metaSnap.exists()) {
          setError("환자 정보를 찾을 수 없습니다.");
          setLoading(false);
          return;
        }

        const userData = userSnap.exists() ? userSnap.data() || {} : {};
        const metaData = metaSnap.exists() ? metaSnap.data() || {} : {};

        // 1) core(기본 프로필) 로드 (이미 읽은 데이터 전달하여 중복 쿼리 방지)
        let coreRes;
        try {
          coreRes = await loadPatientCore(patientId, {
            user: userData,
            meta: metaData,
          });
        } catch (e) {
          console.error("[PatientDetailPage] loadPatientCore 오류:", e);
          throw new Error(`환자 기본 정보 로드 실패: ${e.message}`);
        }
        if (!alive) return;

        if (coreRes?.notFound) {
          setError("환자 정보를 찾을 수 없습니다.");
          setLoading(false);
          return;
        }

        // 2) user 문서 로드 (추가 검색, 선택적) - 이미 읽은 userData 전달하여 중복 쿼리 방지
        let userDoc;
        try {
          userDoc = await loadUserForPatient(
            patientId,
            coreRes?.patient?.name,
            {
              userData: userData,
            }
          );
        } catch (e) {
          console.error("[PatientDetailPage] loadUserForPatient 오류:", e);
          userDoc = {};
        }
        if (!alive) return;

        // 3) 설문/상담 병렬 로드 (이미 읽은 user/meta 데이터 전달하여 중복 쿼리 방지)
        let surveyRes, counselingRes;
        try {
          [surveyRes, counselingRes] = await Promise.all([
            loadSurveyBundle(patientId, { user: userData, meta: metaData }),
            loadCounselingBundle(patientId),
          ]);
        } catch (e) {
          console.error("[PatientDetailPage] 설문/상담 로드 오류:", e);
          surveyRes = surveyRes || {};
          counselingRes = counselingRes || {};
        }
        if (!alive) return;

        // core에 user 병합 저장
        setCore({ ...coreRes, user: userDoc || {} });
        setSurvey(surveyRes);
        setCounseling(counselingRes);

        // 디버깅: 로드된 데이터 확인
        console.log("[PatientDetailPage] surveyRes:", surveyRes);
        console.log(
          "[PatientDetailPage] surveyRes.lastSurvey:",
          surveyRes?.lastSurvey
        );
        console.log(
          "[PatientDetailPage] surveyRes.lastSurvey?.profile:",
          surveyRes?.lastSurvey?.profile
        );
        console.log(
          "[PatientDetailPage] surveyRes.lastSurvey?.profile?.gender:",
          surveyRes?.lastSurvey?.profile?.gender
        );
        console.log(
          "[PatientDetailPage] surveyRes.lastSurvey?.profile?.maritalStatus:",
          surveyRes?.lastSurvey?.profile?.maritalStatus
        );

        const p = coreRes?.patient || {};
        setPatient({
          id: p.id || patientId,
          name: p.name || (userDoc && userDoc.name) || "익명",
          counselingStatus: p.counselingStatus || "미요청",
          archived: !!p.archived,
        });

        setLoading(false);
      } catch (e) {
        console.error("[PatientDetailPage] 전체 오류:", e);
        console.error("[PatientDetailPage] 오류 스택:", e.stack);
        if (!alive) return;
        setError(`환자 데이터를 불러오는 중 오류가 발생했습니다: ${e.message}`);
        setLoading(false);
      }
    }
    if (patientId) run();
    return () => {
      alive = false;
    };
  }, [patientId]);

  // ------- Merged props for child tabs (safe fallbacks) -------
  const mergedStdScores =
    survey && survey.stdScores && Object.keys(survey.stdScores).length
      ? survey.stdScores
      : (core && core.user && core.user.stdScores) ||
        (core && core.patient && core.patient.stdScores) ||
        {};

  const mergedMeanScores =
    survey && survey.meanScores && Object.keys(survey.meanScores).length
      ? survey.meanScores
      : (core && core.user && core.user.meanScores) ||
        (core && core.patient && core.patient.meanScores) ||
        {};

  const mergedCategoryScores =
    survey && survey.categoryScores && Object.keys(survey.categoryScores).length
      ? survey.categoryScores
      : undefined;

  // 위험도 정규화 함수 (FirebaseUtils.js의 normalizeRiskLevel과 동일한 로직)
  // 공통 유틸로 추출 가능하지만 현재는 각 파일에서 독립적으로 사용
  const normalizeRiskLevel = (text) => {
    if (!text) return undefined;
    const t = String(text).toLowerCase();
    if (["high", "고위험", "고위험집단", "위험"].some((k) => t.includes(k)))
      return "high";
    if (["medium", "중위험", "중위험집단", "주의"].some((k) => t.includes(k)))
      return "medium";
    if (["low", "저위험", "저위험집단", "양호"].some((k) => t.includes(k)))
      return "low";
    return undefined;
  };

  // 위험도 우선순위: survey.riskLevel > user.lastOverallRiskGroup > user.overallRiskGroup > patient.riskLevel
  const rawRiskLevel =
    (survey && survey.riskLevel) ||
    (core &&
      core.user &&
      (core.user.lastOverallRiskGroup || core.user.overallRiskGroup)) ||
    (core && core.patient && core.patient.riskLevel) ||
    undefined;

  const mergedRiskLevel = normalizeRiskLevel(rawRiskLevel);

  const mergedOverallFeedback =
    (survey && survey.overallFeedback) ||
    (core &&
      core.user &&
      (core.user.overallFeedback || core.user.lastOverallFeedback)) ||
    undefined;

  const mergedAdditionalFeedback =
    (survey && survey.additionalFeedback) ||
    (core && core.user && core.user.additionalFeedback) ||
    [];

  const getPatientInitials = () => {
    if (!patient?.name) return "?";
    const parts = String(patient.name).trim().split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  };

  if (loading) {
    return (
      <Layout title="환자 상세 정보">
        <Container>
          <p>환자 데이터를 불러오는 중...</p>
        </Container>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="환자 상세 정보">
        <Container>
          <BackLink to="/">← 대시보드로 돌아가기</BackLink>
          <p style={{ color: "#dc3545" }}>{error}</p>
        </Container>
      </Layout>
    );
  }

  if (!patient) {
    return (
      <Layout title="환자 상세 정보">
        <Container>
          <BackLink to="/">← 대시보드로 돌아가기</BackLink>
          <p>해당 ID의 환자를 찾을 수 없습니다.</p>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout title="환자 상세 정보">
      <Container>
        <BackLink to="/">← 대시보드로 돌아가기</BackLink>

        <PatientInfo>
          <div className="patient-details">
            <PatientAvatar>{getPatientInitials()}</PatientAvatar>
            <PatientNameContainer>
              <PatientNameRow>
                <PatientName>{patient.name || "익명 환자"}</PatientName>
                {mergedRiskLevel && (
                  <RiskBadge $level={mergedRiskLevel}>
                    {mergedRiskLevel === "high"
                      ? "위험"
                      : mergedRiskLevel === "medium"
                      ? "주의"
                      : "양호"}
                  </RiskBadge>
                )}
              </PatientNameRow>
              <PatientId>ID: {patient.id}</PatientId>
            </PatientNameContainer>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={patient.counselingStatus || "미요청"}
              onChange={async (e) => {
                const next = e.target.value;
                try {
                  await updatePatientStatus(patient.id, next);
                  setPatient((prev) => ({
                    ...prev,
                    counselingStatus: next,
                    archived: next === "보관" ? true : prev.archived,
                  }));
                } catch (err) {
                  alert("상담 상태 변경에 실패했습니다.");
                  console.error(err);
                }
              }}
              style={{ padding: "6px 8px" }}
              aria-label="상담 상태 변경"
            >
              {["미요청", "요청", "진행중", "완료", "보관"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {patient.archived ? (
              <Button
                onClick={async () => {
                  try {
                    await setArchived(patient.id, false);
                    setPatient((prev) => ({
                      ...prev,
                      archived: false,
                      counselingStatus:
                        prev.counselingStatus === "보관"
                          ? "완료"
                          : prev.counselingStatus,
                    }));
                  } catch (err) {
                    alert("보관 해제에 실패했습니다.");
                    console.error(err);
                  }
                }}
              >
                보관 해제
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  try {
                    await setArchived(patient.id, true);
                    setPatient((prev) => ({
                      ...prev,
                      archived: true,
                      counselingStatus: "보관",
                    }));
                  } catch (err) {
                    alert("보관 처리에 실패했습니다.");
                    console.error(err);
                  }
                }}
              >
                보관
              </Button>
            )}
          </div>
        </PatientInfo>

        <TabNav>
          <TabButton
            $active={activeTab === "overview"}
            onClick={() => switchTab("overview")}
          >
            기본 정보
          </TabButton>
          <TabButton
            $active={activeTab === "survey"}
            onClick={() => switchTab("survey")}
          >
            건강 상태
          </TabButton>
          <TabButton
            $active={activeTab === "responses"}
            onClick={() => switchTab("responses")}
          >
            설문 결과
          </TabButton>
          <TabButton
            $active={activeTab === "counseling"}
            onClick={() => switchTab("counseling")}
          >
            상담 기록
          </TabButton>
        </TabNav>

        {activeTab === "overview" && core && (
          <PatientBasicInfo
            patient={core.patient}
            user={core.user || {}}
            answers={survey?.answers || {}}
            lastSurvey={
              survey?.lastSurvey ??
              (core?.patient?.lastSurveyAt
                ? { createdAt: core.patient.lastSurveyAt }
                : null)
            }
            lastCounseling={
              counseling?.lastCounseling ??
              counseling?.counselingRequests?.[0] ??
              null
            }
          />
        )}

        {activeTab === "survey" && (
          <PatientHealthStatus
            lastSurvey={survey?.lastSurvey}
            user={core?.user || {}}
            patient={core?.patient || {}}
          />
        )}

        {activeTab === "responses" && (
          <PatientSurveyResult
            patientId={patientId}
            answers={survey?.answers}
            categoryScores={mergedCategoryScores}
            stdScores={mergedStdScores}
            meanScores={mergedMeanScores}
            overallFeedback={mergedOverallFeedback}
            additionalFeedback={mergedAdditionalFeedback}
          />
        )}

        {activeTab === "counseling" && (
          <PatientCounseling patientId={patientId} />
        )}
      </Container>
    </Layout>
  );
}

export default PatientDetailPage;
