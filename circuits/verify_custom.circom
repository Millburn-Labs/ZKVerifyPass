/*
 * @title Custom Multi-Purpose Verification Circuit
 * @notice zk-SNARK circuit demonstrating multiple verification use cases
 * @dev This circuit supports various verification scenarios:
 *      - Age verification: Prove age >= threshold without revealing exact age (simplified)
 *      - Identity verification: Prove valid credentials with hash commitment
 *      - Compliance checks: Prove meeting requirements with hash commitment
 *      - Asset ownership: Prove ownership with hash commitment without revealing asset
 * 
 * Note: For production use, implement proper comparison circuits for age verification.
 * This example demonstrates the concept using hash commitments which are simpler to verify.
 * 
 * To use this circuit:
 * 1. Install circom: npm install -g circom
 * 2. Compile: circom circuits/verify_custom.circom --r1cs --wasm --sym
 * 3. Follow setup instructions in README.md
 */

pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

template CustomVerify() {
    // Verification type selector (public input)
    // 1 = Age verification (using hash commitment of age), 
    // 2 = Identity verification, 
    // 3 = Compliance verification,
    // 4 = Asset ownership verification
    signal input verificationType;
    
    // ========== AGE VERIFICATION INPUTS ==========
    // Private: Actual age (to keep secret)
    signal input age;
    // Private: Salt for privacy
    signal input ageSalt;
    // Public: Hash commitment proving age >= threshold
    // In practice, this would be computed off-chain: hash(age, salt, threshold)
    signal input ageCommitment;
    
    // ========== IDENTITY VERIFICATION INPUTS ==========
    // Private: Identity credentials (secret ID number or credential)
    signal input identitySecret;
    // Private: Salt for privacy
    signal input identitySalt;
    // Public: Hash commitment of identity
    signal input identityCommitment;
    
    // ========== COMPLIANCE VERIFICATION INPUTS ==========
    // Private: Compliance data (score, rating, or other metric)
    signal input complianceData;
    // Private: Salt for privacy
    signal input complianceSalt;
    // Public: Hash commitment proving compliance
    signal input complianceCommitment;
    
    // ========== ASSET OWNERSHIP INPUTS ==========
    // Private: Asset identifier (to keep secret)
    signal input assetId;
    // Private: Owner secret key or proof
    signal input ownerSecret;
    // Public: Hash commitment proving ownership
    signal input ownershipCommitment;
    
    // Intermediate verification results
    signal ageVerified;
    signal identityVerified;
    signal complianceVerified;
    signal ownershipVerified;
    
    // ========== AGE VERIFICATION LOGIC ==========
    // Hash age with salt to create commitment
    // Note: In production, include threshold in hash for proper verification
    component ageHasher = Poseidon(2);
    ageHasher.inputs[0] <== age;
    ageHasher.inputs[1] <== ageSalt;
    
    // Check if hash matches commitment
    component ageEq = IsEqual();
    ageEq.in[0] <== ageHasher.out;
    ageEq.in[1] <== ageCommitment;
    
    // Check if verification type is 1 (age verification)
    component ageTypeCheck = IsEqual();
    ageTypeCheck.in[0] <== verificationType;
    ageTypeCheck.in[1] <== 1;
    
    // Age is verified if type is 1 AND hash matches
    ageVerified <== ageEq.out * ageTypeCheck.out;
    
    // ========== IDENTITY VERIFICATION LOGIC ==========
    // Hash identity secret with salt
    component identityHasher = Poseidon(2);
    identityHasher.inputs[0] <== identitySecret;
    identityHasher.inputs[1] <== identitySalt;
    
    // Check if hash matches commitment
    component identityEq = IsEqual();
    identityEq.in[0] <== identityHasher.out;
    identityEq.in[1] <== identityCommitment;
    
    // Check if verification type is 2 (identity verification)
    component identityTypeCheck = IsEqual();
    identityTypeCheck.in[0] <== verificationType;
    identityTypeCheck.in[1] <== 2;
    
    // Identity is verified if type is 2 AND hash matches
    identityVerified <== identityEq.out * identityTypeCheck.out;
    
    // ========== COMPLIANCE VERIFICATION LOGIC ==========
    // Hash compliance data with salt
    component complianceHasher = Poseidon(2);
    complianceHasher.inputs[0] <== complianceData;
    complianceHasher.inputs[1] <== complianceSalt;
    
    // Check if hash matches commitment
    component complianceEq = IsEqual();
    complianceEq.in[0] <== complianceHasher.out;
    complianceEq.in[1] <== complianceCommitment;
    
    // Check if verification type is 3 (compliance verification)
    component complianceTypeCheck = IsEqual();
    complianceTypeCheck.in[0] <== verificationType;
    complianceTypeCheck.in[1] <== 3;
    
    // Compliance is verified if type is 3 AND hash matches
    complianceVerified <== complianceEq.out * complianceTypeCheck.out;
    
    // ========== ASSET OWNERSHIP VERIFICATION LOGIC ==========
    // Hash asset ID with owner secret
    component ownershipHasher = Poseidon(2);
    ownershipHasher.inputs[0] <== assetId;
    ownershipHasher.inputs[1] <== ownerSecret;
    
    // Check if hash matches commitment
    component ownershipEq = IsEqual();
    ownershipEq.in[0] <== ownershipHasher.out;
    ownershipEq.in[1] <== ownershipCommitment;
    
    // Check if verification type is 4 (asset ownership verification)
    component ownershipTypeCheck = IsEqual();
    ownershipTypeCheck.in[0] <== verificationType;
    ownershipTypeCheck.in[1] <== 4;
    
    // Ownership is verified if type is 4 AND hash matches
    ownershipVerified <== ownershipEq.out * ownershipTypeCheck.out;
    
    // ========== FINAL VERIFICATION ==========
    // At least one verification must pass (for the selected type)
    // Sum all verification results
    signal verificationSum;
    verificationSum <== ageVerified + identityVerified + complianceVerified + ownershipVerified;
    
    // The sum should be 1 (exactly one verification type should pass)
    component finalCheck = IsEqual();
    finalCheck.in[0] <== verificationSum;
    finalCheck.in[1] <== 1;
    
    // Ensure verification passes
    finalCheck.out === 1;
}

component main = CustomVerify();
