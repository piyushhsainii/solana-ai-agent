import { z } from "zod";
import { tool } from "ai";

/**
 * 🪙 Fetch wallet balances
 */
export const get_wallet_balance = tool({
  name: "get_wallet_balance",
  description: "Fetch SOL and SPL token balances for the connected wallet.",
  inputSchema: z.object({
    walletAddress: z
      .string()
      .describe("The Solana wallet address to check balances for."),
  }),
  execute: async ({ walletAddress }) => {
    console.log(`Fetching balances for wallet: ${walletAddress}`);
    return {
      walletAddress,
      balances: {
        SOL: "2.34",
        USDC: "120.50",
      },
    };
  },
});

/**
 * 💸 Send SOL or tokens to another wallet
 */
export const send_tokens = tool({
  name: "send_tokens",
  description: "Send SOL or SPL tokens from one wallet to another.",
  inputSchema: z.object({
    fromWallet: z.string().describe("Sender wallet address"),
    toWallet: z.string().describe("Recipient wallet address"),
    amount: z.number().describe("Amount to send"),
    tokenSymbol: z.string().optional().describe("Token symbol, e.g. SOL, USDC"),
  }),
  execute: async ({ fromWallet, toWallet, amount, tokenSymbol = "SOL" }) => {
    console.log(
      `Sending ${amount} ${tokenSymbol} from ${fromWallet} to ${toWallet}`
    );
    return {
      status: "success",
      txHash: "FakeTxHash123ABC",
      details: { fromWallet, toWallet, amount, tokenSymbol },
    };
  },
});

/**
 * 🔄 Get best swap prices
 */
export const get_best_swap_price = tool({
  name: "get_best_swap_price",
  description: "List top DEX swap quotes for a given token pair.",
  inputSchema: z.object({
    fromToken: z.string().describe("Token symbol to swap from"),
    toToken: z.string().describe("Token symbol to swap to"),
    amount: z.number().describe("Amount to swap"),
  }),
  execute: async ({ fromToken, toToken, amount }) => {
    console.log(
      `Fetching best swap price for ${amount} ${fromToken} → ${toToken}`
    );
    return {
      pair: `${fromToken}/${toToken}`,
      amount,
      bestPrice: "1.024",
      route: "Jupiter Aggregator",
    };
  },
});

/**
 * 🧾 Get recent transactions
 */
export const get_recent_transactions = tool({
  name: "get_recent_transactions",
  description: "Fetch the recent transaction history for a wallet.",
  inputSchema: z.object({
    walletAddress: z.string().describe("Wallet to get transactions for"),
    limit: z
      .number()
      .optional()
      .describe("How many transactions to fetch (default: 5)"),
  }),
  execute: async ({ walletAddress, limit = 5 }) => {
    console.log(`Fetching last ${limit} transactions for ${walletAddress}`);
    return {
      walletAddress,
      transactions: Array.from({ length: limit }).map((_, i) => ({
        signature: `FakeTx_${i}`,
        type: i % 2 === 0 ? "transfer" : "swap",
        amount: `${(Math.random() * 1.2).toFixed(2)} SOL`,
        timestamp: Date.now() - i * 60000,
      })),
    };
  },
});

/**
 * 💰 Get portfolio summary
 */
export const get_portfolio_summary = tool({
  name: "get_portfolio_summary",
  description:
    "Get an overview of wallet balances, token distribution, and net worth.",
  inputSchema: z.object({
    walletAddress: z
      .string()
      .describe("Wallet address to summarize portfolio for"),
  }),
  execute: async ({ walletAddress }) => {
    console.log(`Building portfolio summary for wallet: ${walletAddress}`);
    return {
      walletAddress,
      netWorthUSD: 3400.5,
      tokens: [
        { symbol: "SOL", balance: "2.34", valueUSD: 320 },
        { symbol: "USDC", balance: "120.5", valueUSD: 120.5 },
        { symbol: "BONK", balance: "100000", valueUSD: 5.2 },
      ],
    };
  },
});

/**
 * 🧠 Export toolset
 */
export const solanaTools = {
  get_wallet_balance,
  send_tokens,
  get_best_swap_price,
  get_recent_transactions,
  get_portfolio_summary,
};
