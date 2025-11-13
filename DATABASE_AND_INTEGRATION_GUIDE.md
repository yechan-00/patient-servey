# 데이터베이스 분리 및 web3 통합 가이드

## 📊 데이터베이스 분리 방법

### ✅ **같은 Firebase 프로젝트 내에서 컬렉션만 분리하면 됩니다!**

**완전히 다른 Firebase 프로젝트를 사용할 필요는 없습니다.**

현재 상황:

- Firebase 프로젝트: `patient-survey-2a22f`
- web1 (암 생존자 설문): 이 프로젝트 사용 중
- web2 (암 생존자 대시보드): 이 프로젝트 사용 중

### 옵션 1: 같은 Firebase 프로젝트 + 컬렉션 분리 ✅ **추천**

**구조**:

```
Firebase 프로젝트: patient-survey-2a22f
├─ patients_survivors/{id}        (암 생존자)
├─ users_survivors/{id}            (암 생존자)
├─ surveyResults_survivors/{id}    (암 생존자)
├─ counselingRequests_survivors/{id} (암 생존자)
│
├─ patients_patients/{id}          (암 환자) ← 새로 추가
├─ users_patients/{id}              (암 환자) ← 새로 추가
├─ surveyResults_patients/{id}     (암 환자) ← 새로 추가
└─ counselingRequests_patients/{id} (암 환자) ← 새로 추가
```

**장점**:

- ✅ 하나의 Firebase 프로젝트로 관리 간편
- ✅ 비용 효율적 (프로젝트당 무료 할당량 공유)
- ✅ 설정 관리 용이
- ✅ 데이터 백업/복원 간편

**단점**:

- 컬렉션 이름으로만 구분 (하지만 코드에서 명확히 분리 가능)

### 옵션 2: 다른 Firebase 프로젝트 사용 ⚠️ **비추천**

**구조**:

```
Firebase 프로젝트 1: patient-survey-2a22f (암 생존자)
Firebase 프로젝트 2: patient-survey-new (암 환자) ← 새로 생성
```

**장점**:

- 완전한 데이터 분리

**단점**:

- ❌ 프로젝트 관리 복잡도 증가
- ❌ 비용 증가 (프로젝트별 할당량 분리)
- ❌ 설정 중복 (Firebase 설정, 보안 규칙 등)
- ❌ 백업/복원 복잡

---

## 🔧 구현 방법

### 1. 컬렉션 분리 방식 (같은 Firebase 프로젝트)

#### web1 (암 생존자 설문) - 변경 없음

```javascript
// web1/src/utils/firebaseUtils.js
// 기존 코드 그대로 사용
const patientRef = doc(db, "patients_survivors", patientId);
const userRef = doc(db, "users_survivors", userId);
```

#### web3 (암 환자 설문) - 새 컬렉션 사용

```javascript
// web3/src/utils/firebaseUtils.js
// 다른 컬렉션 이름 사용
const patientRef = doc(db, "patients_patients", patientId);
const userRef = doc(db, "users_patients", userId);
```

#### web2 (대시보드) - 타입별로 다른 컬렉션 접근

```javascript
// web2/src/utils/dataAccess/survivorData.js
export async function getSurvivorPatients() {
  const q = query(
    collection(db, "patients_survivors"),
    where("archived", "==", false)
  );
  // ...
}

// web2/src/utils/dataAccess/patientData.js
export async function getPatientPatients() {
  const q = query(
    collection(db, "patients_patients"),
    where("archived", "==", false)
  );
  // ...
}
```

### 2. Firebase 설정은 동일하게 사용

**web1, web2, web3 모두 같은 Firebase 설정 사용**:

```javascript
// web3/src/firebaseConfig.js (web1과 동일)
const firebaseConfig = {
  apiKey: "AIzaSyBSixs1LpKDH_xruyZycJY1GoWQukzqhaw",
  authDomain: "patient-survey-2a22f.firebaseapp.com",
  projectId: "patient-survey-2a22f", // 같은 프로젝트
  // ...
};
```

