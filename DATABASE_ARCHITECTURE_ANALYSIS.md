# 커뮤니티 데이터베이스 아키텍처 분석 및 개선 방향

## 현재 상태

### 사용 중인 데이터베이스

- **커뮤니티 (web4)**: Firebase Firestore
- **설문 (web1, web3)**: Firebase Firestore
- **대시보드 (web2)**: Firebase Firestore

### 커뮤니티에서 사용하는 Firestore 컬렉션

1. `community_users` - 사용자 프로필
2. `community_posts` - 게시글
3. `community_posts/{postId}/comments` - 댓글
4. `community_posts/{postId}/comments/{commentId}/replies` - 답글
5. `community_notifications` - 알림
6. `community_reports` - 신고
7. `user_surveys` - 설문 참여 기록

---

## 커뮤니티만 다른 DB 사용: 가능성 분석

### ✅ 가능합니다

커뮤니티만 다른 데이터베이스를 사용하는 것은 **기술적으로 가능**합니다. 하지만 몇 가지 고려사항이 있습니다.

### 🔄 하이브리드 아키텍처 옵션

#### 옵션 1: 커뮤니티만 관계형 DB (MySQL/PostgreSQL)

```
┌─────────────────┐
│   Firebase      │
│   - Auth        │ ← 인증은 계속 사용
│   - Storage     │ ← 파일 저장은 계속 사용
└─────────────────┘
         │
         ├─────────────────┐
         │                 │
┌────────▼────────┐  ┌─────▼──────────┐
│  Firestore      │  │  MySQL/PostgreSQL│
│  - 설문 데이터   │  │  - 커뮤니티 데이터│
│  - 환자 데이터   │  │  - 게시글/댓글   │
└─────────────────┘  └─────────────────┘
```

**장점:**

- 복잡한 쿼리 (JOIN, 집계, 검색) 성능 향상
- 트랜잭션 처리 용이
- 데이터 일관성 보장
- 비용 최적화 가능 (대용량 데이터)
- 전문 검색 엔진 연동 용이 (Elasticsearch 등)

**단점:**

- 백엔드 서버 필요 (Node.js, Python 등)
- 실시간 업데이트 구현 복잡 (WebSocket, SSE 필요)
- 인프라 관리 복잡도 증가
- 데이터 동기화 필요 (Firebase Auth와 연동)

---

## 추천 데이터베이스 옵션

### 1. PostgreSQL (가장 추천) ⭐⭐⭐⭐⭐

**이유:**

- **JSON/JSONB 지원**: Firestore에서 마이그레이션 용이
- **Full-text Search**: 게시글 검색 최적화
- **트랜잭션**: 댓글/좋아요 동시성 처리
- **확장성**: 수평 확장 가능 (PostgreSQL + Read Replicas)
- **오픈소스**: 비용 효율적

**적합한 이유:**

- 복잡한 관계형 데이터 (게시글-댓글-답글)
- 검색 기능 강화 필요
- 대용량 데이터 처리
- 트랜잭션 중요 (좋아요, 신고 등)

### 2. MySQL ⭐⭐⭐⭐

**이유:**

- 널리 사용됨, 문서화 잘 되어 있음
- 성숙한 생태계
- 비용 효율적

**단점:**

- JSON 지원은 PostgreSQL보다 제한적
- Full-text Search 기능 제한적

### 3. MongoDB ⭐⭐⭐

**이유:**

- NoSQL이라 Firestore와 유사한 구조
- 마이그레이션 용이
- 실시간 기능 내장

**단점:**

- 복잡한 쿼리 성능 제한
- 트랜잭션 지원 제한적 (최신 버전은 개선됨)

---

## 운영 시 복잡한 문제들

### 1. 인증 및 권한 관리 🔐

**문제:**

- Firebase Auth는 계속 사용하지만, 커뮤니티 데이터는 다른 DB에 저장
- 사용자 ID 동기화 필요

**해결 방안:**

```javascript
// Firebase Auth로 로그인 → JWT 토큰 발급
// 백엔드에서 JWT 검증 → MySQL에서 사용자 정보 조회
// 또는 Firebase Auth Custom Claims 사용
```

### 2. 실시간 업데이트 ⚡

**문제:**

- Firestore는 실시간 업데이트가 자동
- MySQL/PostgreSQL은 WebSocket 또는 Server-Sent Events 필요

**해결 방안:**

- **Socket.io** 또는 **WebSocket** 서버 구축
- **Redis Pub/Sub** 사용
- **PostgreSQL LISTEN/NOTIFY** 활용

### 3. 데이터 일관성 🔄

**문제:**

- Firebase와 MySQL 간 데이터 동기화
- 트랜잭션 처리 (댓글 작성 시 게시글 commentCount 증가)

**해결 방안:**

- **트랜잭션 사용** (PostgreSQL의 경우)
- **이벤트 기반 아키텍처** (메시지 큐 사용)
- **Saga 패턴** (분산 트랜잭션)

### 4. 검색 기능 🔍

**문제:**

