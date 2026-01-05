// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title VerificationRegistry
 * @notice Registry/Storage Contract for storing verification records
 * @dev Stores verification records with metadata and status
 */
contract VerificationRegistry {
    // Verification record structure
    struct VerificationRecord {
        address verifier;           // Address of the entity requesting verification
        address subject;             // Address of the entity being verified
        bytes32 verificationId;     // Unique identifier for this verification
        uint256 timestamp;           // When the verification was performed
        bool isValid;                // Whether the proof was valid
        bytes32 publicInputHash;     // Hash of public inputs (for reference)
        string metadata;             // Optional metadata/description
    }

    // Mapping from verification ID to record
    mapping(bytes32 => VerificationRecord) public verifications;
    
    // Mapping from subject address to array of verification IDs
    mapping(address => bytes32[]) public subjectVerifications;
    
    // Mapping from verifier address to array of verification IDs
    mapping(address => bytes32[]) public verifierRecords;
    
    // Array of all verification IDs
    bytes32[] public allVerificationIds;
    
    // Events
    event VerificationRecorded(
        bytes32 indexed verificationId,
        address indexed verifier,
        address indexed subject,
        uint256 timestamp,
        bool isValid
    );
    
    event VerificationUpdated(
        bytes32 indexed verificationId,
        bool newStatus
    );

    /**
     * @notice Record a new verification
     * @param verificationId Unique identifier for this verification
     * @param verifier Address of the entity requesting verification
     * @param subject Address of the entity being verified
     * @param isValid Whether the proof was valid
     * @param publicInputHash Hash of public inputs
     * @param metadata Optional metadata/description
     */
    function recordVerification(
        bytes32 verificationId,
        address verifier,
        address subject,
        bool isValid,
        bytes32 publicInputHash,
        string memory metadata
    ) public {
        require(verifications[verificationId].timestamp == 0, "Verification ID already exists");
        
        VerificationRecord memory record = VerificationRecord({
            verifier: verifier,
            subject: subject,
            verificationId: verificationId,
            timestamp: block.timestamp,
            isValid: isValid,
            publicInputHash: publicInputHash,
            metadata: metadata
        });
        
        verifications[verificationId] = record;
        subjectVerifications[subject].push(verificationId);
        verifierRecords[verifier].push(verificationId);
        allVerificationIds.push(verificationId);
        
        emit VerificationRecorded(
            verificationId,
            verifier,
            subject,
            block.timestamp,
            isValid
        );
    }

    /**
     * @notice Get verification record by ID
     * @param verificationId The verification ID to lookup
     * @return record The verification record
     */
    function getVerification(bytes32 verificationId) 
        public 
        view 
        returns (VerificationRecord memory record) 
    {
        require(verifications[verificationId].timestamp != 0, "Verification not found");
        return verifications[verificationId];
    }

    /**
     * @notice Get all verification IDs for a subject
     * @param subject Address of the subject
     * @return Array of verification IDs
     */
    function getSubjectVerifications(address subject) 
        public 
        view 
        returns (bytes32[] memory) 
    {
        return subjectVerifications[subject];
    }

    /**
     * @notice Get all verification IDs for a verifier
     * @param verifier Address of the verifier
     * @return Array of verification IDs
     */
    function getVerifierRecords(address verifier) 
        public 
        view 
        returns (bytes32[] memory) 
    {
        return verifierRecords[verifier];
    }

    /**
     * @notice Get total number of verifications
     * @return Total count
     */
    function getTotalVerifications() public view returns (uint256) {
        return allVerificationIds.length;
    }

    /**
     * @notice Check if a verification exists and is valid
     * @param verificationId The verification ID to check
     * @return exists Whether the verification exists
     * @return isValid Whether the verification is valid
     */
    function checkVerification(bytes32 verificationId) 
        public 
        view 
        returns (bool exists, bool isValid) 
    {
        VerificationRecord memory record = verifications[verificationId];
        exists = record.timestamp != 0;
        isValid = exists && record.isValid;
    }
}


