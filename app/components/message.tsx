import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

const MessageComponent = ({ message }: { message: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`max-w-2xl p-6 relative overflow-hidden shadow-xl ${"mr-12"}`}
      style={{
        borderRadius: "28px",
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
          borderRadius: "28px",
          padding: "2px",
          background:
            "linear-gradient(135deg, rgba(156, 163, 175, 0.2) 0%, rgba(156, 163, 175, 0.5) 50%, rgba(156, 163, 175, 0.2) 100%)",
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
          background:
            "radial-gradient(circle at top left, rgba(107, 114, 128, 0.15) 0%, transparent 70%)",
          borderTopLeftRadius: "28px",
        }}
      />

      {/* Top-right corner */}
      <div
        className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-40"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(107, 114, 128, 0.15) 0%, transparent 70%)",
          borderTopRightRadius: "28px",
        }}
      />

      {/* Bottom-left corner */}
      <div
        className="absolute bottom-0 left-0 w-24 h-24 pointer-events-none opacity-30"
        style={{
          background:
            "radial-gradient(circle at bottom left, rgba(107, 114, 128, 0.12) 0%, transparent 70%)",
          borderBottomLeftRadius: "28px",
        }}
      />

      {/* Bottom-right corner */}
      <div
        className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none opacity-30"
        style={{
          background:
            "radial-gradient(circle at bottom right, rgba(107, 114, 128, 0.12) 0%, transparent 70%)",
          borderBottomRightRadius: "28px",
        }}
      />

      {/* Glass shimmer effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, transparent 50%, rgba(255, 255, 255, 0.2) 100%)",
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
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`text-xs font-bold tracking-wide ${"text-gray-700"}`}
          >
            {"AI Agent"}
          </span>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Zap className="w-3.5 h-3.5 text-blue-600" />
          </motion.div>
        </div>

        {/* Conditional rendering: Markdown for AI, plain text for User */}
        <div
          className={`text-sm leading-relaxed prose prose-sm max-w-none ${"text-gray-800"}`}
        >
          {message}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageComponent;
