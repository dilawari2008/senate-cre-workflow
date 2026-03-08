import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;

  console.log(`\n🏛️  SENATE Contract Deployment`);
  console.log(`   Network:  ${networkName}`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  const MOCK_FORWARDER = process.env.CRE_FORWARDER_ADDRESS || "0x15fC6ae953E024d975e77382eEeC56A9101f9F88";

  // 1. Deploy SenateReport
  console.log("1/3 Deploying SenateReport...");
  const SenateReport = await ethers.getContractFactory("SenateReport");
  const senateReport = await SenateReport.deploy(MOCK_FORWARDER);
  await senateReport.waitForDeployment();
  const reportAddr = await senateReport.getAddress();
  console.log(`    ✅ SenateReport:    ${reportAddr}`);

  // 2. Deploy Governor contracts per protocol
  console.log("2/5 Deploying Governor contracts per protocol...");
  const SenateGovernor = await ethers.getContractFactory("SenateGovernor");

  const govAave = await SenateGovernor.deploy();
  await govAave.waitForDeployment();
  const govAaveAddr = await govAave.getAddress();
  console.log(`    ✅ AaveGovernor:    ${govAaveAddr}`);

  const govCompound = await SenateGovernor.deploy();
  await govCompound.waitForDeployment();
  const govCompoundAddr = await govCompound.getAddress();
  console.log(`    ✅ CompoundGovernor:${govCompoundAddr}`);

  const govUniswap = await SenateGovernor.deploy();
  await govUniswap.waitForDeployment();
  const govUniswapAddr = await govUniswap.getAddress();
  console.log(`    ✅ UniswapGovernor: ${govUniswapAddr}`);

  const govAddr = govAaveAddr;

  // 3. Deploy SenateRiskOracle (updater = deployer for demo)
  console.log("3/3 Deploying SenateRiskOracle...");
  const SenateRiskOracle = await ethers.getContractFactory("SenateRiskOracle");
  const senateRiskOracle = await SenateRiskOracle.deploy(deployer.address);
  await senateRiskOracle.waitForDeployment();
  const oracleAddr = await senateRiskOracle.getAddress();
  console.log(`    ✅ SenateRiskOracle: ${oracleAddr}`);

  console.log("\n📋 Deployment Summary");
  console.log("─".repeat(50));
  console.log(`SENATE_REPORT_CONTRACT=${reportAddr}`);
  console.log(`GOVERNOR_AAVE=${govAaveAddr}`);
  console.log(`GOVERNOR_COMPOUND=${govCompoundAddr}`);
  console.log(`GOVERNOR_UNISWAP=${govUniswapAddr}`);
  console.log(`SENATE_RISK_ORACLE_CONTRACT=${oracleAddr}`);
  console.log("─".repeat(50));

  // Seed demo data on local/VTN/hardhat networks
  if (networkName === "virtualMainnet" || networkName === "hardhat" || networkName === "localhost") {
    console.log("\n🌱 Seeding demo proposals on SenateGovernor...");

    const govByProtocol: Record<string, typeof govAave> = {
      aave: govAave,
      compound: govCompound,
      uniswap: govUniswap,
    };

    const proposals = [
      {
        title: "Add WBTC as Collateral with 70% LTV",
        protocol: "aave",
        description: "Add Wrapped Bitcoin as collateral on Aave V3 with 70% LTV, 75% liquidation threshold.",
        votingBlocks: 50400,
      },
      {
        title: "Reduce USDC Reserve Factor to 10%",
        protocol: "compound",
        description: "Reduce USDC reserve factor from 15% to 10% on Compound V3 to improve competitiveness.",
        votingBlocks: 50400,
      },
      {
        title: "Increase UNI/ETH Pool Fee to 0.3%",
        protocol: "uniswap",
        description: "Migrate UNI/ETH pool from 0.05% to 0.3% fee tier for better LP compensation.",
        votingBlocks: 50400,
      },
    ];

    for (const p of proposals) {
      const gov = govByProtocol[p.protocol] || govAave;
      const tx = await gov.createProposal(p.title, p.protocol, p.description, p.votingBlocks);
      await tx.wait();
      console.log(`    📜 Created on ${p.protocol} governor: "${p.title}"`);
    }

    // Seed a risk assessment + report for demo
    console.log("\n🔬 Seeding demo risk assessment...");
    const proposalHash = ethers.keccak256(ethers.toUtf8Bytes("aave-proposal-142"));
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes("senate-report-content-v1"));

    const riskTx = await senateRiskOracle.updateRisk(
      proposalHash,
      "aave",
      38,  // risk score
      0,   // PASS
      contentHash
    );
    await riskTx.wait();
    console.log("    ✅ Risk assessment seeded (aave, score: 38, PASS)");

    const reportTx = await senateReport.publishReport(
      proposalHash,
      contentHash,
      0,   // PASS
      38   // risk score
    );
    await reportTx.wait();
    console.log("    ✅ Report published on-chain");
  }

  // Write deployed addresses to a JSON file for the frontend
  const deployment = {
    network: networkName,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      SenateReport: reportAddr,
      SenateGovernor: govAddr,
      SenateRiskOracle: oracleAddr,
    },
    governors: {
      aave: govAaveAddr,
      compound: govCompoundAddr,
      uniswap: govUniswapAddr,
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  const outFile = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(outFile, JSON.stringify(deployment, null, 2));
  console.log(`\n📁 Deployment saved to ${outFile}`);

  // Also write a .env.local snippet for easy copy-paste
  const envSnippet = [
    `# --- Deployed on ${networkName} at ${deployment.timestamp} ---`,
    `SENATE_REPORT_CONTRACT=${reportAddr}`,
    `GOVERNOR_AAVE=${govAaveAddr}`,
    `GOVERNOR_COMPOUND=${govCompoundAddr}`,
    `GOVERNOR_UNISWAP=${govUniswapAddr}`,
    `SENATE_RISK_ORACLE_CONTRACT=${oracleAddr}`,
  ].join("\n");

  const envFile = path.join(deploymentsDir, `${networkName}.env`);
  fs.writeFileSync(envFile, envSnippet);
  console.log(`📋 Env snippet saved to ${envFile}`);

  console.log("\n✨ All contracts deployed successfully!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
