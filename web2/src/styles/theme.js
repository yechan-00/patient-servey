// src/styles/theme.js
// 사회복지사 앱을 위한 테마 파일입니다.

// 폰트 정의
const fontFamily = '"Noto Sans KR", "Pretendard", "Apple SD Gothic Neo", sans-serif';

// 컬러 팔레트 정의
const colors = {
  // 메인 컬러 - 전문성과 신뢰를 주는 다크 블루 계열
  primary: {
    light: '#E3F2FD',
    main: '#1976D2',  // 진한 블루
    dark: '#0D47A1',  // 더 진한 블루
    text: '#0D47A1',
  },
  
  // 서브 컬러 - 차분한 느낌의 블루그레이
  secondary: {
    light: '#ECEFF1',
    main: '#607D8B', 
    dark: '#455A64',
    text: '#263238',
  },
  
  // 포인트 컬러 - 포인트 강조를 위한 청록색 계열
  accent: {
    light: '#E0F7FA',
    main: '#00ACC1',
    dark: '#00838F',
  },
  
  // 중립 컬러
  neutral: {
    white: '#FFFFFF',
    background: '#F5F5F5',
    lighterGrey: '#FAFAFA',
    lightGrey: '#EEEEEE',
    grey: '#9E9E9E',
    darkGrey: '#616161',
    text: '#424242',
    black: '#212121',
  },
  
  // 기능 컬러
  functional: {
    success: '#4CAF50',
    info: '#2196F3',
    warning: '#FF9800',
    error: '#F44336',
  },
  
  // 차트와 시각화용 컬러
  chart: {
    blue: '#1976D2',
    green: '#388E3C',
    orange: '#F57C00',
    red: '#D32F2F',
    purple: '#7B1FA2',
    cyan: '#0097A7',
    teal: '#00796B',
    amber: '#FFA000',
  },
};

// 그림자 스타일
const shadows = {
  small: '0 2px 4px rgba(0, 0, 0, 0.05)',
  medium: '0 4px 8px rgba(0, 0, 0, 0.08)',
  large: '0 8px 16px rgba(0, 0, 0, 0.12)',
  focused: '0 0 0 3px rgba(25, 118, 210, 0.4)',
};

// 반응형 디자인 breakpoints
const breakpoints = {
  xs: '320px',
  sm: '576px',
  md: '768px', 
  lg: '992px',
  xl: '1200px',
};

// 간격(spacing) 변수
const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  xxl: '3rem',    // 48px
};

// 둥근 모서리 값
const borderRadius = {
  small: '4px',
  medium: '8px',
  large: '12px',
  round: '50%',
};

// 반응형 폰트 크기
const fontSize = {
  xs: '0.75rem',     // 12px
  sm: '0.875rem',    // 14px
  md: '1rem',        // 16px
  lg: '1.25rem',     // 20px
  xl: '1.5rem',      // 24px
  xxl: '2rem',       // 32px
  heading1: '2.25rem', // 36px - 암 생존자 앱보다 약간 작게
  heading2: '1.75rem', // 28px
  heading3: '1.375rem', // 22px
  heading4: '1.125rem'  // 18px
};

// 애니메이션 지속 시간
const animation = {
  fast: '0.2s',
  normal: '0.3s',
  slow: '0.5s',
};

// 전체 테마 객체
const theme = {
  colors,
  fontFamily,
  shadows,
  breakpoints,
  spacing,
  borderRadius,
  fontSize,
  animation
};

export default theme;