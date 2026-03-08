import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as tdly from "@tenderly/hardhat-tenderly";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: process.env.RPC_URL || "https://rpc.sepolia.org",
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    },
    virtualMainnet: {
      url: process.env.TENDERLY_VTN_RPC || "",
      accounts: [PRIVATE_KEY],
      chainId: 9991,
    },
  },
  tenderly: {
    username: process.env.TENDERLY_ACCOUNT || "dilawaridev",
    project: process.env.TENDERLY_PROJECT || "cre-hackathon",
    privateVerification: true,
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      virtualMainnet: process.env.TENDERLY_ACCESS_KEY || "",
    },
    customChains: [
      {
        network: "virtualMainnet",
        chainId: 9991,
        urls: {
          apiURL: `${process.env.TENDERLY_VTN_RPC || "https://virtual.mainnet.eu.rpc.tenderly.co/22d1f719-0466-4639-847f-f7c35c8d33d3"}/verify/etherscan`,
          browserURL: process.env.TENDERLY_VTN_EXPLORER_URL || "",
        },
      },
    ],
  },
};

export default config;
