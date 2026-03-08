import {
  cre,
  ok,
  consensusIdenticalAggregation,
  type Runtime,
  type CronPayload,
  type HTTPSendRequester,
  getNetwork,
  bytesToHex,
  encodeCallMsg,
  LAST_FINALIZED_BLOCK_NUMBER,
} from "@chainlink/cre-sdk";
import {
  parseAbi,
  encodeFunctionData,
  decodeFunctionResult,
  zeroAddress,
  type Address,
} from "viem";
import type { SenateConfig } from "./types";

type CronResult = {
  checkedProtocols: number;
  staleProtocols: string[];
  alerts: string[];
};

const RISK_ORACLE_ABI = parseAbi([
  "function getTrackedProtocolCount() view returns (uint256)",
  "function trackedProtocols(uint256) view returns (string)",
  "function getProtocolRisk(string _protocol) view returns ((string protocol, uint8 avgRiskScore, uint256 totalAssessments, uint64 lastUpdated))",
]);

const buildStalenessWebhook =
  (payload: object) =>
  (sendRequester: HTTPSendRequester, config: SenateConfig): { sent: boolean } => {
    const bodyBytes = new TextEncoder().encode(
      JSON.stringify({ ...payload, timestamp: new Date().toISOString() })
    );
    const body = Buffer.from(bodyBytes).toString("base64");

    sendRequester
      .sendRequest({
        url: config.webhookUrl,
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
      })
      .result();
    return { sent: true };
  };

export function onCronTrigger(
  runtime: Runtime<SenateConfig>,
  _payload: CronPayload
): CronResult {
  runtime.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  runtime.log("CRE Workflow: Cron Trigger — Risk Score Staleness Monitor");
  runtime.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    const evmConfig = runtime.config.evms[0];
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
    const oracleAddress = runtime.config
      .senateRiskOracleAddress as Address;

    // Read tracked protocol count
    const countCallData = encodeFunctionData({
      abi: RISK_ORACLE_ABI,
      functionName: "getTrackedProtocolCount",
      args: [],
    });

    const countResult = evmClient
      .callContract(runtime, {
        call: encodeCallMsg({
          from: zeroAddress,
          to: oracleAddress,
          data: countCallData,
        }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result();

    const protocolCount = decodeFunctionResult({
      abi: RISK_ORACLE_ABI,
      functionName: "getTrackedProtocolCount",
      data: bytesToHex(countResult.data),
    }) as bigint;

    runtime.log(`Tracked protocols on SenateRiskOracle: ${protocolCount}`);

    const staleProtocols: string[] = [];
    const alerts: string[] = [];
    const staleThreshold =
      runtime.config.riskStaleThresholdSeconds || 86400;

    for (let i = 0n; i < protocolCount; i++) {
      const nameCallData = encodeFunctionData({
        abi: RISK_ORACLE_ABI,
        functionName: "trackedProtocols",
        args: [i],
      });

      const nameResult = evmClient
        .callContract(runtime, {
          call: encodeCallMsg({
            from: zeroAddress,
            to: oracleAddress,
            data: nameCallData,
          }),
          blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
        })
        .result();

      const protocolName = decodeFunctionResult({
        abi: RISK_ORACLE_ABI,
        functionName: "trackedProtocols",
        data: bytesToHex(nameResult.data),
      }) as string;

      const riskCallData = encodeFunctionData({
        abi: RISK_ORACLE_ABI,
        functionName: "getProtocolRisk",
        args: [protocolName],
      });

      const riskResult = evmClient
        .callContract(runtime, {
          call: encodeCallMsg({
            from: zeroAddress,
            to: oracleAddress,
            data: riskCallData,
          }),
          blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
        })
        .result();

      const protocolRisk = decodeFunctionResult({
        abi: RISK_ORACLE_ABI,
        functionName: "getProtocolRisk",
        data: bytesToHex(riskResult.data),
      }) as {
        protocol: string;
        avgRiskScore: number;
        totalAssessments: bigint;
        lastUpdated: bigint;
      };

      const lastUpdated = Number(protocolRisk.lastUpdated);
      const nowSeconds = Math.floor(Date.now() / 1000);
      const ageSeconds = nowSeconds - lastUpdated;

      if (ageSeconds > staleThreshold) {
        staleProtocols.push(protocolName);
        const ageHours = Math.round(ageSeconds / 3600);
        const alert = `${protocolName}: risk score is ${ageHours}h stale (avg: ${protocolRisk.avgRiskScore})`;
        alerts.push(alert);
        runtime.log(`STALE: ${alert}`);
      } else {
        runtime.log(
          `OK: ${protocolName} — ${Math.round(ageSeconds / 60)}min old (avg: ${protocolRisk.avgRiskScore})`
        );
      }
    }

    if (staleProtocols.length > 0) {
      const httpClient = new cre.capabilities.HTTPClient();
      try {
        httpClient
          .sendRequest(
            runtime,
            buildStalenessWebhook({
              type: "risk_staleness_alert",
              data: {
                staleProtocols,
                alerts,
                checkedProtocols: Number(protocolCount),
              },
            }),
            consensusIdenticalAggregation<{ sent: boolean }>()
          )(runtime.config)
          .result();
      } catch {
        runtime.log("[Webhook] Staleness alert notification failed (non-fatal)");
      }
    }

    runtime.log(
      `Cron complete: ${staleProtocols.length}/${protocolCount} protocols have stale risk scores`
    );

    return {
      checkedProtocols: Number(protocolCount),
      staleProtocols,
      alerts,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    runtime.log(`[ERROR] ${msg}`);
    throw err;
  }
}
