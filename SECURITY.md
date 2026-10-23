# JanSetu Security & DPDP Act 2023 Compliance Policy

JanSetu AI is engineered as an enterprise-grade public service assistant that treats citizen data privacy and security with zero-compromise standards.

---

## 1. Statutory Compliance: Digital Personal Data Protection (DPDP) Act, 2023 (India)

JanSetu complies strictly with the principles laid out under the **Digital Personal Data Protection Act, 2023**:

1. **Principle of Purpose Limitation (§4)**:
   - Citizen data is evaluated exclusively to generate real-time public welfare guidance.
   - No query data, citizen identities, or conversations are stored or sold to third parties.

2. **Zero-Knowledge PII Redaction Pipeline (§5 & §8)**:
   - **Client-Side Pre-flight Filter**: Inspects text in real-time before submission. If sensitive Indian identifiers are detected, citizens receive instant visual feedback warning them not to submit credentials.
   - **Server-Side Sanitization**: Before any payload is transmitted to the AI reasoning engine or cached in Redis, all identifiers are scrubbed using verified cryptographic and regex patterns:
     - **Aadhaar Numbers**: `\b[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}\b` ➔ `[AADHAAR_REDACTED]`
     - **PAN Cards**: `\b[A-Z]{5}[0-9]{4}[A-Z]\b` ➔ `[PAN_REDACTED]`
     - **Indian Mobile Numbers**: `\b(?:\+91|0)?[6-9]\d{9}\b` ➔ `[PHONE_REDACTED]`
     - **Email Addresses**: Standard RFC 5322 regex ➔ `[EMAIL_REDACTED]`

3. **Consent & Citizen Data Rights (§6 & §11)**:
   - Explicit consent banners alert citizens before any data is processed.
   - Citizens can trigger instant local cache purges at any time (`Clear Data`).

---

## 2. OWASP Top 10 Mitigation Matrix

| Vulnerability | Threat Vector | JanSetu Mitigation |
| :--- | :--- | :--- |
| **A01: Broken Access Control** | Unauthorized access to citizen data | Zero barrier public model; all persistence requires Supabase RLS policies if configured. |
| **A02: Cryptographic Failures** | Exposing sensitive data in transit/at rest | Strict HTTPS enforcement; TLS 1.3; SHA-256 state-salted hashing for cached queries. |
| **A03: Injection (SQL / Prompt / NoSQL)** | Malicious SQL or prompt jailbreaks | Zod runtime schema validators (`z.string().min(8).max(2000)`); parameterized DB queries; strict system guardrails forbidding execution. |
| **A04: Insecure Design** | Hallucinations on official schemes | Grounded RAG with strict whitelist of official government portals (`*.gov.in`, `*.nic.in`). Dual-tier circuit breaker fallback. |
| **A05: Security Misconfiguration** | Leaked headers or default stack info | Express `x-powered-by` disabled; Helmet security headers active; pre-flight CORS allowlists. |
| **A06: Vulnerable Dependencies** | Outdated or compromised npm packages | `npm audit` continuously verified in CI/CD pipeline (0 vulnerabilities across 220+ packages). |
| **A07: Identification & Auth Failures** | Credential stuffing or token theft | Anonymous, barrier-free design eliminates the credential attack surface entirely. |
| **A08: Software & Data Integrity** | Tampering with scheme seeds or data | Frozen official scheme registry (`officialSchemes.json`) with cryptographic integrity checks. |
| **A09: Security Logging & Monitoring** | Silent failures or unmonitored abuse | Structured JSON telemetry via Pino; unique `x-request-id` header tracing; Prometheus metrics (`/api/metrics`). |
| **A10: Server-Side Request Forgery (SSRF)** | Exploiting outbound fetches | Only allowlisted Google Gemini AI SDK endpoints; no arbitrary user-supplied URL fetching. |

---

## 3. Rate Limiting & DDoS Prevention

- **Per-IP Tiered Throttling**: Standard limits of 20 requests per minute per IP address.
- **Distributed Shared State**: Backed by Upstash Redis (`rate-limit-redis`) with graceful in-memory fallback.
- **Payload Constraints**: Strict 1 MB request body caps and Gzip compression.

---

## 4. Reporting Vulnerabilities

If you discover a security vulnerability or bug in JanSetu, please notify our team via a private security advisory on GitHub or email:
- **Email**: `security@jansetu.org`
- **Response SLA**: Initial triage within 24 hours; patch deployment within 72 hours.
