import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, Check, ChevronDown,
  CircleHelp, ClipboardCheck, FileText, Globe2, Landmark, LoaderCircle,
  MapPin, Menu, MessageCircle, Search, ShieldCheck, Sparkles, UploadCloud,
  X, Copy, CheckCircle2, AlertTriangle, History, Zap, Lock,
  Printer, PhoneCall, Mic, MicOff
} from "lucide-react";
import { ConversationPanel } from "./components/ConversationPanel";
import { VerifiedBadge } from "./components/VerifiedBadge";
import { EligibilityCalculator } from "./components/EligibilityCalculator";
import { AccessibilityBar } from "./components/AccessibilityBar";
import { ConsentBanner } from "./components/ConsentBanner";
import { PrivacyModal } from "./components/PrivacyModal";
import { InteractivePlan } from "./components/InteractivePlan";
import { detectClientPII } from "./lib/piiMasker";
import { SUPPORTED_LANGUAGES } from "./lib/languages";

const QUICK_PILLS = [
  { icon: "🎓", label: "Scholarships", query: "I am a college student. How can I apply for post matric scholarship and prepare documents?" },
  { icon: "🌾", label: "Farmer Support (PM-Kisan)", query: "How can a farmer apply for PM-Kisan 6,000 yearly income support and complete e-KYC?" },
  { icon: "🏥", label: "Ayushman Card", query: "How to check eligibility and make an Ayushman Bharat 5 lakh cashless health card?" },
  { icon: "🪪", label: "Voter ID / Ration", query: "What is the procedure to apply for a new voter ID card online and verify documents?" },
  { icon: "🏠", label: "PMAY Housing", query: "How do I check if my family qualifies for Pradhan Mantri Awas Yojana Gramin house assistance?" },
];

const examples = [
  { icon: "🎓", title: "Scholarships", text: "I'm a college student. How can I find scholarships and prepare my documents?" },
  { icon: "🪪", title: "Identity documents", text: "I need to apply for a voter ID. Explain the steps and documents to check." },
  { icon: "🏠", title: "Public benefits", text: "How do I find out whether my family may qualify for a housing assistance scheme?" },
  { icon: "📄", title: "Government forms", text: "I have a confusing government form. Help me understand what information it asks for." }
];

const INDIAN_STATES_AND_UTS = [
  "Not specified",
  "Andaman & Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Other"
];

function statusLabel(status) {
  if (status === "commonly-needed") return "Commonly requested";
  if (status === "context-dependent") return "Depends on your situation";
  return "Verify with department";
}

