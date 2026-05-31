// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// import LoginScreen from "./pages/LoginScreen.tsx";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
