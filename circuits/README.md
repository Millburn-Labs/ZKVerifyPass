# Circuit Setup Guide

This directory contains the zk-SNARK circuits for ZKVerifyPass.

## Prerequisites

1. Install Circom compiler:
```bash
npm install -g circom
```

2. Install circomlib and circomlibjs:
```bash
npm install circomlib circomlibjs
```

## Circuit Compilation

1. Compile the circuit:
```bash
circom circuits/verify.circom --r1cs --wasm --sym
```

This generates:
- `verify.r1cs` - Rank-1 Constraint System
- `verify.wasm` - WebAssembly for witness generation
- `verify.sym` - Symbol file for debugging

## Trusted Setup (Powers of Tau)

1. Start a new powers of tau ceremony:
```bash
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
```

2. Contribute to the ceremony:
```bash
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
```

3. Prepare phase 2:
```bash
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
```

## Circuit-Specific Setup (Groth16)

1. Generate the proving key:
```bash
snarkjs groth16 setup verify.r1cs pot12_final.ptau verify_0000.zkey
```

2. Contribute to the circuit-specific phase:
```bash
snarkjs zkey contribute verify_0000.zkey verify_0001.zkey --name="1st Contributor Name" -v
```

3. Export the verification key:
```bash
snarkjs zkey export verificationkey verify_0001.zkey verification_key.json
```

## Generate Solidity Verifier

Generate the Solidity verifier contract:
```bash
snarkjs zkey export solidityverifier verify_0001.zkey contracts/Verifier.sol
```

**Important:** Replace the template `Verifier.sol` with the generated one.

## Generate Proof

### Option 1: Use the Provided Script (Recommended)

The easiest way to generate a proof is to use the provided script:

```bash
node scripts/generateProof.js
```

This script will:
1. Calculate the Poseidon hash of your secret and salt
2. Generate the zk-SNARK proof
3. Save the proof and public signals to the `proofs/` directory

**Note:** Make sure you have installed `circomlibjs`:
```bash
npm install circomlibjs --legacy-peer-deps
```

### Option 2: Manual Proof Generation

If you want to generate proofs manually or customize the inputs, you can use the following JavaScript code:

```javascript
const snarkjs = require("snarkjs");
const fs = require("fs");
const { buildPoseidon } = require("circomlibjs");

async function generateProof() {
    // Load the circuit files
    const wasm = "circuits/verify_js/verify.wasm";
    const zkey = "verify_0001.zkey";
    
    // Your private inputs
    const secret = 12345;  // Your secret value
    const salt = 67890;    // Random salt
    
    // Calculate the Poseidon hash (this becomes the public input)
    const poseidon = await buildPoseidon();
    const publicHash = poseidon.F.toString(
        poseidon([BigInt(secret), BigInt(salt)])
    );
    
    // Prepare inputs
    const input = {
        secret: secret,
        salt: salt,
        publicHash: publicHash  // Must match the hash computed by the circuit
    };
    
    // Generate proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        wasm,
        zkey
    );
    
    // Save proof
    fs.writeFileSync("proof.json", JSON.stringify(proof, null, 2));
    fs.writeFileSync("publicSignals.json", JSON.stringify(publicSignals, null, 2));
    
    console.log("Proof generated!");
    console.log("Public signals:", publicSignals);
}

generateProof();
```

## Verify Proof Off-Chain

After generating the proof, you can verify it off-chain:

```bash
snarkjs groth16 verify verification_key.json proofs/publicSignals.json proofs/proof.json
```

Or use the provided script:

```bash
node scripts/verifyProof.js
```

## Circuit Customization

### Using the Custom Verification Circuit

A custom multi-purpose verification circuit (`verify_custom.circom`) has been created that demonstrates multiple verification use cases:

1. **Age Verification** (Type 1): Prove you know an age value that hashes to a commitment
   - Private inputs: `age`, `ageSalt`
   - Public input: `ageCommitment` (hash commitment)

2. **Identity Verification** (Type 2): Prove you have valid identity credentials
   - Private inputs: `identitySecret`, `identitySalt`
   - Public input: `identityCommitment` (hash commitment)

3. **Compliance Verification** (Type 3): Prove you meet compliance requirements
   - Private inputs: `complianceData`, `complianceSalt`
   - Public input: `complianceCommitment` (hash commitment)

4. **Asset Ownership Verification** (Type 4): Prove ownership without revealing the asset
   - Private inputs: `assetId`, `ownerSecret`
   - Public input: `ownershipCommitment` (hash commitment)

#### Setup for Custom Circuit

1. Compile the custom circuit:
```bash
circom circuits/verify_custom.circom --r1cs --wasm --sym
```

2. Run trusted setup (same process as regular circuit):
```bash
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

snarkjs groth16 setup verify_custom.r1cs pot12_final.ptau verify_custom_0000.zkey
snarkjs zkey contribute verify_custom_0000.zkey verify_custom_0001.zkey --name="1st Contributor" -v

snarkjs zkey export verificationkey verify_custom_0001.zkey verify_custom_verification_key.json
snarkjs zkey export solidityverifier verify_custom_0001.zkey contracts/Verifier_custom.sol
```

3. Generate proof for a specific verification type:
```bash
# Age verification (type 1)
node scripts/generateProof_custom.js 1

# Identity verification (type 2)
node scripts/generateProof_custom.js 2

# Compliance verification (type 3)
node scripts/generateProof_custom.js 3

# Asset ownership verification (type 4)
node scripts/generateProof_custom.js 4
```

### Creating Your Own Circuit

To create your own custom circuit:

1. Define private inputs (data to keep secret)
2. Define public inputs (data that will be revealed)
3. Implement your verification logic using Circom templates
4. Ensure the circuit outputs constraints that must be satisfied

#### Common Circom Templates

- `Poseidon(n)`: Hash function for zk-friendly hashing (n = number of inputs)
- `IsEqual()`: Check if two values are equal
- `LessThan(n)`: Check if first value < second value (n = bit size)
- `GreaterThan(n)`: Check if first value > second value (n = bit size)

#### Example Use Cases

- **Age verification**: Prove age >= threshold without revealing exact age
- **Identity verification**: Prove you have valid credentials
- **Compliance checks**: Prove you meet requirements
- **Asset ownership**: Prove you own an asset without revealing which one
- **Credit scores**: Prove creditworthiness without revealing score
- **Membership proofs**: Prove membership in a set without revealing which member

#### Tips for Circuit Design

1. **Keep it simple**: Start with basic constraints and add complexity gradually
2. **Test thoroughly**: Always test with known inputs before generating proofs
3. **Use hash commitments**: For privacy, hash private values with salts to create commitments
4. **Optimize constraints**: Fewer constraints mean faster proof generation and lower gas costs
5. **Document your circuit**: Comment your code explaining what each constraint does


