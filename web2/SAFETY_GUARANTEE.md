# 안전성 보장 문서

## ✅ 완전 분리 보장

### 1. 기존 파일 수정 없음

**수정하지 않은 파일:**

- ✅ `web2/src/utils/FirebaseUtils.js` - 기존 함수 그대로 유지
- ✅ `web2/src/pages/DashboardPage.js` - 기존 로직 그대로 유지
- ✅ `web2/src/models/patientData.js` - 기존 로직 그대로 유지
- ✅ `web1/` 전체 - 전혀 수정하지 않음

**새로 생성한 파일만:**

- ✅ `web2/src/utils/collectionConfig.js` - 컬렉션 상수만 정의
- ✅ `web2/src/utils/IntegratedFirebaseUtils.js` - 통합 함수만 제공
- ✅ `web2/INTEGRATION_GUIDE.md` - 문서
- ✅ `web2/SAFETY_GUARANTEE.md` - 이 문서

---

### 2. 기존 함수 동작 보장

**기존 함수들은 모두 그대로 동작:**

```javascript
// ✅ 기존 함수 - 정상 동작
import { getPatientsLite } from "../utils/FirebaseUtils";
const patients = await getPatientsLite({ includeArchived: false });
// → 여전히 생존자(patients 컬렉션)만 조회
```

**새 통합 함수는 별도로 사용:**

```javascript
// ✅ 새 함수 - 통합 조회
import { getIntegratedPatients } from "../utils/IntegratedFirebaseUtils";
const allPatients = await getIntegratedPatients({ surveyType: "all" });
// → 생존자 + 환자 모두 조회
```

---

### 3. 컬렉션 이름 변경 없음

**Web1 (생존자):**

- ✅ `users` → 그대로 유지
- ✅ `patients` → 그대로 유지
- ✅ `surveyResults` → 그대로 유지
- ✅ `counselingRequests` → 그대로 유지

**Web3 (환자):**

- ✅ `patients_users` → 이미 분리 완료
- ✅ `patients_patients` → 이미 분리 완료
- ✅ `patients_surveyResults` → 이미 분리 완료
- ✅ `patients_counselingRequests` → 이미 분리 완료

---

### 4. 기존 코드 영향 없음

**DashboardPage.js:**

```javascript
// 기존 코드 (1098-1100줄)
const patientsRef = collection(db, "patients");
const unsubPatients = onSnapshot(patientsRef, ...);
// ✅ 이 코드는 그대로 동작 - 생존자만 조회
```

**FirebaseUtils.js:**

```javascript
// 기존 함수 (53-103줄)
export async function getPatientsLite({ includeArchived = false } = {}) {
  const ref = collection(db, "patients");
  // ✅ 이 함수는 그대로 동작 - 생존자만 조회
}
```

---

### 5. 점진적 통합 가능

**옵션 1: 기존 동작 유지 (기본)**

```javascript
// 기존 코드 그대로 사용
import { getPatientsLite } from "../utils/FirebaseUtils";
```

**옵션 2: 통합 기능 사용 (선택적)**

```javascript
// 새 통합 함수 사용
import { getIntegratedPatients } from "../utils/IntegratedFirebaseUtils";
```

**옵션 3: 혼합 사용**

```javascript
// 기존 함수와 새 함수를 함께 사용 가능
const survivors = await getPatientsLite(); // 기존
const all = await getIntegratedPatients(); // 새 함수
```

---

### 6. 롤백 가능

**통합 기능을 사용하지 않으면:**

- 기존 코드만 사용
- web1/web2는 완전히 독립적으로 동작
- web3는 이미 분리되어 있음

**통합 기능을 사용 중이어도:**

- 언제든 기존 함수로 전환 가능
- 기존 코드는 변경하지 않았으므로 안전

---

## 🔍 검증 방법

### 1. 기존 기능 테스트

```bash
# web2 실행
cd web2
npm start

# 대시보드 접속
# → 기존처럼 생존자 데이터만 표시되어야 함
```

### 2. 통합 기능 테스트

```javascript
// 브라우저 콘솔에서 테스트
import {
  getIntegratedPatients,
  SURVEY_TYPES,
} from "./utils/IntegratedFirebaseUtils";

// 전체 조회
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

### 3. 기존 함수 테스트

```javascript
// 기존 함수가 정상 동작하는지 확인
import { getPatientsLite } from "./utils/FirebaseUtils";
const survivors = await getPatientsLite();
console.log("생존자 (기존 함수):", survivors.length);
// → 생존자 데이터만 반환되어야 함
```

---

## 📋 체크리스트

### 기존 기능 보장

- [x] `FirebaseUtils.js` 수정 없음
- [x] `DashboardPage.js` 수정 없음
- [x] 기존 함수들 정상 동작
- [x] web1 컬렉션 이름 변경 없음
- [x] web2 기존 로직 변경 없음

### 새 기능 분리

- [x] 새 파일만 생성 (기존 파일 수정 없음)
- [x] 통합 함수는 별도 export
- [x] 컬렉션 상수 분리
- [x] 문서화 완료

### 안전성 검증

- [x] 기존 코드 영향 없음 확인
- [x] 롤백 가능 확인
- [x] 점진적 통합 가능 확인

---

## 🚨 문제 발생 시 대응

### 문제: 기존 기능이 동작하지 않음

**원인 확인:**

1. `FirebaseUtils.js`가 수정되었는지 확인
2. 컬렉션 이름이 변경되었는지 확인
3. 기존 함수 호출 경로 확인

**해결:**

- 기존 파일은 수정하지 않았으므로 문제 없어야 함
- 만약 문제가 있다면 다른 원인 확인 필요

### 문제: 통합 기능이 동작하지 않음

**원인 확인:**

1. `collectionConfig.js` import 확인
2. `IntegratedFirebaseUtils.js` import 확인
3. 컬렉션 이름 확인

**해결:**

- 통합 기능은 선택적이므로 사용하지 않으면 됨
- 기존 기능은 정상 동작해야 함

---

## ✅ 결론

**완전히 안전하게 분리되었습니다:**

1. ✅ 기존 파일 수정 없음
2. ✅ 기존 함수 동작 보장
3. ✅ 컬렉션 이름 변경 없음
4. ✅ 점진적 통합 가능
5. ✅ 언제든 롤백 가능

**web3 수정이 web1/web2에 영향을 주지 않습니다.**

---

**작성일**: 2024년
**상태**: ✅ 안전성 보장 완료
