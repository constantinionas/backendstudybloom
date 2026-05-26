import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { AppSettingsProvider } from "./context/AppSettingsContext";
import { QuizProvider } from "./context/QuizContext";

import "./styles/variables.css";
import "./styles/global.css";
import "./styles/theme.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AppSettingsProvider>
        <QuizProvider>
          <App />
        </QuizProvider>
      </AppSettingsProvider>
    </BrowserRouter>
  </StrictMode>
);