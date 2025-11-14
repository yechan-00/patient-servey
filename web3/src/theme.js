// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#397FE2',
      contrastText: '#fff',
    },
    secondary: {
      main: '#8E44AD',
      contrastText: '#fff',
    },
    background: {
      default: '#E3F2FD', // 연한 스카이 블루
      paper: '#fff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
    divider: 'rgba(0,0,0,0.08)',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: { height: '100%' },
        body: {
          height: '100%',
          margin: 0,
          backgroundColor: '#E3F2FD', // ✅ 단색 배경 사용
        },
        '#root': {
          height: '100%',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          // ❌ 그라데이션 제거 (원하면 이 줄도 완전히 삭제 가능)
        },
      },
    },
  },
});

export default theme;
