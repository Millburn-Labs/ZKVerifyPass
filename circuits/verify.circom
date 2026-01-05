/*
 * @title Simple Verification Circuit
 * @notice Example zk-SNARK circuit for ZKVerifyPass
 * @dev This circuit demonstrates a simple verification:
 *      - Private input: secret value
 *      - Public input: commitment hash
 *      - Proves knowledge of secret that hashes to the commitment
 * 
 * To use this circuit:
 * 1. Install circom: npm install -g circom
 * 2. Compile: circom circuits/verify.circom --r1cs --wasm --sym
 * 3. Follow setup instructions in README.md
 */

pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

template Verify() {
    // Private inputs (witness) - these will be kept private during proof generation
    signal input secret;
    signal input salt;
    
    // Public input - the expected hash output (254 bits from Poseidon)
    signal input publicHash;
    
    // Hash the secret with salt using Poseidon
    // Poseidon is zk-friendly and outputs a single field element (254 bits)
    component hasher = Poseidon(2);
    hasher.inputs[0] <== secret;
    hasher.inputs[1] <== salt;
    
    // Verify the hash matches the public input
    component eq = IsEqual();
    eq.in[0] <== hasher.out;
    eq.in[1] <== publicHash;
    
    // The hash must match
    eq.out === 1;
}

component main = Verify();
