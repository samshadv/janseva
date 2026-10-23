# JanSetu AI — Government Services Assistant

A full-stack starter that turns messy questions about public services into structured, source-aware guidance. The starter is designed for India but does **not** claim to determine legal eligibility or submit government applications automatically.

## Features
- React + Vite responsive interface
- Express API with server-side Gemini integration
- Structured JSON response contract
- Clear distinction between official-source links and AI-generated guidance
- Copyable action plan and document checklist
- Request-size limits, rate limiting, Helmet, CORS allowlist, input validation
- No user content is intentionally persisted by this starter

## Requirements
- Node.js 20+
- A Gemini API key from Google AI Studio: https://aistudio.google.com/apikey

## Run locally
1. Copy `server/.env.example` to `server/.env`.
2. Set `GEMINI_API_KEY` and optionally `GEMINI_MODEL`.
3. From this directory:
   ```bash
   npm install
   npm --prefix server install
   npm --prefix client install
   npm run dev
   ```
4. Open the Vite URL printed in the terminal (usually http://localhost:5173).

The Vite development server proxies `/api` to Express on port 5001.

## Environment
See `server/.env.example`. Never put the Gemini key in a `VITE_*` variable or commit `.env`.

## Production checklist (required before real public use)
- Deploy frontend and API behind HTTPS.
- Set `CLIENT_ORIGIN` to the exact deployed frontend origin.
- Use managed secrets; rotate keys and configure Gemini API restrictions/quotas.
- Replace in-memory rate limiting with a shared store (e.g. Redis) for multi-instance deployment.
- Add authentication, authorization, abuse monitoring, request IDs, audit policy and operational alerts if saving cases.
- Add official-source retrieval / allowlisted government domains for verification. This starter does **not** independently verify current rules or eligibility.
- Add accessibility testing, localization review, human usability testing and an incident response process.
- Obtain privacy/legal review before processing Aadhaar, PAN, medical, financial or other sensitive information. Avoid collecting such data in this MVP.
- Never auto-submit an application or make a consequential eligibility decision based only on model output.

## Architecture
`React browser -> Express /api/assist -> Google Gen AI SDK -> validated JSON response -> UI`

## API
`POST /api/assist`
```json
{ "message": "I am a student. What documents should I check before applying for a scholarship?", "state": "Maharashtra", "language": "English" }
```

The server returns `summary`, `serviceCategory`, `steps`, `documents`, `questions`, `officialSources`, `cautions`, and `disclaimer`.

## Important limitation
The model can be wrong or outdated. The app presents official links as places for the user to verify information; it does not assert that the generated response has been independently fact-checked. Confirm eligibility, dates, fees, and requirements on the linked official portal or with the relevant department.