---

## 📦 web3 코드 통합 방법

### 방법 1: ZIP 파일로 통합 ✅ **가능하지만 주의 필요**

**단계**:

1. web3.zip 파일을 프로젝트 루트에 압축 해제
2. `web3/` 폴더로 이름 변경
3. Firebase 설정 확인 및 수정
4. 컬렉션 이름 변경 (patients → patients_patients 등)
5. 의존성 설치 및 테스트

**주의사항**:

- ⚠️ ZIP 파일에 `node_modules` 포함 시 충돌 가능
- ⚠️ `.git` 폴더가 포함되면 Git 히스토리 충돌
- ⚠️ Firebase 설정이 다르면 수정 필요
- ⚠️ 컬렉션 이름 변경 필요

**권장 ZIP 내용**:

```
web3.zip
├─ src/              (소스 코드만)
├─ public/           (정적 파일)
├─ package.json      (의존성 정보)
└─ .env.example      (환경 변수 예시)
```

**제외해야 할 것**:

- ❌ node_modules/
- ❌ .git/
- ❌ build/
- ❌ .env (민감 정보)
- ❌ \*.log

### 방법 2: Git을 사용한 통합 ✅✅ **가장 추천**

**단계**:

1. web3를 별도 Git 저장소로 관리 중이라면:

   ```bash
   # web3를 서브모듈로 추가
   git submodule add <web3-repo-url> web3
   ```

2. 또는 web3 코드를 직접 복사:

   ```bash
   # web3 폴더를 현재 프로젝트에 복사
   cp -r /path/to/web3 ./web3

   # Git에 추가
   git add web3/
   git commit -m "feat: web3 (암 환자 설문) 추가"
   ```

**장점**:

- ✅ Git 히스토리 보존
- ✅ 버전 관리 용이
- ✅ 충돌 해결 용이
- ✅ 협업에 유리

### 방법 3: 수동 파일 복사 ✅ **간단하지만 주의 필요**

**단계**:

1. web3의 주요 파일들을 직접 복사
2. 필요한 부분만 선택적으로 통합
3. Firebase 설정 및 컬렉션 이름 수정

**장점**:

- 필요한 부분만 선택 가능
- 불필요한 파일 제외 가능

**단점**:

- 파일 누락 가능성
- 수동 작업 필요

---

## 🚀 통합 체크리스트

### 1단계: web3 폴더 준비

- [ ] web3.zip 압축 해제 또는 Git 클론
- [ ] `web3/` 폴더로 이름 확인
- [ ] `node_modules` 제거 (재설치 예정)

### 2단계: Firebase 설정 확인

- [ ] `web3/src/firebaseConfig.js` 확인
- [ ] 같은 Firebase 프로젝트 사용 확인
- [ ] 필요시 web1의 설정으로 통일

### 3단계: 컬렉션 이름 변경

- [ ] `patients` → `patients_patients`
- [ ] `users` → `users_patients`
- [ ] `surveyResults` → `surveyResults_patients`
- [ ] `counselingRequests` → `counselingRequests_patients`

**검색 및 일괄 변경**:

```bash
# web3 폴더 내에서 컬렉션 이름 검색
grep -r "patients" web3/src/
grep -r "users" web3/src/
grep -r "surveyResults" web3/src/
grep -r "counselingRequests" web3/src/
```

### 4단계: 의존성 설치

```bash
cd web3
npm install
```

### 5단계: 테스트

- [ ] `npm start` 실행 확인
- [ ] Firebase 연결 확인
- [ ] 설문 제출 테스트
- [ ] 데이터 저장 확인 (올바른 컬렉션에 저장되는지)

### 6단계: web2 대시보드 통합

- [ ] 대시보드 선택 페이지 생성
- [ ] 암 환자 대시보드 페이지 생성
- [ ] 라우팅 설정

