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
  Layers,
  Pause,
} from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { ChatStatus, UIDataTypes, UIMessage, UITools } from "ai";
import { WalletContextState } from "@solana/wallet-adapter-react";

const quickActions = [
  { label: "Swap Tokens", icon: <Zap size={16} /> },
  { label: "Stake SOL", icon: <Layers size={16} /> },
  { label: "Portfolio Analysis", icon: <Activity size={16} /> },
];

// Prompt Input Component
const PromptInput = ({
  onSend,
  wallet,
  status,
}: {
  onSend: any;
  wallet: WalletContextState;
  status: ChatStatus;
}) => {
  const [input, setInput] = useState("");
  const [showActions, setShowActions] = useState(false);

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      className="sticky bottom-0 w-full z-20 bg-yellow-50 border-t-4 border-black p-4 md:p-6"
    >
      <div className="max-w-3xl mx-auto relative">
        {/* Quick Actions Dropdown */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: -16, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-0 right-0 bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 mb-2 z-10"
            >
              <div className="absolute -bottom-2 left-8 w-4 h-4 bg-white border-b-2 border-r-2 border-black transform rotate-45"></div>

              <h3 className="text-sm font-black uppercase mb-3 tracking-widest">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {quickActions.map((action) => (
                  <motion.button
                    key={action.label}
                    whileHover={{
                      x: -2,
                      y: -2,
                      boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                    }}
                    whileTap={{
                      x: 0,
                      y: 0,
                      boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)",
                    }}
                    onClick={() => {
                      setInput(action.label);
                      setShowActions(false);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 border-2 border-black font-bold text-sm text-black transition-colors hover:bg-blue-200"
                  >
                    {action.icon}
                    {action.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Input Area */}
        <div className="relative group">
          {/* Decorative background block behind input for depth */}
          <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 rounded-none" />

          <div className="relative bg-white border-2 border-black p-1 flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask AI to swap, stake, analyze..."
              className="w-full bg-transparent border-0 text-black text-lg font-bold placeholder:text-gray-400 p-3 focus:ring-0 focus:outline-none resize-none min-h-[60px]"
              rows={1}
              style={{ minHeight: "60px" }}
            />

            <div className="flex items-center gap-2 p-2 sm:p-0 sm:pb-2 sm:pr-2">
              {/* Toggle Actions Button */}
              <motion.button
                onClick={() => setShowActions(!showActions)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 border-2 border-black transition-colors ${
                  showActions
                    ? "bg-yellow-300"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <ChevronDown
                  className={`w-5 h-5 text-black transition-transform duration-300 ${
                    showActions ? "rotate-180" : ""
                  }`}
                  strokeWidth={3}
                />
              </motion.button>

              {/* Send Button */}
              <motion.button
                onClick={handleSend}
                disabled={!input.trim() || status == "streaming"}
                whileHover={{
                  x: -2,
                  y: -2,
                  boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                }}
                whileTap={{
                  x: 0,
                  y: 0,
                  boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)",
                }}
                className={`
                  px-6 py-2 border-2 border-black font-black uppercase tracking-wider flex items-center gap-2 transition-all
                  ${
                    input.trim()
                      ? "bg-green-400 text-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }
                `}
              >
                <span>Send</span>
                {status == "streaming" ? (
                  <Pause className="w-4 h-4" strokeWidth={3} />
                ) : (
                  <Send className="w-4 h-4" strokeWidth={3} />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
export default PromptInput;
