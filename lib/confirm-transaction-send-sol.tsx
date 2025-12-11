import React, { useState } from "react";
import {
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { connection } from "./connection";
import { Transaction } from "@solana/web3.js";
import { useChat } from "@ai-sdk/react";

// Type definitions
type TransactionInstruction = {
  type: string;
  program: string;
  description: string;
};

type TransactionDetails = {
  from: string;
  to: string;
  amount: number;
  token: string;
  estimatedFee: string;
  mint?: string;
  decimals?: number;
  recipientAccountCreated?: boolean;
};

type TransactionData = {
  success: boolean;
  transactionType: "SOL_TRANSFER" | "SPL_TOKEN_TRANSFER";
  details: TransactionDetails;
  instructions: TransactionInstruction[];
  serializedTransaction: string;
  blockhash: string;
  lastValidBlockHeight: number;
  message: string;
};

type TransactionConfirmCardProps = {
  transactionData: TransactionData;
  isLoading?: boolean;
};

export const TransactionSendSolConfirmCard = ({
  transactionData,
  isLoading = false,
}: any) => {
  const [status, setStatus] = useState("pending"); // pending, signing, success, error
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const wallet = useWallet();
  const { messages, setMessages, addToolOutput } = useChat();
  console.log(transactionData);

  const handleConfirm = async () => {
    setStatus("signing");
    try {
      // Simulate transaction signing (replace with actual wallet integration)
      const txBuffer = Buffer.from(
        transactionData.serializedTransaction,
        "base64"
      );

      // ✅ Convert buffer → Transaction object
      const tx = Transaction.from(txBuffer);
      const signedTx = await wallet.signTransaction!(tx);

      // ✅ Send it
      const sig = await connection.sendRawTransaction(signedTx.serialize());
      setTxSignature(sig);
      setMessages([
        ...messages,
        {
          role: "assistant",
          parts: [
            {
              text: `Sol Sent Successfully `,
              type: "text",
            },
          ],
          id: "agent-log",
        },
      ]);
      addToolOutput({
        state: "output-available",
      });
      setStatus("success");
    } catch (error) {
      console.error("Transaction failed:", error);

      // Type-safe error handling
      let errorMessage = "Unknown error occurred";
      let errorDetails = null;

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // For Solana SendTransactionError with logs
      if (error && typeof error === "object" && "logs" in error) {
        const txError = error as any;
        errorMessage = txError.message || errorMessage;
        console.log(`error mess`, errorMessage);
        setMessages([...messages, ...(errorMessage as any)]);
        errorDetails = {
          logs: txError.logs,
          signature: txError.signature,
        };
      }
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  if (status === "success") {
    return (
      <div className="border-4 border-black bg-green-400 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-8 h-8" />
          <h2 className="text-2xl font-black uppercase">Transaction Sent!</h2>
        </div>
        <div className="bg-white border-4 border-black p-4 mb-4">
          <p className="font-mono text-sm break-all">{txSignature}</p>
        </div>
        <a
          href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 font-bold uppercase border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-transform"
        >
          View on Explorer
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="border-4 border-black bg-red-400 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-8 h-8" />
          <h2 className="text-2xl font-black uppercase">Transaction Failed</h2>
        </div>
        <p className="mb-4 font-bold">
          Something went wrong. Please try again.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setStatus("pending")}
            className="bg-black text-white px-6 py-3 font-bold uppercase border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-transform"
          >
            Try Again
          </button>
          <button
            // onClick={onCancel}
            className="bg-white px-6 py-3 font-bold uppercase border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-transform"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-4 border-black bg-yellow-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl">
      {/* Header */}
      <div className="bg-black text-white p-4 border-b-4 border-black">
        <h2 className="text-2xl font-black uppercase tracking-tight">
          ⚡ Confirm Transaction
        </h2>
      </div>

      {/* Transaction Details */}
      <div className="p-6 space-y-4">
        {/* Amount Display - Hero */}
        <div className="bg-white border-4 border-black p-6 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-sm font-black uppercase mb-2 text-gray-600">
            You're Sending
          </div>
          <div className="text-5xl font-black mb-1">
            {transactionData?.details?.amount}
          </div>
          <div className="text-2xl font-black uppercase">
            {transactionData?.details?.token}
          </div>
        </div>

        {/* From/To Addresses */}
        <div className="space-y-3">
          <div className="bg-white border-4 border-black p-4">
            <div className="text-xs font-black uppercase mb-2 text-gray-600">
              FROM
            </div>
            <div className="font-mono font-bold text-sm break-all">
              {truncateAddress(transactionData?.details?.from)}
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="w-6 h-6 font-bold" strokeWidth={3} />
          </div>

          <div className="bg-white border-4 border-black p-4">
            <div className="text-xs font-black uppercase mb-2 text-gray-600">
              TO
            </div>
            <div className="font-mono font-bold text-sm break-all">
              {truncateAddress(transactionData?.details?.to)}
            </div>
          </div>
        </div>

        {/* Transaction Info Grid */}
        <div className="bg-cyan-300 border-4 border-black p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-black uppercase mb-1">Type</div>
              <div className="font-bold text-sm">
                {transactionData.transactionType.replace("_", " ")}
              </div>
            </div>
            <div>
              <div className="text-xs font-black uppercase mb-1">Fee</div>
              <div className="font-bold text-sm">
                {transactionData.details.estimatedFee}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-purple-300 border-4 border-black p-4">
          <div className="text-xs font-black uppercase mb-2">Instructions</div>
          {transactionData.instructions.map((inst, idx) => (
            <div key={idx} className="flex items-start gap-2 mb-2 last:mb-0">
              <div className="bg-black text-white w-6 h-6 flex items-center justify-center font-black text-xs flex-shrink-0">
                {idx + 1}
              </div>
              <div className="font-bold text-sm">{inst.description}</div>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div className="bg-orange-300 border-4 border-black p-4 flex items-start gap-3">
          <AlertCircle
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            strokeWidth={3}
          />
          <p className="font-bold text-sm">
            Double-check the recipient address. This action cannot be undone!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleConfirm}
            disabled={status === "signing"}
            className="flex-1 bg-black text-white px-6 py-4 font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {status === "signing" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                Sign & Send
                <ArrowRight className="w-5 h-5" strokeWidth={3} />
              </>
            )}
          </button>

          <button
            // onClick={onCancel}
            disabled={status === "signing"}
            className="bg-white px-6 py-4 font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
