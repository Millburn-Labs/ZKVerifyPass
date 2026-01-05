/**
 * @notice Helper script to verify zk-SNARK proofs off-chain
 * @dev This script verifies proofs using the verification key
 * 
 * Usage:
 *   node scripts/verifyProof.js [proofPath] [publicSignalsPath] [verificationKeyPath]
 */

const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

async function verifyProof(proofPath, publicSignalsPath, vkeyPath) {
    console.log("Verifying zk-SNARK proof...\n");

    // Default paths
    const defaultProofPath = path.join(__dirname, "../proofs/proof.json");
    const defaultPublicPath = path.join(__dirname, "../proofs/publicSignals.json");
    const defaultVkeyPath = path.join(__dirname, "../circuits/verification_key.json");

    proofPath = proofPath || defaultProofPath;
    publicSignalsPath = publicSignalsPath || defaultPublicPath;
    vkeyPath = vkeyPath || defaultVkeyPath;

    // Check if files exist
    if (!fs.existsSync(proofPath)) {
        console.error(`Error: Proof file not found: ${proofPath}`);
        process.exit(1);
    }

    if (!fs.existsSync(publicSignalsPath)) {
        console.error(`Error: Public signals file not found: ${publicSignalsPath}`);
        process.exit(1);
    }

    if (!fs.existsSync(vkeyPath)) {
        console.error(`Error: Verification key not found: ${vkeyPath}`);
        console.error("Please run the trusted setup first.");
        process.exit(1);
    }

    try {
        // Load files
        const proof = JSON.parse(fs.readFileSync(proofPath, "utf8"));
        const publicSignals = JSON.parse(fs.readFileSync(publicSignalsPath, "utf8"));
        const vkey = JSON.parse(fs.readFileSync(vkeyPath, "utf8"));

        console.log("Proof file:", proofPath);
        console.log("Public signals:", publicSignals);
        console.log("\nVerifying...\n");

        // Verify proof
        const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);

        if (isValid) {
            console.log("✓ Proof is VALID!");
            return true;
        } else {
            console.log("✗ Proof is INVALID!");
            return false;
        }
    } catch (error) {
        console.error("Error verifying proof:", error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    verifyProof(args[0], args[1], args[2])
        .then((isValid) => {
            process.exit(isValid ? 0 : 1);
        })
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { verifyProof };


