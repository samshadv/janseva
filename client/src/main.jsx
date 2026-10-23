import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { AccessibilityProvider } from "./contexts/AccessibilityContext.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AccessibilityProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AccessibilityProvider>
  </React.StrictMode>
);
