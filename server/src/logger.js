import pino from "pino";
import { config } from "./config.js";

const isProduction = config.NODE_ENV === "production";
const isTest = config.NODE_ENV === "test";

export const logger = pino({
  level: isTest ? "silent" : isProduction ? "info" : "debug",
  ...(!isProduction && !isTest && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  }),
});
