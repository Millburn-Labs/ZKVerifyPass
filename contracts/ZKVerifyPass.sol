// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Verifier.sol";
import "./VerificationRegistry.sol";

/**
 * @title ZKVerifyPass
 * @notice Main contract for zk-SNARK proof verification and management
 * @dev This contract orchestrates the verification process:
 *      1. Receives zk-SNARK proofs from users
 *      2. Verifies proofs using the Verifier contract (configured for verify_custom.circom)
 *      3. Records results in the VerificationRegistry
 * 
 * Note: Configured for verify_custom.circom. The custom circuit currently has 0 public outputs.
 * Groth16 requires at least 1 public input, so the circuit must be modified to expose 
 * verificationType as a public input before deployment.
 */
contract ZKVerifyPass {
    Verifier public verifier;
    VerificationRegistry public registry;
    
    // Owner of the contract
    address public owner;
    
    // Fee for verification (in wei)
    uint256 public verificationFee;
    
    // Circuit configuration
    // Configured for verify_custom.circom (has 0 public outputs - all inputs are private)
    // IMPORTANT: Groth16 requires at least 1 public input. The circuit must be modified
    // to expose verificationType as a public input before use. Once modified, update
    // this constant to 1 to match the modified circuit.
    uint256 public constant PUBLIC_INPUTS_COUNT = 0;
    
    // Events
    event VerificationRequested(
        bytes32 indexed verificationId,
        address indexed requester,
        address indexed subject
    );
    
    event VerificationCompleted(
        bytes32 indexed verificationId,
        address indexed subject,
        bool isValid
    );
    
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @notice Constructor
     * @param _verifier Address of the Verifier contract
     * @param _registry Address of the VerificationRegistry contract
     * @param _verificationFee Initial verification fee in wei
     */
    constructor(
        address _verifier,
        address _registry,
        uint256 _verificationFee
    ) {
        require(_verifier != address(0), "Invalid verifier address");
        require(_registry != address(0), "Invalid registry address");
        
        verifier = Verifier(_verifier);
        registry = VerificationRegistry(_registry);
        owner = msg.sender;
        verificationFee = _verificationFee;
    }

    /**
     * @notice Verify a zk-SNARK proof and record the result
     * @param proof The zk-SNARK proof structure (a, b, c)
     * @param publicInputs Array of public inputs from the circuit
     * @param subject Address of the entity being verified (optional, can be msg.sender)
     * @param metadata Optional metadata/description for this verification
     * @return verificationId Unique identifier for this verification
     * @return isValid Whether the proof is valid
     */
    function verifyAndRecord(
        Verifier.Proof memory proof,
        uint[] memory publicInputs,
        address subject,
        string memory metadata
    ) public payable returns (bytes32 verificationId, bool isValid) {
        // Check fee payment
        require(msg.value >= verificationFee, "Insufficient verification fee");
        
        // Validate public inputs length
        require(
            publicInputs.length == PUBLIC_INPUTS_COUNT,
            "Invalid public inputs length"
        );
        
        // Use msg.sender as subject if not provided
        if (subject == address(0)) {
            subject = msg.sender;
        }
        
        // Generate unique verification ID
        verificationId = keccak256(
            abi.encodePacked(
                msg.sender,
                subject,
                block.timestamp,
                block.number,
                publicInputs
            )
        );
        
        emit VerificationRequested(verificationId, msg.sender, subject);
        
        // Verify the proof
        isValid = verifier.verifyProof(proof, publicInputs);
        
        // Hash public inputs for storage
        bytes32 publicInputHash = keccak256(abi.encodePacked(publicInputs));
        
        // Record verification in registry
        registry.recordVerification(
            verificationId,
            msg.sender,
            subject,
            isValid,
            publicInputHash,
            metadata
        );
        
        emit VerificationCompleted(verificationId, subject, isValid);
        
        // Refund excess payment
        if (msg.value > verificationFee) {
            payable(msg.sender).transfer(msg.value - verificationFee);
        }
        
        return (verificationId, isValid);
    }

    /**
     * @notice Verify a proof without recording (gas-efficient for repeated checks)
     * @param proof The zk-SNARK proof structure
     * @param publicInputs Array of public inputs from the circuit
     * @return isValid Whether the proof is valid
     */
    function verifyOnly(
        Verifier.Proof memory proof,
        uint[] memory publicInputs
    ) public view returns (bool isValid) {
        require(
            publicInputs.length == PUBLIC_INPUTS_COUNT,
            "Invalid public inputs length"
        );
        
        isValid = verifier.verifyProof(proof, publicInputs);
        return isValid;
    }

    /**
     * @notice Check if a verification record exists and is valid
     * @param verificationId The verification ID to check
     * @return exists Whether the verification exists
     * @return isValid Whether the verification is valid
     */
    function checkVerificationStatus(bytes32 verificationId)
        public
        view
        returns (bool exists, bool isValid)
    {
        return registry.checkVerification(verificationId);
    }

    /**
     * @notice Get verification record by ID
     * @param verificationId The verification ID
     * @return record The verification record
     */
    function getVerificationRecord(bytes32 verificationId)
        public
        view
        returns (VerificationRegistry.VerificationRecord memory record)
    {
        return registry.getVerification(verificationId);
    }

    /**
     * @notice Update verification fee (owner only)
     * @param newFee New verification fee in wei
     */
    function setVerificationFee(uint256 newFee) public {
        require(msg.sender == owner, "Only owner can set fee");
        uint256 oldFee = verificationFee;
        verificationFee = newFee;
        emit FeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Transfer ownership (owner only)
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) public {
        require(msg.sender == owner, "Only owner can transfer");
        require(newOwner != address(0), "Invalid new owner");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @notice Withdraw contract balance (owner only)
     */
    function withdraw() public {
        require(msg.sender == owner, "Only owner can withdraw");
        payable(owner).transfer(address(this).balance);
    }

    /**
     * @notice Get contract balance
     * @return balance Current contract balance in wei
     */
    function getBalance() public view returns (uint256 balance) {
        return address(this).balance;
    }
}


