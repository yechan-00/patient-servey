import React, { useMemo, useState } from "react";
import styled from "styled-components";

/**
 * PatientBasicInfo
 *
 * Presentation-only component. It does **not** query Firestore directly.
 * Pass in the already-fetched documents so we don't duplicate data access logic
 * or introduce mapping drift. It gracefully handles missing/partial data.
 *
 * Props:
 *   - patient: Firestore `patients/{id}` document data (optional)
 *   - user: Firestore `users/{id}` document data (optional)
 *   - lastSurvey: Latest `surveyResults` summary for this user (optional)
 *   - lastCounseling: Latest `counselingRequests` doc for this user (optional)
 */
const PatientBasicInfo = ({
  patient,
  user,
  lastSurvey,
  lastCounseling,
  answers = {},
}) => {
  const [activeSection, setActiveSection] = useState("basic");

  const vm = useMemo(() => {
    const result = buildViewModel({
      patient,
      user,
      lastSurvey,
      lastCounseling,
      answers: answers || {},
    });

    return result;
  }, [patient, user, lastSurvey, lastCounseling, answers]);

  // 섹션별 필드 분류
  const basicInfoRows = vm.rows.filter((row) =>
    ["name", "gender", "birthDate", "age", "maritalStatus"].includes(row.key)
  );

  const cancerInfoRows = vm.rows.filter((row) =>
    [
      "cancerType",
      "cancerStage",
      "diagnosisDate",
      "hasRecurrence",
      "hasSurgery",
      "surgeryDate",
      "otherCancerDiagnosis",
      "otherCancerType",
    ].includes(row.key)
  );

  const contactInfoRows = vm.rows.filter((row) =>
    [
      "phone",
      "contactMethod",
      "contactTime",
      "lastSurveyAt",
      "lastCounselingAt",
    ].includes(row.key)
  );

  const healthBehaviorRows = vm.rows.filter((row) =>
    [
      "alcoholAbstinence",
      "smokingCessation",
      "mentalHistory",
      "mentalDx",
    ].includes(row.key)
  );

  const renderSection = () => {
    let rowsToShow = [];
    let sectionTitle = "";

    switch (activeSection) {
      case "basic":
        rowsToShow = basicInfoRows;
        sectionTitle = "환자 기본정보";
        break;
      case "cancer":
        rowsToShow = cancerInfoRows;
        sectionTitle = "암 관련정보";
        break;
      case "contact":
        rowsToShow = contactInfoRows;
        sectionTitle = "연락방법";
        break;
      case "health":
        rowsToShow = healthBehaviorRows;
        sectionTitle = "건강 행동";
        break;
      default:
        rowsToShow = basicInfoRows;
        sectionTitle = "환자 기본정보";
    }

    return (
      <>
        <SectionTitle>{sectionTitle}</SectionTitle>
        <Grid columns={3}>
          {rowsToShow.map((row) => (
            <Field key={row.key}>
              <Label>{row.label}</Label>
              <Value $muted={!row.value || row.value === "정보 없음"}>
                {row.value ?? "정보 없음"}
              </Value>
            </Field>
          ))}
        </Grid>
      </>
    );
  };

  return (
    <Section>
      <ButtonNav>
        <NavButton
          $active={activeSection === "basic"}
          onClick={() => setActiveSection("basic")}
        >
          환자 기본정보
        </NavButton>
        <NavButton
          $active={activeSection === "cancer"}
          onClick={() => setActiveSection("cancer")}
        >
          암 관련정보
        </NavButton>
        <NavButton
          $active={activeSection === "contact"}
          onClick={() => setActiveSection("contact")}
        >
          연락방법
        </NavButton>
        <NavButton
          $active={activeSection === "health"}
          onClick={() => setActiveSection("health")}
        >
          건강 행동
        </NavButton>
      </ButtonNav>
      {renderSection()}
    </Section>
  );
};

export default PatientBasicInfo;

/* ------------------------------------------------------------
 * View Model
 * ------------------------------------------------------------ */

