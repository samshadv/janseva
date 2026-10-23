import client from "prom-client";

// Create a dedicated Prometheus Registry
export const register = new client.Registry();

// Add standard process and runtime metrics (memory, CPU, event loop lag, GC)
client.collectDefaultMetrics({
  register,
  prefix: "jansetu_",
});

// HTTP Request Duration Histogram
export const httpRequestDurationSeconds = new client.Histogram({
  name: "jansetu_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});

// Total HTTP requests counter
export const httpRequestsTotal = new client.Counter({
  name: "jansetu_http_requests_total",
  help: "Total number of HTTP requests processed",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

// Active in-flight requests gauge
export const activeRequestsGauge = new client.Gauge({
  name: "jansetu_active_requests",
  help: "Number of active requests currently being processed",
  registers: [register],
});
