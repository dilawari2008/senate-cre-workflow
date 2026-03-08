# SENATE AI — Simulated ENvironment for Autonomous Token Evaluation

## The Problem: Governance Proposals in DeFi Are a Blind Spot

DeFi protocols are governed by on-chain proposals — executable code that can change interest rates, move treasury funds, update oracles, or grant minting authority. These proposals are the most powerful operations in any protocol.

### How Many Proposals Are We Talking About?

| Protocol | Governor Contract | Proposals (All Time) | Avg. Frequency |
|----------|-------------------|----------------------|----------------|
| **Aave** | Governance V3 (`0x9AEE...BC7`) | ~300+ | 3–5 per week |
| **Compound** | GovernorBravo (`0xc0Da...529`) | ~290+ | 1–3 per week |
| **Uniswap** | GovernorBravo (`0x408E...C3`) | ~60+ | 1–2 per month |

That's a collective **5–10 proposals per week** across just three protocols — each one carrying the power to restructure billions in locked assets.

### What Happens When Malicious Proposals Slip Through?

It has already happened, repeatedly:

| Attack | Protocol | Year | Loss | What Happened |
|--------|----------|------|------|---------------|
| **Beanstalk Flash Loan** | Beanstalk | 2022 | $182M | Attacker flash-loaned ~$1B to capture 70%+ voting power, passed a proposal to drain the treasury in a single transaction |
| **Tornado Cash Takeover** | Tornado Cash | 2023 | Full control | Malicious proposal disguised as a "governance improvement" contained hidden code that minted 1.2M TORN tokens, giving the attacker permanent majority control |
| **Mango Markets Exploit** | Mango Markets | 2022 | $114M | Attacker manipulated oracle prices to drain $114M, then used governance to negotiate keeping $47M as a "bug bounty" |
| **Compound Prop 289** | Compound | 2024 | $24M (attempted) | A whale exploited low turnout to pass a proposal redirecting $24M in COMP to a multisig they controlled |
| **Build Finance Takeover** | Build Finance | 2022 | Full control | Single actor accumulated enough BUILD tokens to pass a hostile takeover proposal, seizing the entire treasury |

These are not edge cases. They represent a fundamental design flaw: **there is no automated, adversarial analysis layer between proposal submission and execution.**

### How Do Token Holders Evaluate Proposals Today?

1. **Discord / Forum discussions** — Subjective, easy to manipulate with social engineering
2. **Reddit / Twitter threads** — Surface-level, no code analysis
3. **ChatGPT / manual research** — Ad-hoc, no simulation, no historical attack cross-referencing
4. **Reading Solidity directly** — Requires deep technical expertise that 99% of voters lack

The gap is clear: voters are making multi-billion dollar decisions based on vibes, not verified simulation data.

---

## Presenting SENATE AI

**SENATE AI** is an autonomous governance risk intelligence protocol. It intercepts DeFi governance proposals, simulates their on-chain effects, cross-references them against 9 known historical governance attack patterns, and runs a multi-agent AI debate to produce a risk-scored verdict — all before the proposal reaches a vote.

SENATE does not vote. It does not block proposals. It produces **intelligence** — a signed, verifiable risk report that token holders, DAOs, and security teams can use to make informed decisions.

---

## How SENATE Works

SENATE's pipeline processes each governance proposal through four stages:

### Stage 1 — Proposal Simulation

The proposal's executable calldata is simulated against a fork of mainnet state. This produces quantitative metrics:

- **Gas consumption** — abnormally high gas can indicate hidden operations
- **Liquidation risk score** — how the proposal affects collateral ratios
- **TVL impact** — estimated change to total value locked
- **Price impact** — potential oracle/price disruption
- **State changes** — number of storage slots modified

### Stage 2 — Historical Attack Pattern Scan

The proposal (both its human-readable description *and* its executable calldata) is cross-referenced against a database of 9 historical DeFi governance attacks. The AI specifically checks for:

- Flash loan vote capture patterns (Beanstalk-style)
- Hidden code in "routine" upgrades (Tornado Cash-style)
- Treasury drain disguised as security measures
- Description-to-calldata mismatches (says "update oracle" but code does "drain treasury")
- Emergency bypass of timelocks and discussion periods

### Stage 3 — Multi-Agent AI Debate

