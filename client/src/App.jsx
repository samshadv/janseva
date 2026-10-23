import { useState } from "react";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, Check, ChevronDown,
  CircleHelp, ClipboardCheck, FileText, Globe2, Landmark, LoaderCircle,
  MapPin, Menu, MessageCircle, Search, ShieldCheck, Sparkles, UploadCloud,
  X, Copy, CheckCircle2, AlertTriangle
} from "lucide-react";

const examples = [
  { icon: "🎓", title: "Scholarships", text: "I'm a college student. How can I find scholarships and prepare my documents?" },
  { icon: "🪪", title: "Identity documents", text: "I need to apply for a voter ID. Explain the steps and documents to check." },
  { icon: "🏠", title: "Public benefits", text: "How do I find out whether my family may qualify for a housing assistance scheme?" },
  { icon: "📄", title: "Government forms", text: "I have a confusing government form. Help me understand what information it asks for." }
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

  async function ask(prompt = message) {
    if (prompt.trim().length < 8) {
      setError("Tell us a little more about the service you need.");
      return;
    }
    setMessage(prompt);
    setLoading(true); setError(""); setResult(null); setActiveTab("Ask JanSetu");
    try {
      const response = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, state: stateName, language })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data);
    } catch (e) {
      setError(e.message || "Could not reach JanSetu. Check that the backend is running.");
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

  const nav = ["Ask JanSetu", "Explore services", "How it works"];
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={() => { setResult(null); setActiveTab("Ask JanSetu"); }}>
          <span className="brand-mark"><Landmark size={21}/></span>
          <span>jan<span className="brand-accent">setu</span><small>AI FOR PUBLIC GOOD</small></span>
        </a>
        <nav className={mobileMenu ? "nav-links open" : "nav-links"}>
          {nav.map((n) => <button key={n} className={activeTab === n ? "nav-link active" : "nav-link"} onClick={() => { setActiveTab(n); setMobileMenu(false); }}>{n}</button>)}
        </nav>
        <div className="top-actions">
          <span className="privacy-note"><ShieldCheck size={15}/> Privacy-first guidance</span>
          <button className="menu-button" aria-label="Toggle menu" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X/> : <Menu/>}</button>
        </div>
      </header>

      <main>
        {activeTab === "Explore services" ? (
          <section className="explore-page">
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
                <div className="section-heading"><div><div className="eyebrow">LET'S FIGURE IT OUT</div><h2>What do you need help with?</h2><p>Write it as you would explain it to a friend.</p></div><span className="ai-chip"><Sparkles size={14}/> Gemini-powered</span></div>
                <div className="composer-card">
                  <label htmlFor="question" className="field-label">YOUR QUESTION</label>
                  <textarea id="question" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={6000} placeholder="Example: I'm a student and I want to apply for a scholarship, but I'm not sure which documents I need..." />
                  <div className="composer-bottom"><span>{message.length}/6000 characters · Don't include ID numbers or OTPs</span><button className="primary-button" disabled={loading || message.trim().length < 8} onClick={() => ask()}>{loading ? <><LoaderCircle className="spin" size={17}/> Working...</> : <>Make my action plan <ArrowRight size={17}/></>}</button></div>
                  <div className="settings-row">
                    <label><MapPin size={15}/><span>State / UT</span><select value={stateName} onChange={(e) => setStateName(e.target.value)}>{["Not specified","Andhra Pradesh","Delhi","Gujarat","Karnataka","Kerala","Maharashtra","Tamil Nadu","Telangana","Uttar Pradesh","West Bengal","Other"].map(s=><option key={s}>{s}</option>)}</select><ChevronDown size={13}/></label>
                    <label><Globe2 size={15}/><span>Language</span><select value={language} onChange={(e) => setLanguage(e.target.value)}>{["English","Hindi","Marathi"].map(s=><option key={s}>{s}</option>)}</select><ChevronDown size={13}/></label>
                  </div>
                </div>
                {error && <div className="error-banner"><AlertTriangle size={17}/>{error}</div>}
                {!result && !loading && <div className="examples-area"><div className="examples-title"><span>NEED A STARTING POINT?</span><span>Try an example</span></div><div className="example-list">{examples.map(ex=><button key={ex.title} onClick={() => { setMessage(ex.text); setError(""); }}><span className="mini-emoji">{ex.icon}</span><span>{ex.title}</span><ArrowUpRight size={15}/></button>)}</div></div>}
                {loading && <div className="loading-card"><div className="loading-orb"><Sparkles size={24}/></div><h3>Making sense of your request...</h3><p>Organizing your question into steps and details to verify.</p><div className="loading-bar"><span/></div></div>}
                {result && <section className="result-panel">
                  <div className="result-head"><div><div className="eyebrow"><BadgeCheck size={14}/> YOUR ACTION PLAN</div><h2>{result.serviceCategory}</h2></div><button className="outline-button" onClick={copyPlan}>{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? "Copied" : "Copy plan"}</button></div>
                  <p className="result-summary">{result.summary}</p>
                  <div className="intent-strip"><span>Likely need</span><strong>{result.likelyIntent}</strong><span className={`confidence ${result.confidence}`}>{result.confidence} confidence</span></div>
                  <div className="result-section"><h3><span className="number-icon">1</span> Your next steps</h3><div className="step-list">{result.steps.map((s,i)=><div className="step-item" key={i}><span className="step-number">{String(i+1).padStart(2,"0")}</span><div><strong>{s.title}</strong><p>{s.detail}</p></div></div>)}</div></div>
                  {result.documents.length > 0 && <div className="result-section"><h3><span className="number-icon">2</span> Documents to check</h3><p className="section-caption">This is a preparation checklist, not a confirmed official requirement list.</p><div className="document-list">{result.documents.map((d,i)=><div className="document-item" key={i}><FileText size={18}/><div><strong>{d.name}</strong><p>{d.reason}</p><span className="doc-status">{statusLabel(d.requiredStatus)}</span></div></div>)}</div></div>}
                  {result.questions.length > 0 && <div className="result-section"><h3><span className="number-icon">3</span> A few details may help</h3><ul className="question-list">{result.questions.map((q,i)=><li key={i}>{q}</li>)}</ul></div>}
                  {result.officialSources.length > 0 && <div className="result-section"><h3><span className="number-icon">4</span> Places to verify</h3><p className="section-caption">Links suggested by AI; check the domain and current information before sharing details.</p><div className="source-list">{result.officialSources.map((s,i)=><a key={i} href={s.url} target="_blank" rel="noreferrer noopener"><span className="source-icon"><Globe2 size={17}/></span><span><strong>{s.title}</strong><small>{s.why}</small><em>{s.url}</em></span><ArrowUpRight size={17}/></a>)}</div></div>}
                  {result.cautions.length > 0 && <div className="caution-box"><AlertTriangle size={18}/><div><strong>Keep in mind</strong><ul>{result.cautions.map((c,i)=><li key={i}>{c}</li>)}</ul></div></div>}
                  <div className="disclaimer"><ShieldCheck size={17}/><p>{result.disclaimer} Always confirm current requirements with the relevant department.</p></div>
                  <button className="try-again" onClick={() => { setResult(null); setError(""); }}>Ask another question <ArrowRight size={16}/></button>
                </section>}
              </div>
              <aside className="side-column">
                <div className="side-card help-card"><div className="side-icon"><MessageCircle size={20}/></div><h3>Small question.<br/>Big difference.</h3><p>You don't need to know the official terminology. Just explain what you're trying to do.</p><div className="side-divider"/><div className="side-stat"><span>01</span><p><b>Describe</b><small>Tell us your situation</small></p></div><div className="side-stat"><span>02</span><p><b>Understand</b><small>Get plain-language guidance</small></p></div><div className="side-stat"><span>03</span><p><b>Take action</b><small>Know what to verify next</small></p></div></div>
                <div className="side-card safety-card"><div className="safety-head"><ShieldCheck size={20}/><b>Your safety matters</b></div><p>JanSetu will never need your password, OTP, Aadhaar number, PAN or bank PIN to explain a process.</p><a href="https://www.india.gov.in/" target="_blank" rel="noreferrer noopener">Visit India.gov.in <ArrowUpRight size={14}/></a></div>
                <div className="side-foot"><BookOpen size={16}/><span>Guidance is a starting point, not an official decision.</span></div>
              </aside>
            </section>
          </>
        )}
      </main>
      <footer className="footer"><a className="brand footer-brand" href="#"><span className="brand-mark"><Landmark size={18}/></span><span>jansetu<span className="brand-accent"> AI</span></span></a><span>Built for clarity. Designed for public good.</span><span className="footer-right"><ShieldCheck size={14}/> Verify before you apply</span></footer>
    </div>
  );
}
