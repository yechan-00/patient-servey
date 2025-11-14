# Web2 대시보드 통합 가이드

## 📋 개요

web1(생존자 설문)과 web3(환자 설문) 데이터를 web2 대시보드에서 통합 조회하는 기능입니다.

**⚠️ 중요: 기존 web1/web2 코드는 전혀 수정하지 않았습니다.**

- 기존 `FirebaseUtils.js`는 그대로 유지
- 기존 `DashboardPage.js`는 그대로 동작
- 새로운 통합 기능만 별도 파일로 추가

---

## 🔒 안전성 보장

### 1. 완전 분리된 파일 구조

```
web2/src/utils/
├── FirebaseUtils.js          ← 기존 파일 (수정 없음)
├── IntegratedFirebaseUtils.js ← 새 파일 (통합 기능만)
└── collectionConfig.js        ← 새 파일 (컬렉션 상수)
```

### 2. 기존 코드 영향 없음

- ✅ `FirebaseUtils.js`의 모든 함수는 그대로 동작
- ✅ `DashboardPage.js`의 기존 로직은 그대로 동작
- ✅ web1은 영향 없음 (컬렉션 이름 변경 없음)
- ✅ web3는 영향 없음 (이미 분리 완료)

### 3. 점진적 통합 가능

- 기본값: 기존 동작 유지 (생존자만 조회)
- 옵션 활성화: 통합 조회 가능
- 언제든 롤백 가능

---

## 📁 파일 구조

### `collectionConfig.js`

컬렉션 이름 상수 정의

```javascript
export const COLLECTIONS = {
  SURVIVORS: {
    USERS: "users",
    PATIENTS: "patients",
    // ...
  },
  PATIENTS: {
    USERS: "patients_users",
    PATIENTS: "patients_patients",
    // ...
  },
};
```

### `IntegratedFirebaseUtils.js`

통합 조회 함수들

- `getIntegratedPatients()` - 생존자 + 환자 조회
- `subscribeIntegratedPatients()` - 실시간 구독
- `getIntegratedCounselingRequests()` - 상담 요청 조회
- `calculateIntegratedStats()` - 통계 계산
- `getIntegratedPatientDetail()` - 상세 정보 (타입 자동 감지)

---

## 🚀 사용 방법

### 기본 사용 (생존자만 - 기존 동작)

```javascript
// 기존 코드 그대로 사용
import { getPatientsLite } from "../utils/FirebaseUtils";
const patients = await getPatientsLite({ includeArchived: false });
```

### 통합 사용 (생존자 + 환자)

```javascript
// 새 통합 함수 사용
import {
  getIntegratedPatients,
  SURVEY_TYPES,
} from "../utils/IntegratedFirebaseUtils";

// 전체 조회
const allPatients = await getIntegratedPatients({
  surveyType: SURVEY_TYPES.ALL,
  includeArchived: false,
});

// 생존자만
const survivors = await getIntegratedPatients({
  surveyType: SURVEY_TYPES.SURVIVOR,
});

// 환자만
const patients = await getIntegratedPatients({
  surveyType: SURVEY_TYPES.PATIENT,
});
```

### 실시간 구독

```javascript
import {
  subscribeIntegratedPatients,
  SURVEY_TYPES,
} from "../utils/IntegratedFirebaseUtils";

const unsubscribe = subscribeIntegratedPatients(
  { surveyType: SURVEY_TYPES.ALL, showArchived: false },
  (patients) => {
    console.log("통합 환자 목록:", patients);
    // patients 배열에는 type 필드가 포함됨
    // { id, name, ..., type: "survivor" | "patient" }
  }
);

// 구독 해제
unsubscribe();
```

### 통계 계산

```javascript
import {
  getIntegratedPatients,
  calculateIntegratedStats,
  SURVEY_TYPES,
} from "../utils/IntegratedFirebaseUtils";

const allPatients = await getIntegratedPatients({
  surveyType: SURVEY_TYPES.ALL,
});

const stats = calculateIntegratedStats(allPatients);
// {
//   all: { total, highRisk, mediumRisk, lowRisk, pendingRequests },
//   survivors: { ... },
//   patients: { ... }
// }
```