Five AI senators with distinct, adversarial perspectives debate the proposal:

| Agent | Role | Bias | What They Look For |
|-------|------|------|--------------------|
| **Caesar** — The Bull | Growth maximalist | Pro-PASS | Yield opportunities, TVL growth, protocol expansion |
| **Brutus** — The Bear | Security researcher | Pro-FAIL | Attack parallels, calldata mismatches, exploit vectors |
| **Cassius** — The Quant | Quantitative analyst | Neutral | Statistical anomalies, sigma events, EV calculations |
| **Portia** — The Defender | Community advocate | Neutral | Governance culture, precedent, community trust |
| **Angel** — The Guardian | Chairperson | Impartial | Reviews all positions, identifies disputes, delivers final verdict |

The debate follows a structured flow:

1. Each senator delivers an **opening statement** with a PASS/FAIL/ABSTAIN vote and confidence score
2. Angel reviews all positions and asks a **counter-question** to the senator with the weakest argument
3. The targeted senator **responds**, potentially changing their vote
4. Angel delivers the **final verdict** with an aggregate risk score (0–100)

### Stage 4 — Signed Report Generation

The verdict, simulation metrics, debate transcript, and risk score are compiled into a cryptographically signed report. This report is published on-chain so it is:

- **Verifiable** — anyone can check the report's authenticity
- **Immutable** — the assessment cannot be altered after publication
- **Timestamped** — proves the analysis was done before the vote

---

## Why Tenderly Virtual TestNets and Chainlink CRE

### The Simulation Problem → Tenderly Virtual TestNets

SENATE needs to simulate what a proposal *actually does* on-chain — not what its description *says* it does. This requires:

- A **full fork of mainnet state** (all balances, storage, contract bytecode)
- The ability to **impersonate any address** (execute as the Timelock/Executor without private keys)
- A **persistent environment** with verifiable transaction history

**Tenderly Virtual TestNets** are the only solution that provides all three. Traditional local forks (Hardhat/Anvil) don't persist, can't be shared, and produce no verifiable explorer links. Tenderly VTNs fork mainnet at the latest block, allow `eth_sendTransaction` from any `from` address (auto-impersonation), and generate a full block explorer with transaction traces.

### The Orchestration Problem → Chainlink CRE

SENATE's pipeline must:

- **Listen to on-chain events** across multiple governance contracts on multiple chains
- **Execute off-chain computation** (AI inference, simulation API calls) in a decentralized, verifiable manner
- **Write results back on-chain** with cryptographic attestation from a Decentralized Oracle Network (DON)

**Chainlink CRE (Compute Runtime Environment)** is the only framework that provides all three capabilities in a single workflow:

- **Log Triggers** — listen to `ProposalCreated` events from any governor contract
- **HTTP Client** — make authenticated API calls (Tenderly RPC, Gemini AI) with DON consensus
- **EVM Write** — publish the final report on-chain, signed by the DON
- **`runtime.report()`** — generate a DON-signed report that is cryptographically verifiable

No other oracle or automation solution combines on-chain listening, off-chain AI execution, and on-chain writing with consensus guarantees in a single workflow.

---

## Architecture

```
                          ┌─────────────────────────────┐
                          │     GOVERNANCE CONTRACTS     │
                          │  Aave · Compound · Uniswap  │
                          └─────────────┬───────────────┘
                                        │ ProposalCreated event
                                        ▼
                          ┌─────────────────────────────┐
                          │     CHAINLINK CRE WORKFLOW   │
                          │         (DON Nodes)          │
                          │                              │
                          │  ┌───────────────────────┐   │
                          │  │   LOG / HTTP TRIGGER   │   │
                          │  └───────────┬───────────┘   │
                          │              ▼               │
                          │  ┌───────────────────────┐   │
                          │  │  TENDERLY VTN          │   │  ◄── Mainnet fork +
                          │  │  Proposal Simulation   │   │      impersonated execution
                          │  └───────────┬───────────┘   │
                          │              ▼               │
                          │  ┌───────────────────────┐   │
                          │  │  GEMINI AI             │   │  ◄── Attack scan +
                          │  │  Attack Scan + Debate  │   │      5-agent debate
                          │  └───────────┬───────────┘   │
                          │              ▼               │
                          │  ┌───────────────────────┐   │
                          │  │  DON-SIGNED REPORT     │   │
                          │  │  + EVM Write           │   │
                          │  └───────────────────────┘   │
                          └─────────────┬───────────────┘
                                        │
                          ┌─────────────▼───────────────┐
                          │     SENATE REPORT CONTRACT   │
                          │     (On-Chain, Verifiable)   │
                          └─────────────┬───────────────┘
                                        │
                          ┌─────────────▼───────────────┐
                          │         SENATE UI            │
                          │   Live pipeline · Debates    │
                          │   Risk scores · Reports      │
                          └─────────────────────────────┘
```

