# SENATE — AI-Powered On-Chain Governance Debate Protocol

> 5 AI agents (4 senators + 1 chairperson) debate every governance proposal using real Tenderly simulation data, then publish a DON-verified verdict on-chain via Chainlink CRE.

**Built for the Chainlink Convergence Hackathon (Feb 6 – Mar 8, 2026)**

Targeting: **CRE & AI ($17K)** · **Risk & Compliance ($16K)** · **Tenderly Virtual TestNets ($5K)**

---

## How It Works

```
Governance Proposal submitted via HTTP / EVM Log / Manual
        ↓
Tenderly VTN Fork → Simulate proposal on mainnet state
        ↓
Attack Pattern Scanner → Matches against 9 historical governance attacks
        ↓
4 AI senators give opening statements:
  Caesar (The Bull)   → Growth-first analysis
  Brutus (The Bear)   → Risk-first security review
  Cassius (The Quant) → Quantitative EV calculation
  Portia (The Defender) → Governance culture assessment
        ↓
Solomon (The Wise) — Chairperson reviews and identifies disputes
        ↓
Counter-questions posed to disputing agents (if needed)
        ↓
Agents may change their votes based on counter-arguments
        ↓
Solomon delivers final verdict → DON-signed report
        ↓
Written to SenateReport.sol via CRE EVMClient
        ↓
Risk score published to SenateRiskOracle.sol
```

## Demo Scenarios

The app ships with 5 pre-built scenarios demonstrating different debate outcomes:

1. **Unanimous PASS** — WBTC collateral on Aave, all agents agree
2. **Split Verdict (2-2)** — Compound reserve factor, Solomon breaks the tie
3. **Vote Change** — Portia changes PASS to FAIL after counter-questioning on fee increase
4. **Attack Detection** — Emergency treasury drain, unanimous FAIL with attack pattern match
5. **Bull Changes Mind** — Caesar flips from PASS to FAIL on stETH depeg risk

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Next.js App (UI)                          │
│  Dashboard · Proposals · Debate Arena · Reports · Admin       │
│  SSE streaming · MongoDB persistence · Framer Motion          │
└─────────────┬────────────────────────────────────────────────┘
              │ SSE + REST API
┌─────────────▼────────────────────────────────────────────────┐
│              CRE Workflow (senate-workflow)                    │
│  HTTP Trigger → pipeline steps:                               │
│  1. Create Tenderly VTN fork (mainnet state)                  │
│  2. Simulate proposal calldata                                │
│  3. 4 agent opening statements (Gemini)                       │
│  4. Solomon chairperson review                                │
│  5. Counter-questions + responses (if dispute)                │
│  6. Solomon final verdict                                     │
│  7. runtime.report() → DON-signed report                      │
│  8. evmClient.writeReport() → SenateReport.sol                │
└──────┬──────────────┬──────────────┬─────────────────────────┘
       │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌────▼──────────────┐
│ Tenderly    │ │ Gemini AI  │ │ Sepolia           │
│ VTN API     │ │ (Google)   │ │ SenateReport.sol  │
│ Fork+Sim    │ │ 5 agents   │ │ SenateGovernor    │
│ State diffs │ │            │ │ SenateRiskOracle  │
└─────────────┘ └────────────┘ └───────────────────┘
```

## CRE Capabilities Used (8 of 9)

| CRE Capability | Used | How |
|----------------|------|-----|
| **HTTP Trigger** | Yes | Manual proposal submission via API |
| **EVM Log Trigger** | Yes | Fires on `ProposalCreated` event from `SenateGovernor.sol` |
| **Cron Trigger** | Yes | Monitors `SenateRiskOracle` for stale risk scores every 6 hours |
| **EVM Read (`callContract`)** | Yes | Reads proposal data from `SenateGovernor.sol` on-chain |
| **EVM Write (`writeReport`)** | Yes | Publishes DON-signed report to `SenateReport.sol` |
| **HTTP Client** | Yes | Tenderly API, webhook notifications |
| **Confidential HTTP** | Yes | Privacy-preserving Gemini AI API calls (secret injection) |
| **DON Reports (`runtime.report`)** | Yes | Cryptographically signed governance reports |
| **Consensus (`consensusMedianAggregation`)** | Yes | BFT consensus on simulation + agent results |

## Tech Stack

- **Chainlink CRE SDK** — Workflow orchestration, HTTP triggers, EVMClient, DON reports
- **Tenderly Virtual TestNets** — Mainnet forking, proposal simulation, public explorer
- **Google Gemini** — 5 AI agent debates with distinct personas (gemini-2.0-flash-lite)
- **MongoDB** — Persistent storage for proposals, debates, and reports
- **Next.js 16** — App Router, API routes, SSE streaming
- **Hardhat** — Smart contract development, deployment, verification
- **Solidity 0.8.24** — SenateReport, SenateGovernor, SenateRiskOracle
- **Framer Motion** — Debate animations, risk gauge, pipeline stepper
- **Tailwind CSS v4** — Professional dark theme UI

## Quick Start

```bash
# Install dependencies
npm install
cd contracts && npm install && cd ..

