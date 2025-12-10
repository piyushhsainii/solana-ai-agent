import React from "react";
import { motion } from "framer-motion";
import { Zap, RotateCw, Copy, User } from "lucide-react";

interface MessageComponentProps {
  message: string;
  isUser?: boolean;
}

/**
 * MessageComponent (Neobrutalism Edition)
 *
 * Design Characteristics:
 * - High contrast (Black borders on white/colored backgrounds)
 * - Hard shadows (No blur, solid offset)
 * - Geometric shapes
 * - Bold typography
 * - Interactive "press" effect on hover
 */
const MessageComponent = ({
  message,
  isUser = false,
}: MessageComponentProps) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(message);
  };

  const handleRetry = () => {
    // Mock retry action
    console.log("Retrying message:", message);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      whileHover={{
        x: isUser ? -4 : 4,
        y: 4,
        boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)",
      }}
      className={`max-w-2xl w-full relative border-2 border-black p-6 
        ${isUser ? "bg-blue-200 ml-auto" : "bg-white mr-auto"}
      `}
      style={{
        // Hard, solid shadow (no blur)
        boxShadow: "6px 6px 0px 0px rgba(0,0,0,1)",
        borderRadius: "12px", // Slightly rounded, but distinct
      }}
    >
      {/* Decorative "Screws" or corner accents common in brutalism */}
      <div className="absolute top-3 left-3 w-2 h-2 bg-black rounded-full" />
      <div className="absolute top-3 right-3 w-2 h-2 bg-black rounded-full" />
      <div className="absolute bottom-3 left-3 w-2 h-2 bg-black rounded-full" />
      <div className="absolute bottom-3 right-3 w-2 h-2 bg-black rounded-full" />

      <div className="relative z-10 pl-2">
        {/* Header Badge */}
        <div
          className={`flex items-center gap-3 mb-4 ${
            isUser ? "flex-row-reverse" : ""
          }`}
        >
          <div
            className={`flex items-center gap-2 border-2 border-black px-3 py-1 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            ${isUser ? "bg-white" : "bg-purple-400"}
          `}
          >
            <span className="text-xs font-black uppercase tracking-wider text-black">
              {isUser ? "You" : "AI Agent"}
            </span>
            {isUser ? (
              <User className="w-4 h-4 text-black" />
            ) : (
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
              >
                <Zap className="w-4 h-4 text-black fill-yellow-300" />
              </motion.div>
            )}
          </div>

          {/* Timestamp decorative line */}
          <div className="h-0.5 flex-grow bg-black opacity-20" />
        </div>

        {/* Content Area */}
        <div
          className={`text-base font-medium leading-relaxed text-black font-sans ${
            isUser ? "text-right" : ""
          }`}
        >
          {message}
        </div>

        {/* Action Buttons (User Only) */}
        {isUser && (
          <div className="flex gap-3 justify-end mt-6 pt-4 border-t-2 border-black/10">
            <ActionBtn
              onClick={handleRetry}
              icon={<RotateCw size={18} />}
              label="Retry"
            />
            <ActionBtn
              onClick={handleCopy}
              icon={<Copy size={18} />}
              label="Copy"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ActionBtn = ({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
}) => (
  <motion.button
    whileTap={{
      scale: 0.95,
      x: 2,
      y: 2,
      boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)",
    }}
    whileHover={{ x: -2, y: -2, boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)" }}
    onClick={onClick}
    className="group flex items-center gap-2 bg-white border-2 border-black px-3 py-2 
                 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 transition-colors"
  >
    {icon}
    {label && (
      <span className="text-xs font-bold uppercase hidden sm:inline">
        {label}
      </span>
    )}
  </motion.button>
);

export default MessageComponent;
