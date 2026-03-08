# Quick Start: Get Your Tenderly Links in 5 Minutes

## TL;DR

```bash
# 1. Install dependencies
npm install

# 2. Test Tenderly connection
npm run test-tenderly

# 3. Run your app
npm run dev

# 4. Open browser and run a simulation
# http://localhost:3000 → Click proposal → "Run Simulation"

# 5. Capture the links
npm run capture-links
```

---

## Step-by-Step with Screenshots

### Step 1: Configure Tenderly (2 minutes)

1. **Get your Tenderly credentials:**
   - Go to https://dashboard.tenderly.co
   - Click your profile → Settings → Authorization
   - Copy your **Access Token**
   - Note your **Account Name** (in the URL: `dashboard.tenderly.co/{ACCOUNT}/...`)

2. **Add to `.env`:**
   ```bash
   TENDERLY_ACCOUNT=your-account-name
   TENDERLY_PROJECT=senate
   TENDERLY_ACCESS_KEY=your-access-token
   ```

3. **Test the connection:**
   ```bash
   npm run test-tenderly
   ```
   
   Expected output:
   ```
   ✅ Environment variables found
   ✅ Connected to project: senate
   ✅ Test simulation successful!
   ```

---

### Step 2: Run a Simulation (1 minute)

1. **Start your app:**
   ```bash
   npm run dev
   ```

2. **Open in browser:**
   ```
   http://localhost:3000
   ```

3. **Click any proposal:**
   - Example: "Add WBTC as Collateral on Aave"

4. **Click "Run Simulation" button**

5. **Wait for completion** (30-60 seconds)
   - You'll see: Tenderly simulation → AI debate → Final verdict

---

### Step 3: Get the Tenderly URL (1 minute)

The Tenderly URL is automatically generated! Here's where to find it:

#### Option A: From Browser Console (Easiest)

1. Open DevTools (F12)
2. Go to Console tab
3. Look for the API response
4. Find the `forkUrl` field
5. Copy the URL

#### Option B: From Tenderly Dashboard

1. Go to https://dashboard.tenderly.co
2. Click **"Simulations"** in sidebar
3. Find your recent simulation
4. Click to open
5. Copy the URL from browser address bar

#### Option C: Use the Helper Script

```bash
npm run capture-links
```

This will:
- Fetch all simulations from your app
- Generate a markdown file with all links
- Print them to console

---

### Step 4: Update Your README (1 minute)

Copy the output from `npm run capture-links` and paste into your README.md:

```markdown
## Tenderly Virtual TestNet Simulations

### WBTC Collateral - Unanimous PASS

- **Simulation:** [View on Tenderly](https://dashboard.tenderly.co/YOUR_ACCOUNT/senate/simulator/abc123)
- **Verdict:** All 4 senators voted PASS
- **Risk Score:** 15/100

### Emergency Treasury Drain - Attack Detected

- **Simulation:** [View on Tenderly](https://dashboard.tenderly.co/YOUR_ACCOUNT/senate/simulator/def456)
- **Verdict:** Unanimous FAIL, matched historical attack pattern
- **Risk Score:** 95/100
```

---

## Manual URL Construction

If the scripts don't work, you can construct URLs manually:

### Format:
```
https://dashboard.tenderly.co/{ACCOUNT}/{PROJECT}/simulator/{SIMULATION_ID}
```

