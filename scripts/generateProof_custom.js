/**
 * @notice Helper script to generate zk-SNARK proofs for the custom verification circuit
 * @dev This script demonstrates how to generate proofs for different verification types
 * 
 * Usage:
 *   node scripts/generateProof_custom.js [verificationType]
 * 
 * Verification Types:
 *   1 = Age verification (using hash commitment)
 *   2 = Identity verification
 *   3 = Compliance verification
 *   4 = Asset ownership verification
 * 
 * Make sure you have:
 *   1. Compiled the circuit (verify_custom.wasm)
 *   2. Generated the zkey (verify_custom_0001.zkey)
 *   3. Installed snarkjs and circomlibjs
 */

const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");
const { buildPoseidon } = require("circomlibjs");

async function generateProof(verificationType = 2) {
    console.log(`Generating zk-SNARK proof for verification type ${verificationType}...\n`);

    // Paths to circuit files
    const wasmPath = path.join(__dirname, "../verify_custom_js/verify_custom.wasm");
    const zkeyPath = path.join(__dirname, "../verify_custom_0001.zkey");

    // Check if files exist
    if (!fs.existsSync(wasmPath)) {
        console.error("Error: verify_custom.wasm not found. Please compile the circuit first.");
        console.error("Run: circom circuits/verify_custom.circom --r1cs --wasm --sym");
        process.exit(1);
    }

    if (!fs.existsSync(zkeyPath)) {
        console.error("Error: verify_custom_0001.zkey not found. Please run the trusted setup first.");
        console.error("See circuits/README.md for setup instructions.");
        process.exit(1);
    }

    // Calculate Poseidon hash
    console.log("Calculating Poseidon hashes...");
    const poseidon = await buildPoseidon();

    // Prepare inputs based on verification type
    let input = {
        verificationType: verificationType,
        // Initialize all fields with default values
        age: 0,
        ageSalt: 0,
        ageCommitment: 0,
        identitySecret: 0,
        identitySalt: 0,
        identityCommitment: 0,
        complianceData: 0,
        complianceSalt: 0,
        complianceCommitment: 0,
        assetId: 0,
        ownerSecret: 0,
        ownershipCommitment: 0
    };

    switch(verificationType) {
        case 1: // Age verification
            const age = 25;
            const ageSalt = 12345;
            const ageCommitment = poseidon.F.toString(
                poseidon([BigInt(age), BigInt(ageSalt)])
            );
            input.age = age;
            input.ageSalt = ageSalt;
            input.ageCommitment = ageCommitment;
            console.log(`Age Verification Example:`);
            console.log(`  Age: ${age} (kept private)`);
            console.log(`  Salt: ${ageSalt} (kept private)`);
            console.log(`  Commitment: ${ageCommitment} (public)`);
            break;

        case 2: // Identity verification
            const identitySecret = 98765;
            const identitySalt = 67890;
            const identityCommitment = poseidon.F.toString(
                poseidon([BigInt(identitySecret), BigInt(identitySalt)])
            );
            input.identitySecret = identitySecret;
            input.identitySalt = identitySalt;
            input.identityCommitment = identityCommitment;
            console.log(`Identity Verification Example:`);
            console.log(`  Identity Secret: ${identitySecret} (kept private)`);
            console.log(`  Salt: ${identitySalt} (kept private)`);
            console.log(`  Commitment: ${identityCommitment} (public)`);
            break;

        case 3: // Compliance verification
            const complianceData = 85; // e.g., compliance score
            const complianceSalt = 54321;
            const complianceCommitment = poseidon.F.toString(
                poseidon([BigInt(complianceData), BigInt(complianceSalt)])
            );
            input.complianceData = complianceData;
            input.complianceSalt = complianceSalt;
            input.complianceCommitment = complianceCommitment;
            console.log(`Compliance Verification Example:`);
            console.log(`  Compliance Data: ${complianceData} (kept private)`);
            console.log(`  Salt: ${complianceSalt} (kept private)`);
            console.log(`  Commitment: ${complianceCommitment} (public)`);
            break;

        case 4: // Asset ownership verification
            const assetId = 123456789;
            const ownerSecret = 99999;
            const ownershipCommitment = poseidon.F.toString(
                poseidon([BigInt(assetId), BigInt(ownerSecret)])
            );
            input.assetId = assetId;
            input.ownerSecret = ownerSecret;
            input.ownershipCommitment = ownershipCommitment;
            console.log(`Asset Ownership Verification Example:`);
            console.log(`  Asset ID: ${assetId} (kept private)`);
            console.log(`  Owner Secret: ${ownerSecret} (kept private)`);
            console.log(`  Commitment: ${ownershipCommitment} (public)`);
            break;

        default:
            console.error(`Error: Invalid verification type ${verificationType}. Must be 1-4.`);
            process.exit(1);
    }

    console.log("\nGenerating proof (this may take a moment)...\n");

    try {
        // Generate proof
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            wasmPath,
            zkeyPath
        );

        // Format proof for Solidity
        let calldata;
        try {
            calldata = await snarkjs.groth16.exportSolidityCallData(
                proof,
                publicSignals
            );
        } catch (error) {
            console.warn("Warning: Could not export Solidity calldata:", error.message);
            calldata = null;
        }

        // Save proof and public signals
        const outputDir = path.join(__dirname, "../proofs");
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const typeName = ["age", "identity", "compliance", "ownership"][verificationType - 1];
        const proofFile = `proof_${typeName}.json`;
        const publicFile = `publicSignals_${typeName}.json`;
        const calldataFile = `calldata_${typeName}.json`;

        fs.writeFileSync(
            path.join(outputDir, proofFile),
            JSON.stringify(proof, null, 2)
        );

        fs.writeFileSync(
            path.join(outputDir, publicFile),
            JSON.stringify(publicSignals, null, 2)
        );

        if (calldata) {
            try {
                const calldataObj = JSON.parse(calldata);
                fs.writeFileSync(
                    path.join(outputDir, calldataFile),
                    JSON.stringify(calldataObj, null, 2)
                );
            } catch (parseError) {
                fs.writeFileSync(
                    path.join(outputDir, `calldata_${typeName}.txt`),
                    calldata
                );
            }
        }

        console.log("✓ Proof generated successfully!");
        console.log(`\nPublic signals:`, publicSignals);
        console.log(`\nProof saved to: ${outputDir}`);
        console.log(`  - ${proofFile}`);
        console.log(`  - ${publicFile}`);
        if (calldata) console.log(`  - ${calldataFile}`);
        
        console.log(`\nTo verify off-chain:`);
        console.log(`  snarkjs groth16 verify verify_custom_verification_key.json proofs/${publicFile} proofs/${proofFile}`);

        return { proof, publicSignals, calldata };
    } catch (error) {
        console.error("Error generating proof:", error.message);
        console.error("\nMake sure you have:");
        console.error("  1. Compiled the circuit: circom circuits/verify_custom.circom --r1cs --wasm --sym");
        console.error("  2. Run trusted setup and generated zkey");
        console.error("  3. Check that all required inputs are provided correctly");
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    const verificationType = process.argv[2] ? parseInt(process.argv[2]) : 2;
    
    if (isNaN(verificationType) || verificationType < 1 || verificationType > 4) {
        console.error("Usage: node scripts/generateProof_custom.js [verificationType]");
        console.error("  verificationType: 1 (age), 2 (identity), 3 (compliance), 4 (asset ownership)");
        console.error("  Default: 2 (identity)");
        process.exit(1);
    }

    generateProof(verificationType)
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { generateProof };