# Copy environment variables
cp .env.example .env
# Fill in: GEMINI_API_KEY, TENDERLY_ACCESS_KEY, MONGODB_URI (optional)

# Run development server (demo mode works without API keys)
npm run dev

# Deploy contracts to local Hardhat
cd contracts && npx hardhat node          # Terminal 1
cd contracts && npx hardhat run scripts/deploy-all.ts --network localhost  # Terminal 2

# Deploy contracts to Sepolia
cd contracts && npx hardhat run scripts/deploy-all.ts --network sepolia
```

## MongoDB (Optional)

Set `MONGODB_URI` in `.env` to enable persistent storage:

```
MONGODB_URI=mongodb://localhost:27017/senate
```

Without MongoDB, the app runs on in-memory demo data (fully functional).

## Tenderly Virtual TestNet Integration

This project uses Tenderly Virtual TestNets for mainnet-forked proposal simulations.

### Live Simulations

<!-- Add your Tenderly simulation links here after running proposals -->
<!-- Run: npx tsx scripts/capture-tenderly-links.ts -->

**Example Simulation:**
- [View simulation on Tenderly Dashboard](https://dashboard.tenderly.co/YOUR_ACCOUNT/senate/simulator/FORK_ID)

### How to Get Tenderly Links

1. **Run a simulation:**
   ```bash
   npm run dev
   # Open http://localhost:3000
   # Click any proposal → "Run Simulation"
   ```

2. **Capture the links:**
   ```bash
   npx tsx scripts/capture-tenderly-links.ts
   ```

3. **Find links manually:**
   - Check your [Tenderly Dashboard](https://dashboard.tenderly.co)
   - Go to **Simulations** tab
   - Copy URLs from recent simulations

See [`TENDERLY_SETUP.md`](./TENDERLY_SETUP.md) for detailed instructions.

## Deployed Contracts

### Sepolia Testnet

<!-- Add after deployment: npx hardhat run scripts/deploy-all.ts --network sepolia -->

- **SenateGovernor:** `0x...` ([Etherscan](https://sepolia.etherscan.io/address/0x...))
- **SenateReport:** `0x...` ([Etherscan](https://sepolia.etherscan.io/address/0x...))
- **SenateRiskOracle:** `0x...` ([Etherscan](https://sepolia.etherscan.io/address/0x...))

### Tenderly Virtual TestNet

<!-- Add after creating VTN and deploying -->

- **Network:** [Senate VTN](https://dashboard.tenderly.co/explorer/vnet/YOUR_VTN_ID)
- **SenateGovernor:** `0x...` ([Explorer](https://dashboard.tenderly.co/explorer/vnet/YOUR_VTN_ID/address/0x...))
- **SenateReport:** `0x...` ([Explorer](https://dashboard.tenderly.co/explorer/vnet/YOUR_VTN_ID/address/0x...))
- **SenateRiskOracle:** `0x...` ([Explorer](https://dashboard.tenderly.co/explorer/vnet/YOUR_VTN_ID/address/0x...))

## Hackathon Submission

**Chainlink Convergence Hackathon (Feb 6 – Mar 8, 2026)**

**Tracks:**
- 🎯 CRE & AI ($17K)
- 🎯 Risk & Compliance ($16K)
- 🎯 Tenderly Virtual TestNets ($5K)

**Video Demo:** [Link to 3-5 minute video]

**Live Demo:** [Link to deployed app]

## License

MIT