### Example:
```
https://dashboard.tenderly.co/alice/senate/simulator/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### Where to find each part:

1. **ACCOUNT** - Your Tenderly username (from `.env`: `TENDERLY_ACCOUNT`)
2. **PROJECT** - Your project name (from `.env`: `TENDERLY_PROJECT`, default: `senate`)
3. **SIMULATION_ID** - From the API response in your code at line 82 in `pipeline.ts`:
   ```typescript
   return { forkId: simData?.simulation?.id || `sim-${Date.now()}`, ... };
   ```

---

## Troubleshooting

### "No simulations found"

**Problem:** The script can't find any simulations.

**Solutions:**
1. Make sure you've run at least one simulation in the app
2. Check that `TENDERLY_ACCESS_KEY` is set correctly
3. Verify your app is running and connected to Tenderly

### "Tenderly API error: 401"

**Problem:** Invalid access key.

**Solutions:**
1. Go to https://dashboard.tenderly.co/account/authorization
2. Generate a new access token
3. Update `.env` with the new token
4. Restart your app

### "Tenderly API error: 404"

**Problem:** Project not found.

**Solutions:**
1. Check your `TENDERLY_ACCOUNT` is correct (it's case-sensitive!)
2. Check your `TENDERLY_PROJECT` exists
3. Create the project if it doesn't exist:
   - Go to https://dashboard.tenderly.co
   - Click "Create Project"
   - Name it "senate"

### "Simulation URL returns 404"

**Problem:** Simulation not saved or project is private.

**Solutions:**
1. Check that `save: true` is set in the API call (line 48 in `pipeline.ts`)
2. Make sure your Tenderly project is not private:
   - Go to Project Settings
   - Set visibility to "Public"
3. Wait a few seconds - simulations take time to process

### "Script fails with 'tsx not found'"

**Problem:** TypeScript executor not installed.

**Solution:**
```bash
npm install
# This will install tsx from package.json
```

---

## Alternative: Create a Persistent Virtual TestNet

If you want a permanent testnet with its own explorer (better for hackathon):

### 1. Create VTN on Tenderly Dashboard

1. Go to https://dashboard.tenderly.co
2. Click **"Virtual TestNets"** → **"Create Virtual TestNet"**
3. Configure:
   - **Name:** `senate-testnet`
   - **Base Network:** Ethereum Mainnet
   - **Chain ID:** `73571`
   - **Visibility:** **Public** ⚠️ Important!
4. Click **"Create"**

### 2. Get Your VTN URLs

After creation, you'll see:
- **RPC URL:** `https://virtual.mainnet.rpc.tenderly.co/{VTN_ID}`
- **Explorer:** `https://dashboard.tenderly.co/explorer/vnet/{VTN_ID}`

### 3. Deploy Contracts to VTN

Add to `.env`:
```bash
TENDERLY_VTN_RPC=https://virtual.mainnet.rpc.tenderly.co/YOUR_VTN_ID
TENDERLY_VTN_EXPLORER_URL=https://dashboard.tenderly.co/explorer/vnet/YOUR_VTN_ID
```

Add to `contracts/hardhat.config.ts`:
```typescript
tenderly_vtn: {
  url: process.env.TENDERLY_VTN_RPC || "",
  chainId: 73571,
  accounts: [process.env.PRIVATE_KEY || ""],
}
```

Deploy:
```bash
cd contracts
npx hardhat run scripts/deploy-all.ts --network tenderly_vtn
```

### 4. Get Explorer Links

Your contracts will be at:
```
https://dashboard.tenderly.co/explorer/vnet/{VTN_ID}/address/{CONTRACT_ADDRESS}
```

---

## What You Need for Submission

✅ **Minimum Required:**
- 1-3 Tenderly simulation URLs showing your workflow

⭐ **Better:**
- 3-5 simulation URLs with different scenarios
- Deployed contracts on Sepolia with Etherscan links

🏆 **Best:**
- Persistent Virtual TestNet with deployed contracts
- VTN Explorer links for all contracts
- Multiple simulation examples
- Transaction history showing CRE workflow execution

---

## Next Steps

After getting your Tenderly links:

1. ✅ Add them to README.md
2. ✅ Deploy contracts to Sepolia (see `SUBMISSION_CHECKLIST.md`)
3. ✅ Record your 3-5 minute video demo
4. ✅ Test all links in incognito mode
5. ✅ Submit to hackathon!

---

## Need Help?

- **Tenderly Docs:** https://docs.tenderly.co
- **Chainlink Discord:** Ask in #convergence-hackathon
- **Your Code:** Check `pipeline.ts` line 257 for URL generation

Good luck! 🚀
