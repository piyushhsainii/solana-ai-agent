import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export const Header = () => {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 15, stiffness: 200 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b-4 border-black"
    >
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        {/* Logo Section */}
        <motion.div
          className="flex items-center gap-3 cursor-pointer"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <div className="relative">
            <motion.div
              className="w-10 h-10 md:w-12 md:h-12 bg-yellow-300 border-2 border-black rounded-lg flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Zap className="w-6 h-6 md:w-7 md:h-7 text-black fill-black" />
            </motion.div>
          </div>
          <div className="leading-tight">
            <h1 className="text-lg md:text-2xl font-black text-black uppercase tracking-tight">
              Solana Agent
            </h1>
            <p className="text-[10px] md:text-xs font-bold text-black bg-blue-200 border border-black inline-block px-1 rounded-sm shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              INTELLIGENT TRADING
            </p>
          </div>
        </motion.div>

        <div className="flex items-center gap-3 md:gap-4">
          {/* Status Indicator - Hidden on very small screens */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <motion.div
              className="w-2.5 h-2.5 rounded-full bg-green-500 border border-black"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-xs font-bold text-black uppercase tracking-wide">
              Devnet
            </span>
          </motion.div>

          {/* Wallet Button */}
          <WalletMultiButton
            style={{
              borderRadius: "10px",
              background: "linear-gradient(135deg, #319ed8 0%, #1e3a8a 100%)", // Fallback if simple color prefered: #3b82f6
              backgroundColor: "#3b82f6",
              color: "white",
              border: "2px solid black",
              boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          />
        </div>
      </div>
    </motion.header>
  );
};
