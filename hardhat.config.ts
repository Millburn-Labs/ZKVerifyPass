import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.ACCOUNT_PRIVATE_KEY ;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    mantle: {
        url: "https://rpc.mantle.xyz", //mainnet
        accounts: [process.env.ACCOUNT_PRIVATE_KEY || ""],
    },
    mantleSepolia: {
        url: "https://rpc.sepolia.mantle.xyz", // Sepolia Testnet
        accounts: [process.env.ACCOUNT_PRIVATE_KEY || ""],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;