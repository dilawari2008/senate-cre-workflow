// SENATE CRE Workflow — Simulated ENvironment for Autonomous Token Evaluation
//
// 3 Triggers:
//   1. HTTP Trigger       — manual proposal submission via API
//   2. EVM Log Trigger    — fires on ProposalCreated event from SenateGovernor.sol
//   3. Cron Trigger       — checks SenateRiskOracle for stale scores every 6h
//
// CRE Capabilities Used:
//   HTTP Trigger, EVM Log Trigger, Cron Trigger, EVM Client Read,
//   EVM Client Write, HTTP Client, runtime.getSecret, runtime.report

import { cre, Runner, getNetwork } from "@chainlink/cre-sdk";
import { keccak256, toHex } from "viem";
import type { SenateConfig } from "./types";
import { onHttpTrigger } from "./httpCallback";
import { onLogTrigger } from "./logCallback";
import { onCronTrigger } from "./cronCallback";

const PROPOSAL_CREATED_SIGNATURE =
  "ProposalCreated(uint256,string,string,string,address,uint256,uint256)";

const initWorkflow = (config: SenateConfig) => {
  const evmConfig = config.evms[0];

  // Resolve the target network
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: evmConfig.chainSelectorName,
    isTestnet: true,
  });

  if (!network) {
    throw new Error(`Network not found: ${evmConfig.chainSelectorName}`);
  }

  const evmClient = new cre.capabilities.EVMClient(
    network.chainSelector.selector
  );

  // Trigger 1: HTTP — manual proposal submission
  const httpCapability = new cre.capabilities.HTTPCapability();
  const httpTrigger = httpCapability.trigger({});

  // Trigger 2: EVM Log — on-chain ProposalCreated event
  const eventHash = keccak256(toHex(PROPOSAL_CREATED_SIGNATURE));
  const logTrigger = evmClient.logTrigger({
    addresses: [config.senateGovernorAddress],
    topics: [{ values: [eventHash] }],
    confidence: "CONFIDENCE_LEVEL_FINALIZED",
  });

  // Trigger 3: Cron — risk oracle staleness check every 6 hours
  const cronCapability = new cre.capabilities.CronCapability();
  const cronTrigger = cronCapability.trigger({ schedule: "0 */6 * * *" });

  return [
    cre.handler(httpTrigger, onHttpTrigger),
    cre.handler(logTrigger, onLogTrigger),
    cre.handler(cronTrigger, onCronTrigger),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<SenateConfig>();
  await runner.run(initWorkflow);
}

main();
