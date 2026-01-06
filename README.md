# ZKVerifyPass

A platform for private data verification using zk-SNARKs for identity/compliance without revealing information.

## Overview

ZKVerifyPass leverages zero-knowledge proofs (zk-SNARKs) to enable users to prove the validity of their data without revealing the data itself. Traditional methods of verification often expose sensitive information or are computationally expensive.

### How zk-SNARKs Work in Smart Contracts

```
User's Private Data → Circuit → Proof Generation (off-chain)
                              ↓
                    Proof + Public Inputs
                              ↓
                Smart Contract Verification (on-chain)
                              ↓
                      Valid/Invalid Result
```

## Architecture

The platform consists of three main smart contracts:

1. **Verifier Contract** - Auto-generated from your zk-SNARK circuit using SnarkJS
2. **ZKVerifyPass Core Contract** - Main logic for verification management
3. **Registry/Storage Contract** - Stores verification records

## Features

- ✅ Private data verification without revealing sensitive information
- ✅ On-chain proof verification using zk-SNARKs
- ✅ Permanent verification record storage
- ✅ Gas-efficient verification system
- ✅ Configurable verification fees
- ✅ Query verification history by subject or verifier

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Hardhat
- Circom compiler (for circuit compilation)
- SnarkJS (for proof generation and verification)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ZKVerifyPass
```

2. Install dependencies:
```bash
npm install
```

3. Install Circom globally (optional, for circuit compilation):
```bash
npm install -g circom
```

## Project Structure

```
ZKVerifyPass/
├── contracts/
│   ├── Verifier.sol              # Auto-generated verifier (replace with generated one)
│   ├── ZKVerifyPass.sol          # Main verification contract
│   └── VerificationRegistry.sol  # Storage for verification records
├── circuits/
│   ├── verify.circom             # Sample zk-SNARK circuit
│   └── README.md                 # Circuit setup instructions
├── scripts/
│   ├── generateProof.js          # Generate zk-SNARK proofs
│   ├── verifyProof.js            # Verify proofs off-chain
│   └── formatProofForContract.js # Format proofs for Solidity
├── test/                         # Test files
└── ignition/                     # Deployment scripts
```

## Quick Start

### 1. Compile Contracts

```bash
npm run compile
```

### 2. Setup Circuit (First Time Only)

Follow the detailed instructions in `circuits/README.md`:

```bash
# Compile circuit
circom circuits/verify.circom --r1cs --wasm --sym

# Run trusted setup
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

# Generate proving key
snarkjs groth16 setup verify.r1cs pot12_final.ptau verify_0000.zkey
snarkjs zkey contribute verify_0000.zkey verify_0001.zkey --name="1st Contributor" -v

# Export verification key
snarkjs zkey export verificationkey verify_0001.zkey verification_key.json

# Generate Solidity verifier
snarkjs zkey export solidityverifier verify_0001.zkey contracts/Verifier.sol
```

**Important:** Replace the template `Verifier.sol` with the generated one.

### 3. Generate Proof

```bash
node scripts/generateProof.js
```

This will create proof files in the `proofs/` directory.

### 4. Verify Proof Off-Chain

```bash
node scripts/verifyProof.js
```

### 5. Deploy Contracts

Start a local Hardhat node:
```bash
npm run node
```

In another terminal, deploy:
```bash
npm run deploy
```

### 6. Format Proof for Contract

```bash
node scripts/formatProofForContract.js
```

## Usage

### Smart Contract Interaction

#### Verify and Record

```solidity
// Call verifyAndRecord function
ZKVerifyPass.verifyAndRecord(
    proof,           // Verifier.Proof struct
    publicInputs,   // uint[] array
    subject,        // address (optional, defaults to msg.sender)
    metadata        // string
);
```

#### Verify Only (No Storage)

```solidity
// Call verifyOnly for gas-efficient verification
bool isValid = ZKVerifyPass.verifyOnly(proof, publicInputs);
```

#### Check Verification Status

```solidity
// Check if a verification exists and is valid
(bool exists, bool isValid) = ZKVerifyPass.checkVerificationStatus(verificationId);
```

### JavaScript/TypeScript Example

```javascript
const { ethers } = require("hardhat");
const fs = require("fs");

async function verify() {
    // Load proof
    const proof = JSON.parse(fs.readFileSync("proofs/formattedProof.json"));
    
    // Get contract instance
    const ZKVerifyPass = await ethers.getContractAt("ZKVerifyPass", contractAddress);
    
    // Prepare proof struct
    const proofStruct = {
        a: proof.a,
        b: proof.b,
        c: proof.c
    };
    
    // Call verifyAndRecord
    const tx = await ZKVerifyPass.verifyAndRecord(
        proofStruct,
        proof.publicInputs,
        ethers.constants.AddressZero, // Use msg.sender
        "Metadata description",
        { value: ethers.utils.parseEther("0.001") } // Pay fee
    );
    
    const receipt = await tx.wait();
    console.log("Verification recorded:", receipt);
}
```

## Contract Details

### Verifier Contract

- **Purpose**: Verifies zk-SNARK proofs on-chain
- **Generation**: Auto-generated from circuit using SnarkJS
- **Function**: `verifyProof(Proof memory proof, uint[] memory publicInputs)`

### ZKVerifyPass Contract

- **Purpose**: Main verification orchestration
- **Functions**:
  - `verifyAndRecord()` - Verify proof and store result
  - `verifyOnly()` - Verify without storing (gas-efficient)
  - `checkVerificationStatus()` - Query verification status
  - `setVerificationFee()` - Update fee (owner only)
  - `withdraw()` - Withdraw fees (owner only)

### VerificationRegistry Contract

- **Purpose**: Permanent storage of verification records
- **Functions**:
  - `recordVerification()` - Store verification record
  - `getVerification()` - Retrieve verification by ID
  - `getSubjectVerifications()` - Get all verifications for a subject
  - `getVerifierRecords()` - Get all verifications by a verifier

## Testing

Run tests:
```bash
npm test
```

## Security Considerations

1. **Trusted Setup**: The circuit's trusted setup ceremony is critical. Use a secure multi-party ceremony for production.

2. **Verifier Contract**: Always use the auto-generated verifier from SnarkJS. Never modify it manually.

3. **Circuit Design**: Carefully design your circuit to ensure it correctly verifies the intended properties.

4. **Private Keys**: Never expose private inputs or witness values.

5. **Gas Costs**: Proof verification on-chain consumes gas. Consider off-chain verification for non-critical use cases.

## Customization

### Creating Your Own Circuit

1. Define your verification logic in a `.circom` file
2. Compile the circuit
3. Run trusted setup
4. Generate verifier contract
5. Update `PUBLIC_INPUTS_COUNT` in `ZKVerifyPass.sol` to match your circuit

### Use Cases

- **Age Verification**: Prove age >= 18 without revealing exact age
- **Identity Verification**: Prove valid credentials without revealing details
- **Compliance Checks**: Prove meeting requirements without exposing data
- **Asset Ownership**: Prove ownership without revealing which asset
- **Credit Scores**: Prove creditworthiness without revealing score

## Contributing

Contributions are welcome! Please ensure:
- Code follows Solidity style guidelines
- Tests are included for new features
- Documentation is updated

## License

MIT

## Resources

- [SnarkJS Documentation](https://github.com/iden3/snarkjs)
- [Circom Documentation](https://docs.circom.io/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [zk-SNARKs Explained](https://z.cash/technology/zksnarks/)

## Support

For issues and questions, please open an issue on GitHub.
