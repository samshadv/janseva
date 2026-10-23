import { Router } from "express";

export const docsRouter = Router();

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "JanSetu AI - Citizen Welfare & Governance Guidance API",
    version: "1.0.0",
    description:
      "Enterprise-grade REST API providing grounded, source-aware government scheme assistance, citizen eligibility matching, and DPDP Act 2023 compliant advisory services.",
    contact: {
      name: "JanSetu Public Good Initiative",
      url: "https://github.com/samshadv/janseva",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    { url: "/api", description: "Current API Base URL" },
  ],
  paths: {
    "/assist": {
      post: {
        summary: "Generate Grounded Citizen Action Plan",
        description:
          "Accepts citizen queries about public schemes, sanitizes PII, retrieves official scheme grounds, and generates structured, verified step-by-step guidance.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: {
                    type: "string",
                    minLength: 8,
                    maxLength: 2000,
                    example: "How can my family apply for government housing assistance in Maharashtra?",
                  },
                  state: {
                    type: "string",
                    default: "Maharashtra",
                    example: "Maharashtra",
                  },
                  language: {
                    type: "string",
                    default: "English",
                    enum: ["English", "Hindi", "Marathi", "Tamil", "Telugu", "Bengali", "Gujarati", "Kannada"],
                    example: "English",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Grounded guidance and structured citizen action plan",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    summary: { type: "string" },
                    serviceCategory: { type: "string" },
                    likelyIntent: { type: "string" },
                    confidence: { type: "string", enum: ["high", "medium", "low"] },
                    steps: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          detail: { type: "string" },
                        },
                      },
                    },
                    documents: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          reason: { type: "string" },
                          requiredStatus: { type: "string" },
                        },
                      },
                    },
                    questions: { type: "array", items: { type: "string" } },
                    officialSources: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          url: { type: "string" },
                          why: { type: "string" },
                          isGovVerified: { type: "boolean" },
                        },
                      },
                    },
                    cautions: { type: "array", items: { type: "string" } },
                    disclaimer: { type: "string" },
                    groundedSchemes: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
          400: { description: "Validation error (invalid input or length)" },
          429: { description: "Rate limit exceeded" },
          500: { description: "Server processing error" },
        },
      },
    },
    "/schemes": {
      get: {
        summary: "List Official Government Schemes",
        parameters: [
          { name: "category", in: "query", schema: { type: "string" }, description: "Filter by category (e.g. Housing, Health, Agriculture, Education)" },
          { name: "state", in: "query", schema: { type: "string" }, description: "Filter by applicable state" },
        ],
        responses: {
          200: {
            description: "Array of verified official government schemes",
          },
        },
      },
    },
    "/schemes/match": {
      post: {
        summary: "Match Citizen Questionnaire with Schemes",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  state: { type: "string", default: "All" },
                  age: { type: "number", minimum: 0, maximum: 120 },
                  occupation: { type: "string" },
                  incomeBracket: {
                    type: "string",
                    enum: ["BELOW_1L", "UPTO_2_5L", "UPTO_5L", "UPTO_8L", "ABOVE_8L"],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Matched schemes with compatibility score" },
        },
      },
    },
    "/health": {
      get: {
        summary: "API Health & Model Status",
        responses: {
          200: { description: "Service status, model active, uptime" },
        },
      },
    },
    "/health/live": {
      get: {
        summary: "Kubernetes Liveness Probe",
        responses: {
          200: { description: "HTTP process is alive" },
        },
      },
    },
    "/health/ready": {
      get: {
        summary: "Kubernetes Readiness Probe",
        responses: {
          200: { description: "Backing dependencies (Redis, Database) ready" },
          503: { description: "Service degraded or not ready" },
        },
      },
    },
    "/metrics": {
      get: {
        summary: "Prometheus Observability Metrics",
        responses: {
          200: { description: "Prometheus text formatted metrics" },
        },
      },
    },
  },
};

// GET /api/docs/openapi.json
docsRouter.get("/openapi.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  return res.json(openApiSpec);
});

// GET /api/docs — Interactive Swagger UI
docsRouter.get("/", (_req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>JanSetu AI API Documentation (OpenAPI 3.0)</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236558d9'><path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/></svg>">
  <style>
    body { margin: 0; padding: 0; background: #fafafa; font-family: sans-serif; }
    .topbar { display: none; }
    .swagger-ui .info .title { color: #1e293b; font-weight: 800; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "/api/docs/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(html);
});
