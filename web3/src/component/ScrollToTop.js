// web1/src/component/ScrollToTop.js
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 라우트가 바뀔 때마다 최상단으로
    window.scrollTo({ top: 0, left: 0, behavior: "auto" }); // "smooth"도 가능
  }, [pathname]);

  return null;
}
