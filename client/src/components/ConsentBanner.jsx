import React, { useState, useEffect } from "react";
import { ShieldCheck, Check, Info } from "lucide-react";

export function ConsentBanner({ onOpenPrivacy }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("jansetu_dpdp_consent");
    if (!consent) {
      setShow(true);
    }
  }, []);

  function handleAccept() {
    localStorage.setItem("jansetu_dpdp_consent", new Date().toISOString());
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="dpdp-consent-banner" role="dialog" aria-live="polite" aria-label="Privacy Consent Notice">
      <div className="dpdp-banner-inner">
        <div className="dpdp-banner-content">
          <span className="dpdp-icon-badge">
            <ShieldCheck size={18} />
          </span>
          <div>
            <strong>DPDP Act 2023 · Privacy & Data Protection Notice</strong>
            <p>
              JanSetu AI processes public queries using generative AI. We never store Aadhaar, biometric, or banking details.
              Under the Digital Personal Data Protection Act 2023, you retain the statutory right to export or permanently erase your inquiry records at any time.
            </p>
          </div>
        </div>

        <div className="dpdp-banner-actions">
          <button type="button" className="dpdp-learn-btn" onClick={onOpenPrivacy}>
            Read Privacy Terms
          </button>
          <button type="button" className="primary-button dpdp-accept-btn" onClick={handleAccept}>
            <Check size={14} /> I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
