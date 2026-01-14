# ZKVerifyPass

ZKVerifyPass is a comprehensive zero-knowledge proof verification platform that enables private data verification on the blockchain without revealing sensitive information. Built with zk-SNARKs (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge), the platform allows users to prove the validity of their credentials, age, compliance status, and asset ownership while maintaining complete privacy.

## Overview

Traditional verification methods often require exposing sensitive personal data or credentials, creating privacy and security risks. ZKVerifyPass solves this problem by leveraging zero-knowledge cryptography to allow users to prove statements about their data without revealing the data itself.

The platform consists of smart contracts deployed on Ethereum-compatible networks, zk-SNARK circuits for proof generation, and a modern web application for user interaction. Proofs are generated off-chain using Circom circuits and verified on-chain using Groth16 verification.

### How It Works

The verification process follows these steps:

1. **Circuit Definition**: Verification logic is defined in Circom circuits
2. **Proof Generation**: Users generate proofs off-chain using their private data
3. **On-Chain Verification**: Smart contracts verify proofs without accessing private data
4. **Record Storage**: Verification results are stored on-chain for future reference

```
User's Private Data → Circuit → Proof Generation (off-chain)
                              ↓
                    Proof + Public Inputs
                              ↓
                Smart Contract Verification (on-chain)
                              ↓
                      Valid/Invalid Result
                              ↓
                    Permanent Record Storage
```

## Architecture

The platform is built with a modular architecture consisting of three main components:

### Smart Contracts

1. **Verifier Contract** (`Verifier_custom.sol`): Auto-generated Solidity contract from the zk-SNARK circuit using SnarkJS. Implements Groth16 verification for proof validation.

2. **ZKVerifyPass Contract** (`ZKVerifyPass.sol`): Main orchestration contract that handles proof verification, fee management, and integration with the registry. Provides functions for both verification-only and verification-with-storage operations.

3. **VerificationRegistry Contract** (`VerificationRegistry.sol`): Permanent on-chain storage for verification records. Maintains mappings for subjects, verifiers, and verification history.

### Circuits

The project includes a custom multi-purpose verification circuit (`verify_custom.circom`) that supports four verification types:

- **Age Verification**: Prove age requirements without revealing exact age
- **Identity Verification**: Prove valid credentials using hash commitments
- **Compliance Verification**: Prove meeting regulatory requirements
- **Asset Ownership**: Prove ownership of assets without revealing asset details

### Frontend

A Next.js-based web application provides an intuitive interface for:
- Wallet connectivity (via WalletConnect/Reown)
- Verification type selection
- Proof submission and verification
- Verification history and status checking

## Features

- **Privacy-Preserving Verification**: Verify data without exposing sensitive information
- **On-Chain Proof Verification**: Secure verification using Groth16 zk-SNARKs on Ethereum
- **Permanent Record Storage**: Immutable verification records stored on-chain
- **Gas-Efficient Verification**: Separate verification-only function for repeated checks
- **Configurable Fees**: Owner-controlled verification fees
- **Query Capabilities**: Retrieve verification history by subject or verifier
- **Multiple Verification Types**: Support for age, identity, compliance, and ownership verification
- **Modern Web Interface**: User-friendly frontend built with React and Next.js

## Prerequisites

Before installing and running ZKVerifyPass, ensure you have the following:

- Node.js (v16 or higher)
- npm or yarn package manager
- Hardhat (for smart contract development)
- Circom compiler (for circuit compilation)
- SnarkJS (for proof generation and verification)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ZKVerifyPass
```

2. Install root dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

4. Install Circom globally (optional, for circuit compilation):
```bash
npm install -g circom
```

## Project Structure

```
ZKVerifyPass/
├── circuits/
│   ├── verify_custom.circom      # Custom zk-SNARK circuit (age, identity, compliance, ownership)
│   ├── verify.circom             # Base verification circuit
│   └── CUSTOM_CIRCUIT_GUIDE.md   # Detailed circuit setup instructions
├── contracts/
│   ├── Verifier_custom.sol       # Auto-generated verifier for custom circuit (Groth16Verifier)
│   ├── ZKVerifyPass.sol          # Main verification contract
│   └── VerificationRegistry.sol  # Storage for verification records
├── frontend/
│   ├── app/                      # Next.js application
│   │   ├── components/           # React components
│   │   ├── hooks/                # Custom React hooks
│   │   └── ABI/                  # Contract ABIs
│   └── package.json
├── scripts/
│   ├── generateProof.js          # Generate zk-SNARK proofs
│   ├── generateProof_custom.js   # Generate proofs for custom circuit
│   ├── verifyProof.js            # Verify proofs off-chain
│   └── formatProofForContract.js # Format proofs for Solidity
├── test/                         # Test files
├── ignition/                     # Deployment scripts
├── hardhat.config.ts             # Hardhat configuration
└── package.json
```

## Quick Start

### 1. Compile Contracts

```bash
npm run compile
```

### 2. Setup Custom Circuit (First Time Only)

Follow the detailed instructions in `circuits/CUSTOM_CIRCUIT_GUIDE.md`:

```bash
# Compile custom circuit
circom circuits/verify_custom.circom --r1cs --wasm --sym

