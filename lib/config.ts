const networkName = process.env.NETWORK || 'localhost';
const isLocal = networkName === 'localhost' || networkName === 'hardhat';

const config = {
  network: {
    name: networkName,
    chainId: parseInt(process.env.CHAIN_ID || (isLocal ? '31337' : '11155111')),
    rpcUrl: process.env.RPC_URL || (isLocal ? 'http://127.0.0.1:8545' : ''),
    blockExplorerUrl: process.env.BLOCK_EXPLORER_URL || (isLocal ? '' : 'https://sepolia.etherscan.io'),
    isLocal,
  },
  contracts: {
    senateReport: process.env.SENATE_REPORT_CONTRACT || '',
    senateGovernor: process.env.SENATE_GOVERNOR_CONTRACT || '',
    senateRiskOracle: process.env.SENATE_RISK_ORACLE_CONTRACT || '',
    creForwarder: process.env.CRE_FORWARDER_ADDRESS || '0x15fC6ae953E024d975e77382eEeC56A9101f9F88',
  },
  mongodb: { uri: process.env.MONGODB_URI || '' },
  llm: {
    provider: process.env.LLM_PROVIDER || 'gemini',
    apiKey: process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  },
  tenderly: {
    account: process.env.TENDERLY_ACCOUNT || '',
    project: process.env.TENDERLY_PROJECT || 'senate',
    accessKey: process.env.TENDERLY_ACCESS_KEY || '',
    vtnRpc: process.env.TENDERLY_VTN_RPC || '',
    vtnExplorerUrl: process.env.TENDERLY_VTN_EXPLORER_URL || '',
  },
  cre: {
    apiKey: process.env.CRE_API_KEY || '',
    donId: process.env.CRE_DON_ID || '',
    workflowEndpoint: process.env.CRE_WORKFLOW_ENDPOINT || '',
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    privateKey: process.env.PRIVATE_KEY || '',
  },
  flags: {
    useMockLLM: !process.env.GEMINI_API_KEY && !process.env.ANTHROPIC_API_KEY,
    useMockTenderly: !process.env.TENDERLY_ACCESS_KEY,
    isDemo: process.env.DEMO_MODE !== 'false',
  },
} as const;

export default config;
