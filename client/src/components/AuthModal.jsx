import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { X, Lock, Mail, UserCheck, AlertCircle, Sparkles } from "lucide-react";

export function AuthModal({ onClose }) {
  const { signInWithEmail, signUpWithEmail, isConfigured } = useAuth();
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isConfigured) {
      setError("Supabase credentials are not yet configured in client/.env.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      if (tab === "login") {
        await signInWithEmail(email, password);
        onClose();
      } else {
        await signUpWithEmail(email, password);
        setSuccessMsg("Account created! Check your email for confirmation or log in.");
      }
    } catch (err) {
      setError(err?.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="auth-modal-header">
          <div className="auth-badge">
            <Sparkles size={16} /> JanSetu Citizen ID
          </div>
          <h3>{tab === "login" ? "Welcome back" : "Create Citizen Account"}</h3>
          <p>
            {tab === "login"
              ? "Access your saved schemes, inquiry history, and personal preferences."
              : "Sign up to track your service applications and guidance across devices."}
          </p>
        </div>

        {!isConfigured && (
          <div className="auth-unconfigured-notice">
            <AlertCircle size={16} />
            <div>
              <strong>Supabase Setup Required</strong>
              <span>Add your VITE_SUPABASE_URL & ANON KEY to client/.env to enable persistent logins.</span>
            </div>
          </div>
        )}

        <div className="auth-tab-buttons">
          <button
            type="button"
            className={`auth-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => { setTab("login"); setError(""); setSuccessMsg(""); }}
          >
            Log In
          </button>
          <button
            type="button"
            className={`auth-tab ${tab === "signup" ? "active" : ""}`}
            onClick={() => { setTab("signup"); setError(""); setSuccessMsg(""); }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-field">
            <label htmlFor="auth-email">Email Address</label>
            <div className="auth-input-wrapper">
              <Mail size={16} />
              <input
                id="auth-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-input-field">
            <label htmlFor="auth-password">Password</label>
            <div className="auth-input-wrapper">
              <Lock size={16} />
              <input
                id="auth-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="auth-feedback error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="auth-feedback success">
              <UserCheck size={15} />
              <span>{successMsg}</span>
            </div>
          )}

          <button type="submit" className="primary-button auth-submit-btn" disabled={loading}>
            {loading ? "Processing..." : tab === "login" ? "Log In" : "Create Account"}
          </button>
        </form>

        <div className="auth-modal-footer">
          <span>🔒 Protected with Row-Level Security & Encrypted Auth</span>
        </div>
      </div>
    </div>
  );
}