### 환자 상세 조회 (타입 자동 감지)

```javascript
import { getIntegratedPatientDetail } from "../utils/IntegratedFirebaseUtils";

const result = await getIntegratedPatientDetail(patientId);
if (result) {
  console.log("타입:", result.type); // "survivor" | "patient"
  console.log("데이터:", result.data);
  console.log("ID:", result.id);
}
```

---

## 🔄 통합 대시보드 구현 예시

### 옵션 1: 탭으로 구분

```javascript
const [activeTab, setActiveTab] = useState("all"); // "all" | "survivor" | "patient"

const patients = await getIntegratedPatients({
  surveyType:
    activeTab === "all"
      ? SURVEY_TYPES.ALL
      : activeTab === "survivor"
      ? SURVEY_TYPES.SURVIVOR
      : SURVEY_TYPES.PATIENT,
});
```

### 옵션 2: 필터로 구분

```javascript
const [surveyTypeFilter, setSurveyTypeFilter] = useState(SURVEY_TYPES.ALL);

const allPatients = await getIntegratedPatients({
  surveyType: SURVEY_TYPES.ALL,
});

const filtered =
  surveyTypeFilter === SURVEY_TYPES.ALL
    ? allPatients
    : allPatients.filter((p) => p.type === surveyTypeFilter);
```

### 옵션 3: 통합 표시 + 배지

```javascript
const allPatients = await getIntegratedPatients({
  surveyType: SURVEY_TYPES.ALL,
});

// UI에서 타입별로 배지 표시
{
  allPatients.map((patient) => (
    <div key={patient.id}>
      {patient.name}
      <Badge>{patient.type === "survivor" ? "생존자" : "환자"}</Badge>
    </div>
  ));
}
```

---

## ⚠️ 주의사항

### 1. ID 충돌 가능성

같은 이름+생년월일로 생성된 ID가 다를 수 있습니다.

- 해결: `type` 필드로 구분
- 각 환자는 `{ id, type, ... }` 형태로 반환됨

### 2. 데이터 구조 차이

설문 항목/점수 체계가 다를 수 있습니다.

- 생존자: web1 설문 구조
- 환자: web3 설문 구조
- 상세 페이지에서 타입별로 다른 컴포넌트 렌더링 필요

### 3. 성능

두 컬렉션을 병렬 조회하므로:

- 네트워크 요청 2배 증가
- 필요시 페이지네이션 적용 권장

---

## 🧪 테스트 방법

### 1. 기존 기능 테스트

```javascript
// 기존 함수가 정상 동작하는지 확인
import { getPatientsLite } from "../utils/FirebaseUtils";
const survivors = await getPatientsLite();
console.log("생존자:", survivors.length);
```

### 2. 통합 기능 테스트

```javascript
// 통합 함수 테스트
import {
  getIntegratedPatients,
  SURVEY_TYPES,
} from "../utils/IntegratedFirebaseUtils";

// 전체
const all = await getIntegratedPatients({ surveyType: SURVEY_TYPES.ALL });
console.log("전체:", all.length);

// 생존자만
const survivors = await getIntegratedPatients({
  surveyType: SURVEY_TYPES.SURVIVOR,
});
console.log("생존자:", survivors.length);

// 환자만
const patients = await getIntegratedPatients({
  surveyType: SURVEY_TYPES.PATIENT,
});
console.log("환자:", patients.length);
```

---

## 📝 다음 단계

1. ✅ 컬렉션 분리 설정 완료
2. ✅ 통합 유틸 함수 생성 완료
3. ⏳ DashboardPage에 통합 옵션 추가 (선택적)
4. ⏳ 환자 상세 페이지 통합 (선택적)
5. ⏳ 테스트 및 검증

---

## 🔍 검증 체크리스트

- [ ] 기존 `getPatientsLite()` 정상 동작
- [ ] 기존 `DashboardPage` 정상 동작
- [ ] `getIntegratedPatients()` 정상 동작
- [ ] 생존자 데이터 조회 확인
- [ ] 환자 데이터 조회 확인
- [ ] 통계 계산 정확성 확인
- [ ] 실시간 구독 정상 동작

---

**작성일**: 2024년
**상태**: ✅ 안전하게 분리 완료
