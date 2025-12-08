"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Wallet,
  Zap,
  TrendingUp,
  Activity,
  ChevronDown,
  Check,
  Loader2,
  RotateCw,
  Copy,
} from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { UIDataTypes, UIMessage, UITools } from "ai";

// Animated Background
const AnimatedBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden bg-gray-50">
    {/* Floating Blobs */}
    <motion.div
      className="absolute top-20 left-20 w-96 h-96 bg-blue-700/5 rounded-full blur-3xl"
      animate={{
        x: [0, 100, 0],
        y: [0, -50, 0],
        scale: [1, 1.2, 1],
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute bottom-20 right-20 w-96 h-96 bg-blue-700/5 rounded-full blur-3xl"
      animate={{
        x: [0, -100, 0],
        y: [0, 50, 0],
        scale: [1, 1.3, 1],
      }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
    />
  </div>
);

// Header Component
const Header = () => {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 15, stiffness: 200 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200"
    >
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-700/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo Section */}
        <motion.div
          className="flex items-center gap-3"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <div className="relative">
            <motion.div
              className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-900 rounded-lg flex items-center justify-center"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Zap className="w-6 h-6 text-white" />
            </motion.div>
            <motion.div
              className="absolute inset-0 bg-blue-700/30 rounded-lg blur-md"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Solana AI Agent</h1>
            <p className="text-xs text-gray-600">
              Intelligent Trading Assistant
            </p>
          </div>
        </motion.div>

        {/* Status Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100/80 rounded-full border border-gray-200"
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-green-500"
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-sm text-gray-700">Connected to Devnet</span>
        </motion.div>

        {/* Wallet Button */}
        {/* <motion.button
          onClick={() => setIsConnected(!isConnected)}
          whileHover={{
            scale: 1.05,
            boxShadow: "0 0 20px rgba(29, 78, 216, 0.5)",
          }}
          whileTap={{ scale: 0.95 }}
          className={`px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
            isConnected
              ? "bg-gradient-to-r from-green-600 to-green-700 text-white"
              : "bg-gradient-to-r from-blue-700 to-blue-800 text-white"
          }`}
        >
          <Wallet className="w-4 h-4" />
          {isConnected ? "Wallet Connected" : "Connect Wallet"}
        </motion.button> */}
        <WalletMultiButton
          style={{
            borderRadius: "28px",
            background:
              "linear-gradient(135deg, rgba(49, 158, 216, 0.9) 0%, rgba(30, 58, 138, 0.95) 100%)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
          }}
        />
      </div>
    </motion.header>
  );
};

import ReactMarkdown from "react-markdown";
import MessageComponent from "./components/message";
import { Button } from "@/components/ui/button";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { Transaction } from "@solana/web3.js";
import { PerpTradeHandler } from "@/lib/perp-trader-handler";

