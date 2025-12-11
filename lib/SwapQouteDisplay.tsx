import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  TrendingUp,
  Info,
  ChevronDown,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

interface SwapQuoteData {
  success: boolean;
  pair: string;
  inputAmount: number;
  network: string;
  networkInfo: string;
  bestDex: string;
  bestOutputAmount: string;
  recommendation: string;
  quotes: Array<{
    rank: number;
    dex: string;
    outputAmount: string;
    route: string;
    quoteId: string;
  }>;
  executionData?: {
    rawQuote?: {
      priceImpactPct: string;
      swapUsdValue: string;
    };
    fromToken?: string;
    toToken?: string;
  };
}

const TokenIcon = ({ mint }: { mint?: string }) => {
  if (!mint)
    return (
      <div className="w-8 h-8 rounded-full bg-gray-300 border border-black" />
    );

  // Simple mapping for demo purposes
  const isSol = mint.includes("So111");
  const isUsdt = mint.includes("Es9vM");
  const isUsdc = mint.includes("EPjFW");

  return (
    <div
      className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-bold text-[10px]
      ${
        isSol
          ? "bg-purple-400"
          : isUsdt
          ? "bg-green-400"
          : isUsdc
          ? "bg-blue-400"
          : "bg-gray-200"
      }
    `}
    >
      {isSol ? "SOL" : isUsdt ? "USDT" : isUsdc ? "USDC" : "?"}
    </div>
  );
};

const getTokenSymbol = (mint?: string) => {
  if (!mint) return "TOKEN";
  if (mint.includes("So111")) return "SOL";
  if (mint.includes("Es9vM")) return "USDT";
  if (mint.includes("EPjFW")) return "USDC";
  return "UNKNOWN";
};

export const SwapQuoteDisplay = ({ data }: { data: SwapQuoteData }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Extract tokens from executionData or fallback
  const inputMint = data.executionData?.fromToken;
  const outputMint = data.executionData?.toToken;

  return (
    <div className="w-full">
      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden"
      >
        {/* Header - Network & Best DEX */}
        <div className="bg-yellow-300 border-b-2 border-black p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-black text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
              {data.network}
            </div>
            <span className="text-xs font-bold uppercase flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Best Route Found
            </span>
          </div>
          <div className="text-xs font-black uppercase text-blue-800">
            via {data.bestDex}
          </div>
        </div>

        {/* Swap Visualizer */}
        <div className="p-5">
          <div className="flex items-center justify-between gap-2 mb-6">
            {/* From */}
            <div className="flex flex-col items-center gap-2 flex-1 p-2 bg-gray-50 border-2 border-black rounded-lg">
              <TokenIcon mint={inputMint} />
              <div className="text-center">
                <div className="text-xl font-black text-black leading-none">
                  {data.inputAmount}
                </div>
                <div className="text-xs font-bold text-gray-500 mt-1">
                  {getTokenSymbol(inputMint)}
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center justify-center">
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="w-6 h-6 text-black stroke-[3px]" />
              </motion.div>
              <div className="mt-1 bg-green-100 text-[10px] font-bold px-1 border border-black rounded">
                {data.executionData?.rawQuote?.priceImpactPct || "0"}% Impact
              </div>
            </div>

            {/* To */}
            <div className="flex flex-col items-center gap-2 flex-1 p-2 bg-green-50 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <TokenIcon mint={outputMint} />
              <div className="text-center">
                <div className="text-xl font-black text-black leading-none">
                  {parseFloat(data.bestOutputAmount).toFixed(4)}
                </div>
                <div className="text-xs font-bold text-gray-500 mt-1">
                  {getTokenSymbol(outputMint)}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation Banner */}
          <div className="mb-4 bg-blue-50 border-2 border-black p-3 rounded flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-black leading-tight">
                {data.recommendation}
              </p>
              {data.executionData?.rawQuote?.swapUsdValue && (
                <p className="text-xs font-mono text-gray-600 mt-1">
                  ≈ $
                  {parseFloat(data.executionData.rawQuote.swapUsdValue).toFixed(
                    2
                  )}{" "}
                  USD
                </p>
              )}
            </div>
          </div>

          {/* Action Button */}
          <button className="w-full bg-black text-white font-black uppercase py-3 rounded-lg shadow-[3px_3px_0px_0px_rgba(100,100,100,1)] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all active:bg-gray-800 flex items-center justify-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Execute Swap
          </button>
        </div>

        {/* Accordion for Details */}
        <div className="border-t-2 border-black">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <span>Route Details</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                showDetails ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden bg-white"
              >
                <div className="p-4 space-y-3">
                  {data.quotes.map((quote, idx) => (
                    <div
                      key={quote.quoteId}
                      className="flex items-start gap-3 text-sm border-b border-gray-200 last:border-0 pb-2 last:pb-0"
                    >
                      <div className="bg-black text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold uppercase">
                            {quote.dex}
                          </span>
                          <span className="font-mono bg-green-100 px-1 rounded text-green-800 border border-green-300">
                            {parseFloat(quote.outputAmount).toFixed(6)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 break-words">
                          Route: {quote.route}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