# Run trusted setup (Powers of Tau Phase 1)
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

# Generate proving key for custom circuit (Phase 2)
snarkjs groth16 setup verify_custom.r1cs pot12_final.ptau verify_custom_0000.zkey
snarkjs zkey contribute verify_custom_0000.zkey verify_custom_0001.zkey --name="1st Contributor" -v

# Export verification key
snarkjs zkey export verificationkey verify_custom_0001.zkey verify_custom_verification_key.json

# Generate Solidity verifier for custom circuit
snarkjs zkey export solidityverifier verify_custom_0001.zkey contracts/Verifier_custom.sol
```

**Important**: The generated `Verifier_custom.sol` contains the `Groth16Verifier` contract for the custom circuit.

### 3. Generate Proof

```bash
node scripts/generateProof_custom.js
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

### 7. Run Frontend

```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:3000`.

## Usage

### Smart Contract Interaction

#### Verify and Record

The `verifyAndRecord` function verifies a proof and stores the result on-chain:

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

For gas-efficient verification without storage:

```solidity
// Call verifyOnly for gas-efficient verification
bool isValid = ZKVerifyPass.verifyOnly(proof, publicInputs);
```

#### Check Verification Status

Query existing verification records:

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

- **Purpose**: Verifies zk-SNARK proofs on-chain using Groth16
- **Generation**: Auto-generated from circuit using SnarkJS
- **Function**: `verifyProof(Proof memory proof, uint[] memory publicInputs)`

### ZKVerifyPass Contract

- **Purpose**: Main verification orchestration and fee management
- **Functions**:
  - `verifyAndRecord()`: Verify proof and store result
  - `verifyOnly()`: Verify without storing (gas-efficient)
  - `checkVerificationStatus()`: Query verification status
  - `getVerificationRecord()`: Retrieve full verification record
  - `setVerificationFee()`: Update fee (owner only)
  - `withdraw()`: Withdraw fees (owner only)
  - `transferOwnership()`: Transfer contract ownership

### VerificationRegistry Contract

- **Purpose**: Permanent storage of verification records
- **Functions**:
  - `recordVerification()`: Store verification record
  - `getVerification()`: Retrieve verification by ID
  - `getSubjectVerifications()`: Get all verifications for a subject
  - `getVerifierRecords()`: Get all verifications by a verifier
  - `getTotalVerifications()`: Get total verification count
  - `checkVerification()`: Check if verification exists and is valid

## Testing

Run the test suite:

```bash
npm test
```

The test suite includes comprehensive tests for:
- Proof verification
- Fee management
- Registry operations
- Access control
- Edge cases and error handling

## Security Considerations

1. **Trusted Setup**: The circuit's trusted setup ceremony is critical for security. Use a secure multi-party ceremony for production deployments.

2. **Verifier Contract**: Always use the auto-generated `Verifier_custom.sol` (Groth16Verifier) from SnarkJS. Never modify it manually.

3. **Circuit Design**: Carefully design and audit your circuit to ensure it correctly verifies the intended properties without vulnerabilities.

4. **Private Keys**: Never expose private inputs or witness values. Keep all sensitive data secure.

5. **Gas Costs**: Proof verification on-chain consumes gas. Consider off-chain verification for non-critical use cases.

6. **Access Control**: Review and configure access controls appropriately for your use case.

## Customization

### Creating Your Own Circuit

1. Define your verification logic in a `.circom` file
2. Compile the circuit using Circom
3. Run trusted setup ceremony
4. Generate verifier contract using SnarkJS
5. Update `PUBLIC_INPUTS_COUNT` in `ZKVerifyPass.sol` to match your circuit
6. Deploy and test thoroughly

### Use Cases

ZKVerifyPass can be adapted for various privacy-preserving verification scenarios:

- **Age Verification**: Prove age requirements (e.g., 18+) without revealing exact age
- **Identity Verification**: Prove valid credentials without exposing personal information
- **Compliance Checks**: Prove meeting regulatory requirements while maintaining privacy
- **Asset Ownership**: Prove ownership of assets without revealing asset details
- **Credit Scores**: Prove creditworthiness without exposing exact scores
- **Medical Records**: Prove medical conditions or vaccinations without exposing full records
- **Educational Credentials**: Prove qualifications without revealing transcripts

## Contributing

Contributions are welcome and encouraged. Please ensure:

- Code follows Solidity style guidelines and best practices
- Comprehensive tests are included for new features
- Documentation is updated accordingly
- Code is reviewed and tested before submitting pull requests

## License

This project is licensed under the MIT License.

## Resources

- [SnarkJS Documentation](https://github.com/iden3/snarkjs)
- [Circom Documentation](https://docs.circom.io/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [zk-SNARKs Explained](https://z.cash/technology/zksnarks/)
- [Groth16 Paper](https://eprint.iacr.org/2016/260)

## Support

For issues, questions, or feature requests, please open an issue on GitHub.