---

## 📝 컬렉션 이름 변경 가이드

### web3에서 변경해야 할 파일들

#### 1. Firebase 유틸리티 파일

```javascript
// web3/src/utils/firebaseUtils.js (예시)
// 변경 전
const patientRef = doc(db, "patients", patientId);

// 변경 후
const patientRef = doc(db, "patients_patients", patientId);
```

#### 2. 설문 저장 함수

```javascript
// web3/src/utils/saveSurvey.js (예시)
// 변경 전
await setDoc(doc(db, "users", patientId), userData);

// 변경 후
await setDoc(doc(db, "users_patients", patientId), userData);
```

#### 3. 상담 요청 저장

```javascript
// web3/src/component/CounselingRequestForm.js (예시)
// 변경 전
await addDoc(collection(db, "counselingRequests"), requestData);

// 변경 후
await addDoc(collection(db, "counselingRequests_patients"), requestData);
```

### 일괄 변경 스크립트 (참고용)

```bash
# web3 폴더 내에서 일괄 변경 (주의: 백업 필수!)
cd web3/src

# patients → patients_patients
find . -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/"patients"/"patients_patients"/g'
find . -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' "s/'patients'/'patients_patients'/g"

# users → users_patients
find . -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/"users"/"users_patients"/g'
find . -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' "s/'users'/'users_patients'/g"

# surveyResults → surveyResults_patients
find . -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/"surveyResults"/"surveyResults_patients"/g'
find . -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' "s/'surveyResults'/'surveyResults_patients'/g"
```

**⚠️ 주의**: 위 스크립트는 예시이며, 실제 사용 전 백업 필수!

---

## 🎯 최종 권장사항

### 데이터베이스

✅ **같은 Firebase 프로젝트 + 컬렉션 분리**

- 프로젝트: `patient-survey-2a22f` (기존 그대로)
- 컬렉션만 분리: `patients_survivors` vs `patients_patients`

### web3 통합

✅ **ZIP 파일로 통합 가능** (다음 단계 진행)

1. ZIP 파일 제공 시 통합 도와드리겠습니다
2. 컬렉션 이름 자동 변경 도와드리겠습니다
3. 통합 후 테스트 도와드리겠습니다

---

## ❓ FAQ

### Q1: 같은 Firebase 프로젝트를 사용해도 데이터가 섞이지 않나요?

**A**: 네, 안전합니다. 컬렉션 이름이 다르기 때문에 완전히 분리됩니다.

- `patients_survivors`와 `patients_patients`는 다른 컬렉션이므로 절대 섞이지 않습니다.

### Q2: 기존 암 생존자 데이터는 영향받나요?

**A**: 전혀 영향받지 않습니다.

- 기존 데이터는 `patients_survivors` 컬렉션에 그대로 유지됩니다.
- web3는 `patients_patients` 컬렉션을 사용하므로 완전히 분리됩니다.

### Q3: ZIP 파일에 node_modules가 포함되어 있으면?

**A**: 문제없습니다. 통합 후 삭제하고 재설치하면 됩니다.

```bash
cd web3
rm -rf node_modules
npm install
```

### Q4: web3의 Firebase 설정이 다르면?

**A**: web1의 설정으로 통일하면 됩니다.

- `web3/src/firebaseConfig.js`를 web1과 동일하게 수정

### Q5: 컬렉션 이름을 실수로 잘못 변경하면?

**A**: Git을 사용 중이라면 쉽게 되돌릴 수 있습니다.

- 변경 전 커밋으로 되돌리기
- 또는 일괄 변경 전 백업 필수

---

## 📞 다음 단계

web3.zip 파일을 제공해주시면:

1. ✅ 프로젝트에 통합
2. ✅ 컬렉션 이름 자동 변경
3. ✅ Firebase 설정 통일
4. ✅ 통합 테스트
5. ✅ 대시보드 선택 페이지 구현

도와드리겠습니다!
