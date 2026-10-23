import {
  httpRequestDurationSeconds,
  httpRequestsTotal,
  activeRequestsGauge,
} from "../services/metricsService.js";

/**
 * Middleware measuring HTTP request durations and recording Prometheus metrics.
 */
export function metricsMiddleware(req, res, next) {
  // Do not record internal metrics scrape endpoint itself
  if (req.path === "/api/metrics" || req.path === "/metrics") {
    return next();
  }

  activeRequestsGauge.inc();
  const startTime = process.hrtime();

  res.on("finish", () => {
    activeRequestsGauge.dec();

    const diff = process.hrtime(startTime);
    const durationSeconds = diff[0] + diff[1] / 1e9;

    // Normalize route path to prevent high-cardinality explosions with dynamic IDs
    const normalizedRoute = req.baseUrl + (req.route?.path || req.path);

    const labels = {
      method: req.method,
      route: normalizedRoute || req.path,
      status_code: res.statusCode.toString(),
    };

    httpRequestDurationSeconds.observe(labels, durationSeconds);
    httpRequestsTotal.inc(labels);
  });

  next();
}
