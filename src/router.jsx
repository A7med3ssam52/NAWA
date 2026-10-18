import { useEffect } from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";

export { BrowserRouter, Routes, Route } from "react-router-dom";

export function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, search]);
  return null;
}

export default Router;
