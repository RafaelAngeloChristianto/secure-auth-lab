// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// import LoginScreen from "./pages/LoginScreen.tsx";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App.tsx";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

createRoot(document.getElementById("root")!).render(
  <GoogleReCaptchaProvider reCaptchaKey="6Lfx3RwtAAAAAHx_7qWqBVnzSKJkrSQOOeuMK8OE">
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </GoogleReCaptchaProvider>,
);