export function buildViewModel({
  patient = {},
  user = {},
  lastSurvey = {},
  lastCounseling = {},
  answers = {},
}) {
  // Helpers ---------------------------------------------------
  const coalesce = (...vals) =>
    vals.find((v) => v !== undefined && v !== null && v !== "") ?? undefined;

  // 중첩 경로에서 값을 가져오는 헬퍼 함수
  const getNested = (obj, path) => {
    if (!obj || typeof obj !== "object") return undefined;
    const parts = path.split(".");
    let val = obj;
    for (const part of parts) {
      if (val && typeof val === "object" && part in val) {
        val = val[part];
      } else {
        return undefined;
      }
    }
    return val !== undefined && val !== null && String(val).trim() !== ""
      ? val
      : undefined;
  };

  const getAns = (alts) => {
    for (const k of alts) {
      // 중첩 경로 지원 (예: "treatment.surgery.has")
      if (k.includes(".")) {
        const parts = k.split(".");
        let val = answers;
        for (const part of parts) {
          if (val && typeof val === "object" && part in val) {
            val = val[part];
          } else {
            val = undefined;
            break;
          }
        }
        if (val !== undefined && val !== null && String(val).trim() !== "")
          return val;
      } else {
        const v = answers?.[k];
        if (v !== undefined && v !== null && String(v).trim() !== "") return v;
      }
    }
    return undefined;
  };

  const toDate = (raw) => {
    try {
      if (!raw) return undefined;
      // Firestore Timestamp
      if (typeof raw?.toDate === "function") return raw.toDate();
      // {seconds, nanoseconds}
      if (typeof raw === "object" && typeof raw.seconds === "number") {
        return new Date(raw.seconds * 1000 + (raw.nanoseconds ?? 0) / 1e6);
      }
      // ISO or locale-ish strings
      const d = new Date(raw);
      return isNaN(d.getTime()) ? undefined : d;
    } catch {
      return undefined;
    }
  };

  const fmtDate = (raw, { mode = "date", fieldType = "yearMonth" } = {}) => {
    if (mode === "datetime") {
      const d = toDate(raw);
      if (!d) return undefined;
      return d.toLocaleString();
    }

    // 생년월일은 YYYY-MM-DD 형식으로 표시
    if (fieldType === "birthDate") {
      // 이미 YYYY-MM-DD 형식이면 그대로 반환
      if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
        return raw.trim();
      }
      // Date 객체나 Timestamp는 YYYY-MM-DD 형식으로 변환
      const d = toDate(raw);
      if (!d) return undefined;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    }

    // 진단일/수술일은 YYYY-MM 형식만 표시 (기본값)
    // YYYY-MM 형식이면 그대로 반환
    if (typeof raw === "string" && /^\d{4}-\d{2}$/.test(raw.trim())) {
      return raw.trim();
    }

    // YYYY-MM-DD 형식이면 YYYY-MM으로 변환 (진단일/수술일은 년월만 표시)
    if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
      return raw.trim().slice(0, 7); // "YYYY-MM-DD" -> "YYYY-MM"
    }

    // Date 객체나 Timestamp는 YYYY-MM 형식으로 변환 (진단일/수술일)
    const d = toDate(raw);
    if (!d) return undefined;

    // 진단일/수술일은 YYYY-MM 형식만 표시
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  };

  const ageFromBirthDate = (raw) => {
    const d = toDate(raw);
    if (!d) return undefined;
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age >= 0 ? `${age}세` : undefined;
  };

  const yn = (raw) => {
    if (raw === true || raw === "true" || raw === "예" || raw === "yes")
      return "예";
    if (raw === false || raw === "false" || raw === "아니오" || raw === "no")
      return "아니오";
    return undefined;
  };

  const safeText = (raw) => {
    if (raw === undefined || raw === null) return undefined;
    if (typeof raw === "string" && raw.trim() === "") return undefined;
    return String(raw);
  };

  // Source fields --------------------------------------------
  const p = patient ?? {};
  const u = user ?? {};
  const s = lastSurvey ?? {};
  const c = lastCounseling ?? {};

  // Compose values -------------------------------------------
  // 모든 가능한 소스에서 데이터를 가져오도록 포괄적으로 수정
  const name = coalesce(
    p.name,
    u.name,
    u?.profile?.name,
    s?.profile?.name,
    getAns(["name", "이름", "성명", "fullName"])
  );
  const gender = coalesce(
    p.gender,
    u.gender,
    u?.profile?.gender,
    u?.basic?.gender,
    s?.profile?.gender,
    getNested(p, "basic.gender"),
    getNested(p, "profile.gender"),
    getAns(["gender", "성별", "Gender"])
  );
  const birthDate = coalesce(
    p.birthDate,
    u.birthDate,
    u?.profile?.birthDate,
    s?.profile?.birthDate,
    getAns(["birthDate", "생년월일", "dob", "출생일"])
  );
  const diagnosisDate = coalesce(
    p.diagnosisDate,
    u.diagnosisDate,
    u?.profile?.diagnosisDate,
    s?.profile?.diagnosisDate,
    getAns([
      "diagnosisDate",
      "진단일",
      "진단 시기",
      "진단시기",
      "진단연월",
      "진단년월",
    ])
  );
  const maritalStatus = coalesce(
    p.maritalStatus,
    u.maritalStatus,
    u?.profile?.maritalStatus,
    u?.basic?.maritalStatus,
    s?.profile?.maritalStatus,
    getNested(p, "basic.maritalStatus"),
    getNested(p, "profile.maritalStatus"),
    getAns(["maritalStatus", "결혼상태", "결혼 상태", "MaritalStatus"])
  );

  const cancerType = coalesce(
    p.cancerType,
    getNested(p, "diagnosis.cancerType"),
    u.cancerType,
    u?.profile?.cancerType,
    s?.profile?.cancerType,
    getAns(["cancerType", "암 종류", "암종류", "진단암종", "암진단명"])
  );
  const cancerStage = coalesce(
    p.cancerStage,
    getNested(p, "diagnosis.stage"),
    u.cancerStage,
    u?.profile?.cancerStage,
    u?.diagnosis?.stage,
    s?.profile?.cancerStage,
    getNested(u, "diagnosis.stage"),
    getAns(["cancerStage", "암 병기", "암병기", "stage", "Stage"])
  );

  const hasRecurrence = coalesce(
    yn(p.hasRecurrence),
    safeText(p.hasRecurrence),
    yn(getNested(p, "recurrence")),
    safeText(getNested(p, "recurrence")),
    yn(u.hasRecurrence),
    safeText(u.hasRecurrence),
    yn(getNested(u, "recurrence")),
    safeText(getNested(u, "recurrence")),
    getAns([
      "hasRecurrence",
      "재발여부",
      "재발 여부",
      "recurrence",
      "Recurrence",
    ])
  );

  const phone = coalesce(
    p.phone,
    u.phone,
    u?.profile?.phone,
    s?.profile?.phone,
    getAns(["연락처", "전화번호", "phone", "phoneNumber", "휴대폰"])
  );
  const contactMethod = coalesce(
    p.contactMethod,
    u.contactMethod,
    u?.profile?.contactMethod,
    s?.profile?.contactMethod,
    getAns(["연락 방법", "상담 방식", "method", "contactMethod", "연락방법"])
  );
  const contactTime = coalesce(
    p.contactTime,
    u.contactTime,
    u?.profile?.contactTime,
    s?.profile?.contactTime,
    getAns([
      "연락 가능 시간",
      "availableTime",
      "contactTime",
      "연락가능시간",
      "상담 가능 시간",
    ])
  );

  const hasSurgery = coalesce(
    yn(p.hasSurgery),
    safeText(p.hasSurgery),
    yn(getNested(p, "treatment.hasSurgery")),
    safeText(getNested(p, "treatment.hasSurgery")),
    yn(getNested(p, "treatment.surgery.has")),
    safeText(getNested(p, "treatment.surgery.has")),
    yn(u.hasSurgery),
    safeText(u.hasSurgery),
    yn(getNested(u, "treatment.hasSurgery")),
    safeText(getNested(u, "treatment.hasSurgery")),
    yn(getNested(u, "treatment.surgery.has")),
    safeText(getNested(u, "treatment.surgery.has")),
    getAns([
      "수술여부",
      "수술 여부",
      "hasSurgery",
      "treatment.hasSurgery",
      "treatment.surgery.has",
      "Surgery",
    ])
  );
  const surgeryDate = coalesce(
    p.surgeryDate,
    getNested(p, "treatment.surgery.date"),
    (() => {
      const y = getNested(p, "treatment.surgery.year");
      const m = getNested(p, "treatment.surgery.month");
      if (y && m) return `${y}-${String(m).padStart(2, "0")}`;
      return undefined;
    })(),
    (() => {
      const y = getNested(u, "treatment.surgery.year");
      const m = getNested(u, "treatment.surgery.month");
      if (y && m) return `${y}-${String(m).padStart(2, "0")}`;
      return undefined;
    })(),
    u.surgeryDate,
    u?.profile?.surgeryDate,
    getNested(u, "treatment.surgery.date"),
    s?.profile?.surgeryDate,
    getAns([
      "수술일",
      "수술 날짜",
      "surgeryDate",
      "treatment.surgery.date",
      "SurgeryDate",
    ])
  );

  const otherCancerDiagnosis = coalesce(
    yn(p.otherCancerDiagnosis),
    safeText(p.otherCancerDiagnosis),
    yn(getNested(p, "otherCancer.hasOther")),
    safeText(getNested(p, "otherCancer.hasOther")),
    yn(u.otherCancerDiagnosis),
    safeText(u.otherCancerDiagnosis),
    u?.profile?.otherCancerDiagnosis,
    getAns([
      "다른암진단여부",
      "다른 암 진단 여부",
      "otherCancerDiagnosis",
      "diagnosis.otherCancerDiagnosis",
      "otherCancer.hasOther",
    ])
  );
  const otherCancerType = coalesce(
    p.otherCancerType,
    getNested(p, "otherCancer.type"),
    u.otherCancerType,
    u?.profile?.otherCancerType,
    getAns([
      "다른 암 종류",
      "다른암종류",
      "otherCancerType",
      "diagnosis.otherCancerType",
    ])
  );
  const otherCancerDetails = coalesce(
    p.otherCancerDetails,
    getNested(p, "otherCancer.details"),
    u.otherCancerDetails,
    u?.profile?.otherCancerDetails,
    getAns([
      "다른 암 상세 정보",
      "다른암상세정보",
      "otherCancerDetails",
      "diagnosis.otherCancerDetails",
      "otherCancer.details",
    ])
  );

  // 다른 암 표시 규칙
  const otherCancerDisplay = (() => {
    const ynVal = yn(otherCancerDiagnosis) ?? safeText(otherCancerDiagnosis);
    if (ynVal === "아니오" || ynVal === undefined) return "X";
    // 예인 경우 입력값(상세/종류) 우선 표시
    const txt = safeText(coalesce(otherCancerDetails, otherCancerType));
    return txt ?? "정보 없음";
  })();

  const mentalHealthHistory = coalesce(
    yn(p.mentalHealthHistory),
    safeText(p.mentalHealthHistory),
    yn(getNested(p, "mentalHealth.history")),
    safeText(getNested(p, "mentalHealth.history")),
    yn(u.mentalHealthHistory),
    safeText(u.mentalHealthHistory),
    yn(getNested(u, "mentalHealth.history")),
    safeText(getNested(u, "mentalHealth.history")),
    u?.profile?.mentalHealthHistory,
    getAns([
      "정신건강력",
      "정신 건강력",
      "mentalHealthHistory",
      "mentalHealth.history",
      "정신건강 이력",
    ])
  );
  // 정신건강 진단명을 한글로 변환하는 함수
  const translateMentalDx = (value) => {
    if (!value) return value;
    const str = String(value).toLowerCase().trim();
    if (str === "depression" || str === "우울증") return "우울증";
    if (str === "anxietydisorder" || str === "anxiety" || str === "불안장애")
      return "불안장애";
    if (str === "schizophrenia" || str === "조현병") return "조현병";
    if (str === "other" || str === "기타") return "기타";
    return value; // 이미 한글이거나 다른 값이면 그대로 반환
  };

  // 정신과적 진단명: 설문에서 복수선택 가능 (answers.mentalHealthDiagnoses)
  const mentalDxListRaw = getAns([
    "mentalHealthDiagnoses",
    "mentalHealth.diagnoses",
  ]);
  const mentalDxFromList = Array.isArray(mentalDxListRaw)
    ? mentalDxListRaw.filter(Boolean).map(translateMentalDx).join(", ")
    : typeof mentalDxListRaw === "object" && mentalDxListRaw
    ? Object.values(mentalDxListRaw)
        .filter(Boolean)
        .map(translateMentalDx)
        .join(", ")
    : undefined;

  // patient 객체의 중첩 구조에서 진단명 추출
  const mentalDxFromPatient = (() => {
    const diagnosesObj = getNested(p, "mentalHealth.diagnoses");
    if (!diagnosesObj || typeof diagnosesObj !== "object") return undefined;
    const arr = [];
    if (diagnosesObj.depression) arr.push("우울증");
    if (diagnosesObj.anxietyDisorder) arr.push("불안장애");
    if (diagnosesObj.schizophrenia) arr.push("조현병");
    if (diagnosesObj.other) {
      const otherName = getNested(p, "mentalHealth.otherName") ?? "";
      arr.push(otherName || "기타");
    }
    return arr.length > 0 ? arr.join(", ") : undefined;
  })();

  // user 객체의 중첩 구조에서 진단명 추출
  const mentalDxFromUser = (() => {
    const diagnosesObj = getNested(u, "mentalHealth.diagnoses");
    if (!diagnosesObj || typeof diagnosesObj !== "object") return undefined;
    const arr = [];
    if (diagnosesObj.depression) arr.push("우울증");
    if (diagnosesObj.anxietyDisorder) arr.push("불안장애");
    if (diagnosesObj.schizophrenia) arr.push("조현병");
    if (diagnosesObj.other) {
      const otherName = getNested(u, "mentalHealth.otherName") ?? "";
      arr.push(otherName || "기타");
    }
    return arr.length > 0 ? arr.join(", ") : undefined;
  })();

  // 정신건강 진단명 텍스트 수집 및 한글 변환
  const mentalDxTextRaw = coalesce(
    mentalDxFromList,
    mentalDxFromPatient,
    mentalDxFromUser,
    p.mentalHealthDiagnoses,
    p.mentalHealthDiagnosesText,
    p.otherMentalDiagnosis,
    getNested(p, "mentalHealth.otherName"),
    u.mentalHealthDiagnoses,
    u.mentalHealthDiagnosesText,
    u.otherMentalDiagnosis,
    getNested(u, "mentalHealth.otherName"),
    u?.profile?.mentalHealthDiagnosesText,
    getAns([
      "정신건강 진단명",
      "정신 건강 진단명",
      "mentalHealthDiagnosesText",
      "mentalHealth.diagnoses.text",
      "mentalHealth.otherName",
      "otherMentalDiagnosis",
    ])
  );

  // 최종 텍스트를 한글로 변환 (쉼표로 구분된 여러 진단명 처리)
  const mentalDxText = mentalDxTextRaw
    ? String(mentalDxTextRaw)
        .split(",")
        .map((item) => translateMentalDx(item.trim()))
        .join(", ")
    : "없음";

  // 절주/금연 여부 및 구체적 내용 표시
  // lifestyle 객체에서 구체적인 내용을 읽어옴
  const getNestedValue = (obj, path) => {
    if (!obj || typeof obj !== "object") return undefined;
    const parts = path.split(".");
    let val = obj;
    for (const part of parts) {
      if (val && typeof val === "object" && part in val) {
        val = val[part];
      } else {
        return undefined;
      }
    }
    return val !== undefined && val !== null && String(val).trim() !== ""
      ? val
      : undefined;
  };

  // 절주 관련 데이터 수집 (더 많은 소스 확인)
  const alcoholChoiceRaw = coalesce(
    p.alcoholAbstinence,
    u.alcoholAbstinence,
    u?.profile?.alcoholAbstinence,
    getNested(p, "lifestyle.alcohol.tried") ? "예" : undefined,
    getNested(u, "lifestyle.alcohol.tried") ? "예" : undefined,
    getAns([
      "alcoholAbstinence",
      "절주여부",
      "절주 여부",
      "q32",
      "alcoholReduction",
    ])
  );

  // lifestyle.alcohol.current에서 구체적 내용 가져오기 (여러 소스 확인)
  const alcoholCurrentFromP = getNestedValue(p, "lifestyle.alcohol.current");
  const alcoholCurrentFromU = getNestedValue(u, "lifestyle.alcohol.current");
  const alcoholCurrentFromAns = getAns(["lifestyle.alcohol.current"]);
  const alcoholCurrent =
    alcoholCurrentFromP || alcoholCurrentFromU || alcoholCurrentFromAns;

  // answers에서 직접 가져오기 (fallback, 여러 키 확인)
  const alcoholSoju = coalesce(
    alcoholCurrent?.soju,
    getAns([
      "currentAlcoholSoju",
      "lifestyle.alcohol.current.soju",
      "alcoholSoju",
    ])
  );
  const alcoholBeer = coalesce(
    alcoholCurrent?.beer,
    getAns([
      "currentAlcoholBeer",
      "lifestyle.alcohol.current.beer",
      "alcoholBeer",
    ])
  );
  const alcoholOther = coalesce(
    alcoholCurrent?.other,
    getAns([
      "currentAlcoholOther",
      "lifestyle.alcohol.current.other",
      "alcoholOther",
    ])
  );

  // 절주 실패 이유 수집
  const alcoholBarriersFromP = getNestedValue(p, "lifestyle.alcohol.barriers");
  const alcoholBarriersFromU = getNestedValue(u, "lifestyle.alcohol.barriers");
  const alcoholBarriersFromAns = getAns([
    "alcoholReductionBarriers",
    "lifestyle.alcohol.barriers",
  ]);
  const alcoholBarriers = Array.isArray(alcoholBarriersFromP)
    ? alcoholBarriersFromP
    : Array.isArray(alcoholBarriersFromU)
    ? alcoholBarriersFromU
    : Array.isArray(alcoholBarriersFromAns)
    ? alcoholBarriersFromAns
    : [];

  const alcoholDisplay = (() => {
    const choice = safeText(alcoholChoiceRaw);
    if (!choice || choice === "정보 없음") return "정보 없음";
    if (choice === "해당없음") return "해당없음";

    const ynText = yn(choice) ?? choice;
    const lines = [ynText];

    // 현재 음주량 표시
    const currentParts = [];
    if (alcoholSoju && String(alcoholSoju).trim() !== "")
      currentParts.push(`소주: ${alcoholSoju}`);
    if (alcoholBeer && String(alcoholBeer).trim() !== "")
      currentParts.push(`맥주: ${alcoholBeer}`);
    if (alcoholOther && String(alcoholOther).trim() !== "")
      currentParts.push(`기타: ${alcoholOther}`);

    if (currentParts.length > 0) {
      lines.push(`현재 음주량: ${currentParts.join(", ")}`);
    }

    // 실패 이유 표시
    if (alcoholBarriers.length > 0) {
      const barrierLabels = alcoholBarriers.map((b) => {
        const barrier = String(b).trim();
        // 한글 라벨로 변환
        if (barrier.includes("스트레스")) return "스트레스";
        if (barrier.includes("사교") || barrier.includes("모임"))
          return "사교 모임";
        if (barrier.includes("습관")) return "습관";
        if (barrier.includes("의지력")) return "의지력 부족";
        if (barrier.includes("환경")) return "환경적 요인";
        return barrier;
      });
      lines.push(`실패 이유: ${barrierLabels.join(", ")}`);
    }

    return lines.join("\n");
  })();

  // 금연 관련 데이터 수집 (더 많은 소스 확인)
  const smokingChoiceRaw = coalesce(
    p.smokingCessation,
    u.smokingCessation,
    u?.profile?.smokingCessation,
    getNested(p, "lifestyle.smoking.tried") ? "예" : undefined,
    getNested(u, "lifestyle.smoking.tried") ? "예" : undefined,
    getAns(["smokingCessation", "금연여부", "금연 여부", "q33"])
  );

  // lifestyle.smoking.current에서 구체적 내용 가져오기 (여러 소스 확인)
  const smokingCurrentFromP = getNestedValue(p, "lifestyle.smoking.current");
  const smokingCurrentFromU = getNestedValue(u, "lifestyle.smoking.current");
  const smokingCurrentFromAns = getAns(["lifestyle.smoking.current"]);
  const smokingCurrent =
    smokingCurrentFromP || smokingCurrentFromU || smokingCurrentFromAns;

  // answers에서 직접 가져오기 (fallback, 여러 키 확인)
  const smokingRegular = coalesce(
    smokingCurrent?.regular,
    getAns([
      "currentSmokingRegular",
      "lifestyle.smoking.current.regular",
      "smokingRegular",
    ])
  );
  const smokingElectronic = coalesce(
    smokingCurrent?.electronic,
    getAns([
      "currentSmokingEletronic",
      "currentSmokingElectronic",
      "lifestyle.smoking.current.electronic",
      "smokingElectronic",
    ])
  );
  const smokingOther = coalesce(
    smokingCurrent?.other,
    getAns([
      "currentSmokingOther",
      "lifestyle.smoking.current.other",
      "smokingOther",
    ])
  );

  // 금연 실패 이유 수집
  const smokingBarriersFromP = getNestedValue(p, "lifestyle.smoking.barriers");
  const smokingBarriersFromU = getNestedValue(u, "lifestyle.smoking.barriers");
  const smokingBarriersFromAns = getAns([
    "smokingCessationBarriers",
    "lifestyle.smoking.barriers",
  ]);
  const smokingBarriers = Array.isArray(smokingBarriersFromP)
    ? smokingBarriersFromP
    : Array.isArray(smokingBarriersFromU)
    ? smokingBarriersFromU
    : Array.isArray(smokingBarriersFromAns)
    ? smokingBarriersFromAns
    : [];

  const smokingDisplay = (() => {
    const choice = safeText(smokingChoiceRaw);
    if (!choice || choice === "정보 없음") return "정보 없음";
    if (choice === "해당없음") return "해당없음";

    const ynText = yn(choice) ?? choice;
    const lines = [ynText];

    // 현재 흡연량 표시
    const currentParts = [];
    if (smokingRegular && String(smokingRegular).trim() !== "")
      currentParts.push(`일반담배: ${smokingRegular}`);
    if (smokingElectronic && String(smokingElectronic).trim() !== "")
      currentParts.push(`전자담배: ${smokingElectronic}`);
    if (smokingOther && String(smokingOther).trim() !== "")
      currentParts.push(`기타: ${smokingOther}`);

    if (currentParts.length > 0) {
      lines.push(`현재 흡연량: ${currentParts.join(", ")}`);
    }

    // 실패 이유 표시
    if (smokingBarriers.length > 0) {
      const barrierLabels = smokingBarriers.map((b) => {
        const barrier = String(b).trim();
        // 한글 라벨로 변환
        if (barrier.includes("스트레스")) return "스트레스";
        if (barrier.includes("습관")) return "습관";
        if (barrier.includes("금단") || barrier.includes("증상"))
          return "금단증상";
        if (barrier.includes("의지력")) return "의지력 부족";
        if (barrier.includes("환경")) return "환경적 요인";
        return barrier;
      });
      lines.push(`실패 이유: ${barrierLabels.join(", ")}`);
    }

    return lines.join("\n");
  })();

  const rows = [
    { key: "name", label: "이름", value: safeText(name) },
    { key: "gender", label: "성별", value: safeText(gender) },
    {
      key: "birthDate",
      label: "생년월일",
      value: fmtDate(birthDate, { fieldType: "birthDate" }),
    },

    { key: "age", label: "나이", value: ageFromBirthDate(birthDate) },

    {
      key: "maritalStatus",
      label: "결혼 상태",
      value: safeText(maritalStatus),
    },
    { key: "cancerType", label: "암 종류", value: safeText(cancerType) },
    { key: "cancerStage", label: "암 병기", value: safeText(cancerStage) },
    { key: "diagnosisDate", label: "진단일", value: fmtDate(diagnosisDate) },

    {
      key: "hasRecurrence",
      label: "재발 여부",
      value: safeText(hasRecurrence),
    },

    { key: "phone", label: "연락처", value: safeText(phone) },
    {
      key: "contactMethod",
      label: "연락 방법",
      value: safeText(contactMethod),
    },
    {
      key: "contactTime",
      label: "연락 가능 시간",
      value: safeText(contactTime),
    },

    { key: "hasSurgery", label: "수술 여부", value: safeText(hasSurgery) },
    { key: "surgeryDate", label: "수술일", value: fmtDate(surgeryDate) },

    {
      key: "otherCancerDiagnosis",
      label: "다른 암 진단 여부",
      value: safeText(otherCancerDiagnosis),
    },
    {
      key: "otherCancerType",
      label: "다른 암 종류",
      value: safeText(otherCancerDisplay),
    },

    {
      key: "mentalHistory",
      label: "정신 건강력",
      value: safeText(mentalHealthHistory),
    },
    {
      key: "mentalDx",
      label: "정신건강 진단명",
      value: safeText(mentalDxText),
    },

    {
      key: "alcoholAbstinence",
      label: "절주 여부",
      value: safeText(alcoholDisplay),
    },
    {
      key: "smokingCessation",
      label: "금연 여부",
      value: safeText(smokingDisplay),
    },
    {
      key: "lastSurveyAt",
      label: "최근 설문일",
      value: fmtDate(
        coalesce(
          p.lastSurveyAt,
          u.lastSurveyAt,
          u.lastSurveyCompletedAt,
          s?.createdAt,
          s?.updatedAt
        ),
        {
          mode: "datetime",
        }
      ),
    },
    {
      key: "lastCounselingAt",
      label: "최근 상담요청일",
      value: fmtDate(
        coalesce(
          p.lastCounselingRequestAt,
          p.lastCounselingAt,
          u.lastCounselingRequestAt,
          c?.createdAt,
          c?.updatedAt
        ),
        {
          mode: "datetime",
        }
      ),
    },
  ].map((r) => ({ ...r, value: r.value ?? "정보 없음" }));

  // Risk badge (우선순위: users.lastOverallRiskGroup -> users.overallRiskGroup -> patients.riskLevel)
  const riskTextRaw = safeText(
    coalesce(u.lastOverallRiskGroup, u.overallRiskGroup, p.riskLevel)
  );
  const riskLevel = normalizeRiskLevel(riskTextRaw);
  const riskTextKo =
    riskLevel === "high"
      ? "위험"
      : riskLevel === "medium"
      ? "주의"
      : riskLevel === "low"
      ? "양호"
      : undefined;
  const riskBadge = riskLevel
    ? { text: riskTextKo, level: riskLevel }
    : undefined;

  return { rows, riskBadge };
}