- Firestore의 검색 기능 제한적
- 전문 검색 필요 (제목, 내용, 태그 등)

**해결 방안:**

- **PostgreSQL Full-text Search**
- **Elasticsearch** 연동
- **Algolia** 같은 검색 서비스

### 5. 파일 저장 📁

**문제:**

- 현재 Firebase Storage 사용
- 이미지/파일 업로드 처리

**해결 방안:**

- Firebase Storage 계속 사용 (권장)
- 또는 **AWS S3**, **Cloudinary**로 전환

### 6. 확장성 📈

**문제:**

- 사용자 증가 시 성능 저하
- 읽기/쓰기 부하 분산

**해결 방안:**

- **Read Replicas** (읽기 전용 복제본)
- **캐싱** (Redis)
- **CDN** (정적 파일)
- **로드 밸런싱**

### 7. 백업 및 복구 💾

**문제:**

- 데이터 손실 방지
- 장애 복구

**해결 방안:**

- **자동 백업** (일일/주간)
- **Point-in-time Recovery**
- **다중 리전 복제**

---

## 권장 아키텍처 진화 방향

### 단계 1: 현재 상태 유지 (초기 단계) ✅

**현재 아키텍처:**

```
Frontend (React)
    ↓
Firebase (Firestore + Auth + Storage)
```

**장점:**

- 빠른 개발
- 실시간 업데이트 자동
- 서버 관리 불필요

**적합한 경우:**

- 사용자 수 < 10,000명
- 트래픽이 적음
- 빠른 프로토타입

---

### 단계 2: 하이브리드 아키텍처 (중기) 🚀

**추천 아키텍처:**

```
Frontend (React)
    ↓
┌─────────────────────────────────┐
│   Backend API (Node.js/Express) │
│   - REST API                     │
│   - WebSocket (실시간)           │
└─────────────────────────────────┘
    ↓                    ↓
Firebase              PostgreSQL
- Auth               - 커뮤니티 데이터
- Storage            - 게시글/댓글
- 설문 데이터         - 검색 최적화
```

**구현 예시:**

```javascript
// Backend API 구조
/api
  /auth          → Firebase Auth 연동
  /posts         → PostgreSQL
  /comments      → PostgreSQL
  /notifications → PostgreSQL + WebSocket
  /search        → PostgreSQL Full-text Search
```

**장점:**

- 복잡한 쿼리 성능 향상
- 검색 기능 강화
- 비용 최적화
- 확장성 확보

**필요한 작업:**

1. **Backend 서버 구축** (Node.js + Express/Fastify)
2. **데이터베이스 마이그레이션** (Firestore → PostgreSQL)
3. **API 엔드포인트 개발**
4. **실시간 기능 구현** (WebSocket)
5. **인증 미들웨어** (Firebase Auth JWT 검증)

---

### 단계 3: 마이크로서비스 아키텍처 (장기) 🏗️

**고급 아키텍처:**

```
Frontend (React)
    ↓
API Gateway
    ↓
┌──────────┬──────────┬──────────┐
│ Auth     │ Community│ Survey   │
│ Service  │ Service  │ Service  │
└──────────┴──────────┴──────────┘
    ↓          ↓          ↓
Firebase   PostgreSQL  Firestore
```

**적합한 경우:**

- 사용자 수 > 100,000명
- 높은 트래픽
- 복잡한 비즈니스 로직
- 팀 규모 확대

---

## 구체적인 마이그레이션 계획

### Phase 1: 백엔드 API 구축 (2-3주)

1. **Node.js + Express 서버 설정**

   ```bash
   npm init -y
   npm install express pg jsonwebtoken firebase-admin
   ```

2. **PostgreSQL 데이터베이스 설계**

   ```sql
   -- 테이블 구조 예시
   CREATE TABLE users (
     id UUID PRIMARY KEY,
     firebase_uid VARCHAR(255) UNIQUE,
     email VARCHAR(255),
     display_name VARCHAR(255),
     created_at TIMESTAMP,
     updated_at TIMESTAMP
   );

   CREATE TABLE posts (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     title VARCHAR(500),
     content TEXT,
     category VARCHAR(50),
     view_count INTEGER DEFAULT 0,
     like_count INTEGER DEFAULT 0,
     created_at TIMESTAMP,
     updated_at TIMESTAMP
   );

   CREATE TABLE comments (
     id UUID PRIMARY KEY,
     post_id UUID REFERENCES posts(id),
     user_id UUID REFERENCES users(id),
     content TEXT,
     parent_id UUID REFERENCES comments(id), -- 답글용
     created_at TIMESTAMP,
     updated_at TIMESTAMP
   );
   ```

3. **API 엔드포인트 개발**
   - `GET /api/posts` - 게시글 목록
   - `POST /api/posts` - 게시글 작성
   - `GET /api/posts/:id` - 게시글 상세
   - `POST /api/posts/:id/comments` - 댓글 작성
   - `GET /api/search?q=...` - 검색

### Phase 2: 데이터 마이그레이션 (1주)

