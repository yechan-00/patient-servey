# 이미지 첨부 기능 아이디어

## 개요

의료 커뮤니티에서 이미지 첨부 기능은 매우 중요합니다. 환자들이 검사 결과, 처방전, 증상 사진 등을 공유할 수 있어야 합니다.

## 구현 방안

### 1. Firebase Storage 사용

**장점:**

- Firebase 프로젝트와 통합 용이
- 자동 스토리지 관리
- 보안 규칙 설정 가능

**구현 방법:**

```javascript
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// 이미지 업로드
const storage = getStorage();
const imageRef = ref(storage, `community_posts/${postId}/${imageName}`);
await uploadBytes(imageRef, imageFile);
const imageUrl = await getDownloadURL(imageRef);
```

### 2. 이미지 최적화

- **압축**: 클라이언트 사이드에서 이미지 압축 (예: `browser-image-compression`)
- **리사이징**: 썸네일 자동 생성
- **형식 변환**: WebP 형식 지원

### 3. 보안 고려사항

- **파일 타입 제한**: 이미지 파일만 허용 (jpg, png, gif, webp)
- **파일 크기 제한**: 최대 5MB
- **개인정보 보호**: 민감한 정보가 포함된 이미지 경고

### 4. UI/UX

- **드래그 앤 드롭**: 이미지 드래그 앤 드롭 업로드
- **미리보기**: 업로드 전 이미지 미리보기
- **갤러리 뷰**: 여러 이미지 업로드 및 갤러리 형식 표시
- **이미지 뷰어**: 클릭 시 확대 보기

### 5. 데이터 구조

```javascript
// community_posts/{postId}
{
  images: [
    {
      url: string,
      thumbnailUrl: string,
      fileName: string,
      uploadedAt: timestamp,
    }
  ],
  imageCount: number,
}
```

### 6. 의료 커뮤니티 특화 기능

- **의료 정보 경고**: 이미지 업로드 시 개인정보 주의사항 표시
- **익명 옵션**: 이미지에서 개인정보 제거 유도
- **의료진 검토**: 의료진이 이미지 내용 검토 가능

## 추천 라이브러리

1. **react-dropzone**: 드래그 앤 드롭 파일 업로드
2. **browser-image-compression**: 이미지 압축
3. **react-image-gallery**: 이미지 갤러리 표시

## 구현 우선순위

1. 기본 이미지 업로드 (단일 이미지)
2. 이미지 미리보기
3. 다중 이미지 업로드
4. 이미지 압축 및 최적화
5. 이미지 갤러리 뷰

## 주의사항

- **개인정보 보호**: 의료 정보는 민감하므로 주의 필요
- **저작권**: 이미지 사용 시 저작권 고려
- **저장 비용**: Firebase Storage 사용량 모니터링 필요
