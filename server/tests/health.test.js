import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("GET /api/health", () => {
  it("returns 200 with service health info and request-id header", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("ok", true);
    expect(response.body).toHaveProperty("service", "jansetu-ai");
    expect(response.body).toHaveProperty("environment");
    expect(response.body).toHaveProperty("model");
    expect(response.headers["x-request-id"]).toBeDefined();
  });

  it("propagates client x-request-id header when provided", async () => {
    const customId = "client-trace-12345";
    const response = await request(app)
      .get("/api/health")
      .set("x-request-id", customId);

    expect(response.status).toBe(200);
    expect(response.headers["x-request-id"]).toBe(customId);
  });
});
