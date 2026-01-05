/**
 * @notice Helper script to generate zk-SNARK proofs
 * @dev This script demonstrates how to generate proofs using SnarkJS
 * 
 * Usage:
 *   node scripts/generateProof.js
 * 
 * Make sure you have:
 *   1. Compiled the circuit (verify.wasm)
 *   2. Generated the zkey (verify_0001.zkey)
 *   3. Installed snarkjs: npm install snarkjs
 */

const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

async function generateProof() {
    console.log("Generating zk-SNARK proof...\n");

    // Paths to circuit files
    const wasmPath = path.join(__dirname, "../circuits/verify.wasm");
    const zkeyPath = path.join(__dirname, "../circuits/verify_0001.zkey");

    // Check if files exist
    if (!fs.existsSync(wasmPath)) {
        console.error("Error: verify.wasm not found. Please compile the circuit first.");
        console.error("Run: circom circuits/verify.circom --r1cs --wasm --sym");
        process.exit(1);
    }

    if (!fs.existsSync(zkeyPath)) {
        console.error("Error: verify_0001.zkey not found. Please run the trusted setup first.");
        console.error("See circuits/README.md for setup instructions.");
        process.exit(1);
    }

    // Example inputs
    // In a real application, these would come from user data
    const input = {
        secret: 12345,      // Private: The secret value
        salt: 67890,       // Private: Random salt
        publicHash: [      // Public: Hash commitment (must match circuit output)
            // These values should be calculated from your hash function
            // For demonstration, using placeholder values
            // In production, calculate these from: hash(secret, salt)
            123456789,
            987654321
        ]
    };

    console.log("Input:", JSON.stringify(input, null, 2));
    console.log("\nGenerating proof (this may take a moment)...\n");

    try {
        // Generate proof
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            wasmPath,
            zkeyPath
        );

        // Format proof for Solidity
        const calldata = await snarkjs.groth16.exportSolidityCallData(
            proof,
            publicSignals
        );

        // Save proof and public signals
        const outputDir = path.join(__dirname, "../proofs");
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(
            path.join(outputDir, "proof.json"),
            JSON.stringify(proof, null, 2)
        );

        fs.writeFileSync(
            path.join(outputDir, "publicSignals.json"),
            JSON.stringify(publicSignals, null, 2)
        );

        fs.writeFileSync(
            path.join(outputDir, "calldata.json"),
            JSON.stringify(JSON.parse(calldata), null, 2)
        );

        console.log("✓ Proof generated successfully!");
        console.log("\nPublic signals:", publicSignals);
        console.log("\nProof saved to:", outputDir);
        console.log("\nTo verify off-chain:");
        console.log("  snarkjs groth16 verify circuits/verification_key.json proofs/publicSignals.json proofs/proof.json");

        return { proof, publicSignals, calldata };
    } catch (error) {
        console.error("Error generating proof:", error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    generateProof()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { generateProof };