export default function App() {
  const [message, setMessage] = useState("");
  const [stateName, setStateName] = useState("Maharashtra");
  const [language, setLanguage] = useState("English");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Ask JanSetu");
  const [copied, setCopied] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [piiWarning, setPiiWarning] = useState(null);

  function handleMessageChange(val) {
    setMessage(val);
    const warning = detectClientPII(val);
    setPiiWarning(warning);
  }

  function toggleSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice dictation is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === "Hindi" ? "hi-IN" : "en-IN";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setAnnouncement("Listening for citizen inquiry. Speak your question now.");
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((res) => res[0].transcript)
          .join("");
        handleMessageChange(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setAnnouncement("Voice input completed.");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }

  function handleAskFollowUp(questionText) {
    const followUpQuery = `${message || "Regarding this public service"} — Please specifically address: ${questionText}`;
    handleMessageChange(followUpQuery);
    ask(followUpQuery);
  }

  async function ask(prompt = message) {
    if (prompt.trim().length < 8) {
      setError("Tell us a little more about the service you need.");
      return;
    }
    setMessage(prompt);
    setLoading(true); setError(""); setResult(null); setActiveTab("Ask JanSetu");
    setAnnouncement("Contacting JanSetu guidance engine. Generating structured action plan. Please wait.");
    try {
      const response = await fetch("/api/assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: prompt, state: stateName, language })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data);
      setAnnouncement(`Action plan for ${data.serviceCategory || "requested service"} successfully generated with ${data.steps?.length || 0} clear steps.`);
    } catch (e) {
      setError(e.message || "Could not reach JanSetu. Check that the backend is running.");
      setAnnouncement("Failed to generate action plan: " + (e.message || "Network error."));
    } finally { setLoading(false); }
  }

  async function copyPlan() {
    if (!result) return;
    const content = [
      result.summary, "", "NEXT STEPS",
      ...result.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.detail}`),
      "", "DOCUMENTS TO CHECK",
      ...result.documents.map((d) => `- ${d.name} (${statusLabel(d.requiredStatus)}): ${d.reason}`),
      "", "VERIFY", ...result.officialSources.map((s) => `- ${s.title}: ${s.url}`)
    ].join("\n");
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    } catch { setError("Clipboard access was blocked by your browser."); }
  }

  function handleSelectHistory({ query, state, language: lang, result: histResult }) {
    setMessage(query);
    if (state) setStateName(state);
    if (lang) setLanguage(lang);
    setResult(histResult);
    setActiveTab("Ask JanSetu");
  }

  const nav = ["Ask JanSetu", "Explore services", "How it works"];
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      <div className="sr-only" role="status" aria-live="polite">{announcement}</div>
      <AccessibilityBar />

      <header className="topbar">
        <a className="brand" href="#" onClick={() => { setResult(null); setActiveTab("Ask JanSetu"); }}>
          <span className="brand-mark"><Landmark size={21}/></span>
          <span>jan<span className="brand-accent">setu</span><small>AI FOR PUBLIC GOOD</small></span>
        </a>
        <nav className={mobileMenu ? "nav-links open" : "nav-links"}>
          {nav.map((n) => <button key={n} className={activeTab === n ? "nav-link active" : "nav-link"} onClick={() => { setActiveTab(n); setMobileMenu(false); }}>{n}</button>)}
        </nav>
        <div className="top-actions">
          <span className="open-access-chip" title="100% Free and Open to all citizens without registration">
            <CheckCircle2 size={13} /> 100% Free & Open Access
          </span>
          <span className="privacy-note"><ShieldCheck size={14}/> Zero Logins · Privacy First</span>
          <button className="menu-button" aria-label="Toggle menu" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X/> : <Menu/>}</button>
        </div>
      </header>

      <main id="main-content" tabIndex="-1">
        {activeTab === "Explore services" ? (
          <section className="explore-page">
            <EligibilityCalculator
              states={INDIAN_STATES_AND_UTS}
              onSelectScheme={(schemeQuery) => {
                setMessage(schemeQuery);
                ask(schemeQuery);
              }}
            />

            <div className="eyebrow"><Landmark size={15}/> SERVICE DIRECTORY</div>
            <h1>Start with what<br/><span>you need.</span></h1>
            <p className="hero-sub">Choose a common topic, or ask in your own words. JanSetu helps you understand the process and what to verify.</p>
            <div className="example-grid">{examples.map((ex) => <button className="example-card" key={ex.title} onClick={() => ask(ex.text)}><span className="example-emoji">{ex.icon}</span><strong>{ex.title}</strong><p>{ex.text}</p><span className="card-arrow"><ArrowUpRight size={17}/></span></button>)}</div>
            <button className="back-link" onClick={() => setActiveTab("Ask JanSetu")}>← Back to assistant</button>
          </section>
        ) : activeTab === "How it works" ? (
          <section className="explore-page">
            <div className="eyebrow"><Sparkles size={15}/> SIMPLE BY DESIGN</div><h1>Clarity first.<br/><span>Action next.</span></h1>
            <div className="how-grid">{[{n:"01",title:"Tell us your situation",body:"Use everyday language. You don't need to know the official name of a scheme or form."},{n:"02",title:"Get a structured plan",body:"Gemini organizes your request into practical steps, possible documents, and follow-up questions."},{n:"03",title:"Verify before acting",body:"Use official department portals to confirm current rules. JanSetu never submits an application for you."}].map(x=><article className="how-card" key={x.n}><span>{x.n}</span><h3>{x.title}</h3><p>{x.body}</p></article>)}</div>
            <button className="primary-button" onClick={() => setActiveTab("Ask JanSetu")}>Ask JanSetu <ArrowRight size={17}/></button>
          </section>
        ) : (
          <>
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow"><span className="pulse-dot"/> YOUR GUIDE TO PUBLIC SERVICES</div>
                <h1>Government services,<br/><span>made clearer.</span></h1>
                <p className="hero-sub">Confusing forms, complicated schemes, too many steps? Start with your question. Get a simple plan for what to do next.</p>
                <div className="trust-row"><span><CheckCircle2 size={16}/> Plain-language help</span><span><CheckCircle2 size={16}/> Actionable checklists</span><span><CheckCircle2 size={16}/> Official links to verify</span></div>
              </div>
              <div className="hero-art" aria-label="Illustration of public service guidance">
                <div className="art-orbit orbit-one"></div><div className="art-orbit orbit-two"></div>
                <div className="art-center"><Landmark size={45}/><span>PUBLIC<br/>SERVICES</span></div>
                <div className="float-card float-one"><span className="float-icon mint"><ClipboardCheck size={20}/></span><span><b>Clear next steps</b><small>One thing at a time</small></span><Check size={17} className="check-green"/></div>
                <div className="float-card float-two"><span className="float-icon lavender"><FileText size={20}/></span><span><b>Document checklist</b><small>Know what to verify</small></span></div>
                <div className="float-card float-three"><span className="float-icon peach"><ShieldCheck size={20}/></span><span><b>Safer decisions</b><small>Verify before you apply</small></span></div>
                <div className="art-spark spark-a">✳</div><div className="art-spark spark-b">✦</div>
              </div>
            </section>

            <section className="assistant-layout" id="assistant">
              <div className="assistant-main">
                <div className="section-heading">
                  <div>
                    <div className="eyebrow">LET'S FIGURE IT OUT</div>
                    <h2>What do you need help with?</h2>
                    <p>Write it as you would explain it to a friend.</p>
                  </div>
                  <span className="ai-chip"><Sparkles size={14}/> Gemini-powered</span>
                </div>

                <div className="composer-card">
                  {/* Interactive Quick Topics Bar */}
                  <div className="quick-pills-bar">
                    <span className="pills-title">Quick Topics:</span>
                    <div className="pills-scroll">
                      {QUICK_PILLS.map((pill) => (
                        <button
                          key={pill.label}
                          type="button"
                          className="quick-pill-btn"
                          onClick={() => {
                            handleMessageChange(pill.query);
                            ask(pill.query);
                          }}
                        >
                          <span className="pill-emoji">{pill.icon}</span>
                          <span className="pill-text">{pill.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <label htmlFor="question" className="field-label">YOUR QUESTION</label>
                  <textarea
                    id="question"
                    value={message}
                    onChange={(e) => handleMessageChange(e.target.value)}
                    maxLength={6000}
                    placeholder="Example: I'm a student and I want to apply for a scholarship, but I'm not sure which documents I need..."
                  />

                  {piiWarning && (
                    <div className="pii-warning-banner" role="alert">
                      <Lock size={15} />
                      <span>{piiWarning}</span>
                    </div>
                  )}

                  <div className="composer-bottom">
                    <div className="composer-meta">
                      <button
                        type="button"
                        className={`voice-mic-btn ${isListening ? "active-listening" : ""}`}
                        onClick={toggleSpeechRecognition}
                        title={isListening ? "Listening... Click to finish" : "Click to speak your question in Hindi or English"}
                      >
                        {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                        <span>{isListening ? "Listening..." : "Speak Question"}</span>
                        {isListening && <span className="mic-pulse-ring" />}
                      </button>
                      <span className="char-count">{message.length}/6000 chars · PII Shield on</span>
                    </div>
                    <button className="primary-button" disabled={loading || message.trim().length < 8} onClick={() => ask()}>
                      {loading ? <><LoaderCircle className="spin" size={17}/> Working...</> : <>Make my action plan <ArrowRight size={17}/></>}
                    </button>
                  </div>
                  <div className="settings-row">
                    <label><MapPin size={15}/><span>State / UT</span><select value={stateName} onChange={(e) => setStateName(e.target.value)}>{INDIAN_STATES_AND_UTS.map(s=><option key={s}>{s}</option>)}</select><ChevronDown size={13}/></label>
                    <label><Globe2 size={15}/><span>Language</span><select value={language} onChange={(e) => setLanguage(e.target.value)}>{SUPPORTED_LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.name} ({l.nativeName})</option>)}</select><ChevronDown size={13}/></label>
                  </div>
                </div>

                {error && <div className="error-banner"><AlertTriangle size={17}/>{error}</div>}
                {!result && !loading && <div className="examples-area"><div className="examples-title"><span>NEED A STARTING POINT?</span><span>Try an example</span></div><div className="example-list">{examples.map(ex=><button key={ex.title} onClick={() => { setMessage(ex.text); setError(""); }}><span className="mini-emoji">{ex.icon}</span><span>{ex.title}</span><ArrowUpRight size={15}/></button>)}</div></div>}
                {loading && <div className="loading-card"><div className="loading-orb"><Sparkles size={24}/></div><h3>Making sense of your request...</h3><p>Organizing your question into steps and details to verify.</p><div className="loading-bar"><span/></div></div>}
                
                {result && (
                  <InteractivePlan
                    result={result}
                    copied={copied}
                    onCopy={copyPlan}
                    onPrint={() => window.print()}
                    onAskFollowUp={handleAskFollowUp}
                    onReset={() => { setResult(null); setError(""); }}
                  />
                )}
              </div>
              <aside className="side-column">
                <div className="side-card help-card"><div className="side-icon"><MessageCircle size={20}/></div><h3>Small question.<br/>Big difference.</h3><p>You don't need to know the official terminology. Just explain what you're trying to do.</p><div className="side-divider"/><div className="side-stat"><span>01</span><p><b>Describe</b><small>Tell us your situation</small></p></div><div className="side-stat"><span>02</span><p><b>Understand</b><small>Get plain-language guidance</small></p></div><div className="side-stat"><span>03</span><p><b>Take action</b><small>Know what to verify next</small></p></div></div>
                
                <div className="side-card helpline-card">
                  <div className="safety-head"><PhoneCall size={18}/><b>National Helplines</b></div>
                  <p className="helpline-intro">Official citizen emergency & assistance (24x7 / Toll-free):</p>
                  <ul className="helpline-list">
                    <li><span className="helpline-badge">112</span> <span>National Emergency (Police, Fire, Ambulance)</span></li>
                    <li><span className="helpline-badge">1930</span> <span>Cyber Financial Fraud / Cybercrime</span></li>
                    <li><span className="helpline-badge">14555</span> <span>Ayushman Bharat Health Protection</span></li>
                    <li><span className="helpline-badge">181</span> <span>Women in Distress / Safety</span></li>
                    <li><span className="helpline-badge">1915</span> <span>National Consumer Grievance Helpline</span></li>
                  </ul>
                  <div className="side-divider"/>
                  <div className="grievance-box">
                    <span className="grievance-label">Central Grievance Redressal</span>
                    <p>File or track official grievances with any central ministry or department:</p>
                    <a href="https://pgportal.gov.in" target="_blank" rel="noreferrer noopener" className="cpgrams-link">
                      Visit CPGRAMS (pgportal.gov.in) <ArrowUpRight size={13}/>
                    </a>
                  </div>
                </div>

                <div className="side-card safety-card"><div className="safety-head"><ShieldCheck size={20}/><b>Your safety matters</b></div><p>JanSetu will never need your password, OTP, Aadhaar number, PAN or bank PIN to explain a process.</p><a href="https://www.india.gov.in/" target="_blank" rel="noreferrer noopener">Visit India.gov.in <ArrowUpRight size={14}/></a></div>
                <div className="side-foot"><BookOpen size={16}/><span>Guidance is a starting point, not an official decision.</span></div>
              </aside>
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#"><span className="brand-mark"><Landmark size={18}/></span><span>jansetu<span className="brand-accent"> AI</span></span></a>
        <button
          type="button"
          onClick={() => setShowPrivacyModal(true)}
          style={{ background: "transparent", border: "0", color: "#64748b", fontSize: "11px", fontWeight: "600", cursor: "pointer", textDecoration: "underline" }}
        >
          DPDP Act 2023 · Privacy & Data Rights
        </button>
        <span className="footer-right"><ShieldCheck size={14}/> Verify before you apply</span>
      </footer>

      {showPrivacyModal && <PrivacyModal onClose={() => setShowPrivacyModal(false)} />}
      <ConversationPanel
        isOpen={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
        onSelectConversation={handleSelectHistory}
      />
      <ConsentBanner onOpenPrivacy={() => setShowPrivacyModal(true)} />
    </div>
  );
}
