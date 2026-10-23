import { createApp } from "./app.js";
import { config } from "./config.js";
import { logger } from "./logger.js";

const app = createApp();

const server = app.listen(config.PORT, () => {
  logger.info(
    {
      port: config.PORT,
      env: config.NODE_ENV,
      clientOrigin: config.CLIENT_ORIGIN,
      aiModel: config.GEMINI_MODEL,
      aiConfigured: config.isApiKeyConfigured,
    },
    `JanSetu API listening on http://localhost:${config.PORT}`
  );
});

// Graceful shutdown handling
function shutdown(signal) {
  logger.info({ signal }, "Gracefully shutting down JanSetu API");
  server.close(() => {
    logger.info("Server closed successfully");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
