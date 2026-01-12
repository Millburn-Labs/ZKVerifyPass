'use client';

import { useState } from 'react';
import { useVerificationRecord, useVerificationStatus } from '../hooks/useZKVerifyPass';

export function VerificationChecker() {
  const [verificationId, setVerificationId] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const { status, isLoading: isLoadingStatus } = useVerificationStatus(
    verificationId && verificationId.startsWith('0x') && verificationId.length === 66
      ? (verificationId as `0x${string}`)
      : null
  );

  const { record, isLoading: isLoadingRecord } = useVerificationRecord(
    verificationId && verificationId.startsWith('0x') && verificationId.length === 66
      ? (verificationId as `0x${string}`)
      : null
  );

  const handleCheck = () => {
    if (!verificationId || !verificationId.startsWith('0x') || verificationId.length !== 66) {
      alert('Please enter a valid verification ID (0x followed by 64 hex characters)');
      return;
    }
    setIsChecking(true);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
      <h2 className="text-2xl font-semibold mb-6">Check Verification Status</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Verification ID
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={verificationId}
            onChange={(e) => {
              setVerificationId(e.target.value);
              setIsChecking(false);
            }}
            placeholder="0x..."
            className="flex-1 bg-black border border-gray-700 rounded-lg p-3 text-white font-mono text-sm focus:outline-none focus:border-white"
          />
          <button
            onClick={handleCheck}
            disabled={!verificationId || isLoadingStatus || isLoadingRecord}
            className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            {isLoadingStatus || isLoadingRecord ? 'Checking...' : 'Check'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Enter a verification ID to check its status
        </p>
      </div>

      {isChecking && verificationId && (
        <div className="mt-6">
          {isLoadingStatus || isLoadingRecord ? (
            <div className="text-gray-400">Loading verification status...</div>
          ) : status ? (
            <div className={`p-4 rounded-lg ${
              status[0] && status[1]
                ? 'bg-green-900/20 border border-green-800'
                : status[0] && !status[1]
                ? 'bg-red-900/20 border border-red-800'
                : 'bg-gray-800 border border-gray-700'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  status[0] && status[1] ? 'bg-green-500' : status[0] ? 'bg-red-500' : 'bg-gray-500'
                }`}>
                  {status[0] && status[1] ? '✓' : status[0] ? '✗' : '?'}
                </div>
                <div className="flex-1">
                  {status[0] ? (
                    <>
                      <h3 className="font-semibold mb-2">
                        {status[1] ? 'Verification Valid' : 'Verification Invalid'}
                      </h3>
                      {record && (
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="text-gray-400">Subject:</span>{' '}
                            <span className="font-mono text-xs">{record.subject}</span>
                          </p>
                          <p>
                            <span className="text-gray-400">Verifier:</span>{' '}
                            <span className="font-mono text-xs">{record.verifier}</span>
                          </p>
                          <p>
                            <span className="text-gray-400">Timestamp:</span>{' '}
                            {new Date(Number(record.timestamp) * 1000).toLocaleString()}
                          </p>
                          <p>
                            <span className="text-gray-400">Metadata:</span> {record.metadata}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <h3 className="font-semibold">Verification Not Found</h3>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
