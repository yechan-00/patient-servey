# Firebase 컬렉션 분리 가이드

## 개요

web3는 암 환자 설문 페이지이며, web1(암 생존자 설문)과 데이터를 분리하기 위해 컬렉션 접두사를 사용합니다.

## 컬렉션 구조

### Web1 (생존자) - 기존 컬렉션

- `users`
- `patients`
- `surveyResults`
- `counselingRequests`

### Web3 (환자) - 접두사 적용

- `patients_users`
- `patients_patients`
- `patients_surveyResults`
- `patients_counselingRequests`

## 사용 방법

모든 Firebase 컬렉션 참조는 `collectionConfig.js`의 `COLLECTIONS` 상수를 사용해야 합니다:

```javascript
import { COLLECTIONS } from "./utils/collectionConfig";

// ✅ 올바른 사용
const userRef = doc(db, COLLECTIONS.USERS, userId);
const surveyRef = await addDoc(
  collection(db, COLLECTIONS.SURVEY_RESULTS),
  data
);

// ❌ 잘못된 사용 (직접 문자열 사용)
const userRef = doc(db, "users", userId);
```

## 환경 변수 제어

필요시 `.env` 파일에서 접두사 사용 여부를 제어할 수 있습니다:

```env
REACT_APP_COLLECTION_PREFIX=none  # 접두사 사용 안 함
```

## 대시보드 통합

web2 대시보드에서 두 설문의 데이터를 모두 조회하려면:

```javascript
// 생존자 데이터
const survivorsRef = collection(db, "users");
const survivorsSnapshot = await getDocs(survivorsRef);

// 환자 데이터
const patientsRef = collection(db, COLLECTIONS.USERS);
const patientsSnapshot = await getDocs(patientsRef);
```

## 마이그레이션

기존 데이터가 있다면 마이그레이션 스크립트를 실행하여 접두사가 붙은 컬렉션으로 이동해야 합니다.
