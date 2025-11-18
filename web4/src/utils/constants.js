// 공통 상수 정의

export const CATEGORIES = [
  { id: "all", name: "전체" },
  { id: "free", name: "자유게시판" },
  { id: "question", name: "질문게시판" },
  { id: "review", name: "후기게시판" },
  { id: "info", name: "정보공유" },
  { id: "support", name: "지원 요청" },
];

export const CATEGORY_LABELS = {
  free: "자유게시판",
  question: "질문게시판",
  review: "후기게시판",
  info: "정보공유",
  support: "지원 요청",
};

export const CANCER_TYPES = [
  { id: "all", name: "전체" },
  { id: "breast", name: "유방암" },
  { id: "lung", name: "폐암" },
  { id: "stomach", name: "위암" },
  { id: "colon", name: "대장암" },
  { id: "liver", name: "간암" },
  { id: "thyroid", name: "갑상선암" },
  { id: "prostate", name: "전립선암" },
  { id: "pancreas", name: "췌장암" },
  { id: "ovary", name: "난소암" },
  { id: "cervical", name: "자궁경부암" },
  { id: "blood", name: "혈액암" },
  { id: "brain", name: "뇌종양" },
  { id: "other", name: "기타" },
];

export const CANCER_TYPE_LABELS = {
  breast: "유방암",
  lung: "폐암",
  stomach: "위암",
  colon: "대장암",
  liver: "간암",
  thyroid: "갑상선암",
  prostate: "전립선암",
  pancreas: "췌장암",
  ovary: "난소암",
  cervical: "자궁경부암",
  blood: "혈액암",
  brain: "뇌종양",
  other: "기타",
};

export const TREATMENT_STAGES = [
  { id: "", name: "선택 안 함" },
  { id: "diagnosis", name: "진단 초기" },
  { id: "treatment", name: "치료 중" },
  { id: "completed", name: "치료 완료" },
  { id: "followup", name: "추적 관찰 중" },
];

export const REPORT_REASONS = {
  spam: "스팸 또는 광고",
  inappropriate: "부적절한 내용",
  harassment: "욕설 또는 괴롭힘",
  false_info: "잘못된 의료 정보",
  other: "기타",
};

export const REPORT_STATUS_LABELS = {
  pending: "대기 중",
  reviewed: "검토 중",
  resolved: "처리 완료",
  rejected: "기각",
};

export const NOTIFICATION_TYPES = {
  comment: "댓글",
  like: "좋아요",
  reply: "답글",
};

export const SORT_OPTIONS = {
  latest: "최신순",
  popular: "인기순",
  comments: "댓글순",
  views: "조회순",
};

// 후기 게시판 필드
export const TREATMENT_METHODS = [
  { id: "surgery", name: "수술" },
  { id: "chemotherapy", name: "항암치료" },
  { id: "radiation", name: "방사선치료" },
  { id: "immunotherapy", name: "면역치료" },
  { id: "hormone", name: "호르몬치료" },
  { id: "targeted", name: "표적치료" },
  { id: "other", name: "기타" },
];

export const TREATMENT_RESULTS = [
  { id: "cured", name: "완치" },
  { id: "partial", name: "부분완화" },
  { id: "ongoing", name: "치료 진행 중" },
  { id: "stable", name: "안정" },
  { id: "other", name: "기타" },
];

export const SIDE_EFFECTS = [
  { id: "nausea", name: "구토/메스꺼움" },
  { id: "fatigue", name: "피로감" },
  { id: "hair_loss", name: "탈모" },
  { id: "pain", name: "통증" },
  { id: "skin", name: "피부 반응" },
  { id: "digestive", name: "소화기 문제" },
  { id: "immune", name: "면역력 저하" },
  { id: "mental", name: "우울/불안" },
  { id: "other", name: "기타" },
];

export const SATISFACTION_LEVELS = [
  { id: "5", name: "매우 만족" },
  { id: "4", name: "만족" },
  { id: "3", name: "보통" },
  { id: "2", name: "불만족" },
  { id: "1", name: "매우 불만족" },
];

// 정보공유 게시판 필드
export const INFO_TYPES = [
  { id: "hospital", name: "병원 정보" },
  { id: "treatment", name: "치료 정보" },
  { id: "lifestyle", name: "생활 정보" },
  { id: "rehabilitation", name: "재활 정보" },
  { id: "nutrition", name: "영양 정보" },
  { id: "exercise", name: "운동 정보" },
  { id: "support_group", name: "지원 단체" },
  { id: "other", name: "기타" },
];

export const REGIONS = [
  { id: "seoul", name: "서울" },
  { id: "busan", name: "부산" },
  { id: "daegu", name: "대구" },
  { id: "incheon", name: "인천" },
  { id: "gwangju", name: "광주" },
  { id: "daejeon", name: "대전" },
  { id: "ulsan", name: "울산" },
  { id: "sejong", name: "세종" },
  { id: "gyeonggi", name: "경기도" },
  { id: "gangwon", name: "강원도" },
  { id: "chungbuk", name: "충청북도" },
  { id: "chungnam", name: "충청남도" },
  { id: "jeonbuk", name: "전라북도" },
  { id: "jeonnam", name: "전라남도" },
  { id: "gyeongbuk", name: "경상북도" },
  { id: "gyeongnam", name: "경상남도" },
  { id: "jeju", name: "제주도" },
  { id: "overseas", name: "해외" },
];

// 지원 요청 게시판 필드
export const SUPPORT_TYPES = [
  { id: "financial", name: "경제적 지원" },
  { id: "counseling", name: "심리 상담" },
  { id: "information", name: "정보 제공" },
  { id: "hospital_recommend", name: "병원 추천" },
  { id: "daily_help", name: "일상 도움" },
  { id: "transportation", name: "이동 도움" },
  { id: "caregiver", name: "간병 도움" },
  { id: "other", name: "기타" },
];

export const URGENCY_LEVELS = [
  { id: "urgent", name: "긴급" },
  { id: "normal", name: "보통" },
  { id: "low", name: "여유" },
];
