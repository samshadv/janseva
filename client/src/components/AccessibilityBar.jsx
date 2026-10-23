import React from "react";
import { useAccessibility } from "../contexts/AccessibilityContext";
import { Eye, SunMedium } from "lucide-react";

export function AccessibilityBar() {
  const { fontSize, setFontSize, highContrast, toggleHighContrast } = useAccessibility();

  return (
    <div className="gov-accessibility-strip" role="region" aria-label="Accessibility Controls">
      <div className="accessibility-strip-inner">
        <span className="accessibility-label">
          <Eye size={12} /> Accessibility:
        </span>

        <div className="text-size-controls" role="group" aria-label="Text Size Adjustment">
          <button
            type="button"
            className={`font-btn ${fontSize === "small" ? "active" : ""}`}
            onClick={() => setFontSize("small")}
            title="Decrease Font Size (A-)"
            aria-label="Decrease Font Size (A-)"
          >
            A-
          </button>
          <button
            type="button"
            className={`font-btn ${fontSize === "normal" ? "active" : ""}`}
            onClick={() => setFontSize("normal")}
            title="Default Font Size (A)"
            aria-label="Default Font Size (A)"
          >
            A
          </button>
          <button
            type="button"
            className={`font-btn ${fontSize === "large" || fontSize === "xlarge" ? "active" : ""}`}
            onClick={() => setFontSize("large")}
            title="Increase Font Size (A+)"
            aria-label="Increase Font Size (A+)"
          >
            A+
          </button>
        </div>

        <button
          type="button"
          className={`contrast-toggle-btn ${highContrast ? "active" : ""}`}
          onClick={toggleHighContrast}
          title="Toggle High Contrast Theme"
          aria-pressed={highContrast}
        >
          <SunMedium size={12} />
          <span>{highContrast ? "Normal Contrast" : "High Contrast"}</span>
        </button>
      </div>
    </div>
  );
}
