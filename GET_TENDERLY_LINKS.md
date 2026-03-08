# How to Get Tenderly Virtual TestNet Explorer Links

## The Answer You're Looking For

Your code **already generates** Tenderly URLs at line 257 in `pipeline.ts`:

```typescript
const tenderlyUrl = `https://dashboard.tenderly.co/${runtime.config.tenderlyAccount}/${runtime.config.tenderlyProject}/simulator/${simResults.forkId}`;
```

**You just need to run a simulation and capture this URL!**

---

## Fastest Method (2 minutes)

### 1. Run your app
```bash
npm run dev
```

### 2. Open browser and run a simulation
- Go to http://localhost:3000
- Click any proposal
- Click "Run Simulation"

### 3. Get the URL

**Option A: From your code logs**
- The URL is sent to your webhook (line 274 in `pipeline.ts`)
- Check your terminal logs or MongoDB for `forkUrl`

**Option B: From Tenderly Dashboard**
- Go to https://dashboard.tenderly.co
- Click "Simulations" in sidebar
- Find your recent simulation
- Copy the URL

**Option C: Use the helper script**
```bash
npm install  # Install tsx if needed
npm run test-tenderly  # Test connection first
npm run capture-links  # Get all simulation URLs
```

---

## URL Format

```
https://dashboard.tenderly.co/{YOUR_ACCOUNT}/senate/simulator/{SIMULATION_ID}
```

**Example:**
```
https://dashboard.tenderly.co/alice/senate/simulator/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Where to get each part:**
- `YOUR_ACCOUNT` - From `.env`: `TENDERLY_ACCOUNT`
- `senate` - From `.env`: `TENDERLY_PROJECT` (default: "senate")
- `SIMULATION_ID` - Returned from Tenderly API (line 82 in `pipeline.ts`)

---

## For Hackathon Submission

You need **Tenderly Virtual TestNet Explorer Link** showing:
1. Deployed smart contracts
2. Transaction history

### Two Options:

#### Option 1: Use One-Off Simulations (Easier)
- Run 3-5 simulations through your app
- Each creates a Tenderly simulation URL
- These show the execution but not deployed contracts

**Good for:** Demonstrating the workflow

#### Option 2: Create Persistent VTN (Better)
- Create a Virtual TestNet on Tenderly
- Deploy your contracts there
- Get permanent explorer links

**Good for:** Showing deployed contracts + transaction history

---

## Create Persistent Virtual TestNet (Recommended)

### Step 1: Create VTN
1. Go to https://dashboard.tenderly.co
2. Click "Virtual TestNets" → "Create Virtual TestNet"
3. Configure:
   - Name: `senate-testnet`
   - Base Network: Ethereum Mainnet
   - Chain ID: `73571`
   - **Visibility: Public** (important!)

### Step 2: Get URLs
After creation:
- **RPC:** `https://virtual.mainnet.rpc.tenderly.co/{VTN_ID}`
- **Explorer:** `https://dashboard.tenderly.co/explorer/vnet/{VTN_ID}`

### Step 3: Deploy Contracts
Add to `.env`:
```bash
TENDERLY_VTN_RPC=https://virtual.mainnet.rpc.tenderly.co/YOUR_VTN_ID
```

Add to `contracts/hardhat.config.ts`:
```typescript
tenderly_vtn: {
  url: process.env.TENDERLY_VTN_RPC,
  chainId: 73571,
  accounts: [process.env.PRIVATE_KEY],
}
```

Deploy:
```bash
cd contracts
npx hardhat run scripts/deploy-all.ts --network tenderly_vtn
```

### Step 4: Get Explorer Links
Your contracts will be at:
```
https://dashboard.tenderly.co/explorer/vnet/{VTN_ID}/address/{CONTRACT_ADDRESS}
```

---

## What to Include in Submission

### Minimum (Required)
```markdown
## Tenderly Integration

**Example Simulation:**
[WBTC Collateral Proposal](https://dashboard.tenderly.co/alice/senate/simulator/abc123)
```

