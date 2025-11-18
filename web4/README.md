# 암 환자 커뮤니티 앱 (web4)

암 환자와 생존자들이 서로 소통하고 정보를 공유하는 커뮤니티 플랫폼입니다.

## 주요 기능

### 1. 사용자 인증

- ✅ 회원가입 (이메일/비밀번호)
- ✅ 로그인/로그아웃
- ✅ 비밀번호 재설정
- ✅ 사용자 프로필 관리

### 2. 커뮤니티 기능

- ✅ 게시판 (카테고리별 분류)
  - 자유게시판
  - 정보공유
  - 질문과 답변
  - 지원 요청
- ✅ 게시글 작성/읽기/삭제
- ✅ 댓글 기능
- ✅ 실시간 업데이트

### 3. 설문 접근

- ✅ 생존자 설문 (web1) 링크
- ✅ 환자 설문 (web3) 링크
- ✅ 새 창에서 설문 열기
- ✅ 비회원/회원 차별화 기능
  - 비회원: 설문 참여 가능, 회원가입 유도
  - 회원: 설문 참여 + 이력 조회 + 결과 추적
- ✅ 설문 이력 조회 페이지 (회원 전용)

## 기술 스택

- **React 19.1.0**
- **React Router DOM 7.4.1**
- **Firebase 11.7.1**
  - Authentication (이메일/비밀번호)
  - Firestore (실시간 데이터베이스)
- **Styled Components 6.1.16**

## 설치 및 실행

### 1. 의존성 설치

```bash
cd web4
npm install
```

### 2. 개발 서버 실행

```bash
npm start
```

브라우저에서 [http://localhost:3000](http://localhost:3000)로 접속하세요.

### 3. 빌드

```bash
npm run build
```

## 프로젝트 구조

```
web4/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   └── Layout.js          # 네비게이션 레이아웃
│   ├── contexts/
│   │   └── AuthContext.js      # 인증 컨텍스트
│   ├── pages/
│   │   ├── HomePage.js         # 홈 페이지
│   │   ├── LoginPage.js        # 로그인 페이지
│   │   ├── SignupPage.js       # 회원가입 페이지
│   │   ├── ForgotPasswordPage.js # 비밀번호 찾기
│   │   ├── CommunityPage.js    # 커뮤니티 목록
│   │   ├── WritePostPage.js     # 게시글 작성
│   │   ├── PostDetailPage.js    # 게시글 상세
│   │   ├── SurveysPage.js       # 설문 페이지
│   │   └── SurveyHistoryPage.js # 설문 이력 조회 (회원 전용)
│   ├── styles/
│   │   ├── GlobalStyle.js       # 전역 스타일
│   │   └── theme.js             # 테마 설정
│   ├── firebase.js              # Firebase 설정
│   ├── App.js                   # 메인 앱 컴포넌트
│   └── index.js                 # 진입점
├── package.json
└── README.md
```

## Firebase 데이터베이스 구조

### 컬렉션

1. **community_users** - 사용자 프로필

   ```
   {
     email: string,
     displayName: string,
     createdAt: timestamp,
     updatedAt: timestamp,
     role: "member"
   }
   ```

2. **community_posts** - 게시글

   ```
   {
     title: string,
     content: string,
     category: "free" | "info" | "question" | "support",
     authorId: string,
     authorName: string,
     authorEmail: string,
     createdAt: timestamp,
     updatedAt: timestamp,
     commentCount: number
   }
   ```

3. **community_posts/{postId}/comments** - 댓글

   ```
   {
     content: string,
     authorId: string,
     authorName: string,
     authorEmail: string,
     createdAt: timestamp
   }
   ```

4. **user_surveys/{surveyId}** - 회원의 설문 참여 기록
   ```
   {
     userId: string,
     surveyType: "survivor" | "patient",
     surveyUrl: string,
     completedAt: timestamp,
     patientId: string,        // 설문에서 생성된 patientId
     surveyResultId: string,  // 설문 결과 문서 ID (선택적)
     createdAt: timestamp
   }
   ```

## 주요 페이지

### 홈 페이지 (/)

- 커뮤니티 소개
- 설문 접근 링크
- 주요 기능 안내

### 커뮤니티 (/community)

- 게시글 목록
- 카테고리별 필터링
- 게시글 작성 버튼

### 게시글 작성 (/community/write)

- 제목, 내용, 카테고리 입력
- 게시글 작성 및 저장

### 게시글 상세 (/community/post/:postId)

- 게시글 내용 표시
- 댓글 작성 및 표시
- 게시글 삭제 (작성자만)

### 설문 페이지 (/surveys)

- 생존자 설문 링크 (web1)
- 환자 설문 링크 (web3)
- 비회원: 회원가입 유도 배너 표시
- 회원: 마지막 설문 참여 날짜, 설문 이력 보기 버튼

### 설문 이력 페이지 (/survey-history) - 회원 전용

- 회원의 설문 참여 이력 조회
- 설문 유형별 필터링 (전체/생존자/환자)
- 설문 참여 날짜 및 정보 표시

## 배포

GitHub Pages에 배포하려면:

1. `package.json`의 `homepage` 필드를 확인
2. 빌드 실행: `npm run build`
3. `build` 폴더의 내용을 GitHub Pages에 배포

## 비회원/회원 설문 접근 차이

### 비회원

- 설문 참여 가능 (익명으로)
- 설문 결과는 저장되지만 사용자 계정과 연결되지 않음
- 설문 이력 조회 불가
- 회원가입 유도 메시지 표시

### 회원

- 설문 참여 가능
- 설문 결과를 사용자 계정과 연결하여 저장
- 설문 이력 조회 가능 (`/survey-history`)
- 마지막 설문 참여 날짜 표시
- 설문 결과 추적 및 관리 가능

자세한 내용은 `SURVEY_ACCESS_LOGIC.md` 파일을 참고하세요.

## 주의사항

- Firebase Authentication에서 이메일/비밀번호 로그인을 활성화해야 합니다.
- Firestore 보안 규칙을 설정하여 데이터 보안을 유지하세요.
- 설문 링크는 GitHub Pages 경로를 사용합니다. 실제 배포 경로에 맞게 수정하세요.
- 설문 앱(web1, web3)에서 `localStorage`의 `community_userId`를 읽어 사용자 정보를 연결할 수 있습니다.

## 라이선스

이 프로젝트는 개인 프로젝트입니다.