function normalizeRiskLevel(text) {
  if (!text) return undefined;
  const t = String(text).toLowerCase();
  if (["high", "고위험", "고위험집단", "위험"].some((k) => t.includes(k)))
    return "high";
  if (["medium", "중위험", "중위험집단", "주의"].some((k) => t.includes(k)))
    return "medium";
  if (["low", "저위험", "저위험집단", "양호"].some((k) => t.includes(k)))
    return "low";
  return undefined;
}

/* ------------------------------------------------------------
 * Styles (low-risk, minimal)
 * ------------------------------------------------------------ */
const Section = styled.section``;

const ButtonNav = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const NavButton = styled.button`
  padding: 10px 20px;
  border: 2px solid ${(p) => (p.$active ? "#1976d2" : "#e0e0e0")};
  background-color: ${(p) => (p.$active ? "#1976d2" : "#ffffff")};
  color: ${(p) => (p.$active ? "#ffffff" : "#333333")};
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: ${(p) => (p.$active ? "600" : "500")};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${(p) => (p.$active ? "#1565c0" : "#f5f5f5")};
    border-color: ${(p) => (p.$active ? "#1565c0" : "#bdbdbd")};
  }

  &:active {
    transform: scale(0.98);
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 0 16px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(${(p) => p.columns || 3}, minmax(0, 1fr));
  gap: 12px 24px;
`;

const Field = styled.div`
  min-height: 54px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
`;

const Label = styled.div`
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 6px;
`;

const Value = styled.div`
  font-size: 1rem;
  color: ${(p) => (p.$muted ? "rgba(0,0,0,0.45)" : "#111")};
  white-space: pre-line;
  line-height: 1.6;
`;