---

## AI Agent Personas

### Caesar — The Bull 🟠

*"Capital flows to yield. This is yield."*

Growth-first DeFi maximalist. Caesar is biased toward PASS for any proposal that increases yield, TVL, or protocol growth. He sees opportunity where others see risk. His role is to ensure that conservative bias doesn't kill genuinely beneficial proposals.

### Brutus — The Bear 🔴

*"I have seen this exact parameter change before. It ended in a $200M hack."*

Risk-first security researcher. Brutus is an expert on every major DeFi governance attack. He cross-references every proposal against historical exploits and is deeply suspicious of emergency proposals, large fund transfers, and description-calldata mismatches. He is biased toward FAIL.

### Cassius — The Quant 🔵

*"The simulation shows a 3.2 sigma event with 11% probability. Adjust accordingly."*

Emotionless quantitative analyst. Cassius only cares about expected value, probability distributions, and statistical anomalies. He verifies that calldata parameters are mathematically consistent with the description and flags numerical red flags.

### Portia — The Defender 🟣

*"A protocol is only as strong as its governance culture."*

Community advocate. Portia evaluates proposals through the lens of governance culture, precedent, and community trust. She flags proposals that bypass discussion periods, circumvent normal processes, or set dangerous precedents — even if the proposal itself is technically sound.

### Angel — The Guardian 🟡

*"Let wisdom weigh what passion cannot."*

Impartial chairperson and final arbiter. Angel does not vote. She reviews all four senators' positions, identifies the most contentious disagreement, asks a targeted counter-question to challenge the weakest argument, and delivers the final verdict with a risk score from 0 to 100.

---

## Production vs. Demo: What's Different

### Chainlink CRE

| Aspect | Production (Ideal) | Demo |
|--------|-------------------|------|
| **Trigger** | `EVM Log Trigger` — listens for `ProposalCreated` events from real governor contracts | `HTTP Trigger` — proposals submitted manually via API |
| **Aave monitoring** | Log trigger on `0x9AEE0B04504CeF83A65AC3f0e838D0593BCb2BC7` for `ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,bytes32)` | HTTP trigger with Aave proposal payload |
| **Compound monitoring** | Log trigger on `0xc0Da02939E1441F497fd74F78cE7Decb17B66529` for `ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)` | HTTP trigger with Compound proposal payload |
| **Uniswap monitoring** | Log trigger on `0x408ED6354d4973f66138C91495F2f2FCbd8724C3` for `ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)` | HTTP trigger with Uniswap proposal payload |
| **Governor contract** | Real protocol governor contracts (above addresses) | `SenateGovernor.sol` — a mock contract that emits a simplified `ProposalCreated` event |
| **DON execution** | Full DON consensus with multiple nodes | `cre workflow simulate --broadcast` (single-node local simulation) |

### Tenderly Virtual TestNets

| Aspect | Production (Ideal) | Demo |
|--------|-------------------|------|
| **Simulation target** | Execute the actual proposal calldata from the real Executor/Timelock address against the real target contract on VTN | Execute `createProposal()` on the mock `SenateGovernor.sol` on VTN |
| **Execution context** | `from:` Aave Short Executor (`0xEE56...8D5`), Compound Timelock (`0x6d90...925`), or Uniswap Timelock (`0x1a9C...5BC`) | `from: 0xf39F...2266` (Hardhat default signer) |
| **Simulation metrics** | Derived from actual DeFi state changes (real token transfers, storage mutations, oracle updates) | Derived from `gasUsed` and `logCount` of the mock transaction via heuristic formulas* |

#### *Heuristic Simulation Formulas

