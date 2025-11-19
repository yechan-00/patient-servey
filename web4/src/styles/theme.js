// src/styles/theme.js
const theme = {
  colors: {
    // Primary (의료 커뮤니티 특화 - 희망과 치유)
    primary: {
      50: "#e8f5e9",
      100: "#c8e6c9",
      200: "#a5d6a7",
      300: "#81c784",
      400: "#66bb6a",
      500: "#4caf50", // 메인 그린
      600: "#43a047",
      700: "#388e3c",
      800: "#2e7d32",
      900: "#1b5e20",
    },
    // Secondary (돌봄과 신뢰)
    secondary: {
      50: "#e3f2fd",
      100: "#bbdefb",
      200: "#90caf9",
      300: "#64b5f6",
      400: "#42a5f5",
      500: "#2196f3", // 메인 블루
      600: "#1e88e5",
      700: "#1976d2",
      800: "#1565c0",
      900: "#0d47a1",
    },
    // Support (지원과 공감)
    support: {
      50: "#f3e5f5",
      100: "#e1bee7",
      200: "#ce93d8",
      300: "#ba68c8",
      400: "#ab47bc",
      500: "#9c27b0",
      600: "#8e24aa",
      700: "#7b1fa2",
      800: "#6a1b9a",
      900: "#4a148c",
    },
    // Semantic Colors
    success: "#4caf50",
    warning: "#ff9800",
    error: "#f44336",
    info: "#2196f3",
    // Neutral
    neutral: {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#eeeeee",
      300: "#e0e0e0",
      400: "#bdbdbd",
      500: "#9e9e9e",
      600: "#757575",
      700: "#616161",
      800: "#424242",
      900: "#212121",
    },
    // Legacy (하위 호환성)
    primaryDark: "#1d4269",
    primaryLight: "#3a7eb8",
    light: "#f8f9fa",
    dark: "#343a40",
    white: "#ffffff",
    text: "#212121",
    textSecondary: "#616161",
    border: "#e0e0e0",
  },
  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    xxl: "3rem", // 48px
    xxxl: "4rem", // 64px
  },
  borderRadius: {
    xs: "4px",
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    round: "50%",
  },
  shadows: {
    xs: "0 1px 2px rgba(0, 0, 0, 0.05)",
    sm: "0 2px 4px rgba(0, 0, 0, 0.08)",
    md: "0 4px 8px rgba(0, 0, 0, 0.1)",
    lg: "0 8px 16px rgba(0, 0, 0, 0.12)",
    xl: "0 12px 24px rgba(0, 0, 0, 0.15)",
    // Colored shadows
    primary: "0 4px 12px rgba(33, 150, 243, 0.2)",
    success: "0 4px 12px rgba(76, 175, 80, 0.2)",
    support: "0 4px 12px rgba(156, 39, 176, 0.2)",
  },
  typography: {
    fontFamily: {
      korean:
        '-apple-system, "Noto Sans KR", "Apple SD Gothic Neo", sans-serif',
      english:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    fontSize: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "2rem", // 32px
      "4xl": "2.5rem", // 40px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  transitions: {
    default: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    fast: "all 0.15s ease-out",
    slow: "all 0.5s ease-in-out",
    spring: "all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },
  breakpoints: {
    mobile: "768px",
    tablet: "1024px",
    desktop: "1280px",
    wide: "1536px",
  },
  // 카테고리별 색상 매핑 (중성톤 + 패스텔)
  categoryColors: {
    all: { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" },
    free: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
    question: { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
    review: { bg: "#f3e8ff", text: "#6b21a8", border: "#c4b5fd" },
    info: { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
    support: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  },
  // 카테고리별 아이콘
  categoryIcons: {
    all: "📋",
    free: "💬",
    question: "❓",
    review: "⭐",
    info: "📚",
    support: "🤝",
  },
};

export default theme;
