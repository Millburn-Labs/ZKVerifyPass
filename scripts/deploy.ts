/**
 * Deployment Script for ZKVerifyPass Contracts
 * 
 * This script deploys the following contracts in order:
 * 1. VerificationRegistry - Storage contract for verification records
 * 2. Verifier - zk-SNARK proof verifier (Groth16Verifier from Verifier.sol)
 * 3. ZKVerifyPass - Main contract that orchestrates verification
 * 
 * Usage:
 *   Local deployment:        npm run deploy:localhost
 *   Sepolia testnet:         npm run deploy:sepolia
 *   Goerli testnet:          npm run deploy:goerli
 *   Mainnet:                 npm run deploy:mainnet
 *   Default (Hardhat):       npm run deploy
 * 
 * Environment Variables (optional):
 *   PRIVATE_KEY - Private key of the deployer account
 *   SEPOLIA_RPC_URL - RPC URL for Sepolia network
 *   GOERLI_RPC_URL - RPC URL for Goerli network
 *   MAINNET_RPC_URL - RPC URL for Ethereum mainnet
 *   VERIFICATION_FEE_WEI - Initial verification fee in wei (default: 1000000000000000 = 0.001 ETH)
 * 
 * The script will save deployment information to:
 *   - deployments/<network-name>.json
 *   - deployments/latest.json
 */

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentInfo {
  network: string;
  deployedAt: string;
  contracts: {
    verificationRegistry?: string;
    verifier?: string;
    zkVerifyPass?: string;
  };
  verificationFee: string;
}

async function main() {
  console.log("Starting deployment of ZKVerifyPass contracts...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Network:", network.name, `(Chain ID: ${network.chainId})`);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Configuration - can be overridden via environment variables
  const verificationFeeWei = process.env.VERIFICATION_FEE_WEI || "1000000000000000"; // 0.001 ETH default
  const verificationFee = BigInt(verificationFeeWei);
  
  console.log("Configuration:");
  console.log("  Verification Fee:", ethers.formatEther(verificationFee), "ETH");
  console.log("");

  const deploymentInfo: DeploymentInfo = {
    network: network.name,
    deployedAt: new Date().toISOString(),
    contracts: {},
    verificationFee: verificationFeeWei
  };

  try {
    // Step 1: Deploy VerificationRegistry
    console.log("Step 1: Deploying VerificationRegistry...");
    const VerificationRegistryFactory = await ethers.getContractFactory("VerificationRegistry");
    const registry = await VerificationRegistryFactory.deploy();
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    deploymentInfo.contracts.verificationRegistry = registryAddress;
    console.log("  VerificationRegistry deployed to:", registryAddress);
    console.log("  Transaction hash:", registry.deploymentTransaction()?.hash);
    console.log("");

    // Step 2: Deploy Verifier
    // Note: The Verifier.sol file contains a contract named Groth16Verifier,
    // but Hardhat should resolve "Verifier" to the contract in that file.
    // If this fails, try using "Groth16Verifier" as the contract name.
    console.log("Step 2: Deploying Verifier (Groth16Verifier)...");
    let VerifierFactory;
    try {
      VerifierFactory = await ethers.getContractFactory("Verifier");
    } catch (error) {
      console.log("  Attempting to use 'Groth16Verifier' as contract name...");
      VerifierFactory = await ethers.getContractFactory("Groth16Verifier");
    }
    const verifier = await VerifierFactory.deploy();
    await verifier.waitForDeployment();
    const verifierAddress = await verifier.getAddress();
    deploymentInfo.contracts.verifier = verifierAddress;
    console.log("  Verifier deployed to:", verifierAddress);
    console.log("  Transaction hash:", verifier.deploymentTransaction()?.hash);
    console.log("");

    // Step 3: Deploy ZKVerifyPass
    console.log("Step 3: Deploying ZKVerifyPass...");
    const ZKVerifyPassFactory = await ethers.getContractFactory("ZKVerifyPass");
    const zkVerifyPass = await ZKVerifyPassFactory.deploy(
      verifierAddress,
      registryAddress,
      verificationFee
    );
    await zkVerifyPass.waitForDeployment();
    const zkVerifyPassAddress = await zkVerifyPass.getAddress();
    deploymentInfo.contracts.zkVerifyPass = zkVerifyPassAddress;
    console.log("  ZKVerifyPass deployed to:", zkVerifyPassAddress);
    console.log("  Transaction hash:", zkVerifyPass.deploymentTransaction()?.hash);
    console.log("");

    // Verify deployment by checking contract state
    console.log("Verifying deployment...");
    const owner = await zkVerifyPass.owner();
    const fee = await zkVerifyPass.verificationFee();
    const registryFromContract = await zkVerifyPass.registry();
    const verifierFromContract = await zkVerifyPass.verifier();

    console.log("  ZKVerifyPass owner:", owner);
    console.log("  Verification fee:", ethers.formatEther(fee), "ETH");
    console.log("  Registry address (from contract):", registryFromContract);
    console.log("  Verifier address (from contract):", verifierFromContract);

    if (registryFromContract.toLowerCase() !== registryAddress.toLowerCase()) {
      throw new Error("Registry address mismatch!");
    }
    if (verifierFromContract.toLowerCase() !== verifierAddress.toLowerCase()) {
      throw new Error("Verifier address mismatch!");
    }
    console.log("  Deployment verified successfully!\n");

    // Save deployment info to file
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("Deployment info saved to:", deploymentFile);

    // Also create/update a latest.json file
    const latestFile = path.join(deploymentsDir, "latest.json");
    fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("Latest deployment info saved to:", latestFile, "\n");

    // Summary
    console.log("=".repeat(60));
    console.log("DEPLOYMENT SUMMARY");
    console.log("=".repeat(60));
    console.log("Network:", network.name);
    console.log("Deployer:", deployer.address);
    console.log("");
    console.log("Deployed Contracts:");
    console.log("  VerificationRegistry:", registryAddress);
    console.log("  Verifier:", verifierAddress);
    console.log("  ZKVerifyPass:", zkVerifyPassAddress);
    console.log("");
    console.log("Next Steps:");
    console.log("  1. Update your frontend with these contract addresses");
    console.log("  2. If on a testnet/mainnet, verify contracts on block explorer:");
    console.log("     - VerificationRegistry:", registryAddress);
    console.log("     - Verifier:", verifierAddress);
    console.log("     - ZKVerifyPass:", zkVerifyPassAddress);
    console.log("  3. Test the contracts with a sample proof");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("\nDeployment failed!");
    console.error(error);
    
    // Save partial deployment info if available
    if (Object.keys(deploymentInfo.contracts).length > 0) {
      const deploymentsDir = path.join(__dirname, "..", "deployments");
      if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
      }
      const errorFile = path.join(deploymentsDir, `${network.name}-error.json`);
      fs.writeFileSync(errorFile, JSON.stringify(deploymentInfo, null, 2));
      console.log("\nPartial deployment info saved to:", errorFile);
    }
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