function ChatBubble({
  message,
  isUser,
  index,
  handleSendMessage,
}: {
  message: {
    message: UIMessage<unknown, UIDataTypes, UITools>;
    role: "user" | "assistant" | "system";
  };
  isUser: boolean;
  index: number;
  handleSendMessage: any;
}) {
  const reSendMessage = async (prompt: string) => {
    await handleSendMessage(prompt);
  };

  const wallet = useWallet();
  const connection = new Connection(clusterApiUrl("devnet"));
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`max-w-2xl px-6 py-3 relative overflow-hidden shadow-xl ${
        isUser ? "ml-12" : "mr-12"
      }`}
      style={{
        borderRadius: "28px",
        background: isUser
          ? "linear-gradient(135deg, rgba(49, 158, 216, 0.9) 0%, rgba(30, 58, 138, 0.95) 100%)"
          : "linear-gradient(135deg, rgba(249, 250, 251, 0.85) 0%, rgba(243, 244, 246, 0.9) 100%)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      {/* Dynamic border - stronger in center, faded at corners */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: "28px",
          padding: "2px",
          background: isUser
            ? "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.1) 100%)"
            : "linear-gradient(135deg, rgba(156, 163, 175, 0.2) 0%, rgba(156, 163, 175, 0.5) 50%, rgba(156, 163, 175, 0.2) 100%)",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      {/* Darker gradient overlays in corners */}
      {/* Top-left corner */}
      <div
        className="absolute top-0 left-0 w-24 h-24 pointer-events-none opacity-40"
        style={{
          background: isUser
            ? "radial-gradient(circle at top left, rgba(0, 0, 0, 0.3) 0%, transparent 70%)"
            : "radial-gradient(circle at top left, rgba(107, 114, 128, 0.15) 0%, transparent 70%)",
          borderTopLeftRadius: "28px",
        }}
      />

      {/* Top-right corner */}
      <div
        className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-40"
        style={{
          background: isUser
            ? "radial-gradient(circle at top right, rgba(0, 0, 0, 0.3) 0%, transparent 70%)"
            : "radial-gradient(circle at top right, rgba(107, 114, 128, 0.15) 0%, transparent 70%)",
          borderTopRightRadius: "28px",
        }}
      />

      {/* Bottom-left corner */}
      <div
        className="absolute bottom-0 left-0 w-24 h-24 pointer-events-none opacity-30"
        style={{
          background: isUser
            ? "radial-gradient(circle at bottom left, rgba(0, 0, 0, 0.25) 0%, transparent 70%)"
            : "radial-gradient(circle at bottom left, rgba(107, 114, 128, 0.12) 0%, transparent 70%)",
          borderBottomLeftRadius: "28px",
        }}
      />

      {/* Bottom-right corner */}
      <div
        className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none opacity-30"
        style={{
          background: isUser
            ? "radial-gradient(circle at bottom right, rgba(0, 0, 0, 0.25) 0%, transparent 70%)"
            : "radial-gradient(circle at bottom right, rgba(107, 114, 128, 0.12) 0%, transparent 70%)",
          borderBottomRightRadius: "28px",
        }}
      />

      {/* Glass shimmer effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isUser
            ? "linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%, rgba(255, 255, 255, 0.08) 100%)"
            : "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, transparent 50%, rgba(255, 255, 255, 0.2) 100%)",
        }}
      />

      {/* Top highlight for glass effect */}
      <div
        className="absolute top-0 left-8 right-8 h-px opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent)",
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`text-xs font-bold tracking-wide ${
              isUser ? "text-white/90" : "text-gray-700"
            }`}
          >
            {isUser ? "You" : "AI Agent"}
          </span>
          {!isUser && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Zap className="w-3.5 h-3.5 text-blue-600" />
            </motion.div>
          )}
        </div>

        {/* Conditional rendering: Markdown for AI, plain text for User */}
        <div
          className={`text-sm leading-relaxed prose prose-sm max-w-none ${
            isUser ? "text-white prose-invert" : "text-gray-800"
          }`}
        >
          {isUser ? (
            // 🧍 USER MESSAGE
            <p className="m-0">
              {message.message.parts
                .filter((data) => data.type === "text")
                .map((dataa) => dataa.text)
                .join(" ")}
            </p>
          ) : (
            // 🤖 AI AGENT MESSAGE
            <div className="flex flex-col gap-3">
              {/* 1️⃣ Render AI normal text parts */}
              <ReactMarkdown>
                {message.message.parts
                  .filter((data) => data.type === "text")
                  .map((dataa) => dataa.text)
                  .join(" ")}
              </ReactMarkdown>

              {/* 2️⃣ Render Tool Outputs */}
              {message.message.parts
                .filter(
                  (part) =>
                    part.type?.startsWith("tool-") &&
                    // @ts-ignore
                    part.state === "output-available" &&
                    // @ts-ignore
                    part.output
                )
                .map((part, i) => {
                  const toolName = part.type.replace("tool-", "");
                  // @ts-ignore
                  const output = part.output;
                  console.log(output);
                  // @ts-ignore
                  const toolResult = part.output;
                  return (
                    <div
                      key={i}
                      className="p-4 border border-blue-200 bg-blue-50/70 rounded-xl backdrop-blur-sm shadow-sm"
                    >
                      {toolName === "get_wallet_balance" && output && (
                        <div className="text-sm text-gray-800">
                          <p className="font-semibold mb-3 text-lg">
                            💰 Wallet Balances
                          </p>

                          {/* Show SOL balance */}
                          {output.balances?.SOL && (
                            <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">◎</span>
                                <div>
                                  <p className="text-xs text-gray-600 uppercase">
                                    Solana
                                  </p>
                                  <p className="font-bold text-lg">
                                    {typeof output.balances.SOL === "object"
                                      ? output.balances.SOL.balance
                                      : output.balances.SOL}{" "}
                                    SOL
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Show SPL Tokens */}
                          {Array.isArray(output.balances?.tokens) &&
                            output.balances.tokens.length > 0 && (
                              <div className="mt-4">
                                <p className="font-semibold mb-3 flex items-center gap-2">
                                  <span className="text-lg">🪙</span>
                                  Top SPL Tokens
                                  {output.totalTokens > 5 && (
                                    <span className="text-xs text-gray-500">
                                      (showing top 5 of {output.totalTokens})
                                    </span>
                                  )}
                                </p>

                                <div className="space-y-3">
                                  {output.balances.tokens.map((token, i) => (
                                    <div
                                      key={token.mint || i}
                                      className="p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                                    >
                                      <div className="flex items-start gap-3">
                                        {/* Token Image */}
                                        {token.image ? (
                                          <img
                                            src={token.image}
                                            alt={token.name || token.symbol}
                                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                                            onError={(e) => {
                                              e.currentTarget.src =
                                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='monospace' font-size='20' fill='%239ca3af'%3E?%3C/text%3E%3C/svg%3E";
                                            }}
                                          />
                                        ) : (
                                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0">
                                            <span className="text-gray-500 font-bold">
                                              {token.symbol?.charAt(0) || "?"}
                                            </span>
                                          </div>
                                        )}

                                        {/* Token Info */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-baseline gap-2 mb-1">
                                            <h3 className="font-semibold text-base truncate">
                                              {token.name || "Unknown Token"}
                                            </h3>
                                            <span className="text-xs text-gray-500 font-mono">
                                              {token.symbol || "???"}
                                            </span>
                                          </div>

                                          {/* Balance */}
                                          <p className="font-bold text-lg text-gray-900 mb-1">
                                            {token.balance.toLocaleString(
                                              undefined,
                                              {
                                                maximumFractionDigits:
                                                  token.decimals || 6,
                                              }
                                            )}
                                          </p>

                                          {/* Description */}
                                          {token.description && (
                                            <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                                              {token.description}
                                            </p>
                                          )}

                                          {/* Mint Address */}
                                          <div className="mt-2 flex items-center gap-2">
                                            <span className="text-xs text-gray-400">
                                              Mint:
                                            </span>
                                            <code className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                              {token.mint.slice(0, 4)}...
                                              {token.mint.slice(-4)}
                                            </code>
                                            <button
                                              onClick={() => {
                                                navigator.clipboard.writeText(
                                                  token.mint
                                                );
                                              }}
                                              className="text-xs text-blue-500 hover:text-blue-700"
                                              title="Copy mint address"
                                            >
                                              📋
                                            </button>
                                          </div>

                                          {/* Metadata URI */}
                                          {token.uri && (
                                            <a
                                              href={token.uri}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-xs text-blue-500 hover:text-blue-700 mt-1 inline-block"
                                            >
                                              View Metadata →
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          {/* No tokens found */}
                          {Array.isArray(output.balances?.tokens) &&
                            output.balances.tokens.length === 0 && (
                              <p className="text-gray-500 italic mt-3">
                                No SPL tokens found in this wallet
                              </p>
                            )}

                          {/* Render ANY markdown coming from the tool */}
                          {output.markdown && (
                            <div className="mt-4 prose prose-sm max-w-none">
                              <ReactMarkdown>{output.markdown}</ReactMarkdown>
                            </div>
                          )}

                          {/* Handle errors gracefully */}
                          {output.error && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-red-700 text-sm">
                                ⚠️ {output.error}
                              </p>
                            </div>
                          )}

                          {/* Success indicator */}
                          {output.success && !output.error && (
                            <p className="text-xs text-green-600 mt-3 flex items-center gap-1">
                              <span>✓</span> Successfully fetched wallet data
                            </p>
                          )}
                        </div>
                      )}

                      {toolName === "get_best_swap_price" && (
                        <div className="text-sm text-gray-800">
                          <p className="font-semibold text-blue-800 mb-1">
                            🔄 Best Swap Route
                          </p>
                          <div className="flex flex-col gap-1 bg-white/70 border border-blue-100 rounded-xl p-3 shadow-sm">
                            <p>
                              Pair:{" "}
                              <span className="font-medium text-gray-900">
                                {output.pair}
                              </span>
                            </p>
                            <p>
                              Route:{" "}
                              <span className="font-medium text-blue-700">
                                {output.route}
                              </span>
                            </p>
                            <p>
                              Best Price:{" "}
                              <span className="font-semibold text-gray-900">
                                {output.bestPrice}
                              </span>
                            </p>
                          </div>
                        </div>
                      )}

                      {toolName === "send_tokens" && (
                        <div className="text-sm text-gray-800 bg-green-50 border border-green-200 p-3 rounded-xl">
                          <p className="font-semibold text-green-700 mb-1">
                            📤 Token Sent
                          </p>
                          <p>
                            {output.amount} {output.token} →{" "}
                            <span className="font-mono text-gray-900">
                              {output.toAddress}
                            </span>
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Tx Signature:{" "}
                            {output.signature || "Simulated (devnet)"}
                          </p>
                        </div>
                      )}

                      {toolName === "get_recent_transactions" && (
                        <div className="text-sm">
                          <p className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="text-lg">🧾</span>
                            Recent Transactions
                          </p>
                          <ul
                            className="divide-y divide-gray-200/50 rounded-[20px] overflow-hidden shadow-xl relative"
                            style={{
                              background:
                                "linear-gradient(135deg, rgba(249, 250, 251, 0.85) 0%, rgba(243, 244, 246, 0.9) 100%)",
                              backdropFilter: "blur(20px) saturate(180%)",
                              WebkitBackdropFilter: "blur(20px) saturate(180%)",
                            }}
                          >
                            {/* Dynamic border - stronger in center, faded at corners */}
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                borderRadius: "20px",
                                padding: "2px",
                                background:
                                  "linear-gradient(135deg, rgba(156, 163, 175, 0.2) 0%, rgba(156, 163, 175, 0.5) 50%, rgba(156, 163, 175, 0.2) 100%)",
                                WebkitMask:
                                  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                                WebkitMaskComposite: "xor",
                                maskComposite: "exclude",
                              }}
                            />

                            {/* Corner gradients */}
                            <div
                              className="absolute top-0 left-0 w-20 h-20 pointer-events-none opacity-40"
                              style={{
                                background:
                                  "radial-gradient(circle at top left, rgba(107, 114, 128, 0.15) 0%, transparent 70%)",
                                borderTopLeftRadius: "20px",
                              }}
                            />
                            <div
                              className="absolute top-0 right-0 w-20 h-20 pointer-events-none opacity-40"
                              style={{
                                background:
                                  "radial-gradient(circle at top right, rgba(107, 114, 128, 0.15) 0%, transparent 70%)",
                                borderTopRightRadius: "20px",
                              }}
                            />
                            <div
                              className="absolute bottom-0 left-0 w-20 h-20 pointer-events-none opacity-30"
                              style={{
                                background:
                                  "radial-gradient(circle at bottom left, rgba(107, 114, 128, 0.12) 0%, transparent 70%)",
                                borderBottomLeftRadius: "20px",
                              }}
                            />
                            <div
                              className="absolute bottom-0 right-0 w-20 h-20 pointer-events-none opacity-30"
                              style={{
                                background:
                                  "radial-gradient(circle at bottom right, rgba(107, 114, 128, 0.12) 0%, transparent 70%)",
                                borderBottomRightRadius: "20px",
                              }}
                            />

                            {/* Glass shimmer */}
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                background:
                                  "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, transparent 50%, rgba(255, 255, 255, 0.2) 100%)",
                              }}
                            />

                            {/* Top highlight */}
                            <div
                              className="absolute top-0 left-6 right-6 h-px opacity-60"
                              style={{
                                background:
                                  "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent)",
                              }}
                            />

                            {(output.transactions || []).map(
                              (tx: any, i: number) => (
                                <li
                                  key={i}
                                  className="p-4 hover:bg-white/50 transition-colors duration-200 relative z-10"
                                >
                                  <p className="font-semibold text-gray-900 mb-1">
                                    Type: {tx.type}
                                  </p>
                                  <p className="text-xs text-gray-600 mb-0.5">
                                    Amount:{" "}
                                    <span className="font-medium">
                                      {tx.amount}
                                    </span>
                                  </p>
                                  <p className="text-xs text-gray-500 font-mono truncate">
                                    Signature: {tx.signature}
                                  </p>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                      {toolName === "get_portfolio_summary" && (
                        <div className="text-sm">
                          <p className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="text-lg">📊</span>
                            Portfolio Summary
                          </p>
                          <div
                            className="rounded-[20px] p-5 shadow-xl relative overflow-hidden"
                            style={{
                              background:
                                "linear-gradient(135deg, rgba(249, 250, 251, 0.85) 0%, rgba(243, 244, 246, 0.9) 100%)",
                              backdropFilter: "blur(20px) saturate(180%)",
                              WebkitBackdropFilter: "blur(20px) saturate(180%)",
                            }}
                          >
                            {/* Dynamic border - stronger in center, faded at corners */}
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                borderRadius: "20px",
                                padding: "2px",
                                background:
                                  "linear-gradient(135deg, rgba(156, 163, 175, 0.2) 0%, rgba(156, 163, 175, 0.5) 50%, rgba(156, 163, 175, 0.2) 100%)",
                                WebkitMask:
                                  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                                WebkitMaskComposite: "xor",
                                maskComposite: "exclude",
                              }}
                            />

                            {/* Corner gradients */}
                            <div
                              className="absolute top-0 left-0 w-20 h-20 pointer-events-none opacity-40"
                              style={{
                                background:
                                  "radial-gradient(circle at top left, rgba(107, 114, 128, 0.15) 0%, transparent 70%)",
                                borderTopLeftRadius: "20px",
                              }}
                            />
                            <div
                              className="absolute top-0 right-0 w-20 h-20 pointer-events-none opacity-40"
                              style={{
                                background:
                                  "radial-gradient(circle at top right, rgba(107, 114, 128, 0.15) 0%, transparent 70%)",
                                borderTopRightRadius: "20px",
                              }}
                            />
                            <div
                              className="absolute bottom-0 left-0 w-20 h-20 pointer-events-none opacity-30"
                              style={{
                                background:
                                  "radial-gradient(circle at bottom left, rgba(107, 114, 128, 0.12) 0%, transparent 70%)",
                                borderBottomLeftRadius: "20px",
                              }}
                            />
                            <div
                              className="absolute bottom-0 right-0 w-20 h-20 pointer-events-none opacity-30"
                              style={{
                                background:
                                  "radial-gradient(circle at bottom right, rgba(107, 114, 128, 0.12) 0%, transparent 70%)",
                                borderBottomRightRadius: "20px",
                              }}
                            />

                            {/* Glass shimmer */}
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                background:
                                  "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, transparent 50%, rgba(255, 255, 255, 0.2) 100%)",
                              }}
                            />

                            {/* Top highlight */}
                            <div
                              className="absolute top-0 left-6 right-6 h-px opacity-60"
                              style={{
                                background:
                                  "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent)",
                              }}
                            />

                            <div className="relative z-10">
                              <p className="mb-2 bg-gray-300 text-xs rounded-full px-2 ">
                                Wallet:
                                <span className="font-mono  text-sm text-black font-semibold">
                                  {output.walletAddress}
                                </span>
                              </p>
                              <Button className="font-bold text-base bg-green-700 text-white mb-4">
                                Net Worth: ${output.netWorthUSD}
                              </Button>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                  <thead>
                                    <tr className="text-gray-600 border-b-2 border-gray-300/50">
                                      <th className="pb-2 font-semibold">
                                        Token
                                      </th>
                                      <th className="pb-2 font-semibold">
                                        Balance
                                      </th>
                                      <th className="pb-2 font-semibold">
                                        Value (USD)
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(output.tokens || []).map((token: any) => (
                                      <tr
                                        key={token.symbol}
                                        className="border-b border-gray-200/50 hover:bg-white/40 transition-colors"
                                      >
                                        <td className="py-2 font-semibold text-gray-900">
                                          {token.symbol}
                                        </td>
                                        <td className="py-2 text-gray-700 font-semibold">
                                          {token.balance}
                                        </td>
                                        <td className="py-2 text-green-700 font-semibold ">
                                          ${token.valueUSD}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {toolName === "open_perp_trade" && (
                        <PerpTradeHandler
                          toolName="open_perp_trade"
                          toolResult={toolResult}
                        />
                      )}

                      {/* 3️⃣ Generic fallback for unknown tools */}
                      {![
                        "get_wallet_balance",
                        "get_best_swap_price",
                        "send_tokens",
                        "get_recent_transactions",
                        "get_portfolio_summary",
                        "open_perp_trade",
                      ].includes(toolName) && (
                        <ReactMarkdown>
                          {message.message.parts
                            .filter((data) => data.type === "text")
                            .map((dataa) => dataa.text)
                            .join(" ")}
                        </ReactMarkdown>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
      {isUser && (
        <div className="flex gap-2 justify-end mt-2">
          <div>
            {" "}
            <RotateCw
              color="white"
              onClick={async () =>
                reSendMessage(
                  message.message.parts
                    .filter((data) => data.type === "text")
                    .map((dataa) => dataa.text)
                    .join(" ")
                )
              }
              size={19}
              className="cursor-pointer hover:scale-110"
            />{" "}
          </div>
          <div>
            {" "}
            <Copy
              onClick={() => {
                navigator.clipboard.writeText(
                  message.message.parts
                    .filter((data) => data.type === "text")
                    .map((dataa) => dataa.text)
                    .join(" ")
                );
              }}
              color={`${isUser ? "white" : "black"}`}
              size={19}
              className="cursor-pointer hover:scale-110"
            />{" "}
          </div>
        </div>
      )}
    </motion.div>
  );
}
// Chat Message Component
const ChatMessage = ({
  message,
  index,
  role,
  type = false,
  handleSendMessage,
}: {
  message: {
    message: UIMessage<unknown, UIDataTypes, UITools>;
    role: "user" | "assistant" | "system";
  };
  index: number;
  role: "user" | "assistant" | "system";
  type: boolean;
  handleSendMessage: any;
}) => {
  const isUser = role === "user";
  const isLog = type;

  console.log(`message data`, {
    message,
    index,
    role,
    type,
  });

  if (isLog) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="mb-3 px-4"
      >
        <div className="max-w-4xl">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200/50">
            <Activity className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-semibold text-blue-700">
                  AGENT LOG
                </span>
                <span className="text-xs text-gray-500">
                  {/* {message.timestamp || new Date().toLocaleTimeString()} */}
                </span>
              </div>
              <p className="text-sm font-mono text-gray-700 leading-relaxed">
                {message.message.parts
                  .filter((data) => data.type == "text")
                  .map((dataa) => dataa.text)
                  .join()}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{
        x: isUser ? 100 : -100,
        opacity: 0,
      }}
      animate={{
        x: 0,
        opacity: 1,
      }}
      transition={{
        type: "spring",
        damping: 15,
        stiffness: 200,
        delay: index * 0.1,
      }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 px-4`}
    >
      <ChatBubble
        isUser={isUser}
        message={message}
        index={index}
        handleSendMessage={handleSendMessage}
      />
    </motion.div>
  );
};

// Chat Thread Component
const ChatThread = ({
  chat_messages,
  handleSendMessage,
}: {
  chat_messages: UIMessage<unknown, UIDataTypes, UITools>[];
  handleSendMessage: any;
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat_messages]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex-1 overflow-hidden"
    >
      <div
        ref={scrollRef}
        className="h-full scroll-gradient overflow-y-auto px-6 py-4 "
      >
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          {
            <MessageComponent message="Welcome! I'm your Solana AI Agent. I can help you swap tokens, stake SOL, analyze your portfolio, and execute on-chain actions. What would you like to do?" />
          }
          {chat_messages
            .map((message) => ({
              message: message,
              role: message.role,
            }))
            .filter((message) =>
              message?.message?.parts?.filter((d) => d.type == "text")
            )
            .map((messageObj, index) => (
              <ChatMessage
                key={index}
                message={messageObj}
                role={messageObj.role}
                index={index}
                type={false}
                handleSendMessage={handleSendMessage}
              />
            ))}
        </div>
      </div>
    </motion.div>
  );
};

// Sidebar Component
const Sidebar = ({ isOpen, onToggle }) => {
  const stats = [
    { label: "SOL Balance", value: "24.56", icon: Wallet, trend: "+5.2%" },
    {
      label: "Total Value",
      value: "$2,845",
      icon: TrendingUp,
      trend: "+12.4%",
    },
    { label: "Active Trades", value: "3", icon: Activity, trend: "Live" },
  ];

  const quickActions = ["Swap", "Stake", "Portfolio", "Analyze"];

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ left: isOpen ? "20rem" : "0.5rem" }}
        className={` fixed  top-20 z-50 p-3 bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-shadow  `}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 -rotate-90 " />
        </motion.div>
      </motion.button>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed left-0 top-16 bottom-0 w-80 bg-white/70 backdrop-blur-md border-r border-gray-200 p-6 overflow-y-auto z-40"
          >
            {/* Balance Cards */}
            <div className="space-y-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">
                Wallet Overview
              </h3>
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="relative p-4 rounded-xl bg-white/60 border border-blue-100 overflow-hidden group"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-blue-700/0 to-blue-700/5 opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={false}
                  />
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                      <span className="text-xs text-green-600">
                        {stat.trend}
                      </span>
                    </div>
                    <stat.icon className="w-8 h-8 text-blue-700/40" />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: "rgba(29, 78, 216, 0.1)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-3 rounded-lg bg-gray-100/80 border border-gray-200 text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors"
                  >
                    {action}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Agent Status */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-transparent border border-blue-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-4 h-4 text-blue-700" />
                </motion.div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Agent Status
                </h4>
              </div>
              <p className="text-xs text-gray-600">Ready to execute commands</p>
              <div className="mt-2 text-xs text-gray-500">
                Mode: Trading Assistant
              </div>
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

// Prompt Input Component
const PromptInput = ({
  onSend,
  wallet,
}: {
  onSend: any;
  wallet: WalletContextState;
}) => {
  const [input, setInput] = useState("");
  const [showActions, setShowActions] = useState(false);

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.4 }}
      className="sticky bottom-0  backdrop-blur-xl border-t border-gray-200 p-6"
    >
      {/* Decorative particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-500 rounded-full"
            style={{
              left: `${20 + i * 20}%`,
              bottom: "20px",
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      <div className="max-w-5xl mx-auto relative">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              borderRadius: "28px",
              background:
                "linear-gradient(135deg, rgba(249, 250, 251, 0.85) 0%, rgba(243, 244, 246, 0.9) 100%)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
            }}
            placeholder="Ask Solana AI to swap, stake, analyze..."
            className="w-full px-6 py-4 pr-32  border border-gray-300 rounded-2xl text-blue-900 font-semibold placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-700/50 focus:bg-white transition-all resize-none"
            rows={2}
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <motion.button
              onClick={() => setShowActions(!showActions)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-gray-200/80 hover:bg-gray-300/80 transition-colors"
            >
              <ChevronDown
                className={`w-4 h-4 text-gray-700 transition-transform ${
                  showActions ? "rotate-180" : ""
                }`}
              />
            </motion.button>

            <motion.button
              onClick={handleSend}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 15px rgba(29, 78, 216, 0.5)",
              }}
              style={{
                borderRadius: "28px",
                background:
                  "linear-gradient(135deg, rgba(49, 158, 216, 0.9) 0%, rgba(30, 58, 138, 0.95) 100%)",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
              }}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </motion.button>
          </div>
        </div>

        {/* Quick Actions Dropdown */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-full mb-2 left-0 right-0 p-3 bg-white/90 backdrop-blur-md rounded-xl border border-gray-200"
            >
              <div className="grid grid-cols-3 gap-2">
                {["Swap Tokens", "Stake SOL", "Portfolio Analysis"].map(
                  (action) => (
                    <motion.button
                      key={action}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setInput(action);
                        setShowActions(false);
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-blue-700 hover:text-white rounded-lg text-sm text-gray-700 transition-colors"
                    >
                      {action}
                    </motion.button>
                  )
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Agent Status Bar Component
const AgentStatusBar = ({ status, show }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40"
        >
          <motion.div
            className="px-6 py-3 bg-blue-700/80 backdrop-blur-md rounded-xl shadow-2xl flex items-center gap-3"
            animate={{
              boxShadow: [
                "0 0 20px rgba(29, 78, 216, 0.3)",
                "0 0 30px rgba(29, 78, 216, 0.5)",
                "0 0 20px rgba(29, 78, 216, 0.3)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {status.loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-5 h-5 text-white" />
              </motion.div>
            ) : (
              <Check className="w-5 h-5 text-green-300" />
            )}
            <p className="text-white font-mono text-sm">{status.message}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Footer Component
const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="bg-white/60 backdrop-blur-sm py-3 text-center border-t border-gray-200"
    >
      <motion.p
        whileHover={{ color: "#1d4ed8" }}
        className="text-xs text-gray-600 transition-colors"
      >
        Running on Devnet | Solana AI Agent v0.1
      </motion.p>
    </motion.footer>
  );
};

// Main App Component
export default function SolanaAIAgentDashboard() {
  // const [messages, setMessages] = useState([
  //   {
  //     role: "agent",
  //     content:
  //       "Welcome! I'm your Solana AI Agent. I can help you swap tokens, stake SOL, analyze your portfolio, and execute on-chain actions. What would you like to do?",
  //   },
  // ]);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [agentStatus, setAgentStatus] = useState({
    show: false,
    message: "",
    loading: false,
  });

  const {
    resumeStream,
    messages: chat_messages,
    sendMessage,
    setMessages,
    status,
  } = useChat();
  const wallet = useWallet();

  const handleSendMessage = async (content: string) => {
    // Add user message
    // setMessages((prev) => [...prev, { role: "user", content }]);
    let timeoutId;

    switch (status) {
      case "ready":
        setAgentStatus({
          show: true,
          message: "Agent Ready...",
          loading: false,
        });
        break;

      case "submitted":
        setAgentStatus({
          show: true,
          message: "Processing your request...",
          loading: true,
        });
        break;

      case "streaming":
        setAgentStatus({
          show: true,
          message: "Generating response...",
          loading: true,
        });
        break;

      case "error":
        // Show error first
        setAgentStatus({
          show: true,
          message: "An error occurred. Please try again.",
          loading: false,
        });

        // Hide after 3 seconds
        timeoutId = setTimeout(() => {
          setAgentStatus({
            show: false,
            message: "",
            loading: false,
          });
        }, 3000);

        break;
      default:
        // Treat unknown as idle
        setAgentStatus({
          show: false,
          message: "",
          loading: false,
        });
        break;
    }

    // Show agent status

    // Add initial log
    setTimeout(() => {
      // addLog("Initializing transaction...", "Connecting to Solana Devnet RPC");
    }, 500);

    // Add processing log
    setTimeout(() => {
      // addLog("Analyzing request parameters", "Parsing: " + content);
    }, 1500);

    // Add execution log
    setTimeout(() => {
      // addLog(
      //   "Executing on-chain transaction",
      //   "TX Hash: 5j7k8m9n0p1q2r3s4t5u6v7w8x9y0z"
      // );
    }, 2500);
    sendMessage(
      { text: content },
      {
        body: {
          walletAddress: wallet.connected ? wallet.publicKey : null,
        },
        metadata: {
          walletProvided: wallet.connected,
        },
      }
    );
  };
  console.log(chat_messages[0]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-linear-to-tr  from-gray-50 via-gray-300 to-gray-50">
      <AnimatedBackground />
      <Header />

      <div className="flex-1 flex mt-16 overflow-hidden w-full max-w-[1300px] mx-auto ">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div
          className={`flex-1 flex flex-col  transition-all duration-300 ${
            sidebarOpen ? "ml-20" : "ml-0"
          }`}
        >
          <ChatThread
            chat_messages={chat_messages}
            handleSendMessage={handleSendMessage}
          />
          <PromptInput onSend={handleSendMessage} wallet={wallet} />
        </div>
      </div>

      <AgentStatusBar status={agentStatus} show={agentStatus.show} />
      <Footer />
    </div>
  );
}
