# 대시보드 통합 방안 분석

## 📋 현재 상황

- **web1**: 암 생존자 설문 페이지
- **web2**: 암 생존자용 대시보드
- **web3**: 암 환자 설문 페이지 (새로 생성)
- **요구사항**: 두 설문을 한 대시보드에서 관리

## 🔍 데이터베이스 구조 분석

### 현재 Firestore 구조

```
patients/{patientId}
  - 기본 환자 정보
  - riskLevel, counselingStatus 등

users/{userId}
  - 설문 결과 요약
  - stdScores, meanScores, riskGroups
  - lastSurveyId, lastSurveyAt

surveyResults/{surveyId}
  - 상세 설문 결과
  - answers, stdScores, meanScores 등

counselingRequests/{requestId}
  - 상담 요청 정보
```

### 잠재적 문제점

#### 1. **데이터 혼재 문제** ⚠️

- **문제**: 암 생존자와 암 환자가 같은 `patients`, `users` 컬렉션을 사용하면:
  - 설문 항목이 다를 수 있음 (생존자 vs 환자)
  - 점수 계산 방식이 다를 수 있음
  - 위험도 평가 기준이 다를 수 있음
  - 같은 patientId로 저장되면 데이터가 덮어씌워질 수 있음

#### 2. **쿼리 복잡도 증가** ⚠️

- 모든 환자를 조회할 때 생존자/환자 구분이 필요
- 필터링 로직이 복잡해짐
- 통계 계산 시 그룹별 분리 필요

#### 3. **데이터 무결성 문제** ⚠️

- 같은 이름+생년월일로 patientId가 생성되면 충돌 가능
- 설문 결과가 잘못된 그룹에 저장될 위험
- 데이터 마이그레이션 시 복잡도 증가

## 💡 해결 방안 비교

### 방안 1: 완전 통합 (교수님 제안) ❌ **비추천**

**구조**:

```
대시보드 → 모든 환자 통합 표시
```

**장점**:

- 단일 대시보드로 관리 간편
- 코드 중복 최소화

**단점**:

- ❌ 데이터 혼재로 인한 오류 위험 높음
- ❌ 설문 항목/점수 체계가 다를 경우 처리 복잡
- ❌ 환자/생존자 구분 로직이 모든 곳에 필요
- ❌ 데이터 마이그레이션 시 복잡도 높음
- ❌ 향후 확장성 제한 (다른 설문 추가 시)

**구현 복잡도**: ⭐⭐⭐⭐⭐ (매우 높음)

---

### 방안 2: 선택 페이지 방식 (사용자 제안) ✅ **추천**

**구조**:

```
로그인 → 대시보드 선택 페이지
  ├─ 암 생존자 대시보드 (web2)
  └─ 암 환자 대시보드 (web4, 새로 생성)
```

**장점**:

- ✅ 데이터 완전 분리 (혼재 위험 없음)
- ✅ 각 설문의 특성에 맞는 대시보드 구성 가능
- ✅ 코드 유지보수 용이
- ✅ 확장성 좋음 (새 설문 추가 시 독립적)
- ✅ 데이터베이스 구조 명확
- ✅ 각 대시보드별 최적화 가능

**단점**:

- 대시보드 간 전환 시 페이지 이동 필요
- 일부 공통 기능 중복 가능 (하지만 공통 컴포넌트로 해결)

**구현 복잡도**: ⭐⭐ (낮음)

**데이터베이스 구조**:

```javascript
// 암 생존자용
patients_survivors/{patientId}
users_survivors/{userId}
surveyResults_survivors/{surveyId}

// 암 환자용
patients_patients/{patientId}
users_patients/{userId}
surveyResults_patients/{surveyId}

// 또는 컬렉션은 같지만 타입 필드로 구분
patients/{patientId}
  - patientType: "survivor" | "patient"
users/{userId}
  - patientType: "survivor" | "patient"
```

---

### 방안 3: 하이브리드 방식 (통합 + 필터) ⚠️ **조건부 추천**

**구조**:

```
통합 대시보드 → 타입 필터로 구분
```

**장점**:

- 단일 대시보드에서 모든 환자 확인 가능
- 타입별 전환 간편

**단점**:

- 데이터 분리 로직이 모든 쿼리에 필요
- 실수로 필터를 빼먹으면 데이터 혼재 위험
- 코드 복잡도 증가

**구현 복잡도**: ⭐⭐⭐⭐ (높음)

**데이터베이스 구조**:

```javascript
patients/{patientId}
  - patientType: "survivor" | "patient"  // 필수 필드
  - ... 기타 필드

// 모든 쿼리에 patientType 필터 필수
query(collection(db, "patients"),
  where("patientType", "==", "survivor"))
```

---

### 방안 4: 탭 기반 통합 대시보드 ⚠️ **중간 추천**

**구조**:

```
통합 대시보드
  ├─ 탭: 암 생존자
  └─ 탭: 암 환자
```

**장점**:

- 단일 페이지에서 관리
- 탭 전환으로 빠른 접근
- 공통 기능 공유 가능

**단점**:

