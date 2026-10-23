import React, { createContext, useContext, useState, useEffect } from "react";

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("jansetu_fontsize") || "normal");
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem("jansetu_contrast") === "high");

  useEffect(() => {
    localStorage.setItem("jansetu_fontsize", fontSize);
    document.documentElement.setAttribute("data-font-size", fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("jansetu_contrast", highContrast ? "high" : "normal");
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [highContrast]);

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        toggleHighContrast: () => setHighContrast((prev) => !prev),
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used within AccessibilityProvider");
  return ctx;
}
