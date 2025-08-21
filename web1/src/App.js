// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';

// ─── page/ 아래 컴포넌트 import ──────────────────────
import Home from './page/home';
import Info from './page/info';

import Section1Page from './page/Section1Page';
import Section2Page from './page/Section2Page';
import Section3Page from './page/Section3Page';
import Section4Page from './page/Section4Page';
import Section5Page from './page/Section5Page';
import Section6Page from './page/Section6Page';
import Section7Page from './page/Section7Page';
import SurveyResultPage from './page/SurveyResultPage'; 

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router basename="/patient_survey/web1">
        <Routes>
          {/* 메인 화면 */}
          <Route path="/" element={<Home />} />
          <Route path="/info" element={<Info />} />

          {/* 7개 섹션 페이지 */}
          <Route path="/section1" element={<Section1Page />} />
          <Route path="/section2" element={<Section2Page />} />
          <Route path="/section3" element={<Section3Page />} />
          <Route path="/section4" element={<Section4Page />} />
          <Route path="/section5" element={<Section5Page />} />
          <Route path="/section6" element={<Section6Page />} />
          <Route path="/section7" element={<Section7Page />} />

          {/* 설문 결과 페이지 */}
+         <Route path="/survey-result" element={<SurveyResultPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
