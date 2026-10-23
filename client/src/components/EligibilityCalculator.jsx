import React, { useState } from "react";
import { Sparkles, ArrowRight, CheckCircle2, FileText, ExternalLink, Filter, HelpCircle } from "lucide-react";
import { VerifiedBadge } from "./VerifiedBadge";

const OCCUPATION_OPTIONS = [
  "Any",
  "Student",
  "Farmer",
  "Agricultural Laborer",
  "Street Vendor / Small Business",
  "Daily Wage Earner",
  "Senior Citizen",
];

const INCOME_OPTIONS = [
  { label: "Below ₹1 Lakh / year (BPL)", value: "BELOW_1L" },
  { label: "₹1 Lakh - ₹2.5 Lakhs / year", value: "UPTO_2_5L" },
  { label: "₹2.5 Lakhs - ₹5 Lakhs / year", value: "UPTO_5L" },
  { label: "₹5 Lakhs - ₹8 Lakhs / year", value: "UPTO_8L" },
  { label: "Above ₹8 Lakhs / year", value: "ABOVE_8L" },
];

export function EligibilityCalculator({ states, onSelectScheme }) {
  const [state, setState] = useState("Maharashtra");
  const [age, setAge] = useState("24");
  const [occupation, setOccupation] = useState("Student");
  const [incomeBracket, setIncomeBracket] = useState("UPTO_2_5L");
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFindSchemes(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/schemes/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state,
          age: Number(age) || undefined,
          occupation,
          incomeBracket,
        }),
      });

      if (!res.ok) throw new Error("Could not calculate matches.");
      const data = await res.json();
      setMatches(data.matches || []);
    } catch (err) {
      setError(err?.message || "Failed to calculate scheme eligibility.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="eligibility-widget">
      <div className="eligibility-intro">
        <div className="eyebrow">
          <Sparkles size={14} /> ELIGIBILITY MATCHER
        </div>
        <h2>Find Schemes You May Qualify For</h2>
        <p>Answer 4 simple questions to discover government schemes matched to your profile.</p>
      </div>

      <form onSubmit={handleFindSchemes} className="eligibility-form">
        <div className="eligibility-grid">
          <div className="calc-field">
            <label>State / Union Territory</label>
            <select value={state} onChange={(e) => setState(e.target.value)}>
              {states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="calc-field">
            <label>Citizen Age (Years)</label>
            <input
              type="number"
              min="0"
              max="110"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />
          </div>

          <div className="calc-field">
            <label>Occupation / Category</label>
            <select value={occupation} onChange={(e) => setOccupation(e.target.value)}>
              {OCCUPATION_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <div className="calc-field">
            <label>Annual Family Income</label>
            <select value={incomeBracket} onChange={(e) => setIncomeBracket(e.target.value)}>
              {INCOME_OPTIONS.map((inc) => (
                <option key={inc.value} value={inc.value}>{inc.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="primary-button calc-submit-btn" disabled={loading}>
          {loading ? "Matching Criteria..." : "Find Matched Schemes"}
          <ArrowRight size={16} />
        </button>
      </form>

      {error && <div className="error-banner">{error}</div>}

      {matches && (
        <div className="matched-schemes-results">
          <div className="results-counter">
            <strong>Found {matches.length} Matched Schemes</strong>
            <span>Ranked by verified eligibility criteria match</span>
          </div>

          <div className="schemes-cards-list">
            {matches.map((scheme) => (
              <div key={scheme.code} className="scheme-match-card">
                <div className="scheme-card-header">
                  <div>
                    <span className="scheme-category-badge">{scheme.category}</span>
                    <h3>{scheme.title}</h3>
                    <small>{scheme.ministry}</small>
                  </div>
                  <div className="match-score-badge">
                    <span>{scheme.matchPercentage}%</span>
                    <small>Match</small>
                  </div>
                </div>

                <p className="scheme-summary-text">{scheme.summary}</p>

                <div className="match-reasons-list">
                  {scheme.matchReasons.map((r, i) => (
                    <span key={i} className="match-reason-tag">
                      <CheckCircle2 size={12} /> {r}
                    </span>
                  ))}
                </div>

                <div className="scheme-docs-preview">
                  <strong>Key Documents:</strong>
                  <span>{scheme.requiredDocuments.join(" · ")}</span>
                </div>

                <div className="scheme-card-actions">
                  <a
                    href={scheme.officialPortal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="scheme-portal-link"
                  >
                    <VerifiedBadge />
                    <span>Official Portal</span>
                    <ExternalLink size={13} />
                  </a>

                  <button
                    type="button"
                    className="scheme-ask-btn"
                    onClick={() =>
                      onSelectScheme(
                        `How can I apply for ${scheme.title}? Please explain the exact process and documents.`
                      )
                    }
                  >
                    <span>Ask JanSetu for Action Plan</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
