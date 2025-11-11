import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useParams, useLocation } from "react-router-dom";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as fbLimit,
} from "firebase/firestore";

// ---------- styled ----------
const Page = styled.div`
  padding: 24px;
`;
const Section = styled.section`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
`;
const SectionTitle = styled.h3`
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
`;
const TextInputCard = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const QuestionHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const QuestionNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #1976d2;
  color: white;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-right: 12px;
  min-width: 50px;
  height: 28px;
`;

const QuestionLabel = styled.div`
  color: #374151;
  font-weight: 600;
  font-size: 0.95rem;
  line-height: 1.5;
  flex: 1;
`;

const AnswerValue = styled.div`
  color: #111827;
  font-size: 1rem;
  line-height: 1.8;
  padding: 12px 16px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  white-space: pre-wrap;
  word-break: break-word;
`;

// ---------- helpers ----------
const firstNonEmpty = (...vals) =>
  vals.find((v) => v !== undefined && v !== null);

const normalizeUser = (raw) => {
  if (!raw) return {};
  const out = { ...raw };
  // alias mapping (Korean/English variations)
  out.name = firstNonEmpty(raw.name, raw.userName, raw.이름);
  out.birthDate = firstNonEmpty(
    raw.birthDate,
    raw.생년월일,
    raw.birth,
    raw.birthdate
  );
  out.cancerType = firstNonEmpty(raw.cancerType, raw.암종류, raw.cancer);
  out.diagnosisDate = firstNonEmpty(
    raw.diagnosisDate,
    raw.진단시기,
    raw.diagnosis_at
  );
  out.gender = firstNonEmpty(raw.gender, raw.성별);
  out.maritalStatus = firstNonEmpty(raw.maritalStatus, raw.결혼상태, raw.혼인);
  out.stage = firstNonEmpty(
    raw.stage,
    raw.암병기,
    raw["암 병기"],
    raw.cancerStage
  );
  out.recurrence = firstNonEmpty(
    raw.recurrence,
    raw.재발여부,
    raw.recurrenceYn
  );
  out.surgery = firstNonEmpty(raw.surgery, raw.수술여부, raw.surgeryYn);
  out.otherCancer = firstNonEmpty(
    raw.otherCancer,
    raw.다른암진단여부,
    raw.otherCancerYn
  );
  out.mentalHistory = firstNonEmpty(raw.정신건강력, raw.mentalHistory);
  out.mentalDx = firstNonEmpty(raw.정신건강진단명, raw.mentalDx);
  out.drinking = firstNonEmpty(raw.절주여부, raw.drinking);
  out.smoking = firstNonEmpty(raw.금연여부, raw.smoking);
  return out;
};

const normalizeSurveyDoc = (doc) => {
  if (!doc) return null;
  const d = { ...doc };
  // score containers
  d.stdScores = d.stdScores || d.tScores || {};
  d.meanScores = d.meanScores || {};
  // historical key typos
  if (
    d.stdScores &&
    d.stdScores.psycnologicalBurden &&
    !d.stdScores.psychologicalBurden
  ) {
    d.stdScores.psychologicalBurden = d.stdScores.psycnologicalBurden;
  }
  if (
    d.meanScores &&
    d.meanScores.psycnologicalBurden &&
    !d.meanScores.psychologicalBurden
  ) {
    d.meanScores.psychologicalBurden = d.meanScores.psycnologicalBurden;
  }
  // answers container - raw 객체 안에 answers가 있을 수 있음
  d.answers =
    d.answers || d.raw?.answers || d.rawAnswers || d.surveyAnswers || {};
  d.additionalNotes = d.additionalNotes || d.freeText || d.memo || "";
  d.timestamp = d.timestamp || d.createdAt || d.updatedAt || null;
  return d;
};

function pickLatest(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return [...arr].sort((a, b) => {
    const ta = a?.timestamp?.seconds || a?.timestamp || 0;
    const tb = b?.timestamp?.seconds || b?.timestamp || 0;
    return tb - ta;
  })[0];
}

// ---------- main component ----------
export default function PatientSurveyResult({ answers: propAnswers }) {
  const { patientId } = useParams();
  const location = useLocation();
  const db = getFirestore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [userMeta, setUserMeta] = useState({});
  const [survey, setSurvey] = useState(null);
  const [sourceTrace, setSourceTrace] = useState([]); // 어디서 가져왔는지 기록

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const trace = [];

        // 0) route state 힌트(있다면)
        const hint = location.state || {};
        const hintSurvey = normalizeSurveyDoc(hint.lastSurvey || hint.survey);
        if (hintSurvey) {
          trace.push("route-state");
          if (mounted) setSurvey(hintSurvey);
        }
        if (hint.user) {
          trace.push("route-user");
          if (mounted)
            setUserMeta((prev) => ({ ...normalizeUser(hint.user), ...prev }));
        }

        // 1) patients/{id}
        const pRef = doc(db, "patients", patientId);
        const pSnap = await getDoc(pRef);
        if (pSnap.exists()) {
          const pData = pSnap.data();
          trace.push("patients/{id}");
          if (mounted)
            setUserMeta((prev) => ({ ...normalizeUser(pData), ...prev }));
          // 배열형 히스토리
          if (
            Array.isArray(pData.surveyResults) &&
            pData.surveyResults.length
          ) {
            const latest = normalizeSurveyDoc(pickLatest(pData.surveyResults));
            if (latest && mounted) {
              setSurvey((prev) => prev || latest);
              trace.push("patients.{surveyResults[]}");
            }
          }
        }

        // 2) users/{id}/surveyResults (subcollection)
        try {
          const subQ = query(
            collection(db, "users", patientId, "surveyResults"),
            orderBy("timestamp", "desc"),
            fbLimit(1)
          );
          const subSnap = await getDocs(subQ);
          if (!subSnap.empty) {
            const d = { id: subSnap.docs[0].id, ...subSnap.docs[0].data() };
            const norm = normalizeSurveyDoc(d);
            if (mounted && norm) {
              setSurvey((prev) => prev || norm);
              trace.push("users/{id}/surveyResults");
            }
          }
        } catch (_) {}

        // 3) users/{id} (array field)
        try {
          const uRef = doc(db, "users", patientId);
          const uSnap = await getDoc(uRef);
          if (uSnap.exists()) {
            const uData = uSnap.data();
            trace.push("users/{id}");
            if (mounted)
              setUserMeta((prev) => ({ ...prev, ...normalizeUser(uData) }));
            if (
              Array.isArray(uData.surveyResults) &&
              uData.surveyResults.length
            ) {
              const latest = normalizeSurveyDoc(
                pickLatest(uData.surveyResults)
              );
              if (mounted && latest) {
                setSurvey((prev) => prev || latest);
                trace.push("users.{surveyResults[]}");
              }
            }
          }
        } catch (_) {}

        // 4) top-level surveyResults where userId == patientId
        try {
          const tlQ = query(
            collection(db, "surveyResults"),
            where("userId", "==", patientId),
            orderBy("timestamp", "desc"),
            fbLimit(1)
          );
          const tlSnap = await getDocs(tlQ);
          if (!tlSnap.empty) {
            const d = { id: tlSnap.docs[0].id, ...tlSnap.docs[0].data() };
            const norm = normalizeSurveyDoc(d);
            if (mounted && norm) {
              setSurvey((prev) => prev || norm);
              trace.push("/surveyResults(userId)");
            }
          }
        } catch (_) {}

        if (mounted) setSourceTrace(trace);
      } catch (e) {
        if (mounted) setError(e?.message || "데이터 로드 오류");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [db, patientId, location.state]);

  // 수기 입력 필드 추출 및 정리
  const textInputFields = useMemo(() => {
    // props로 받은 answers를 우선 사용, 없으면 survey에서 가져옴
    const answers = propAnswers || survey?.answers || {};
    const fields = [];

    // q12_reasons (12-1번 질문 - q12가 1 또는 2일 때 나타나는 추가 질문)
    if (
      answers.q12_reasons &&
      Array.isArray(answers.q12_reasons) &&
      answers.q12_reasons.length > 0
    ) {
      fields.push({
        number: "12-1",
        label: "해당되지 않는 이유",
        value: answers.q12_reasons.join(", "),
      });
    }

    // q15_reasons (15-1번 질문 - q15가 1 또는 2일 때 나타나는 추가 질문)
    if (
      answers.q15_reasons &&
      Array.isArray(answers.q15_reasons) &&
      answers.q15_reasons.length > 0
    ) {
      fields.push({
        number: "15-1",
        label: "주변인들로부터 관심과 도움을 받지 못하는 이유",
        value: answers.q15_reasons.join(", "),
      });
    }

    // counselingAreasText (34번 질문 관련)
    if (
      answers.counselingAreasText &&
      String(answers.counselingAreasText).trim()
    ) {
      fields.push({
        number: "34",
        label: "상담 희망 분야에 대한 추가 의견",
        value: String(answers.counselingAreasText).trim(),
      });
    }

    // healthInfoNeedsText (35번 질문 관련)
    if (
      answers.healthInfoNeedsText &&
      String(answers.healthInfoNeedsText).trim()
    ) {
      fields.push({
        number: "35",
        label: "필요한 건강관리 정보에 대한 추가 의견",
        value: String(answers.healthInfoNeedsText).trim(),
      });
    }

    // generalComments (36번 질문)
    if (answers.generalComments && String(answers.generalComments).trim()) {
      fields.push({
        number: "36",
        label: "기타 의견",
        value: String(answers.generalComments).trim(),
      });
    }

    return fields;
  }, [survey, propAnswers]);

  return (
    <Page>
      {/* 수기 입력 정보 */}
      {textInputFields.length > 0 && (
        <Section>
          <SectionTitle>추가 입력 정보</SectionTitle>
          {textInputFields.map((field, idx) => (
            <TextInputCard key={idx}>
              <QuestionHeader>
                <QuestionNumber>{field.number}</QuestionNumber>
                <QuestionLabel>{field.label}</QuestionLabel>
              </QuestionHeader>
              <AnswerValue>{field.value}</AnswerValue>
            </TextInputCard>
          ))}
        </Section>
      )}

      {/* 로딩/오류/출처 */}
      {loading && <div>불러오는 중…</div>}
      {error && <div style={{ color: "#d32f2f" }}>오류: {error}</div>}
      {!loading && sourceTrace.length > 0 && (
        <div style={{ color: "#6b7280", fontSize: 12 }}>
          데이터 출처: {sourceTrace.join(" → ")}
        </div>
      )}
    </Page>
  );
}
