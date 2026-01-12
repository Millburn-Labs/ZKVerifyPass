'use client';

import { useState, useEffect } from 'react';
import { useAccount, useDisconnect, usePublicClient } from 'wagmi';
import { AppKitButton } from '@reown/appkit/react';
import { useZKVerifyPass, useVerificationRecord } from './hooks/useZKVerifyPass';
import { VerificationChecker } from './components/VerificationChecker';
import { decodeEventLog } from 'viem';
import { ZKVerifyPassContract } from './ABI';

type VerificationType = 'age' | 'identity' | 'compliance' | 'ownership' | null;

interface VerificationResult {
  verificationId: string;
  isValid: boolean;
  transactionHash: string;
  blockNumber?: bigint;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const publicClient = usePublicClient();
  const [selectedVerificationType, setSelectedVerificationType] = useState<VerificationType>(null);
  const [proofData, setProofData] = useState('');
  const [hasProofData, setHasProofData] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const {
    verifyAndRecord,
    verificationFee,
    isLoadingFee,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error: contractError,
  } = useZKVerifyPass();

  // Get verification record when we have a verification ID
  const { record } = useVerificationRecord(
    verificationResult?.verificationId as `0x${string}` | null
  );

  const verificationTypes = [
    { id: 'age', label: 'Age Verification', description: 'Prove age requirement without revealing exact age' },
    { id: 'identity', label: 'Identity Verification', description: 'Prove valid credentials with hash commitment' },
    { id: 'compliance', label: 'Compliance Verification', description: 'Prove meeting requirements with hash commitment' },
    { id: 'ownership', label: 'Asset Ownership', description: 'Prove ownership with hash commitment' },
  ];

  const handleDisconnect = () => {
    disconnect();
  };

  const handleVerificationTypeSelect = (type: VerificationType) => {
    setSelectedVerificationType(type);
    setHasProofData(false);
    setProofData('');
    setVerificationResult(null);
    setError(null);
  };

  // Get metadata string based on verification type
  const getMetadata = (type: VerificationType): string => {
    switch (type) {
      case 'age':
        return 'Age Verification: Proving age requirement without revealing exact age';
      case 'identity':
        return 'Identity Verification: Proving valid credentials with hash commitment';
      case 'compliance':
        return 'Compliance Verification: Proving meeting requirements with hash commitment';
      case 'ownership':
        return 'Asset Ownership Verification: Proving ownership with hash commitment';
      default:
        return 'ZK-SNARK Verification';
    }
  };

  // Parse verification result from transaction receipt
  useEffect(() => {
    if (isConfirmed && hash && publicClient) {
      const parseVerificationResult = async () => {
        try {
          const receipt = await publicClient.getTransactionReceipt({ hash });

          // Find the event in logs
          for (const log of receipt.logs) {
            try {
              const decoded = decodeEventLog({
                abi: ZKVerifyPassContract.abi,
                data: log.data,
                topics: log.topics,
              });
              
              if (decoded.eventName === 'VerificationCompleted') {
                // Type assertion for VerificationCompleted event args
                const args = decoded.args as unknown as {
                  verificationId: `0x${string}`;
                  subject: `0x${string}`;
                  isValid: boolean;
                };
                
                setVerificationResult({
                  verificationId: args.verificationId,
                  isValid: args.isValid,
                  transactionHash: hash,
                  blockNumber: receipt.blockNumber,
                });
                setError(null);
                return;
              }
            } catch {
              // Not the event we're looking for, continue
            }
          }
          
          // If event not found, still show success
          setVerificationResult({
            verificationId: '0x0',
            isValid: false,
            transactionHash: hash,
            blockNumber: receipt.blockNumber,
          });
        } catch (err: any) {
          setError(err.message || 'Failed to parse verification result');
        }
      };

      parseVerificationResult();
    }
  }, [isConfirmed, hash, publicClient]);

  // Handle contract errors
  useEffect(() => {
    if (contractError) {
      const errorMessage = contractError.message || 'Contract interaction failed';
      setError(errorMessage);
    }
  }, [contractError]);

