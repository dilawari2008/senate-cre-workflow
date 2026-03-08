# Hackathon Submission Checklist

## 🎯 Required for All Tracks

### 1. ✅ CRE Workflow (You have this!)
- [x] Integrates blockchain (Sepolia) with external APIs (Tenderly, Gemini)
- [x] Demonstrates successful simulation via CRE
- [x] Uses HTTP triggers, EVM read/write, DON reports

### 2. ⚠️ Video Demo (3-5 minutes)
- [ ] Record screen showing:
  - [ ] App overview (30 seconds)
  - [ ] Submit a proposal (30 seconds)
  - [ ] CRE workflow execution (1 minute)
  - [ ] Tenderly simulation results (30 seconds)
  - [ ] AI agents debating (1 minute)
  - [ ] Final verdict + on-chain transaction (30 seconds)
  - [ ] Show Etherscan/Tenderly explorer links (30 seconds)
- [ ] Upload to YouTube (unlisted or public)
- [ ] Add link to README

**Tools:** OBS Studio, Loom, or QuickTime (Mac)

### 3. ✅ Public Source Code
- [x] GitHub public repository
- [ ] Verify repo is public (not private!)

### 4. ⚠️ README with Chainlink Links
- [x] Basic README exists
- [ ] Add deployed contract addresses
- [ ] Add Tenderly simulation links
- [ ] Add video demo link
- [ ] Link to all files using Chainlink CRE

---

## 📋 Step-by-Step: Getting Tenderly Links

### Option A: Quick Method (Use Existing Simulations)

1. **Run your app:**
   ```bash
   npm run dev
   ```

2. **Run a simulation:**
   - Open http://localhost:3000
   - Click any demo proposal (e.g., "WBTC Collateral on Aave")
   - Click "Run Simulation"
   - Wait for completion

3. **Capture the Tenderly URL:**
   
   **Method 1: From Browser Console**
   - Open DevTools (F12)
   - Look for the simulation response
   - Find `forkUrl` or `forkId`
   
   **Method 2: From MongoDB (if enabled)**
   ```bash
   npm install -g mongodb-compass
   # Connect to your MongoDB
   # Check the 'simulations' collection
   # Copy the 'forkUrl' field
   ```
   
   **Method 3: Use the helper script**
   ```bash
   npm install  # Install tsx if needed
   npm run capture-links
   ```

4. **Construct URL manually if needed:**
   ```
   https://dashboard.tenderly.co/{YOUR_ACCOUNT}/senate/simulator/{FORK_ID}
   ```
   
   Replace:
   - `{YOUR_ACCOUNT}` - Your Tenderly username (from .env: `TENDERLY_ACCOUNT`)
   - `{FORK_ID}` - The simulation ID from logs

5. **Verify the link works:**
   - Open in incognito browser
   - Should show simulation details, state diffs, traces

### Option B: Create Persistent Virtual TestNet (Recommended)

1. **Go to Tenderly Dashboard:**
   - https://dashboard.tenderly.co
   - Click "Virtual TestNets" → "Create Virtual TestNet"

2. **Configure VTN:**
   - Name: `senate-testnet`
   - Base Network: Ethereum Mainnet
   - Chain ID: `73571`
   - Visibility: **Public** (important!)

3. **Get RPC URL:**
   - Copy the RPC URL: `https://virtual.mainnet.rpc.tenderly.co/{VTN_ID}`
   - Copy Explorer URL: `https://dashboard.tenderly.co/explorer/vnet/{VTN_ID}`

4. **Add to .env:**
   ```bash
   TENDERLY_VTN_RPC=https://virtual.mainnet.rpc.tenderly.co/YOUR_VTN_ID
   TENDERLY_VTN_EXPLORER_URL=https://dashboard.tenderly.co/explorer/vnet/YOUR_VTN_ID
   ```

5. **Deploy contracts to VTN:**
   ```bash
   cd contracts
   # Add VTN network to hardhat.config.ts first (see TENDERLY_SETUP.md)
   npx hardhat run scripts/deploy-all.ts --network tenderly_vtn
   ```

6. **Get explorer links:**
   ```
   https://dashboard.tenderly.co/explorer/vnet/{VTN_ID}/address/{CONTRACT_ADDRESS}
   ```

---

## 🚀 Deploy Contracts to Sepolia

### 1. Get Sepolia ETH
- Faucet: https://sepoliafaucet.com
- Or: https://www.alchemy.com/faucets/ethereum-sepolia

### 2. Configure .env
```bash
NETWORK=sepolia
CHAIN_ID=11155111
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=0x...  # Your wallet private key
```

### 3. Deploy
```bash
cd contracts
npm install
npx hardhat run scripts/deploy-all.ts --network sepolia
```

### 4. Save addresses
Copy the output addresses to:
- `.env` file
- `README.md`
- Your submission form

### 5. Verify on Etherscan (optional but recommended)
```bash
# Get Etherscan API key: https://etherscan.io/myapikey
npx hardhat verify --network sepolia {CONTRACT_ADDRESS}
```

---

## 📝 Update README

Add this section to your README.md:

