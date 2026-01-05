import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * @notice Deployment module for ZKVerifyPass contracts
 * @dev Deploys Verifier, VerificationRegistry, and ZKVerifyPass in order
 */
const ZKVerifyPassModule = buildModule("ZKVerifyPassModule", (m) => {
    // Deploy VerificationRegistry first (no dependencies)
    const registry = m.contract("VerificationRegistry");

    // Deploy Verifier contract
    // NOTE: In production, replace this with your auto-generated Verifier contract
    const verifier = m.contract("Verifier");

    // Deploy ZKVerifyPass with dependencies
    // Initial verification fee: 0.001 ETH (adjust as needed)
    const verificationFee = m.getParameter("verificationFee", "1000000000000000"); // 0.001 ETH
    
    const zkVerifyPass = m.contract("ZKVerifyPass", [
        verifier,
        registry,
        verificationFee
    ]);

    return {
        registry,
        verifier,
        zkVerifyPass
    };
});

export default ZKVerifyPassModule;


