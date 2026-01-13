import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * @notice Deployment module for ZKVerifyPass contracts
 * @dev Deploys Verifier_custom (Groth16Verifier), VerificationRegistry, and ZKVerifyPass in order
 */
const ZKVerifyPassModule = buildModule("ZKVerifyPassModule", (m) => {
    // Deploy VerificationRegistry first (no dependencies)
    const registry = m.contract("VerificationRegistry");

    // Deploy Verifier_custom contract (Groth16Verifier for custom circuit)
    // NOTE: This uses the auto-generated Verifier_custom.sol contract which contains Groth16Verifier
    const verifier = m.contract("Groth16Verifier");

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


