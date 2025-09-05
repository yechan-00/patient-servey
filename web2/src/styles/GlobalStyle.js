// src/styles/GlobalStyle.js
import { createGlobalStyle } from 'styled-components';
import theme from './theme';

const GlobalStyle = createGlobalStyle`
  /* 폰트 로딩 및 기본 스타일 적용 */
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
  }

  body {
    font-family: ${theme.fontFamily};
    line-height: 1.6;
    color: ${theme.colors.neutral.text};
    background-color: ${theme.colors.neutral.background};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4, h5, h6 {
    margin: 0 0 ${theme.spacing.md} 0;
    font-weight: 700;
    line-height: 1.3;
    color: ${theme.colors.neutral.black};
  }

  h1 {
    font-size: ${theme.fontSize.heading1};
  }

  h2 {
    font-size: ${theme.fontSize.heading2};
  }

  h3 {
    font-size: ${theme.fontSize.heading3};
  }

  h4 {
    font-size: ${theme.fontSize.heading4};
  }

  p {
    margin: 0 0 ${theme.spacing.md} 0;
  }

  a {
    color: ${theme.colors.primary.main};
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: ${theme.colors.primary.dark};
    }
  }

  button, input, select, textarea {
    font-family: inherit;
    font-size: inherit;
    color: inherit;
  }

  button {
    cursor: pointer;
    border: none;
    background-color: transparent;
  }

  ul, ol {
    list-style: none;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    text-align: left;
  }

  /* 포커스 관련 접근성 스타일 */
  :focus {
    outline: none;
  }

  :focus-visible {
    outline: 3px solid ${theme.colors.primary.light};
    outline-offset: 2px;
  }
`;

export default GlobalStyle;