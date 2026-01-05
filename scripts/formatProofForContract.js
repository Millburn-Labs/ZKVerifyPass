/**
 * @notice Helper script to format proof for Solidity contract calls
 * @dev Converts SnarkJS proof format to Solidity-compatible format
 * 
 * Usage:
 *   node scripts/formatProofForContract.js [proofPath] [publicSignalsPath]
 */

const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

function formatProofForContract(proof, publicSignals) {
    // Format proof for Solidity Verifier contract
    const formatted = {
        a: [
            proof.pi_a[0],
            proof.pi_a[1]
        ],
        b: [
            [proof.pi_b[0][1], proof.pi_b[0][0]], // Reverse order for Solidity
            [proof.pi_b[1][1], proof.pi_b[1][0]]
        ],
        c: [
            proof.pi_c[0],
            proof.pi_c[1]
        ],
        publicInputs: publicSignals.map(s => s.toString())
    };

    return formatted;
}

async function main() {
    const args = process.argv.slice(2);
    const proofPath = args[0] || path.join(__dirname, "../proofs/proof.json");
    const publicSignalsPath = args[1] || path.join(__dirname, "../proofs/publicSignals.json");

    if (!fs.existsSync(proofPath)) {
        console.error(`Error: Proof file not found: ${proofPath}`);
        process.exit(1);
    }

    if (!fs.existsSync(publicSignalsPath)) {
        console.error(`Error: Public signals file not found: ${publicSignalsPath}`);
        process.exit(1);
    }

    try {
        const proof = JSON.parse(fs.readFileSync(proofPath, "utf8"));
        const publicSignals = JSON.parse(fs.readFileSync(publicSignalsPath, "utf8"));

        const formatted = formatProofForContract(proof, publicSignals);

        // Save formatted proof
        const outputPath = path.join(__dirname, "../proofs/formattedProof.json");
        fs.writeFileSync(
            outputPath,
            JSON.stringify(formatted, null, 2)
        );

        console.log("✓ Proof formatted for Solidity contract");
        console.log("\nFormatted proof saved to:", outputPath);
        console.log("\nYou can use this in your contract calls:");
        console.log(JSON.stringify(formatted, null, 2));

        // Also generate calldata
        const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
        const calldataObj = JSON.parse(calldata);
        
        console.log("\n\nCalldata for direct contract call:");
        console.log(JSON.stringify(calldataObj, null, 2));

    } catch (error) {
        console.error("Error formatting proof:", error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { formatProofForContract };


