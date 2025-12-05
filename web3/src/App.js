// web3/src/App.js
import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";

import Home from "./page/home";
import Info from "./page/info";
import Section1Page from "./page/Section1Page";
import Section2Page from "./page/Section2Page";
import SurveyResultPage from "./page/SurveyResultPage";
import CounselingRequestPage from "./page/CounselingRequestPage";
import ScrollToTop from "./component/ScrollToTop";
import { SurveyFormProvider } from "./context/SurveyFormContext";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <ScrollToTop />

        {/* ✅ 설문 관련 페이지 전체를 Provider로 감쌈 */}
        <SurveyFormProvider storageKey="survey-draft" schemaVersion={1}>
          <Routes>
            {/* 메인 화면 */}
            <Route path="/" element={<Home />} />
            <Route path="/info" element={<Info />} />

            {/* 설문 섹션 페이지 */}
            <Route path="/section1" element={<Section1Page />} />
            <Route path="/section2" element={<Section2Page />} />

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