Since the demo simulates a mock `createProposal()` call rather than the actual DeFi action, the simulation metrics are approximated from the transaction receipt using these formulas:

**Inputs** (from Tenderly VTN transaction receipt):
- `gasUsed` — gas consumed by the transaction
- `logCount` — number of event logs emitted
- `success` — whether the transaction reverted

**Normalized values:**
- `gasNorm = min(gasUsed / 500000, 1)` — normalizes gas to 0–1 range (500k gas = max)
- `logNorm = min(logCount / 5, 1)` — normalizes log count to 0–1 range (5 logs = max)

**Output metrics:**

| Metric | Formula | Range | Interpretation |
|--------|---------|-------|----------------|
| TVL Change % | `logCount × 2.5 + gasNorm × 3` | 0–15% | Higher gas + more events → larger estimated TVL impact |
| Liquidation Risk | `gasNorm × 45 + logNorm × 30 + (reverted ? 25 : 0)` | 0–100 | Combines gas complexity, event volume, and revert status |
| Price Impact % | `min(5, logNorm × 2 + gasNorm × 1.5)` | 0–5% | Capped at 5%; reflects potential oracle/price disruption |
| Collateral Ratio (After) | `1.52 − liquidationRisk × 0.003` | ~1.0–1.52x | Decreases proportionally with risk score |
| Affected Addresses | `max(logCount × 2, gasNorm × 50)` | 0–50 | Rough estimate of impacted accounts |

These heuristics provide **differentiated, non-random input** to the AI agents so they can reason about relative risk. In production, these metrics would be derived from actual state diffs of the real DeFi operation.

---

## Roadmap / TODOs

### Tenderly State Sync & Real Proposal Execution
- [ ] Implement Tenderly VTN state sync to fork at the exact block of proposal submission
- [ ] Execute actual proposal calldata (e.g., `COMP.transfer()`, `LendingPool.setReserveConfiguration()`) via impersonated Executor/Timelock addresses
- [ ] Replace heuristic formulas with real simulation metrics derived from actual state diffs (storage slot changes, token balance deltas, oracle price mutations)
- [ ] Add pre/post simulation state comparison for human-readable impact reports

### CRE Log Trigger Integration
- [ ] Deploy log triggers for Aave Governance V3 (`0x9AEE...BC7`), Compound GovernorBravo (`0xc0Da...529`), and Uniswap GovernorBravo (`0x408E...C3`)
- [ ] Parse each protocol's unique `ProposalCreated` event signature (Aave uses `bytes32` for ipfsHash, Compound/Uniswap use `string` for description)
- [ ] Multi-chain support — monitor governance contracts across Ethereum mainnet, Arbitrum, Optimism, Polygon

### AI Agent Architecture Improvements
- [ ] Implement sub-agent architecture with specialized tool-calling (e.g., Brutus has access to a historical attack database tool, Cassius can call simulation APIs)
- [ ] Improve debate quality with few-shot examples of real governance debates
- [ ] Add a second round of debate where agents can cross-examine each other directly
- [ ] Fine-tune agent prompts with real governance proposal/attack datasets
- [ ] Implement confidence calibration — agents should lower confidence when simulation data is ambiguous

### General
- [ ] Multi-protocol support beyond Aave, Compound, Uniswap (MakerDAO, Curve, Balancer)
- [ ] Alert system — push notifications to Discord/Telegram when a high-risk proposal is detected
- [ ] Historical risk score tracking and trend analysis
- [ ] Integration with Snapshot for off-chain governance monitoring

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, Framer Motion |
| **Backend** | Next.js API Routes, Server-Sent Events (SSE) for real-time pipeline streaming |
| **Database** | MongoDB Atlas (via Mongoose 9) |
| **AI Model** | Google Gemini 2.5 Flash (`gemini-2.5-flash`) — streaming API for live debate, batched API for DON report |
| **Blockchain Simulation** | Tenderly Virtual TestNets (mainnet fork with persistent state and transaction explorer) |
| **Workflow Orchestration** | Chainlink CRE SDK — log triggers, HTTP client, EVM write, DON-signed reports |
| **Smart Contracts** | Solidity (Hardhat) — SenateGovernor, SenateReport, SenateRiskOracle |
| **Runtime** | Bun (CRE workflow), Node.js (Next.js) |