- 데이터 분리 로직 필요
- 탭별로 다른 데이터 구조 처리 필요
- 코드 복잡도 중간

**구현 복잡도**: ⭐⭐⭐ (중간)

---

## 🎯 최종 추천: 방안 2 (선택 페이지 방식) + 개선안

### 추천 이유

1. **데이터 무결성 보장**

   - 완전한 데이터 분리로 혼재 위험 제로
   - 각 설문의 특성에 맞는 최적화 가능

2. **확장성**

   - 향후 다른 설문 추가 시 독립적으로 확장 가능
   - 각 설문별 맞춤 대시보드 구성

3. **유지보수성**

   - 코드 분리로 버그 수정 및 기능 추가 용이
   - 각 팀이 독립적으로 작업 가능

4. **사용자 경험**
   - 명확한 구분으로 혼란 최소화
   - 각 대시보드에 최적화된 UI/UX 제공

### 개선된 구현 방안

#### 1. 대시보드 선택 페이지 (DashboardSelector)

```jsx
// web2/src/pages/DashboardSelectorPage.js
function DashboardSelectorPage() {
  return (
    <Layout>
      <SelectorContainer>
        <Title>대시보드 선택</Title>
        <DashboardCards>
          <DashboardCard
            to="/dashboard/survivors"
            title="암 생존자 대시보드"
            description="암 생존자 설문 결과 및 관리"
            icon={<SurvivorIcon />}
            count={survivorCount}
          />
          <DashboardCard
            to="/dashboard/patients"
            title="암 환자 대시보드"
            description="암 환자 설문 결과 및 관리"
            icon={<PatientIcon />}
            count={patientCount}
          />
        </DashboardCards>
      </SelectorContainer>
    </Layout>
  );
}
```

#### 2. 데이터베이스 구조

**옵션 A: 컬렉션 완전 분리** (가장 안전) ✅ **최우선 추천**

```javascript
// 암 생존자용
patients_survivors / { patientId };
users_survivors / { userId };
surveyResults_survivors / { surveyId };
counselingRequests_survivors / { requestId };

// 암 환자용
patients_patients / { patientId };
users_patients / { userId };
surveyResults_patients / { surveyId };
counselingRequests_patients / { requestId };
```

**옵션 B: 타입 필드로 구분** (공간 효율적)

```javascript
// 공통 컬렉션 사용
patients/{patientId}
  - patientType: "survivor" | "patient"  // 필수 필드
  - ... 기타 필드

users/{userId}
  - patientType: "survivor" | "patient"  // 필수 필드
  - ... 기타 필드

// 모든 쿼리에 필터 필수
const survivorsQuery = query(
  collection(db, "patients"),
  where("patientType", "==", "survivor"),
  where("archived", "==", false)
);
```

#### 3. 공통 컴포넌트 추출

```javascript
// web2/src/components/shared/
// - PatientTable.js (공통 환자 테이블)
// - StatCard.js (공통 통계 카드)
// - RiskBadge.js (공통 위험도 배지)
// - FilterBar.js (공통 필터 바)

// 각 대시보드에서 공통 컴포넌트 사용
import { PatientTable } from "../components/shared/PatientTable";
```

#### 4. 라우팅 구조

```javascript
// web2/src/App.js
<Routes>
  <Route path="/" element={<DashboardSelectorPage />} />
  <Route path="/dashboard/survivors" element={<SurvivorDashboardPage />} />
  <Route path="/dashboard/patients" element={<PatientDashboardPage />} />
  <Route path="/patients/:patientId" element={<PatientDetailPage />} />
  // ...
</Routes>
```

#### 5. 데이터 접근 계층 분리

```javascript
// web2/src/utils/dataAccess/
// - survivorData.js (생존자 데이터 접근)
// - patientData.js (환자 데이터 접근)
// - commonData.js (공통 데이터 접근)

// survivorData.js
export async function getSurvivorPatients() {
  const q = query(
    collection(db, "patients_survivors"),
    where("archived", "==", false)
  );
  // ...
}

// patientData.js
export async function getPatientPatients() {
  const q = query(
    collection(db, "patients_patients"),
    where("archived", "==", false)
  );
  // ...
}
```

---

## 🔄 대안 아이디어

### 대안 1: 통합 대시보드 + 타입 필터 (하이브리드)

**구조**:

```
통합 대시보드
  ├─ 상단: 타입 선택 토글 (생존자/환자)
  ├─ 통계: 선택한 타입만 표시
  └─ 환자 목록: 선택한 타입만 표시
```

**장점**:

- 단일 페이지에서 관리
- 빠른 타입 전환

**단점**:

- 모든 쿼리에 타입 필터 필수
- 실수로 필터 누락 시 데이터 혼재 위험

**구현**:

