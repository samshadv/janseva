import React, { useState, useEffect } from "react";
import {
  BadgeCheck, Check, Copy, Printer, Volume2, VolumeX, Play, Pause,
  ChevronRight, ChevronLeft, ArrowRight, ArrowUpRight, FileText, Globe2,
  AlertTriangle, ShieldCheck, Zap, Sparkles, CheckCircle2, RotateCcw
} from "lucide-react";
import { VerifiedBadge } from "./VerifiedBadge";

export function InteractivePlan({
  result,
  copied,
  onCopy,
  onPrint,
  onAskFollowUp,
  onReset
}) {
  // Checklist readiness state
  const [completedSteps, setCompletedSteps] = useState({});
  const [readyDocs, setReadyDocs] = useState({});
  const [viewMode, setViewMode] = useState("all"); // "all" | "stepper"
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // Audio Speech state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Initialize or restore progress when result changes
  useEffect(() => {
    setCompletedSteps({});
    setReadyDocs({});
    setCurrentStepIdx(0);
    stopSpeaking();
  }, [result]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const totalItems = (result?.steps?.length || 0) + (result?.documents?.length || 0);
  const completedCount =
    Object.values(completedSteps).filter(Boolean).length +
    Object.values(readyDocs).filter(Boolean).length;
  const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  function toggleStep(idx) {
    setCompletedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  function toggleDoc(idx) {
    setReadyDocs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  function resetChecklist() {
    setCompletedSteps({});
    setReadyDocs({});
  }

  // Voice narration using SpeechSynthesis
  function toggleSpeech() {
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
      return;
    }

    const textToRead = [
      result.summary,
      "Here are your action steps.",
      ...result.steps.map((s, i) => `Step ${i + 1}: ${s.title}. ${s.detail}`),
      "Required documents checklist.",
      ...result.documents.map((d) => `${d.name}. ${d.reason}`)
    ].join(" ");

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Pick best voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishIndian = voices.find((v) => v.lang.includes("en-IN") || v.lang.includes("hi-IN"));
    if (englishIndian) utterance.voice = englishIndian;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  }

  function statusLabel(status) {
    if (status === "mandatory") return "Usually required";
    if (status === "optional") return "Helpful if available";
    if (status === "context-dependent") return "Depends on situation";
    return "Verify with department";
  }

  return (
    <section className="result-panel interactive-panel" aria-label="Action Plan">
      {/* Header with Title and Interactive Actions */}
      <div className="result-head">
        <div>
          <div className="eyebrow"><BadgeCheck size={14} /> YOUR ACTION PLAN</div>
          <h2>{result.serviceCategory}</h2>
        </div>
        <div className="result-actions">
          {result.fromCache && (
            <span className="ai-chip" title="Instant verified response">
              <Zap size={13} /> Instant Verified
            </span>
          )}

          {/* Audio Reader Button */}
          <button
            type="button"
            className={`interactive-btn audio-btn ${isSpeaking ? "playing" : ""}`}
            onClick={toggleSpeech}
            title={isSpeaking ? (isPaused ? "Resume voice guidance" : "Pause voice guidance") : "Listen to guidance"}
            aria-label="Listen to action plan"
          >
            {isSpeaking ? (
              isPaused ? <Play size={14} /> : <Pause size={14} />
            ) : (
              <Volume2 size={14} />
            )}
            <span>{isSpeaking ? (isPaused ? "Resume" : "Listening...") : "Listen"}</span>
            {isSpeaking && !isPaused && (
              <span className="sound-wave">
                <span /><span /><span />
              </span>
            )}
          </button>

          {/* Print A4 Button */}
          <button
            type="button"
            className="outline-button print-btn"
            onClick={onPrint}
            title="Print or save A4 action plan for CSC kiosk"
          >
            <Printer size={14} /> Print / Save A4
          </button>

          {/* Copy Plan Button */}
          <button
            type="button"
            className="outline-button"
            onClick={onCopy}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy plan"}
          </button>
        </div>
      </div>

      <p className="result-summary">{result.summary}</p>

      {/* Referenced Grounded Official Schemes Strip */}
      {result.groundedSchemes?.length > 0 && (
        <div className="grounded-schemes-strip">
          <span className="grounded-strip-title">
            <ShieldCheck size={14} /> REFERENCED OFFICIAL SCHEMES:
          </span>
          {result.groundedSchemes.map((gs) => (
            <span key={gs.code} className="grounded-scheme-chip" title={gs.title}>
              🏛️ {gs.title}
            </span>
          ))}
        </div>
      )}

      {/* Intent & Confidence Strip */}
      <div className="intent-strip">
        <span>Likely need</span>
        <strong>{result.likelyIntent}</strong>
        <span className={`confidence ${result.confidence}`}>
          {result.confidence} confidence
        </span>
      </div>

      {/* Interactive Preparation Meter & View Mode Switcher */}
      <div className="readiness-card">
        <div className="readiness-top">
          <div className="readiness-info">
            <strong>Citizen Preparation Meter</strong>
            <span>{completedCount} of {totalItems} checklist items marked ready ({progressPercent}%)</span>
          </div>
          <div className="readiness-controls">
            <div className="view-toggle">
              <button
                type="button"
                className={`toggle-tab ${viewMode === "all" ? "active" : ""}`}
                onClick={() => setViewMode("all")}
              >
                All Checklist
              </button>
              <button
                type="button"
                className={`toggle-tab ${viewMode === "stepper" ? "active" : ""}`}
                onClick={() => setViewMode("stepper")}
              >
                Step-by-Step
              </button>
            </div>
            {completedCount > 0 && (
              <button
                type="button"
                className="reset-progress-btn"
                onClick={resetChecklist}
                title="Reset preparation marks"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="progress-track" role="progressbar" aria-valuenow={progressPercent} aria-valuemin="0" aria-valuemax="100">
          <div
            className={`progress-fill ${progressPercent === 100 ? "complete" : ""}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {progressPercent === 100 && (
          <div className="celebration-banner">
            <CheckCircle2 size={16} />
            <span><strong>Ready to Apply!</strong> You've verified all preparation steps and documents.</span>
          </div>
        )}
      </div>

      {/* SECTION 1: STEPS (EITHER FULL LIST OR STEPPER VIEW) */}
      <div className="result-section">
        <div className="section-title-row">
          <h3><span className="number-icon">1</span> Your next steps</h3>
          <span className="section-badge">Click steps to track completion</span>
        </div>

        {viewMode === "stepper" ? (
          /* STEP-BY-STEP GUIDED MODE */
          <div className="stepper-box">
            <div className="stepper-header">
              <span className="stepper-count">
                STEP {currentStepIdx + 1} OF {result.steps.length}
              </span>
              <button
                type="button"
                className={`stepper-check-btn ${completedSteps[currentStepIdx] ? "checked" : ""}`}
                onClick={() => toggleStep(currentStepIdx)}
              >
                <Check size={14} />
                <span>{completedSteps[currentStepIdx] ? "Step Completed" : "Mark as Done"}</span>
              </button>
            </div>

            <div className="stepper-body">
              <h4>{result.steps[currentStepIdx].title}</h4>
              <p>{result.steps[currentStepIdx].detail}</p>
            </div>

            <div className="stepper-nav">
              <button
                type="button"
                className="stepper-nav-btn"
                disabled={currentStepIdx === 0}
                onClick={() => setCurrentStepIdx((i) => Math.max(0, i - 1))}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <div className="stepper-dots">
                {result.steps.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`stepper-dot ${idx === currentStepIdx ? "active" : ""} ${completedSteps[idx] ? "done" : ""}`}
                    onClick={() => setCurrentStepIdx(idx)}
                    aria-label={`Jump to step ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                className="stepper-nav-btn"
                disabled={currentStepIdx === result.steps.length - 1}
                onClick={() => setCurrentStepIdx((i) => Math.min(result.steps.length - 1, i + 1))}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* FULL INTERACTIVE CHECKLIST VIEW */
          <div className="step-list">
            {result.steps.map((s, i) => {
              const isDone = Boolean(completedSteps[i]);
              return (
                <div
                  className={`step-item interactive-step ${isDone ? "is-done" : ""}`}
                  key={i}
                  onClick={() => toggleStep(i)}
                  role="checkbox"
                  aria-checked={isDone}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      toggleStep(i);
                    }
                  }}
                >
                  <div className={`step-check-circle ${isDone ? "checked" : ""}`}>
                    {isDone ? <Check size={14} /> : <span>{String(i + 1).padStart(2, "0")}</span>}
                  </div>
                  <div className="step-content">
                    <strong>{s.title}</strong>
                    <p>{s.detail}</p>
                  </div>
                  <span className="step-hint">{isDone ? "Completed" : "Click to mark done"}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: DOCUMENTS TO CHECK */}
      {result.documents.length > 0 && (
        <div className="result-section">
          <div className="section-title-row">
            <h3><span className="number-icon">2</span> Documents to check</h3>
            <span className="section-badge">Check off documents you have</span>
          </div>
          <p className="section-caption">
            Click any document to mark it ready for your application.
          </p>
          <div className="document-list">
            {result.documents.map((d, i) => {
              const isReady = Boolean(readyDocs[i]);
              return (
                <div
                  className={`document-item interactive-doc ${isReady ? "is-ready" : ""}`}
                  key={i}
                  onClick={() => toggleDoc(i)}
                  role="checkbox"
                  aria-checked={isReady}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      toggleDoc(i);
                    }
                  }}
                >
                  <div className={`doc-check-box ${isReady ? "checked" : ""}`}>
                    {isReady ? <Check size={13} /> : <FileText size={15} />}
                  </div>
                  <div className="doc-content">
                    <strong>{d.name}</strong>
                    <p>{d.reason}</p>
                    <div className="doc-tags">
                      <span className="doc-status">{statusLabel(d.requiredStatus)}</span>
                      <span className={`ready-badge ${isReady ? "ready" : "needed"}`}>
                        {isReady ? "✓ Have it ready" : "Need to prepare"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: INTERACTIVE FOLLOW-UP QUESTIONS */}
      {result.questions.length > 0 && (
        <div className="result-section">
          <div className="section-title-row">
            <h3><span className="number-icon">3</span> A few details may help</h3>
            <span className="section-badge">Click question to explore</span>
          </div>
          <div className="interactive-question-list">
            {result.questions.map((q, i) => (
              <div className="interactive-question-item" key={i}>
                <span className="q-bullet">?</span>
                <span className="q-text">{q}</span>
                <button
                  type="button"
                  className="ask-followup-btn"
                  onClick={() => onAskFollowUp(q)}
                  title="Ask JanSetu this follow-up detail"
                >
                  <span>Explore this</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: PLACES TO VERIFY (OFFICIAL GOV PORTALS) */}
      {result.officialSources.length > 0 && (
        <div className="result-section">
          <h3><span className="number-icon">4</span> Places to verify</h3>
          <p className="section-caption">
            Links verified against official government registries before recommendation.
          </p>
          <div className="source-list">
            {result.officialSources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noreferrer noopener"
                className="interactive-source-card"
              >
                <span className="source-icon"><Globe2 size={18} /></span>
                <span className="source-details">
                  <strong>{s.title} <VerifiedBadge /></strong>
                  <small>{s.why}</small>
                  <em>{s.url}</em>
                </span>
                <span className="source-action">
                  Open Portal <ArrowUpRight size={15} />
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* CAUTIONS & DISCLAIMER */}
      {result.cautions.length > 0 && (
        <div className="caution-box">
          <AlertTriangle size={18} />
          <div>
            <strong>Keep in mind</strong>
            <ul>
              {result.cautions.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="disclaimer">
        <ShieldCheck size={17} />
        <p>{result.disclaimer}</p>
      </div>

      <button
        type="button"
        className="try-again"
        onClick={onReset}
      >
        Ask another question <ArrowRight size={16} />
      </button>
    </section>
  );
}
