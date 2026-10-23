import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("OpenAPI Documentation Endpoints", () => {
  it("GET /api/docs/openapi.json returns valid OpenAPI 3.0 specification", async () => {
    const res = await request(app).get("/api/docs/openapi.json");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("openapi", "3.0.3");
    expect(res.body.info).toHaveProperty("title");
    expect(res.body.paths).toHaveProperty("/assist");
    expect(res.body.paths).toHaveProperty("/schemes");
    expect(res.body.paths).toHaveProperty("/health");
  });

  it("GET /api/docs returns Swagger UI interactive documentation page", async () => {
    const res = await request(app).get("/api/docs");
    expect(res.status).toBe(200);
    expect(res.text).toContain("SwaggerUIBundle");
    expect(res.text).toContain("JanSetu AI API Documentation");
  });
});