1. **Firestore → PostgreSQL 마이그레이션 스크립트**

   ```javascript
   // migration.js
   const admin = require('firebase-admin');
   const { Pool } = require('pg');

   async function migratePosts() {
     const firestorePosts = await admin.firestore()
       .collection('community_posts')
       .get();

     for (const doc of firestorePosts.docs) {
       await pool.query(
         'INSERT INTO posts (id, user_id, title, content, ...) VALUES ($1, $2, $3, $4, ...)',
         [doc.id, doc.data().authorId, doc.data().title, ...]
       );
     }
   }
   ```

2. **이중 쓰기 (Dual Write)**
   - 일정 기간 동안 Firestore와 PostgreSQL 모두에 쓰기
   - 데이터 일관성 검증

### Phase 3: 프론트엔드 연동 (1-2주)

1. **API 클라이언트 생성**

   ```javascript
   // api/client.js
   const API_BASE = "https://api.yourdomain.com";

   export const getPosts = async (category) => {
     const response = await fetch(`${API_BASE}/api/posts?category=${category}`);
     return response.json();
   };
   ```

2. **기존 Firestore 코드를 API 호출로 변경**

   ```javascript
   // Before (Firestore)
   const postsRef = collection(db, "community_posts");
   const q = query(postsRef, orderBy("createdAt", "desc"));

   // After (API)
   const posts = await getPosts(category);
   ```

### Phase 4: 실시간 기능 구현 (1-2주)

1. **WebSocket 서버 구축**

   ```javascript
   // server.js
   const io = require("socket.io")(server);

   io.on("connection", (socket) => {
     socket.on("subscribe:post", (postId) => {
       socket.join(`post:${postId}`);
     });
   });

   // 댓글 작성 시
   await pool.query("INSERT INTO comments ...");
   io.to(`post:${postId}`).emit("new_comment", comment);
   ```

2. **프론트엔드 WebSocket 클라이언트**

   ```javascript
   import io from "socket.io-client";

   const socket = io("https://api.yourdomain.com");
   socket.on("new_comment", (comment) => {
     setComments((prev) => [...prev, comment]);
   });
   ```

---

## 비용 비교

### Firebase Firestore

- **무료**: 50,000 읽기/일, 20,000 쓰기/일
- **유료**: $0.06/100K 읽기, $0.18/100K 쓰기
- **예상 비용** (10만 사용자, 활성 10%): $50-200/월

### PostgreSQL (AWS RDS)

- **t3.micro**: $15/월 (무료 티어 1년)
- **t3.small**: $30/월
- **예상 비용**: $30-100/월 (사용량에 따라)

### 하이브리드 (Firebase Auth + PostgreSQL)

- **Firebase Auth**: 무료 (월 50K 사용자)
- **PostgreSQL**: $30-100/월
- **총 예상 비용**: $30-150/월

---

## 최종 권장사항

### 현재 단계 (초기 운영)

✅ **Firebase Firestore 유지**

- 빠른 개발 및 배포
- 실시간 기능 자동
- 서버 관리 불필요
- 사용자 수가 적을 때는 충분

### 중기 (사용자 증가, 기능 확장)

🚀 **PostgreSQL로 전환 고려**

- 사용자 수 > 5,000명
- 복잡한 검색 필요
- 비용 최적화 필요
- 전문 검색 기능 필요

### 장기 (대규모 운영)

🏗️ **마이크로서비스 아키텍처**

- 사용자 수 > 50,000명
- 높은 트래픽
- 복잡한 비즈니스 로직

---

## 즉시 개선 가능한 사항 (Firebase 유지)

### 1. Firestore 인덱스 최적화

```javascript
// 복합 인덱스 생성 필요
- category + createdAt (이미 있음)
- cancerType + createdAt
- authorId + createdAt
```

### 2. 캐싱 도입

```javascript
// React Query 또는 SWR 사용
import { useQuery } from "react-query";

const { data: posts } = useQuery("posts", fetchPosts, {
  staleTime: 30000, // 30초 캐싱
});
```

### 3. 페이지네이션 개선

```javascript
// 현재: 모든 데이터 로드
// 개선: 커서 기반 페이지네이션
const q = query(
  postsRef,
  orderBy("createdAt", "desc"),
  limit(20),
  startAfter(lastDoc)
);
```

### 4. 검색 최적화

- **Algolia** 또는 **Elasticsearch** 연동
- Firestore에서 기본 데이터, 검색은 Algolia

---

## 결론

1. **현재는 Firebase 유지 권장** (초기 단계)
2. **사용자 증가 시 PostgreSQL 전환 고려** (중기)
3. **점진적 마이그레이션** (하이브리드 → 완전 전환)
4. **즉시 개선**: 인덱스, 캐싱, 페이지네이션

**추천 순서:**

1. Firestore 인덱스 최적화 (즉시)
2. 캐싱 도입 (1주)
3. 검색 서비스 연동 (Algolia) (1주)
4. 백엔드 API 구축 검토 (사용자 수 증가 시)
