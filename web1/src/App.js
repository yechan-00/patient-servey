// web1\src\App.js
import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";

import Home from "./page/home";
import Info from "./page/info";
import Section1Page from "./page/Section1Page";
import Section2Page from "./page/Section2Page";
import Section3Page from "./page/Section3Page";
import Section4Page from "./page/Section4Page";
import Section5Page from "./page/Section5Page";
import Section6Page from "./page/Section6Page";
import Section7Page from "./page/Section7Page";
import SurveyResultPage from "./page/SurveyResultPage";
import CounselingRequestPage from "./page/CounselingRequestPage";
import ScrollToTop from "./component/ScrollToTop";
import { SurveyFormProvider } from "./context/SurveyFormContext";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router basename="/patient-servey/web1">
        <ScrollToTop />

        {/* ✅ 설문 관련 페이지 전체를 Provider로 감쌈 */}
        <SurveyFormProvider storageKey="survey-draft" schemaVersion={1}>
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
            <Route path="/survey-result" element={<SurveyResultPage />} />

            {/* 상담 요청 페이지 */}
            <Route
              path="/counseling-request"
              element={<CounselingRequestPage />}
            />
          </Routes>
        </SurveyFormProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
