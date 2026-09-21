import type { Router } from "express";
import { requireHolder } from "../auth/supabaseAuth";
import { loadAppConfig } from "../config/env";
import { FundedNextMcpClient } from "./mcpClient";
import { createExecutionRouter } from "./routes";
import { ExecutionService } from "./service";

/** Builds the /api/execution router from the app config (mounted once in server.ts). */
export function buildExecutionRouter(): Router {
  const config = loadAppConfig().fundedNext;
  const service = config ? new ExecutionService(new FundedNextMcpClient({ apiKey: config.apiKey, url: config.mcpUrl })) : null;
  return createExecutionRouter({ service, ownerEmail: config?.ownerEmail ?? "", requireHolder });
}
