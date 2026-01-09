# Custom Circuit Guide

## Overview

The `verify_custom.circom` circuit demonstrates multiple verification use cases in a single circuit, allowing you to verify different types of claims without revealing sensitive information.

## Supported Verification Types

### Type 1: Age Verification
- **Purpose**: Prove you know an age value that hashes to a commitment
- **Private Inputs**: `age`, `ageSalt`
- **Public Input**: `ageCommitment` (hash of age + salt)
- **Use Case**: Verify age >= threshold without revealing exact age

### Type 2: Identity Verification
- **Purpose**: Prove you have valid identity credentials
- **Private Inputs**: `identitySecret`, `identitySalt`
- **Public Input**: `identityCommitment` (hash of identity + salt)
- **Use Case**: Verify identity without revealing credentials

### Type 3: Compliance Verification
- **Purpose**: Prove you meet compliance requirements
- **Private Inputs**: `complianceData`, `complianceSalt`
- **Public Input**: `complianceCommitment` (hash of compliance data + salt)
- **Use Case**: Prove compliance score/rating without revealing the actual value

### Type 4: Asset Ownership Verification
- **Purpose**: Prove asset ownership without revealing the asset
- **Private Inputs**: `assetId`, `ownerSecret`
- **Public Input**: `ownershipCommitment` (hash of asset ID + owner secret)
- **Use Case**: Prove ownership without revealing which asset you own

## Quick Start

### 1. Compile the Circuit

```bash
circom circuits/verify_custom.circom --r1cs --wasm --sym
```

This generates:
- `verify_custom.r1cs` - Rank-1 Constraint System
- `verify_custom_js/verify_custom.wasm` - WebAssembly for witness generation
- `verify_custom.sym` - Symbol file for debugging

### 2. Trusted Setup

Use the same Powers of Tau files as your regular circuit, but generate a new zkey:

```bash
snarkjs groth16 setup verify_custom.r1cs pot12_final.ptau verify_custom_0000.zkey
snarkjs zkey contribute verify_custom_0000.zkey verify_custom_0001.zkey --name="1st Contributor" -v
snarkjs zkey export verificationkey verify_custom_0001.zkey verify_custom_verification_key.json
snarkjs zkey export solidityverifier verify_custom_0001.zkey contracts/Verifier_custom.sol
```

### 3. Generate Proofs

Generate a proof for a specific verification type:

```bash
# Age verification
node scripts/generateProof_custom.js 1

# Identity verification
node scripts/generateProof_custom.js 2

# Compliance verification
node scripts/generateProof_custom.js 3

# Asset ownership verification
node scripts/generateProof_custom.js 4
```

Proofs will be saved to the `proofs/` directory:
- `proof_age.json`, `proof_identity.json`, etc.
- `publicSignals_age.json`, `publicSignals_identity.json`, etc.
- `calldata_age.json`, `calldata_identity.json`, etc.

### 4. Verify Proofs Off-Chain

```bash
snarkjs groth16 verify verify_custom_verification_key.json proofs/publicSignals_identity.json proofs/proof_identity.json
```

## Circuit Structure

The circuit uses a verification type selector pattern:

1. All verification types share the same circuit structure
2. The `verificationType` input selects which verification to perform
3. Only the selected verification type is checked
4. All other verification inputs are ignored (set to 0)

## Customization Tips

### Adding a New Verification Type

1. Add new private inputs for your verification type
2. Add a corresponding commitment input (public)
3. Create a hasher component using `Poseidon(2)`
4. Create an equality check component using `IsEqual()`
5. Add a type check component to verify `verificationType == X`
6. Multiply the equality result by the type check result
7. Add the result to the `verificationSum`
8. Ensure `verificationSum === 1` at the end

### Example: Adding a Credit Score Verification

```circom
// Add inputs
signal input creditScore;
signal input creditSalt;
signal input creditCommitment;

// Add verification logic
component creditHasher = Poseidon(2);
creditHasher.inputs[0] <== creditScore;
creditHasher.inputs[1] <== creditSalt;

component creditEq = IsEqual();
creditEq.in[0] <== creditHasher.out;
creditEq.in[1] <== creditCommitment;

component creditTypeCheck = IsEqual();
creditTypeCheck.in[0] <== verificationType;
creditTypeCheck.in[1] <== 5; // New type

signal creditVerified;
creditVerified <== creditEq.out * creditTypeCheck.out;

// Add to verification sum
verificationSum <== ageVerified + identityVerified + complianceVerified + ownershipVerified + creditVerified;
```

## Important Notes

1. **Age Verification Limitation**: The current implementation uses hash commitments, which proves knowledge of age but doesn't directly prove `age >= threshold`. For production use, implement proper comparison circuits using bit decomposition.

2. **Hash Commitments**: All verifications use Poseidon hash commitments. Make sure to:
   - Use the same hash function when creating commitments off-chain
   - Keep salts private
   - Store commitments securely

3. **Public vs Private Inputs**: In Circom 2.0, all inputs are private by default. Public signals are determined by what needs to be verified on-chain. The verifier contract will handle public signal verification.

4. **Gas Costs**: The custom circuit is larger than the simple circuit, resulting in:
   - Slower proof generation
   - Higher gas costs for on-chain verification
   - More storage requirements

5. **Security**: Always use secure random salts. Never reuse salts across different verifications.

## Example Usage in JavaScript

```javascript
const { generateProof } = require("./scripts/generateProof_custom");

// Generate identity verification proof
async function verifyIdentity() {
    const { proof, publicSignals } = await generateProof(2);
    
    // Use proof with your smart contract
    // await contract.verifyAndRecord(proof, publicSignals, ...);
}

// Generate age verification proof
async function verifyAge() {
    const { proof, publicSignals } = await generateProof(1);
    
    // Use proof with your smart contract
    // await contract.verifyAndRecord(proof, publicSignals, ...);
}
```

## Troubleshooting

### Error: "Signal not found"
- Check that all required inputs are provided in the input JSON
- Verify input names match exactly with circuit definitions

### Error: "Too many signals set"
- Ensure you're only providing inputs for the selected verification type
- Set other inputs to 0

### Error: "Assert Failed"
- Verify that the hash commitment matches what the circuit computes
- Check that verification type matches the inputs provided
- Ensure all constraints are satisfied

### Proof generation is slow
- This is normal for larger circuits
- The custom circuit has ~993 non-linear constraints, so proof generation may take 10-30 seconds
- Consider optimizing the circuit for your specific use case

## Next Steps

1. Customize the circuit for your specific use case
2. Implement proper comparison circuits for age verification
3. Add range checks for compliance scores
4. Optimize constraints to reduce gas costs
5. Deploy the custom verifier contract
6. Integrate with your application

