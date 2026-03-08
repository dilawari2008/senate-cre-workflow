import hre from "hardhat";

const CONTRACTS = [
  {
    name: "SenateReport",
    address: "0x195FA537B17734Bb4fDEE405146dAb5F9Dca72be",
  },
  {
    name: "SenateGovernor",
    address: "0x212d332EAB63A0FA9754d386596f43c9Ad27C07c",
  },
  {
    name: "SenateGovernor",
    address: "0xfa61a6B6A502453DC708a33e3ceb769332120de2",
  },
  {
    name: "SenateGovernor",
    address: "0x8086F2ab25023CF90d6efA36f8B5943B0e349A9C",
  },
  {
    name: "SenateRiskOracle",
    address: "0x00A9EaF180969488f5b5753fa4014cbDf8536344",
  },
];

async function main() {
  console.log("Verifying contracts on Tenderly VTN...\n");

  for (const c of CONTRACTS) {
    try {
      console.log(`  Verifying ${c.name} at ${c.address}...`);
      await hre.tenderly.verify({ name: c.name, address: c.address });
      console.log(`  ✅ ${c.name} verified\n`);
    } catch (err: any) {
      console.error(`  ❌ ${c.name} failed: ${err.message}\n`);
    }
  }

  console.log("Done!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
