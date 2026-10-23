import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { X, ShieldCheck, Download, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";

export function PrivacyModal({ onClose }) {
  const { isAuthenticated, getToken, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleExportData() {
    if (!isAuthenticated) {
      setErrorMsg("Please log in to export your saved inquiries.");
      return;
    }
    setLoading(true);
    setStatusMsg("");
    setErrorMsg("");

    try {
      const token = getToken();
      const res = await fetch("/api/me/export", {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jansetu_data_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setStatusMsg("Data exported successfully! Check your downloads folder.");
    } catch (err) {
      setErrorMsg("Failed to generate data export. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEraseData() {
    if (!isAuthenticated) {
      setErrorMsg("Please log in to manage your stored records.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to permanently erase all your saved inquiries and profile? This action is irreversible under DPDP Act 2023."
    );
    if (!confirmed) return;

    setLoading(true);
    setStatusMsg("");
    setErrorMsg("");

    try {
      const token = getToken();
      const res = await fetch("/api/me", {
        method: "DELETE",
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });

      if (!res.ok) throw new Error("Erasure failed");

      setStatusMsg("All data permanently erased. Signing you out...");
      setTimeout(async () => {
        await signOut();
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg("Failed to erase records. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-card privacy-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="auth-modal-header">
          <div className="auth-badge">
            <ShieldCheck size={16} /> DPDP ACT 2023 COMPLIANCE
          </div>
          <h3>Citizen Privacy & Data Rights</h3>
          <p>
            JanSetu AI is committed to open governance and Indian data protection principles.
            You have full ownership and statutory rights over your inquiry data.
          </p>
        </div>

        <div className="privacy-principles-list">
          <div className="privacy-principle-item">
            <CheckCircle2 size={16} className="text-emerald" />
            <div>
              <strong>No Aadhaar or Biometric Retention</strong>
              <small>Sensitive identity numbers are automatically redacted before LLM processing.</small>
            </div>
          </div>
          <div className="privacy-principle-item">
            <CheckCircle2 size={16} className="text-emerald" />
            <div>
              <strong>Statutory Right to Data Portability (Section 11)</strong>
              <small>Download your complete inquiry history and profile in structured JSON format.</small>
            </div>
          </div>
          <div className="privacy-principle-item">
            <CheckCircle2 size={16} className="text-emerald" />
            <div>
              <strong>Right to Complete Erasure (Section 12)</strong>
              <small>Permanently purge your account, conversations, and records from our databases.</small>
            </div>
          </div>
        </div>

        {statusMsg && (
          <div className="auth-feedback success">
            <CheckCircle2 size={15} />
            <span>{statusMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="auth-feedback error">
            <AlertTriangle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="dpdp-actions-row">
          <button
            type="button"
            className="privacy-action-btn export"
            onClick={handleExportData}
            disabled={loading}
          >
            <Download size={15} />
            <span>Export My Data (JSON)</span>
          </button>

          <button
            type="button"
            className="privacy-action-btn delete"
            onClick={handleEraseData}
            disabled={loading}
          >
            <Trash2 size={15} />
            <span>Erase My Records</span>
          </button>
        </div>

        <div className="auth-modal-footer">
          <span>Protected under Information Technology Act, 2000 & DPDP Act, 2023</span>
        </div>
      </div>
    </div>
  );
}
