'use client';

import { useState } from 'react';

type VerificationType = 'age' | 'identity' | 'compliance' | 'ownership' | null;

export default function Home() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [selectedVerificationType, setSelectedVerificationType] = useState<VerificationType>(null);
  const [proofData, setProofData] = useState('');
  const [hasProofData, setHasProofData] = useState(false);

  const verificationTypes = [
    { id: 'age', label: 'Age Verification', description: 'Prove age requirement without revealing exact age' },
    { id: 'identity', label: 'Identity Verification', description: 'Prove valid credentials with hash commitment' },
    { id: 'compliance', label: 'Compliance Verification', description: 'Prove meeting requirements with hash commitment' },
    { id: 'ownership', label: 'Asset Ownership', description: 'Prove ownership with hash commitment' },
  ];

  const handleConnectWallet = () => {
    // Placeholder for wallet connection logic
    setIsWalletConnected(!isWalletConnected);
  };

  const handleVerificationTypeSelect = (type: VerificationType) => {
    setSelectedVerificationType(type);
    setHasProofData(false);
    setProofData('');
  };

  const handleSubmitProof = () => {
    if (!selectedVerificationType || !proofData) {
      alert('Please select a verification type and provide proof data');
      return;
    }

    try {
      const parsed = JSON.parse(proofData);
      console.log('Submitting proof:', { type: selectedVerificationType, proof: parsed });
      // Placeholder for proof submission logic
      alert('Proof submitted! (This is a placeholder)');
    } catch (error) {
      alert('Invalid JSON format. Please check your proof data.');
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
          <button
            onClick={handleConnectWallet}
            className="px-6 py-2 border border-white rounded-lg hover:bg-white hover:text-black transition-colors"
          >
            {isWalletConnected ? 'Disconnect Wallet' : 'Connect Wallet'}
          </button>
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
                  onChange={(e) => setProofData(e.target.value)}
                  placeholder='{"proof": {"a": [...], "b": [...], "c": [...]}, "publicSignals": [...]}'
                  className="w-full h-48 bg-black border border-gray-700 rounded-lg p-4 text-white font-mono text-sm focus:outline-none focus:border-white resize-none"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Paste your zk-SNARK proof data in JSON format
                </p>
              </div>
            )}

            <button
              onClick={handleSubmitProof}
              disabled={!hasProofData || !proofData}
              className="w-full py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              Submit Proof
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
