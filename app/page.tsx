"use client";
import { useState, useRef, useEffect, JSX } from "react";
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
  Layers,
} from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { UIDataTypes, UIMessage, UITools } from "ai";

// Header Component

import ReactMarkdown from "react-markdown";
import MessageComponent from "./components/message";
import { Button } from "@/components/ui/button";
import { useWallet } from "@solana/wallet-adapter-react";
import { PerpTradeHandler } from "@/lib/perp-trader-handler";
import { GetDriftBalance } from "@/lib/get-drift-balance";
import CreateDriftAccount from "@/lib/create-drift-account";
import PromptInput from "@/lib/prompt-input";
import { Header } from "@/lib/header";
import Sidebar from "@/lib/sidebar";

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{
        scale: 1.01,
        y: -2,
        boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)",
      }}
      className={`max-w-2xl px-6 py-6 relative overflow-hidden border-2 border-black rounded-xl ${
        isUser ? "ml-12 bg-blue-300" : "mr-12 bg-white"
      }`}
      style={{
        boxShadow: "6px 6px 0px 0px rgba(0,0,0,1)",
      }}
    >
      {/* Decorative 'Screws' for industrial feel */}
      <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-black rounded-full opacity-50" />
      <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-black rounded-full opacity-50" />
      <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-black rounded-full opacity-50" />
      <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-black rounded-full opacity-50" />

      <div className="relative z-10">
        <div
          className={`flex items-center gap-2 mb-3 pb-2 border-b-2 border-black/10 ${
            isUser ? "flex-row-reverse" : ""
          }`}
        >
          <div
            className={`
            px-2 py-0.5 border-2 border-black rounded text-xs font-black uppercase tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            ${isUser ? "bg-white text-black" : "bg-yellow-300 text-black"}
          `}
          >
            {isUser ? "You" : "AI Agent"}
          </div>
          {!isUser && (
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Zap className="w-4 h-4 text-black fill-current" />
            </motion.div>
          )}
        </div>

        {/* Conditional rendering: Markdown for AI, plain text for User */}
        <div
          className={`text-sm leading-relaxed prose prose-sm max-w-none font-medium ${
            isUser ? "text-black text-right" : "text-black"
          }`}
        >
          {isUser ? (
            // 🧍 USER MESSAGE
            <p className="m-0 text-base font-bold">
              {message.message.parts
                .filter((data) => data.type === "text")
                .map((dataa) => dataa.text)
                .join(" ")}
            </p>
          ) : (
            // 🤖 AI AGENT MESSAGE
            <div className="flex flex-col gap-4">
              {/* 1️⃣ Render AI normal text parts */}
              <ReactMarkdown
                components={{
                  p: ({ node, ...props }) => (
                    <p className="mb-2 text-black font-medium" {...props} />
                  ),
                  strong: ({ node, ...props }) => (
                    <span
                      className="font-black bg-yellow-200 px-1 border border-black rounded-sm"
                      {...props}
                    />
                  ),
                  code: ({ node, ...props }) => (
                    <code
                      className="bg-gray-200 text-red-600 px-1 rounded font-bold"
                      {...props}
                    />
                  ),
                }}
              >
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
                  // @ts-ignore
                  const toolResult = part.output;
                  return (
                    <div
                      key={i}
                      className="p-4 border-2 border-black bg-blue-50 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {toolName === "get_wallet_balance" && output && (
                        <div className="text-sm text-gray-900">
                          <p className="font-black mb-3 text-lg border-b-2 border-black pb-1 inline-block">
                            💰 Wallet Balances
                          </p>

                          {/* Show SOL balance */}
                          {output.balances?.SOL && (
                            <div className="mb-4 p-3 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-transform">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-black">◎</span>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase font-bold">
                                    Solana
                                  </p>
                                  <p className="font-black text-xl">
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
                                <p className="font-bold mb-3 flex items-center gap-2">
                                  <span className="text-lg">🪙</span>
                                  Top SPL Tokens
                                  {output.totalTokens > 5 && (
                                    <span className="text-xs text-gray-500 font-normal">
                                      (top 5 of {output.totalTokens})
                                    </span>
                                  )}
                                </p>

                                <div className="space-y-3">
                                  {output.balances.tokens.map(
                                    (token: any, i: number) => (
                                      <div
                                        key={token.mint || i}
                                        className="p-3 bg-white rounded-lg border-2 border-black hover:bg-yellow-50 transition-colors"
                                      >
                                        <div className="flex items-start gap-3">
                                          {/* Token Image */}
                                          {token.image ? (
                                            <img
                                              src={token.image}
                                              alt={token.name || token.symbol}
                                              className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-black"
                                              onError={(e) => {
                                                e.currentTarget.src =
                                                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='monospace' font-size='20' fill='%239ca3af'%3E?%3C/text%3E%3C/svg%3E";
                                              }}
                                            />
                                          ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-black flex items-center justify-center flex-shrink-0">
                                              <span className="text-black font-bold">
                                                {token.symbol?.charAt(0) || "?"}
                                              </span>
                                            </div>
                                          )}

                                          {/* Token Info */}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-2 mb-1">
                                              <h3 className="font-black text-base truncate uppercase">
                                                {token.name || "Unknown"}
                                              </h3>
                                              <span className="text-xs font-bold bg-black text-white px-1 rounded">
                                                {token.symbol || "???"}
                                              </span>
                                            </div>

                                            {/* Balance */}
                                            <p className="font-bold text-lg text-black mb-1">
                                              {token.balance.toLocaleString(
                                                undefined,
                                                {
                                                  maximumFractionDigits:
                                                    token.decimals || 6,
                                                }
                                              )}
                                            </p>

                                            {/* Mint Address */}
                                            <div className="mt-2 flex items-center gap-2">
                                              <span className="text-xs font-bold text-gray-500">
                                                MINT:
                                              </span>
                                              <code className="text-xs font-mono font-bold text-black bg-gray-200 px-2 py-0.5 rounded border border-black">
                                                {token.mint.slice(0, 4)}...
                                                {token.mint.slice(-4)}
                                              </code>
                                              <button
                                                onClick={() => {
                                                  navigator.clipboard.writeText(
                                                    token.mint
                                                  );
                                                }}
                                                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                                              >
                                                COPY
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                          {/* No tokens found */}
                          {Array.isArray(output.balances?.tokens) &&
                            output.balances.tokens.length === 0 && (
                              <p className="text-gray-500 italic mt-3 font-bold">
                                No SPL tokens found.
                              </p>
                            )}

                          {/* Handle errors gracefully */}
                          {output.error && (
                            <div className="mt-3 p-3 bg-red-100 border-2 border-black rounded-lg">
                              <p className="text-red-900 font-bold text-sm">
                                ⚠️ {output.error}
                              </p>
                            </div>
                          )}

                          {/* Success indicator */}
                          {output.success && !output.error && (
                            <div className="mt-3 inline-block px-2 py-1 bg-green-200 border-2 border-black rounded text-xs font-bold text-green-900">
                              ✓ DATA SYNCED
                            </div>
                          )}
                        </div>
                      )}

                      {toolName === "get_best_swap_price" && (
                        <div className="text-sm text-black">
                          <p className="font-black text-blue-800 mb-2 uppercase tracking-wide">
                            🔄 Best Swap Route
                          </p>
                          <div className="flex flex-col gap-2 bg-white border-2 border-black rounded-lg p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <p className="flex justify-between border-b border-black/10 pb-1">
                              <span className="text-gray-600 font-bold">
                                Pair
                              </span>
                              <span className="font-black uppercase">
                                {output.pair}
                              </span>
                            </p>
                            <p className="flex justify-between border-b border-black/10 pb-1">
                              <span className="text-gray-600 font-bold">
                                Route
                              </span>
                              <span className="font-bold text-blue-700">
                                {output.route}
                              </span>
                            </p>
                            <div className="flex justify-between pt-1">
                              <span className="text-gray-600 font-bold">
                                Best Price
                              </span>
                              <span className="font-black bg-yellow-200 px-1 border border-black rounded">
                                {output.bestPrice}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {toolName === "send_tokens" && (
                        <div className="text-sm text-black bg-green-100 border-2 border-black p-3 rounded-lg">
                          <p className="font-black text-green-900 mb-2 uppercase">
                            📤 Token Sent
                          </p>
                          <p className="font-bold text-lg">
                            {output.amount} {output.token}{" "}
                            <span className="text-gray-500">→</span>
                          </p>
                          <p className="font-mono bg-white border border-black p-1 rounded mt-1 text-xs break-all">
                            {output.toAddress}
                          </p>
                          <p className="text-xs font-bold text-gray-600 mt-2">
                            SIG: {output.signature || "Simulated (devnet)"}
                          </p>
                        </div>
                      )}

                      {toolName === "get_recent_transactions" && (
                        <div className="text-sm">
                          <p className="font-black text-black mb-3 flex items-center gap-2 uppercase">
                            <span className="text-lg">🧾</span>
                            Recent Transactions
                          </p>
                          <ul className="rounded-lg overflow-hidden border-2 border-black bg-white">
                            {(output.transactions || []).map(
                              (tx: any, i: number) => (
                                <li
                                  key={i}
                                  className="p-3 border-b-2 border-black last:border-b-0 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-black bg-black text-white px-2 py-0.5 rounded text-xs uppercase">
                                      {tx.type}
                                    </span>
                                    <span className="font-bold text-green-700">
                                      {tx.amount}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 font-mono truncate">
                                    {tx.signature}
                                  </p>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                      {toolName === "get_portfolio_summary" && (
                        <div className="text-sm">
                          <p className="font-black text-black mb-3 flex items-center gap-2 uppercase">
                            <span className="text-lg">📊</span>
                            Portfolio Summary
                          </p>
                          <div className="rounded-lg p-4 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <p className="mb-3 bg-gray-200 border border-black text-xs rounded-md px-2 py-1 inline-flex flex-col">
                              <span className="text-gray-500 font-bold uppercase text-[10px]">
                                Wallet
                              </span>
                              <span className="font-mono font-bold">
                                {output.walletAddress}
                              </span>
                            </p>

                            <div className="mb-4">
                              <Button className="w-full bg-green-600 text-white font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                Net Worth: ${output.netWorthUSD}
                              </Button>
                            </div>

                            <div className="overflow-x-auto border-2 border-black rounded-lg">
                              <table className="w-full text-left text-sm bg-gray-50">
                                <thead>
                                  <tr className="bg-black text-white">
                                    <th className="p-2 font-bold uppercase text-xs">
                                      Token
                                    </th>
                                    <th className="p-2 font-bold uppercase text-xs">
                                      Balance
                                    </th>
                                    <th className="p-2 font-bold uppercase text-xs">
                                      Value
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(output.tokens || []).map((token: any) => (
                                    <tr
                                      key={token.symbol}
                                      className="border-b border-black last:border-0 hover:bg-yellow-100 transition-colors"
                                    >
                                      <td className="p-2 font-bold text-black border-r border-black/10">
                                        {token.symbol}
                                      </td>
                                      <td className="p-2 text-gray-800 font-medium border-r border-black/10">
                                        {token.balance}
                                      </td>
                                      <td className="p-2 text-green-700 font-black">
                                        ${token.valueUSD}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
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
                      {toolName === "get_drift_balance" && output && (
                        <GetDriftBalance output={output} />
                      )}
                      {toolName === "create_drift_account_tool" && output && (
                        <CreateDriftAccount toolResult={output} />
                      )}
                      {/* 3️⃣ Generic fallback for unknown tools */}
                      {![
                        "get_wallet_balance",
                        "get_best_swap_price",
                        "send_tokens",
                        "get_recent_transactions",
                        "get_portfolio_summary",
                        "open_perp_trade",
                        "get_drift_balance",
                        "create_drift_account_tool",
                      ].includes(toolName) && (
                        <div className="prose prose-sm">
                          {/* Simple fallback if not structured */}
                          <pre>{JSON.stringify(output, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
      {isUser && (
        <div className="flex gap-3 justify-end mt-4 pt-3 border-t-2 border-black/10">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 90 }}
            className="cursor-pointer bg-white border-2 border-black p-1.5 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            onClick={async () =>
              reSendMessage(
                message.message.parts
                  .filter((data) => data.type === "text")
                  .map((dataa) => dataa.text)
                  .join(" ")
              )
            }
          >
            <RotateCw className="text-black w-4 h-4" />
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.1, y: -2 }}
            className="cursor-pointer bg-white border-2 border-black p-1.5 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            onClick={() => {
              navigator.clipboard.writeText(
                message.message.parts
                  .filter((data) => data.type === "text")
                  .map((dataa) => dataa.text)
                  .join(" ")
              );
            }}
          >
            <Copy className="text-black w-4 h-4" />
          </motion.div>
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

  // Process messages to extract tools used and text content
  const processedMessages = chat_messages.flatMap((message, msgIndex) => {
    const elements: JSX.Element[] = [];

    // Extract tool usage from message parts
    const toolsUsed = message.parts
      .filter(
        (part) => part.type.startsWith("tool-") || part.type === "dynamic-tool"
      )
      .map((part) => part.type);

    // Check if message has text content
    // const hasTextContent = message.parts.some((part) => part.type === "text");

    // If assistant message and tools were used, add tool log
    if (message.role === "assistant" && toolsUsed.length > 0) {
      elements.push(
        <div
          key={`tool-${msgIndex}`}
          className="text-sm text-gray-500 italic mb-2"
        >
          Tools used: {toolsUsed.join(", ")}
        </div>
      );
    }

    elements.push(
      <ChatMessage
        key={`msg-${msgIndex}`}
        message={{ message, role: message.role }}
        role={message.role}
        index={msgIndex}
        type={false}
        handleSendMessage={handleSendMessage}
      />
    );
    return elements;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex-1 overflow-hidden flex flex-col h-full bg-yellow-50/50"
    >
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto px-4 md:px-8 py-6 space-y-6 scroll-smooth"
      >
        <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-24">
          {/* Welcome Message styled consistently */}
          <MessageComponent
            message="Welcome! I'm your Solana AI Agent. I can help you swap tokens, stake SOL, analyze your portfolio, and execute on-chain actions. What would you like to do?"
            isUser={false}
          />

          {processedMessages}
        </div>
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [agentStatus, setAgentStatus] = useState({
    show: false,
    message: "",
    loading: false,
  });

  const {
    resumeStream,
    messages: chat_messages,
    addToolOutput,
    sendMessage,
    setMessages,
    status,
  } = useChat();
  const wallet = useWallet();

  console.log();
  const handleSendMessage = async (content: string) => {
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
    <div className="h-screen flex flex-col overflow-hidden bg-yellow-50/50">
      <Header />
      <div className="flex-1 flex mt-16 overflow-hidden w-full max-w-[1300px] mx-auto bg-yellow-50/50">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          agentStatus={status}
        />

        <div
          className={`flex-1 flex flex-col  transition-all duration-300 bg-yellow-50/50 ${
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
