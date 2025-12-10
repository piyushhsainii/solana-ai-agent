import { useWallet } from "@solana/wallet-adapter-react";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { Transaction } from "@solana/web3.js";
import React, { useState } from "react";

const CreateDriftAccount = ({ toolResult }: { toolResult: any }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wallet = useWallet();
  const connection = new Connection(clusterApiUrl("devnet"));
  if (wallet.connected == false) {
    return null;
  }

  const handleSignAndSend = async () => {
    if (wallet.connected == false || !wallet) {
      return null;
    }
    try {
      setIsProcessing(true);
      setError(null);

      const txBase64 = toolResult.transaction;
      const txBuffer = Buffer.from(toolResult.transaction, "base64");

      // ✅ Convert buffer → Transaction object
      const tx = Transaction.from(txBuffer);

      // ✅ Now sign correctly
      const signedTx = await wallet.signTransaction!(tx);

      // ✅ Send it
      const sig = await connection.sendRawTransaction(signedTx.serialize());

      await connection.confirmTransaction(sig, "confirmed");

      setTxSignature(sig);
    } catch (err: any) {
      setError(err?.message || "Transaction failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!toolResult?.success) return null;

  return (
    <div className="space-y-4">
      {/* Success Info */}
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            {toolResult.message}
          </p>
        </div>
      </div>

      {/* Transaction Card */}
      {toolResult.transaction && !txSignature && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h4 className="text-sm font-semibold mb-3">Drift Account Creation</h4>

          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className="font-medium text-yellow-600">
                {isProcessing ? "Processing…" : "Awaiting Signature"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Estimated Fees:
              </span>
              <span className="font-mono text-xs">
                {toolResult.estimatedFees || "~0.001 SOL"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Tx Size:</span>
              <span className="font-mono text-xs">
                {toolResult.transaction.length} bytes
              </span>
            </div>
          </div>

          {/* Instruction List */}
          {toolResult.instructions?.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/30 rounded">
              <p className="text-xs text-gray-500 mb-2">Steps:</p>
              <ul className="text-xs space-y-1">
                {toolResult.instructions.map((step: string, i: number) => (
                  <li key={i} className="text-gray-700 dark:text-gray-300">
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleSignAndSend}
            disabled={isProcessing}
            className={`w-full px-4 py-3 ${
              isProcessing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            } text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg`}
          >
            {isProcessing ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0..."
                  />
                </svg>
                Creating Drift Account…
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
                Create Drift Account
              </>
            )}
          </button>
        </div>
      )}

      {/* Confirmed State */}
      {txSignature && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm font-medium text-green-800 mb-2">
            Drift account successfully created 🎉
          </p>
          <a
            href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            View transaction on Explorer →
          </a>
          <p className="text-xs font-mono mt-2 break-all">{txSignature}</p>
        </div>
      )}
    </div>
  );
};

export default CreateDriftAccount;