  const handleSubmitProof = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!selectedVerificationType || !proofData) {
      setError('Please select a verification type and provide proof data');
      return;
    }

    try {
      const parsed = JSON.parse(proofData);
      setError(null);
      setVerificationResult(null);

      const metadata = getMetadata(selectedVerificationType);
      
      await verifyAndRecord(parsed, address as `0x${string}`, metadata);
    } catch (err: any) {
      if (err.message.includes('JSON')) {
        setError('Invalid JSON format. Please check your proof data.');
      } else {
        setError(err.message || 'Failed to submit proof');
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-xl">ZK</span>
            </div>
            <span className="text-2xl font-bold">ZKVerifyPass</span>
          </div>
          <div className="flex items-center gap-3">
            {isConnected && address && (
              <span className="text-sm text-gray-400">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            )}
            {isConnected ? (
              <button
                onClick={handleDisconnect}
                className="px-6 py-2 border border-white rounded-lg hover:bg-white hover:text-black transition-colors"
              >
                Disconnect
              </button>
            ) : (
              <AppKitButton />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* App Name and Tagline */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">ZKVerifyPass</h1>
          <p className="text-xl text-gray-300">
            Zero-Knowledge Proof Verification Platform
          </p>
        </div>

        {/* Verification Type Selection Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Select Verification Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verificationTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleVerificationTypeSelect(type.id as VerificationType)}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  selectedVerificationType === type.id
                    ? 'border-white bg-gray-800'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <h3 className="text-lg font-semibold mb-2">{type.label}</h3>
                <p className="text-sm text-gray-400">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Proof Data Input (appears after selection) */}
        {selectedVerificationType && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
            {/* Verification Fee Display */}
            {isLoadingFee ? (
              <div className="mb-6 text-sm text-gray-400">Loading verification fee...</div>
            ) : (
              <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Verification Fee:</span>
                  <span className="text-lg font-semibold">{verificationFee} ETH</span>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasProofData}
                  onChange={(e) => {
                    setHasProofData(e.target.checked);
                    if (!e.target.checked) {
                      setProofData('');
                    }
                  }}
                  className="w-5 h-5 accent-white"
                />
                <span className="text-lg">I have my zk-SNARK proof data (JSON format)</span>
              </label>
            </div>

            {hasProofData && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  ZK Proof Data (JSON)
                </label>
                <textarea
                  value={proofData}
                  onChange={(e) => {
                    setProofData(e.target.value);
                    setError(null);
                  }}
                  placeholder='{"proof": {"pi_a": [...], "pi_b": [...], "pi_c": [...]}, "publicSignals": [...]}'
                  className="w-full h-48 bg-black border border-gray-700 rounded-lg p-4 text-white font-mono text-sm focus:outline-none focus:border-white resize-none"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Paste your zk-SNARK proof data in JSON format. Format: {"{"}proof: {"{"}pi_a, pi_b, pi_c{"}"}, publicSignals: []{"}"}
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Verification Result Display */}
            {verificationResult && (
              <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    verificationResult.isValid ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {verificationResult.isValid ? '✓' : '✗'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">
                      {verificationResult.isValid ? 'Verification Successful!' : 'Verification Failed'}
                    </h3>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="text-gray-400">Verification ID:</span>{' '}
                        <span className="font-mono text-xs break-all">{verificationResult.verificationId}</span>
                      </p>
                      <p>
                        <span className="text-gray-400">Transaction:</span>{' '}
                        <span className="font-mono text-xs break-all">{verificationResult.transactionHash}</span>
                      </p>
                      {record && (
                        <>
                          <p>
                            <span className="text-gray-400">Timestamp:</span>{' '}
                            {new Date(Number(record.timestamp) * 1000).toLocaleString()}
                          </p>
                          <p>
                            <span className="text-gray-400">Metadata:</span> {record.metadata}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmitProof}
              disabled={!isConnected || !hasProofData || !proofData || isPending || isConfirming}
              className="w-full py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {isPending || isConfirming
                ? isPending
                  ? 'Confirming transaction...'
                  : 'Waiting for confirmation...'
                : 'Submit Proof'}
            </button>
          </div>
        )}

        {/* Verification Checker */}
        <div className="mt-8">
          <VerificationChecker />
        </div>
      </main>
    </div>
  );
}
