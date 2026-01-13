import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ZKVerifyPassContract } from '../ABI';

export interface Proof {
  a: [string, string];
  b: [[string, string], [string, string]];
  c: [string, string];
}

export interface VerificationResult {
  verificationId: string;
  isValid: boolean;
  transactionHash?: string;
  blockNumber?: bigint;
}

export interface VerificationRecord {
  verifier: string;
  subject: string;
  verificationId: string;
  timestamp: bigint;
  isValid: boolean;
  publicInputHash: string;
  metadata: string;
}

export function useZKVerifyPass() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Read verification fee
  const { data: verificationFeeData, isLoading: isLoadingFee } = useReadContract({
    address: ZKVerifyPassContract.address as `0x${string}`,
    abi: ZKVerifyPassContract.abi,
    functionName: 'verificationFee',
  });
  
  // Type assertion: verificationFee returns uint256 which is bigint
  const verificationFee = verificationFeeData as bigint | undefined;

  // Format proof from JSON format to contract format
  const formatProof = (proofData: any): Proof => {
    // Handle different proof formats
    let proofObj: any;
    
    // Check if proof is nested under "proof" key
    if (proofData.proof) {
      proofObj = proofData.proof;
    } else if (proofData.pi_a || proofData.a) {
      // Proof is at root level (pi_a format from snarkjs, or already formatted as a/b/c)
      proofObj = proofData;
    } else {
      throw new Error('Invalid proof format: Expected proof object with pi_a/pi_b/pi_c or a/b/c fields');
    }

    // Handle snarkjs format (pi_a, pi_b, pi_c)
    if (proofObj.pi_a && proofObj.pi_b && proofObj.pi_c) {
      return {
        a: [proofObj.pi_a[0], proofObj.pi_a[1]],
        b: [
          [proofObj.pi_b[0][1], proofObj.pi_b[0][0]],
          [proofObj.pi_b[1][1], proofObj.pi_b[1][0]],
        ],
        c: [proofObj.pi_c[0], proofObj.pi_c[1]],
      };
    } 
    // Handle already formatted proof (a, b, c)
    else if (proofObj.a && proofObj.b && proofObj.c) {
      return proofObj as Proof;
    } else {
      throw new Error('Invalid proof format: Expected pi_a/pi_b/pi_c or a/b/c fields');
    }
  };

  // Verify and record proof
  const verifyAndRecord = async (
    proofData: any,
    subject: `0x${string}` | null,
    metadata: string
  ): Promise<void> => {
    if (!verificationFee || typeof verificationFee !== 'bigint') {
      throw new Error('Verification fee not loaded');
    }

    const proof = formatProof(proofData);
    const publicInputs = proofData.publicSignals || [];

    // Use zero address to indicate msg.sender should be used as subject
    const subjectAddress = subject || '0x0000000000000000000000000000000000000000';

    await writeContract({
      address: ZKVerifyPassContract.address as `0x${string}`,
      abi: ZKVerifyPassContract.abi,
      functionName: 'verifyAndRecord',
      args: [proof, publicInputs, subjectAddress as `0x${string}`, metadata],
      value: verificationFee,
    });
  };

  // Check verification status
  const checkVerificationStatus = async (verificationId: `0x${string}`) => {
    // This will be handled by useReadContract hook
    return null;
  };

  // Get verification record
  const getVerificationRecord = async (verificationId: `0x${string}`) => {
    // This will be handled by useReadContract hook
    return null;
  };

  return {
    verifyAndRecord,
    checkVerificationStatus,
    getVerificationRecord,
    formatProof,
    verificationFee: verificationFee ? formatEther(verificationFee) : '0',
    isLoadingFee,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error,
  };
}

// Hook to check verification status
export function useVerificationStatus(verificationId: `0x${string}` | null) {
  const { data, isLoading, error } = useReadContract({
    address: verificationId ? (ZKVerifyPassContract.address as `0x${string}`) : undefined,
    abi: ZKVerifyPassContract.abi,
    functionName: 'checkVerificationStatus',
    args: verificationId ? [verificationId] : undefined,
  });

  return {
    status: data as [boolean, boolean] | undefined,
    isLoading,
    error,
  };
}

// Hook to get verification record
export function useVerificationRecord(verificationId: `0x${string}` | null) {
  const { data, isLoading, error } = useReadContract({
    address: verificationId ? (ZKVerifyPassContract.address as `0x${string}`) : undefined,
    abi: ZKVerifyPassContract.abi,
    functionName: 'getVerificationRecord',
    args: verificationId ? [verificationId] : undefined,
  });

  return {
    record: data as VerificationRecord | undefined,
    isLoading,
    error,
  };
}
