import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, Transaction, VersionedTransaction } from "@solana/web3.js";
import { useState } from "react";

// Component for handling perp trades
export function PerpTradeHandler({
  toolResult,
  toolName,
}: {
  toolResult: any;
  toolName: string;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignAndSend = async () => {
    if (!toolResult?.transaction) {
      setError("No transaction data available");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setTxSignature(null);

    try {
      const wallet = useWallet();
      if (!wallet || !wallet.publicKey) return;
      console.log("Connected wallet:", wallet.publicKey.toString());

      // 3. Deserialize the transaction
      const transactionBuffer = Buffer.from(toolResult.transaction, "base64");
      const transaction = Transaction.from(transactionBuffer);

      console.log("Transaction deserialized:", transaction);

      // 4. Get fresh blockhash (important for transaction validity)
      const connection = new Connection(
        "https://api.devnet.solana.com",
        "confirmed"
      );
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      // 5. Simulate transaction first to catch errors
      console.log("Simulating transaction...");
      const simulation = await connection.simulateTransaction(transaction);

      if (simulation.value.err) {
        console.error("Simulation error:", simulation.value.err);
        throw new Error(
          `Transaction simulation failed: ${JSON.stringify(
            simulation.value.err
          )}`
        );
      }

      console.log("✅ Simulation successful:", simulation.value);

      // 6. Sign and send transaction with Phantom
      console.log("Requesting signature from Phantom...");
      const signature = await wallet.sendTransaction(transaction, connection);

      console.log("✅ Transaction sent:", signature);
      setTxSignature(signature);

      // 7. Wait for confirmation
      console.log("Waiting for confirmation...");
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      console.log("✅ Transaction confirmed!");
      alert(
        `Trade executed successfully! Signature: ${signature.slice(0, 8)}...`
      );
    } catch (err: any) {
      console.error("Transaction error:", err);

      // Parse common Solana/Phantom errors
      let errorMessage = "Unknown error occurred";

      if (err.message?.includes("User rejected")) {
        errorMessage = "Transaction rejected by user";
      } else if (err.message?.includes("Blockhash not found")) {
        errorMessage = "Transaction expired. Please try again.";
      } else if (err.message?.includes("insufficient")) {
        errorMessage = "Insufficient SOL for transaction fees";
      } else if (err.message?.includes("InsufficientCollateral")) {
        errorMessage = "Insufficient collateral in Drift account";
      } else if (err.message?.includes("InvalidOrderSize")) {
        errorMessage = "Order size below minimum requirements";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      alert(`Transaction failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (toolName !== "open_perp_trade") return null;

  return (
    <div className="mt-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Perpetual Trade Order
      </h3>

      {toolResult?.success ? (
        <div className="space-y-4">
          {/* Success Message */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {toolResult.message}
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Details Card */}
          {toolResult.transaction && !txSignature && (
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Transaction Ready
              </h4>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Status:
                  </span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">
                    {isProcessing ? "Processing..." : "Awaiting Signature"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Transaction Size:
                  </span>
                  <span className="font-mono text-xs text-gray-900 dark:text-gray-100">
                    {toolResult.transaction.length} bytes
                  </span>
                </div>

                {/* Show additional details if available */}
                {toolResult.details && (
                  <>
                    {toolResult.details.estimatedPrice && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Estimated Price:
                        </span>
                        <span className="font-mono text-xs text-gray-900 dark:text-gray-100">
                          $
                          {(
                            parseInt(toolResult.details.estimatedPrice) / 1e6
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {toolResult.details.baseAssetAmount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Base Amount:
                        </span>
                        <span className="font-mono text-xs text-gray-900 dark:text-gray-100">
                          {(
                            parseInt(toolResult.details.baseAssetAmount) / 1e9
                          ).toFixed(6)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Error display if simulation fails */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {error}
                  </p>
                </div>
              )}

              {/* CTA Button */}
              <button
                onClick={handleSignAndSend}
                disabled={isProcessing}
                className={`w-full px-4 py-3 ${
                  isProcessing
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                } text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none`}
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
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing Transaction...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    Sign & Send with Phantom
                  </>
                )}
              </button>
            </div>
          )}

          {/* Success state after transaction confirmed */}
          {txSignature && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                    Transaction Confirmed!
                  </p>
                  <a
                    href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    View on Solana Explorer
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                  </a>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-mono break-all">
                    {txSignature}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trade Details */}
          {toolResult.details && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Order Details
              </h4>
              <div className="space-y-1 text-sm">
                {toolResult.details.market && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Market:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {toolResult.details.market}
                    </span>
                  </div>
                )}
                {toolResult.details.side && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Side:
                    </span>
                    <span
                      className={`font-medium ${
                        toolResult.details.side === "long"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {toolResult.details.side.toUpperCase()}
                    </span>
                  </div>
                )}
                {toolResult.details.size && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Size:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {toolResult.details.size}
                    </span>
                  </div>
                )}
                {toolResult.details.leverage && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Leverage:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {toolResult.details.leverage}
                    </span>
                  </div>
                )}
                {toolResult.details.freeCollateralAfter && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Free Collateral After:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      $
                      {(
                        parseInt(toolResult.details.freeCollateralAfter) / 1e6
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Error State */
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                Trade Failed
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {toolResult?.message || "An unknown error occurred"}
              </p>

              {/* Show additional error details if available */}
              {toolResult?.details && (
                <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/40 rounded text-xs font-mono">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(toolResult.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
