// web2/src/models/patientProfile.js

// 화면 표시 라벨
export const PROFILE_LABELS = {
  name: "이름",
  gender: "성별",
  birthDate: "생년월일",
  age: "나이",
  maritalStatus: "결혼 상태",

  cancerType: "암 종류",
  cancerStage: "암 병기",
  diagnosisDate: "진단일",
  hasRecurrence: "재발 여부",
  hasSurgery: "수술 여부",
  surgeryDate: "수술일",

  otherCancerDiagnosis: "다른 암 진단 여부",
  otherCancerType: "다른 암 종류",
  otherCancerDetails: "다른 암 상세 정보",

  phone: "연락처",
  contactMethod: "연락 방법",
  contactTime: "연락 가능 시간",

  mentalHealthHistory: "정신건강력",
  mentalHealthDiagnosesText: "정신건강 진단명",

  alcohol: "절주 여부",
  smoking: "금연 여부",

  lastSurveyAt: "최근 설문일",
  lastCounselingRequestAt: "최근 상담요청일",
  riskBadge: "위험도",
};

// 화면/저장에 사용할 표준 키(= users 문서의 필드 이름)
export const PROFILE_KEYS = [
  "name",
  "gender",
  "birthDate",
  "age",
  "maritalStatus",

  "cancerType",
  "cancerStage",
  "diagnosisDate",
  "hasRecurrence",
  "hasSurgery",
  "surgeryDate",

  "otherCancerDiagnosis",
  "otherCancerType",
  "otherCancerDetails",

  "phone",
  "contactMethod",
  "contactTime",

  "mentalHealthHistory",
  "mentalHealthDiagnosesText",

  "alcohol",
  "smoking",

  "lastSurveyAt",
  "lastCounselingRequestAt",
  "riskBadge",
];

// 설문에서 끌어올 때 사용할 “원본 키 후보들” (Korean/영문 혼재 대비)
export const SURVEY_KEY_SOURCES = {
  name: ["name", "이름", "profile.name"],
  gender: ["gender", "성별", "profile.gender"],
  birthDate: ["birthDate", "생년월일", "profile.birthDate"],
  maritalStatus: [
    "maritalStatus",
    "결혼상태",
    "결혼 상태",
    "profile.maritalStatus",
  ],

  cancerType: ["cancerType", "암종류", "암 종류", "profile.cancerType"],
  cancerStage: ["cancerStage", "암병기", "암 병기", "profile.cancerStage"],
  diagnosisDate: ["diagnosisDate", "진단일", "profile.diagnosisDate"],
  hasRecurrence: [
    "hasRecurrence",
    "재발여부",
    "재발 여부",
    "profile.hasRecurrence",
  ],
  hasSurgery: ["hasSurgery", "수술여부", "수술 여부", "profile.hasSurgery"],
  surgeryDate: ["surgeryDate", "수술일", "profile.surgeryDate"],

  otherCancerDiagnosis: [
    "otherCancerDiagnosis",
    "다른암진단여부",
    "다른 암 진단여부",
    "profile.otherCancerDiagnosis",
  ],
  otherCancerType: [
    "otherCancerType",
    "다른암종류",
    "다른 암 종류",
    "profile.otherCancerType",
  ],
  otherCancerDetails: [
    "otherCancerDetails",
    "다른암상세",
    "다른 암 상세 정보",
    "profile.otherCancerDetails",
  ],

  phone: ["phone", "연락처", "profile.phone"],
  contactMethod: [
    "contactMethod",
    "연락방법",
    "연락 방법",
    "profile.contactMethod",
  ],
  contactTime: [
    "contactTime",
    "연락가능시간",
    "연락 가능 시간",
    "profile.contactTime",
  ],

  mentalHealthHistory: [
    "mentalHealthHistory",
    "정신건강력",
    "profile.mentalHealthHistory",
  ],
  mentalHealthDiagnosesText: [
    "mentalHealthDiagnosesText",
    "정신건강진단명",
    "정신건강 진단명",
    "profile.mentalHealthDiagnosesText",
  ],

  alcohol: ["alcohol", "절주여부", "절주 여부", "profile.alcohol"],
  smoking: ["smoking", "금연여부", "금연 여부", "profile.smoking"],

  lastSurveyAt: ["lastSurveyAt", "createdAt"],
  lastCounselingRequestAt: ["lastCounselingRequestAt"],
  riskBadge: ["overallRiskGroup", "riskBadge"],
};
