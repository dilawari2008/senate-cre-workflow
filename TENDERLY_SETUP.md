# Getting Tenderly Virtual TestNet Explorer Links

## Quick Answer

Your app **already generates** Tenderly simulation URLs! They're created at line 257 in `pipeline.ts`:

```
https://dashboard.tenderly.co/{ACCOUNT}/{PROJECT}/simulator/{FORK_ID}
```

## Method 1: Get Links from Your Running App ✅ (Fastest)

### Step 1: Run a simulation

```bash
npm run dev
# Open http://localhost:3000
# Click any demo proposal
# Click "Run Simulation"
```

### Step 2: Find the Tenderly URL

The URL is logged in your webhook payload. Check:

1. **Browser DevTools Console** - Look for the simulation response
2. **MongoDB** - Check the `simulations` collection for `forkUrl`
3. **Terminal logs** - The CRE workflow logs the fork ID

### Step 3: Construct the URL manually

If you have the fork ID from logs:

```
https://dashboard.tenderly.co/{YOUR_TENDERLY_ACCOUNT}/senate/simulator/{FORK_ID}
```

Replace:
- `{YOUR_TENDERLY_ACCOUNT}` - Your Tenderly username/account
- `{FORK_ID}` - The simulation ID from the response (line 82 in pipeline.ts)

---

## Method 2: Create a Persistent Virtual TestNet ⭐ (Best for Hackathon)

This creates a **permanent testnet** with its own explorer, perfect for your submission.

### Step 1: Create a Virtual TestNet on Tenderly Dashboard

1. Go to https://dashboard.tenderly.co
2. Click **"Virtual TestNets"** in the sidebar
3. Click **"Create Virtual TestNet"**
4. Configure:
   - **Name:** `senate-testnet`
   - **Base Network:** Ethereum Mainnet (for mainnet fork)
   - **Chain ID:** `73571` (or any unused ID)
   - **Visibility:** Public (so judges can view)
5. Click **"Create"**

### Step 2: Get Your VTN RPC URL

After creation, you'll see:
- **RPC URL:** `https://virtual.mainnet.rpc.tenderly.co/{YOUR_VTN_ID}`
- **Explorer URL:** `https://dashboard.tenderly.co/explorer/vnet/{YOUR_VTN_ID}`

### Step 3: Deploy Your Contracts to the VTN

Update your `.env`:

```bash
# Add these to your .env
TENDERLY_VTN_RPC=https://virtual.mainnet.rpc.tenderly.co/YOUR_VTN_ID
TENDERLY_VTN_EXPLORER_URL=https://dashboard.tenderly.co/explorer/vnet/YOUR_VTN_ID
TENDERLY_VTN_CHAIN_ID=73571
```

Create a new Hardhat network config:

```bash
# Edit contracts/hardhat.config.ts
# Add this network:

tenderly_vtn: {
  url: process.env.TENDERLY_VTN_RPC || "",
  chainId: parseInt(process.env.TENDERLY_VTN_CHAIN_ID || "73571"),
  accounts: [process.env.PRIVATE_KEY || ""],
}
```

Deploy your contracts:

```bash
cd contracts
npx hardhat run scripts/deploy-all.ts --network tenderly_vtn
```

### Step 4: Get Your Explorer Links

After deployment, you'll have:

**Contract Explorer Links:**
```
https://dashboard.tenderly.co/explorer/vnet/{YOUR_VTN_ID}/address/{CONTRACT_ADDRESS}
```

**Transaction Explorer Links:**
```
https://dashboard.tenderly.co/explorer/vnet/{YOUR_VTN_ID}/tx/{TX_HASH}
```

---

## Method 3: Use Tenderly CLI (Alternative)

### Install Tenderly CLI

```bash
npm install -g @tenderly/cli
tenderly login
```

### Create and Deploy to VTN

```bash
# Create VTN
tenderly virtual-network create \
  --name senate-testnet \
  --chain-id 73571 \
  --network-id 1

# Deploy contracts
cd contracts
npx hardhat run scripts/deploy-all.ts --network tenderly_vtn

# Get explorer URL
tenderly virtual-network list
```

---

## What to Include in Your Hackathon Submission

### 1. Tenderly Virtual TestNet Explorer Link

```markdown
## Tenderly Virtual TestNet

**Network:** [Senate TestNet](https://dashboard.tenderly.co/explorer/vnet/YOUR_VTN_ID)

**Deployed Contracts:**
- **SenateGovernor:** [0x...](https://dashboard.tenderly.co/explorer/vnet/YOUR_VTN_ID/address/0x...)
- **SenateReport:** [0x...](https://dashboard.tenderly.co/explorer/vnet/YOUR_VTN_ID/address/0x...)
- **SenateRiskOracle:** [0x...](https://dashboard.tenderly.co/explorer/vnet/YOUR_VTN_ID/address/0x...)

**Example Transactions:**
- [Proposal Simulation #1](https://dashboard.tenderly.co/explorer/vnet/YOUR_VTN_ID/tx/0x...)
- [Report Published](https://dashboard.tenderly.co/explorer/vnet/YOUR_VTN_ID/tx/0x...)
```

### 2. Simulation Examples

Run 3-5 simulations and save the URLs:

```markdown
**Simulation Examples:**
1. [WBTC Collateral - Unanimous PASS](https://dashboard.tenderly.co/YOUR_ACCOUNT/senate/simulator/FORK_ID_1)
2. [Emergency Treasury Drain - Attack Detected](https://dashboard.tenderly.co/YOUR_ACCOUNT/senate/simulator/FORK_ID_2)
3. [Compound Reserve Factor - Split Vote](https://dashboard.tenderly.co/YOUR_ACCOUNT/senate/simulator/FORK_ID_3)
```

---

## Troubleshooting

### "Simulation not found"

Your code saves simulations with `save: true` (line 48), so they should persist. If not:

1. Check your Tenderly account dashboard
2. Go to **Simulations** tab
3. Sort by **Recent**
4. Find your simulation and copy the URL

### "Can't create VTN"

Free Tenderly accounts have limited VTNs. Options:
- Delete old VTNs
- Use one-off simulations instead (Method 1)
- Request a hackathon account upgrade

### "Contracts not showing in explorer"

VTN contracts appear immediately after deployment. If missing:
1. Check the deployment transaction succeeded
2. Verify you're using the correct VTN RPC URL
3. Check the explorer URL format: `https://dashboard.tenderly.co/explorer/vnet/{VTN_ID}/address/{ADDRESS}`

---

## Quick Checklist for Submission

- [ ] Create Tenderly VTN or run simulations
- [ ] Deploy contracts (VTN or Sepolia)
- [ ] Run 3-5 example simulations
- [ ] Save all explorer URLs
- [ ] Take screenshots of:
  - [ ] Tenderly simulation results
  - [ ] State diffs
  - [ ] Transaction traces
  - [ ] Contract deployments
- [ ] Update README with all links
- [ ] Test all links in incognito mode (ensure public access)

---

## Resources

- [Tenderly Virtual TestNets Docs](https://docs.tenderly.co/virtual-testnets)
- [Tenderly Simulation API](https://docs.tenderly.co/simulations-and-forks/simulation-api)
- [Your Tenderly Dashboard](https://dashboard.tenderly.co)