### Better
```markdown
## Tenderly Virtual TestNet Simulations

1. [WBTC Collateral - Unanimous PASS](https://dashboard.tenderly.co/alice/senate/simulator/abc123)
2. [Treasury Drain - Attack Detected](https://dashboard.tenderly.co/alice/senate/simulator/def456)
3. [Reserve Factor - Split Vote](https://dashboard.tenderly.co/alice/senate/simulator/ghi789)
```

### Best
```markdown
## Tenderly Virtual TestNet

**Network:** [Senate VTN Explorer](https://dashboard.tenderly.co/explorer/vnet/YOUR_VTN_ID)

**Deployed Contracts:**
- **SenateGovernor:** [0x...](https://dashboard.tenderly.co/explorer/vnet/YOUR_VTN_ID/address/0x...)
- **SenateReport:** [0x...](https://dashboard.tenderly.co/explorer/vnet/YOUR_VTN_ID/address/0x...)
- **SenateRiskOracle:** [0x...](https://dashboard.tenderly.co/explorer/vnet/YOUR_VTN_ID/address/0x...)

**Example Simulations:**
1. [WBTC Collateral - Unanimous PASS](https://dashboard.tenderly.co/alice/senate/simulator/abc123)
2. [Treasury Drain - Attack Detected](https://dashboard.tenderly.co/alice/senate/simulator/def456)
3. [Reserve Factor - Split Vote](https://dashboard.tenderly.co/alice/senate/simulator/ghi789)
```

---

## Troubleshooting

### Can't find simulation URLs

**Check these places:**

1. **Browser DevTools Console**
   - Open DevTools (F12)
   - Look for API responses
   - Find `forkUrl` or `forkId`

2. **MongoDB** (if enabled)
   - Connect to your database
   - Check `simulations` collection
   - Look for `simulation.forkUrl`

3. **Tenderly Dashboard**
   - https://dashboard.tenderly.co
   - Click "Simulations"
   - Sort by "Recent"

4. **Terminal Logs**
   - Check your app's console output
   - Look for "Tenderly" or "simulation"

### Simulation URL returns 404

**Possible causes:**

1. **Project is private**
   - Go to Tenderly project settings
   - Set visibility to "Public"

2. **Wrong account name**
   - Check `.env` for `TENDERLY_ACCOUNT`
   - It's case-sensitive!

3. **Simulation not saved**
   - Check line 48 in `pipeline.ts`: `save: true`
   - This should already be set

### API returns 401 Unauthorized

**Fix:**
1. Go to https://dashboard.tenderly.co/account/authorization
2. Generate new access token
3. Update `.env`: `TENDERLY_ACCESS_KEY=...`
4. Restart your app

---

## Quick Commands

```bash
# Test Tenderly connection
npm run test-tenderly

# Run app and create simulations
npm run dev

# Capture all simulation URLs
npm run capture-links

# Deploy to Sepolia (for Etherscan links)
cd contracts && npx hardhat run scripts/deploy-all.ts --network sepolia
```

---

## Files Created for You

I've created these helper files:

1. **`TENDERLY_SETUP.md`** - Detailed Tenderly setup guide
2. **`SUBMISSION_CHECKLIST.md`** - Complete hackathon submission checklist
3. **`QUICK_START_SUBMISSION.md`** - 5-minute quick start guide
4. **`scripts/test-tenderly.ts`** - Test your Tenderly connection
5. **`scripts/capture-tenderly-links.ts`** - Auto-capture simulation URLs

---

## Summary

**To get Tenderly links:**

1. ✅ Configure `.env` with Tenderly credentials
2. ✅ Run `npm run test-tenderly` to verify
3. ✅ Run `npm run dev` and simulate a proposal
4. ✅ Run `npm run capture-links` to get URLs
5. ✅ Add URLs to README.md

**For best submission:**
- Create a persistent Virtual TestNet
- Deploy contracts there
- Get both simulation URLs and contract explorer links

---

## Need More Help?

- **Quick Start:** Read `QUICK_START_SUBMISSION.md`
- **Full Guide:** Read `TENDERLY_SETUP.md`
- **Checklist:** Read `SUBMISSION_CHECKLIST.md`
- **Test Script:** Run `npm run test-tenderly`
- **Tenderly Docs:** https://docs.tenderly.co/virtual-testnets