```markdown
## 🌐 Live Deployment

### Sepolia Testnet

- **SenateGovernor:** [`0x...`](https://sepolia.etherscan.io/address/0x...)
- **SenateReport:** [`0x...`](https://sepolia.etherscan.io/address/0x...)
- **SenateRiskOracle:** [`0x...`](https://sepolia.etherscan.io/address/0x...)

### Tenderly Virtual TestNet

**Network:** [Senate VTN Explorer](https://dashboard.tenderly.co/explorer/vnet/YOUR_VTN_ID)

**Deployed Contracts:**
- **SenateGovernor:** [`0x...`](https://dashboard.tenderly.co/explorer/vnet/YOUR_VTN_ID/address/0x...)
- **SenateReport:** [`0x...`](https://dashboard.tenderly.co/explorer/vnet/YOUR_VTN_ID/address/0x...)
- **SenateRiskOracle:** [`0x...`](https://dashboard.tenderly.co/explorer/vnet/YOUR_VTN_ID/address/0x...)

### Example Simulations

1. **WBTC Collateral - Unanimous PASS**
   - [Tenderly Simulation](https://dashboard.tenderly.co/YOUR_ACCOUNT/senate/simulator/FORK_ID_1)
   - Risk Score: 15/100
   - Verdict: All 4 senators voted PASS

2. **Emergency Treasury Drain - Attack Detected**
   - [Tenderly Simulation](https://dashboard.tenderly.co/YOUR_ACCOUNT/senate/simulator/FORK_ID_2)
   - Risk Score: 95/100
   - Verdict: Unanimous FAIL, matched historical attack pattern

3. **Compound Reserve Factor - Split Vote**
   - [Tenderly Simulation](https://dashboard.tenderly.co/YOUR_ACCOUNT/senate/simulator/FORK_ID_3)
   - Risk Score: 58/100
   - Verdict: 2-2 split, Solomon broke the tie

## 🎥 Demo Video

[Watch 5-minute demo on YouTube](YOUR_VIDEO_LINK)

## 📦 Chainlink CRE Integration

All CRE workflow files:
- [`senate-workflow/my-senate-workflow/main.ts`](./senate-workflow/my-senate-workflow/main.ts) - Entry point
- [`senate-workflow/my-senate-workflow/pipeline.ts`](./senate-workflow/my-senate-workflow/pipeline.ts) - Main workflow logic
- [`senate-workflow/my-senate-workflow/httpCallback.ts`](./senate-workflow/my-senate-workflow/httpCallback.ts) - HTTP trigger
- [`senate-workflow/my-senate-workflow/logCallback.ts`](./senate-workflow/my-senate-workflow/logCallback.ts) - EVM log trigger
- [`senate-workflow/my-senate-workflow/cronCallback.ts`](./senate-workflow/my-senate-workflow/cronCallback.ts) - Cron trigger
```

---

## 🎬 Recording Your Video

### Script Template (5 minutes)

**[0:00-0:30] Introduction**
- "Hi, I'm [name], and this is SENATE - an AI-powered governance debate protocol"
- "It uses Chainlink CRE to orchestrate 5 AI agents that debate proposals using real Tenderly simulation data"

**[0:30-1:00] Problem & Solution**
- "Governance is hard - voters lack time and expertise"
- "SENATE solves this by simulating proposals on mainnet forks, detecting attack patterns, and running multi-agent debates"

**[1:00-2:00] Live Demo - Submit Proposal**
- Show the dashboard
- Click a proposal
- Click "Run Simulation"
- Show the loading states

**[2:00-3:00] Show Tenderly Simulation**
- Open Tenderly link
- Show state diffs, gas usage, transfers
- Highlight the mainnet fork

**[3:00-4:00] Show AI Debate**
- Show the 4 senators' opening statements
- Show Solomon's review
- Show counter-questions (if any)
- Show final verdict

**[4:00-4:30] Show On-Chain Transaction**
- Show Etherscan link
- Show the published report
- Show the DON signature

**[4:30-5:00] Wrap Up**
- "Built with Chainlink CRE, Tenderly VTN, and Google Gemini"
- "Targeting CRE & AI, Risk & Compliance, and Tenderly tracks"
- "Thank you!"

### Recording Tips

- Use 1080p resolution
- Enable system audio
- Speak clearly and not too fast
- Zoom in on important parts
- Edit out long loading times
- Add captions if possible

---

## ✅ Final Checklist

Before submitting:

- [ ] Video uploaded and link added to README
- [ ] Contracts deployed to Sepolia (or VTN)
- [ ] All contract addresses in README
- [ ] 3-5 Tenderly simulation links in README
- [ ] GitHub repo is public
- [ ] README has "Chainlink CRE Integration" section
- [ ] All links tested in incognito mode
- [ ] Screenshots taken for backup
- [ ] .env.example updated with all required variables
- [ ] Installation instructions work on fresh clone

---

## 🆘 Troubleshooting

### "Can't find Tenderly simulation"

Your simulations are saved with `save: true` in the API call. Check:
1. Tenderly Dashboard → Simulations tab
2. Sort by "Recent"
3. Look for simulations from your account

### "Simulation URL returns 404"

Make sure:
1. Your Tenderly project is not private
2. You're using the correct account name
3. The fork ID is correct

### "No simulations showing up"

Check:
1. `TENDERLY_ACCESS_KEY` is set in .env
2. `TENDERLY_ACCOUNT` and `TENDERLY_PROJECT` are correct
3. The API call succeeded (check browser console)

### "Can't deploy to Sepolia"

1. Check you have Sepolia ETH (get from faucet)
2. Verify `PRIVATE_KEY` is correct
3. Check `RPC_URL` is working
4. Try increasing gas limit in hardhat.config.ts

---

## 📚 Resources

- [Tenderly Setup Guide](./TENDERLY_SETUP.md)
- [Chainlink CRE Docs](https://docs.chain.link/chainlink-runtime-environment)
- [Tenderly VTN Docs](https://docs.tenderly.co/virtual-testnets)
- [Hackathon Prizes](https://chain.link/hackathon/prizes)
