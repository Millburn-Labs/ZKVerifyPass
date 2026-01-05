# Quick Start Guide

This guide will help you get ZKVerifyPass up and running quickly.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Compile Contracts

```bash
npm run compile
```

## Step 3: Setup Circuit (One-Time Setup)

### Install Circom

```bash
npm install -g circom
```

### Compile Circuit

```bash
cd circuits
circom verify.circom --r1cs --wasm --sym
cd ..
```

### Run Trusted Setup

```bash
cd circuits

# Phase 1: Powers of Tau
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

# Phase 2: Circuit-specific setup
snarkjs groth16 setup verify.r1cs pot12_final.ptau verify_0000.zkey
snarkjs zkey contribute verify_0000.zkey verify_0001.zkey --name="1st Contributor" -v

# Export verification key
snarkjs zkey export verificationkey verify_0001.zkey verification_key.json

# Generate Solidity verifier
snarkjs zkey export solidityverifier verify_0001.zkey ../contracts/Verifier.sol

cd ..
```

**Important:** The generated `Verifier.sol` will replace the template. Make sure to review it.

## Step 4: Generate a Proof

```bash
node scripts/generateProof.js
```

This creates proof files in the `proofs/` directory.

## Step 5: Verify Proof Off-Chain

```bash
node scripts/verifyProof.js
```

## Step 6: Format Proof for Contract

```bash
node scripts/formatProofForContract.js
```

## Step 7: Deploy Contracts

### Start Local Node

```bash
npm run node
```

### Deploy (in another terminal)

```bash
npm run deploy
```

## Step 8: Test

```bash
npm test
```

## Next Steps

1. Customize the circuit in `circuits/verify.circom` for your use case
2. Update `PUBLIC_INPUTS_COUNT` in `contracts/ZKVerifyPass.sol` to match your circuit
3. Integrate with your frontend/backend application
4. Deploy to a testnet (Sepolia, Mumbai, etc.)
5. Run a proper trusted setup ceremony for production

## Troubleshooting

### "verify.wasm not found"
- Make sure you've compiled the circuit: `circom circuits/verify.circom --r1cs --wasm --sym`

### "verify_0001.zkey not found"
- Complete the trusted setup process (Step 3)

### "Verification key not found"
- Export the verification key: `snarkjs zkey export verificationkey verify_0001.zkey verification_key.json`

### Contract compilation errors
- Make sure you've generated the Verifier contract from your circuit
- Check that Solidity version matches in `hardhat.config.ts`

## Production Checklist

- [ ] Run a secure multi-party trusted setup ceremony
- [ ] Audit the circuit logic
- [ ] Audit the smart contracts
- [ ] Test on testnet
- [ ] Set appropriate verification fees
- [ ] Implement access controls if needed
- [ ] Set up monitoring and alerts
- [ ] Document your specific circuit use case


