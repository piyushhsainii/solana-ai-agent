import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  ChevronRight,
  Loader2,
  Activity,
  Server,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { ChatStatus } from "ai";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  agentStatus?: any; //submitted || ready || streaming || error
}

const Sidebar = ({ isOpen, onToggle, agentStatus }: SidebarProps) => {
  // Enhanced stats for a trading dashboard feel
  const stats = [
    {
      label: "SOL Balance",
      value: "24.56",
      unit: "SOL",
      icon: Wallet,
      trend: "+5.2%",
      positive: true,
      color: "bg-blue-200",
    },
    {
      label: "Net Worth",
      value: "$2,845",
      unit: "USD",
      icon: TrendingUp,
      trend: "+12.4%",
      positive: true,
      color: "bg-green-200",
    },
  ];

  const quickActions = [
    { label: "SWAP", icon: Zap },
    { label: "STAKE", icon: ShieldCheck },
    { label: "ANALYZE", icon: Activity },
    { label: "BRIDGE", icon: Server },
  ];

  return (
    <>
      {/* 
        Toggle Button 
        Moves with the sidebar using a spring animation to match the sidebar's physics
      */}
      <motion.button
        onClick={onToggle}
        initial={false}
        animate={{
          left: isOpen ? "20.5rem" : "1rem", // Aligns with the w-80 (20rem) sidebar width + gap
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        whileHover={{
          scale: 1.1,
          rotate: isOpen ? 0 : 15,
          boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
        }}
        whileTap={{ scale: 0.9, boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)" }}
        className="fixed top-24 z-[60] p-3 bg-yellow-300 border-2 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors hover:bg-yellow-400"
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronRight className="w-6 h-6 stroke-[3px]" />
        </motion.div>
      </motion.button>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="fixed left-0 top-[76px] bottom-0 w-80 bg-white border-r-4 border-black p-5 overflow-y-auto z-50 flex flex-col gap-6"
            style={{
              // Add a subtle texture pattern
              backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
              backgroundSize: "20px 20px",
              backgroundColor: "#fff",
            }}
          >
            {/* Decorative Top Plate */}
            <div className="bg-black text-white p-2 text-center border-2 border-black mb-2 shadow-[4px_4px_0px_0px_rgba(100,100,100,1)]">
              <h2 className="font-black tracking-widest uppercase text-sm">
                Command Center
              </h2>
            </div>

            {/* Wallet Overview Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-black">
                  Wallet Status
                </h3>
                <div className="w-2 h-2 bg-green-500 rounded-full border border-black animate-pulse" />
              </div>

              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  whileHover={{
                    x: 4,
                    boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                  }}
                  className={`relative p-4 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${stat.color} transition-all`}
                >
                  {/* Decorative corner screws */}
                  <div className="absolute top-1 left-1 w-1 h-1 bg-black rounded-full opacity-30" />
                  <div className="absolute top-1 right-1 w-1 h-1 bg-black rounded-full opacity-30" />

                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold uppercase text-black/70">
                      {stat.label}
                    </span>
                    <stat.icon className="w-5 h-5 text-black stroke-[2.5px]" />
                  </div>

                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-black text-black leading-none">
                      {stat.value}
                    </span>
                    <span className="text-xs font-bold text-black mb-1">
                      {stat.unit}
                    </span>
                  </div>

                  <div className="mt-2 inline-block px-1.5 py-0.5 bg-white border border-black rounded text-[10px] font-bold">
                    TREND: {stat.trend}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Network Health (Replacement for Active Trades) */}
            <div className="p-3 bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-xs font-black uppercase mb-3 flex items-center gap-2">
                <Activity className="w-3 h-3" />
                Network Health
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 border border-black">
                  <span className="block text-gray-500 font-bold text-[10px]">
                    TPS
                  </span>
                  <span className="font-black text-green-600">2,450</span>
                </div>
                <div className="bg-white p-2 border border-black">
                  <span className="block text-gray-500 font-bold text-[10px]">
                    PING
                  </span>
                  <span className="font-black text-green-600">24ms</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-black mb-3 border-b-2 border-black pb-1">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action.label}
                    whileHover={{
                      y: -2,
                      boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                    }}
                    whileTap={{
                      y: 0,
                      boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)",
                    }}
                    className="flex flex-col items-center justify-center p-3 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-50 transition-colors"
                  >
                    <action.icon className="w-5 h-5 mb-1 stroke-[2px]" />
                    <span className="text-xs font-black uppercase">
                      {action.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Spacer to push status to bottom */}
            <div className="flex-1" />

            {/* Agent Status Panel */}
            <motion.div
              className={`p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-auto
                ${
                  agentStatus == "streaming"
                    ? "bg-green-100"
                    : agentStatus === "streaming"
                    ? "bg-yellow-100"
                    : agentStatus === "error"
                    ? "bg-red-100"
                    : "bg-gray-50"
                }
              `}
            >
              <div className="flex items-center gap-2 mb-2 pb-2 border-b-2 border-black/10">
                <div
                  className={`p-1 border-2 border-black bg-white rounded-full ${
                    agentStatus === "streaming" || agentStatus === "streaming"
                      ? "animate-spin"
                      : ""
                  }`}
                >
                  <Loader2 className="w-3 h-3 text-black" />
                </div>
                <h4 className="text-xs font-black uppercase tracking-wider">
                  SYSTEM STATUS
                </h4>
              </div>

              <div className="font-mono text-xs font-bold text-black min-h-[3rem]">
                <span className="text-gray-500 mr-2">{">"}</span>
                {agentStatus || "System Ready. Awaiting input..."}
                <span className="animate-pulse ml-1">_</span>
              </div>

              <div className="mt-2 flex justify-between items-center text-[10px] font-bold uppercase text-gray-500">
                <span>MODE: ASSISTANT</span>
                <span
                  className={`px-1 text-black border border-black ${
                    agentStatus == "ready" ? "bg-green-400" : "bg-gray-300"
                  }`}
                >
                  {agentStatus == "ready" ? "ONLINE" : "OFFLINE"}
                </span>
              </div>
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
