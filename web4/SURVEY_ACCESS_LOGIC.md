# 설문 접근 로직 정리

## 개요

비회원과 회원이 설문에 접근했을 때의 차이점과 처리 로직을 정의합니다.

## 사용자 유형별 차이

### 1. 비회원 (Guest)

**접근 권한:**

- ✅ 설문 참여 가능 (익명으로)
- ✅ 설문 결과 저장 가능 (익명 저장)
- ❌ 설문 이력 조회 불가
- ❌ 설문 결과 추적 불가
- ❌ 개인화된 서비스 이용 불가

**UI/UX:**

- 설문 참여 전 회원가입 유도 배너 표시
- 설문 참여 후 회원가입 유도 메시지 표시
- "회원가입하면 설문 이력을 관리할 수 있어요!" 메시지

**기술적 처리:**

- 설문 링크에 `guest=true` 파라미터 전달
- 설문 결과는 익명으로 저장 (patientId 기반, 사용자 계정 미연결)
- 설문 완료 후 돌아왔을 때 회원가입 유도

### 2. 회원 (Member)

**접근 권한:**

- ✅ 설문 참여 가능
- ✅ 설문 결과를 사용자 계정과 연결하여 저장
- ✅ 설문 이력 조회 가능
- ✅ 설문 결과 추적 및 관리 가능
- ✅ 개인화된 서비스 이용 가능

**UI/UX:**

- 설문 참여 전 "이전 설문 이력 보기" 버튼 표시
- 설문 참여 후 "내 설문 이력 보기" 버튼 표시
- 설문 결과 요약 카드 표시

**기술적 처리:**

- 설문 링크에 사용자 ID 전달 (선택적, 보안 고려)
- 설문 결과 저장 시 사용자 계정과 연결
- Firestore에 `user_surveys` 컬렉션에 설문 참여 기록 저장
- 설문 완료 후 돌아왔을 때 설문 이력 페이지로 이동 옵션 제공

## 데이터 구조

### Firestore 컬렉션

#### `user_surveys/{surveyId}`

회원의 설문 참여 기록

```javascript
{
  userId: string,              // 사용자 UID
  surveyType: "survivor" | "patient",  // 설문 유형
  surveyUrl: string,          // 설문 URL
  completedAt: timestamp,     // 완료 시간
  patientId: string,          // 설문에서 생성된 patientId
  surveyResultId: string,     // 설문 결과 문서 ID (선택적)
  createdAt: timestamp
}
```

#### `community_users/{userId}`

사용자 프로필 (기존)

```javascript
{
  email: string,
  displayName: string,
  surveyHistory: {
    lastSurvivorSurvey: timestamp,
    lastPatientSurvey: timestamp,
    totalSurveys: number
  },
  ...
}
```

## 플로우 차트

### 비회원 설문 참여 플로우

```
1. 설문 페이지 접근
   ↓
2. "회원가입하면 설문 이력을 관리할 수 있어요!" 배너 표시
   ↓
3. 설문 참여 버튼 클릭
   ↓
4. 설문 링크 열기 (guest=true 파라미터)
   ↓
5. 설문 완료 (익명 저장)
   ↓
6. 돌아오기
   ↓
7. "회원가입하고 설문 이력을 관리하세요!" 메시지 표시
```

### 회원 설문 참여 플로우

```
1. 설문 페이지 접근
   ↓
2. "이전 설문 이력 보기" 버튼 표시
   ↓
3. 설문 참여 버튼 클릭
   ↓
4. 설문 링크 열기 (userId 파라미터, 선택적)
   ↓
5. 설문 완료 (사용자 계정과 연결하여 저장)
   ↓
6. user_surveys 컬렉션에 기록 저장
   ↓
7. 돌아오기
   ↓
8. "내 설문 이력 보기" 버튼 표시
   ↓
9. 설문 이력 페이지에서 결과 확인
```

## 구현 세부사항

### 1. 설문 링크 생성

```javascript
// 비회원
const surveyUrl = `${baseUrl}?guest=true`;

// 회원
const surveyUrl = `${baseUrl}?userId=${currentUser.uid}`;
// 또는 보안을 위해 localStorage에 저장 후 설문 앱에서 읽기
```

### 2. 설문 완료 후 처리

```javascript
// 회원인 경우
if (currentUser) {
  // user_surveys 컬렉션에 기록 저장
  await addDoc(collection(db, "user_surveys"), {
    userId: currentUser.uid,
    surveyType: "survivor" | "patient",
    completedAt: serverTimestamp(),
    ...
  });

  // 사용자 프로필 업데이트
  await updateDoc(doc(db, "community_users", currentUser.uid), {
    "surveyHistory.lastSurvivorSurvey": serverTimestamp(),
    "surveyHistory.totalSurveys": increment(1)
  });
}
```

### 3. 설문 이력 조회

```javascript
// 회원의 설문 이력 조회
const surveysRef = collection(db, "user_surveys");
const q = query(
  surveysRef,
  where("userId", "==", currentUser.uid),
  orderBy("completedAt", "desc")
);
```

## 보안 고려사항

1. **사용자 ID 전달**: URL 파라미터로 직접 전달하지 않고, localStorage나 세션 스토리지 사용 고려
2. **익명 설문**: 비회원도 설문 참여 가능하도록 설문 앱에서 처리
3. **데이터 분리**: 회원과 비회원의 설문 데이터는 별도로 관리

## UI 컴포넌트

### 설문 카드 (비회원)

- 설문 참여 버튼
- 회원가입 유도 배너
- "회원가입하면 설문 이력을 관리할 수 있어요!" 메시지

### 설문 카드 (회원)

- 설문 참여 버튼
- "이전 설문 이력 보기" 버튼
- 마지막 설문 참여 날짜 표시
- 총 설문 참여 횟수 표시

## 향후 개선사항

1. 설문 결과 요약 카드 (회원 전용)
2. 설문 알림 기능 (회원 전용)
3. 설문 완료율 추적 (회원 전용)
4. 설문 결과 비교 기능 (회원 전용)
