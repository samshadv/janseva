import { Router } from "express";
import { healthRouter } from "./health.js";
import { assistRouter } from "./assist.js";
import { authRouter } from "./auth.js";
import { conversationsRouter } from "./conversations.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/assist", assistRouter);
apiRouter.use("/", authRouter);
apiRouter.use("/conversations", conversationsRouter);
