import { type Runtime, type HTTPPayload, decodeJson } from "@chainlink/cre-sdk";
import type { SenateConfig, ProposalData, SenateResult } from "./types";
import { runSenatePipeline } from "./pipeline";

export function onHttpTrigger(
  runtime: Runtime<SenateConfig>,
  payload: HTTPPayload
): SenateResult {
  runtime.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  runtime.log("CRE Workflow: HTTP Trigger — Proposal Submission");
  runtime.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    if (!payload.input || payload.input.length === 0) {
      throw new Error("Empty request payload");
    }

    const data = decodeJson(payload.input) as ProposalData;
    runtime.log(`Received proposal: "${data.title}" (${data.protocol})`);

    if (!data.title || !data.description) {
      throw new Error("title and description are required");
    }

    return runSenatePipeline(runtime, data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    runtime.log(`[ERROR] ${msg}`);
    throw err;
  }
}