```jsx
function UnifiedDashboardPage() {
  const [patientType, setPatientType] = useState("survivor");

  const patientsQuery = useMemo(
    () =>
      query(
        collection(db, "patients"),
        where("patientType", "==", patientType),
        where("archived", "==", false)
      ),
    [patientType]
  );

  return (
    <Layout>
      <TypeSelector>
        <ToggleButton
          active={patientType === "survivor"}
          onClick={() => setPatientType("survivor")}
        >
          암 생존자
        </ToggleButton>
        <ToggleButton
          active={patientType === "patient"}
          onClick={() => setPatientType("patient")}
        >
          암 환자
        </ToggleButton>
      </TypeSelector>
      {/* 통계 및 환자 목록 */}
    </Layout>
  );
}
```

---

### 대안 2: 멀티 테넌시 패턴

**구조**:

```
대시보드 선택 → 각 대시보드는 독립적인 "테넌트"로 관리
```

**장점**:

- 완전한 데이터 분리
- 각 테넌트별 독립적인 설정 가능
- 확장성 최고

**단점**:

- 구현 복잡도 높음
- 초기 설정 필요

**구현**:

```javascript
// 테넌트별 컬렉션 접두사
const TENANTS = {
  survivor: "survivors",
  patient: "patients",
};

function getCollection(tenant, collectionName) {
  return `${collectionName}_${TENANTS[tenant]}`;
}

// 사용 예시
const patientsRef = collection(db, getCollection("survivor", "patients"));
```

---

### 대안 3: 통합 뷰 + 상세 분리

**구조**:

```
통합 대시보드 (요약 정보만)
  ├─ 생존자 요약 카드 → 클릭 시 생존자 대시보드
  └─ 환자 요약 카드 → 클릭 시 환자 대시보드
```

**장점**:

- 전체 현황 한눈에 파악
- 상세는 각 대시보드에서 관리

**단점**:

- 페이지 전환 필요
- 요약 정보만으로는 제한적

---

## 📊 최종 비교표

| 방안        | 데이터 분리 | 구현 복잡도 | 확장성     | 유지보수성 | 추천도 |
| ----------- | ----------- | ----------- | ---------- | ---------- | ------ |
| 완전 통합   | ❌ 낮음     | ⭐⭐⭐⭐⭐  | ⭐⭐       | ⭐⭐       | ❌     |
| 선택 페이지 | ✅ 높음     | ⭐⭐        | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅✅✅ |
| 하이브리드  | ⚠️ 중간     | ⭐⭐⭐⭐    | ⭐⭐⭐     | ⭐⭐⭐     | ⚠️     |
| 탭 기반     | ⚠️ 중간     | ⭐⭐⭐      | ⭐⭐⭐⭐   | ⭐⭐⭐⭐   | ✅     |
| 멀티 테넌시 | ✅ 높음     | ⭐⭐⭐⭐    | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | ✅✅   |

---

## 🎯 최종 권장사항

### 1순위: 선택 페이지 방식 (방안 2) + 컬렉션 완전 분리

**이유**:

- 데이터 무결성 최우선 보장
- 구현 및 유지보수 용이
- 확장성 최고

**구현 단계**:

1. `DashboardSelectorPage` 생성
2. `SurvivorDashboardPage` (기존 web2 대시보드)
3. `PatientDashboardPage` (새로 생성)
4. 데이터 접근 계층 분리
5. 공통 컴포넌트 추출

### 2순위: 탭 기반 통합 대시보드 (방안 4)

**이유**:

- 단일 페이지에서 관리 가능
- 데이터 분리 로직 필요하지만 구현 가능

**구현 단계**:

1. 통합 대시보드 페이지 생성
2. 탭 컴포넌트 추가
3. 타입별 데이터 로딩 로직
4. 공통 컴포넌트 활용

---

## ⚠️ 주의사항

### 데이터 마이그레이션

기존 데이터가 있다면:

1. **백업 필수**: 마이그레이션 전 전체 데이터 백업
2. **점진적 마이그레이션**: 일부 데이터부터 테스트
3. **검증**: 마이그레이션 후 데이터 무결성 확인

### 네이밍 컨벤션

- 컬렉션명: `patients_survivors`, `patients_patients` (명확한 구분)
- 변수명: `survivorPatients`, `patientPatients` (가독성)
- 함수명: `getSurvivorPatients()`, `getPatientPatients()` (일관성)

### 코드 중복 방지

- 공통 로직은 유틸리티 함수로 추출
- 공통 컴포넌트는 shared 폴더에 배치
- 타입별 차이점만 각 대시보드에서 구현

---

## 💬 결론

**사용자의 우려는 정당합니다.** 완전 통합은 데이터 혼재 위험이 높고, 구현 복잡도가 매우 높습니다.

**선택 페이지 방식이 가장 안전하고 확장 가능한 해결책**입니다. 교수님께는 다음과 같이 설명하시면 좋을 것 같습니다:

1. **데이터 무결성**: 두 설문의 데이터가 혼재되지 않도록 완전 분리
2. **확장성**: 향후 다른 설문 추가 시 독립적으로 확장 가능
3. **유지보수성**: 각 설문별 특성에 맞는 최적화된 대시보드 제공
4. **사용자 경험**: 명확한 구분으로 혼란 최소화

선택 페이지에서 각 대시보드로 이동하는 것은 단 한 번의 클릭이므로, 사용성 측면에서도 큰 불편함이 없습니다.
