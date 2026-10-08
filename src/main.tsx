import React from "react";
import ReactDOM from "react-dom/client";
import AOS from "aos";
import "aos/dist/aos.css";

import App from "./App";
import "./index.css";

AOS.init({
  duration: 650,
  easing: "ease-out-cubic",
  once: true,
  offset: 80,
  delay: 0,
  mirror: false,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);