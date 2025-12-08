import { z } from "zod";
import { tool } from "ai";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import {
  BASE_PRECISION,
  BN,
  DriftClient,
  MarketType,
  OrderType,
  PositionDirection,
  PRICE_PRECISION,
  QUOTE_PRECISION,
  Wallet,
} from "@drift-labs/sdk";
import wallet from "../../my-keypair.json";
import { Keypair } from "@solana/web3.js";
import { Transaction } from "@solana/web3.js";
import {
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

export const runtime = "nodejs"; // better performance on Vercel

function getMetadataPDA(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
      mint.toBuffer(),
    ],
    new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
  );
  return pda;
}

/**
 * Parse metadata from account data manually
 */
function parseMetadata(data: Buffer) {
  try {
    let offset = 0;

    // Skip key (1 byte)
    offset += 1;

    // Skip updateAuthority (32 bytes)
    offset += 32;

    // Skip mint (32 bytes)
    offset += 32;

    // Read name
    const nameLen = data.readUInt32LE(offset);
    offset += 4;
    const name = data
      .slice(offset, offset + nameLen)
      .toString("utf-8")
      .replace(/\0/g, "")
      .trim();
    offset += nameLen;

    // Read symbol
    const symbolLen = data.readUInt32LE(offset);
    offset += 4;
    const symbol = data
      .slice(offset, offset + symbolLen)
      .toString("utf-8")
      .replace(/\0/g, "")
      .trim();
    offset += symbolLen;

    // Read uri
    const uriLen = data.readUInt32LE(offset);
    offset += 4;
    const uri = data
      .slice(offset, offset + uriLen)
      .toString("utf-8")
      .replace(/\0/g, "")
      .trim();

    return { name, symbol, uri };
  } catch (err) {
    console.error("Failed to parse metadata:", err);
    return { name: null, symbol: null, uri: null };
  }
}

/**
 * 🪙 Fetch wallet balances - SOL + top 5 SPL tokens with metadata
 */
export const get_wallet_balance = tool({
  name: "get_wallet_balance",
  description:
    "Fetch SOL balance and top 5 SPL tokens with decoded metadata including name, symbol, image, and description",
  inputSchema: z.object({
    walletAddress: z.string().describe("Solana wallet address to query"),
  }),

  execute: async ({ walletAddress }) => {
    // Validate wallet address
    if (!walletAddress) {
      return {
        success: false,
        walletAddress: "",
        error: "Wallet address is required",
        balances: {
          SOL: { balance: "0", uiBalance: 0 },
          tokens: [],
        },
        totalTokens: 0,
      };
    }

    try {
      const connection = new Connection(
        clusterApiUrl("mainnet-beta"),
        "confirmed"
      );

      console.log("📍 Wallet address received:", walletAddress);

      let owner: PublicKey;
      try {
        owner = new PublicKey(walletAddress);
        console.log("✅ Valid public key:", owner.toBase58());
      } catch (err) {
        return {
          success: false,
          walletAddress,
          error: "Invalid wallet address format",
          balances: {
            SOL: { balance: "0", uiBalance: 0 },
            tokens: [],
          },
          totalTokens: 0,
        };
      }

      // ✅ Fetch SOL balance
      const solLamports = await connection.getBalance(owner);
      const solBalance = solLamports / LAMPORTS_PER_SOL;

      console.log("💰 SOL balance:", solBalance);

      // USDC mint addresses
      const USDC_MINT_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
      // const USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

      // Detect network from RPC URL
      const USDC_MINT = USDC_MINT_MAINNET;

      // ✅ First, try to get USDC balance directly using ATA
      let usdcBalance = 0;
      let usdcDecimals = 6;
      let hasUSDC = false;

      try {
        const usdcMintPubkey = new PublicKey(USDC_MINT);
        const usdcATA = await getAssociatedTokenAddress(
          usdcMintPubkey,
          owner,
          false,
          TOKEN_PROGRAM_ID
        );

        console.log("🔍 USDC ATA address:", usdcATA.toBase58());

        const usdcAccountInfo = await getAccount(
          connection,
          usdcATA,
          "confirmed",
          TOKEN_PROGRAM_ID
        );
        usdcBalance =
          Number(usdcAccountInfo.amount) / Math.pow(10, usdcDecimals);
        hasUSDC = usdcBalance > 0;

        console.log("💵 USDC balance found:", usdcBalance);
      } catch (err) {
        console.log("ℹ️ No USDC account found or error:", err);
      }

      // Check if this wallet exists
      if (solLamports === 0) {
        const accountInfo = await connection.getAccountInfo(owner);
        if (!accountInfo) {
          console.log("⚠️ Wallet account does not exist on this network");
        }
      }

      // ✅ Fetch token accounts from BOTH programs AND get all token accounts
      const [tokenAccountsStandard, tokenAccounts2022] = await Promise.all([
        connection
          .getParsedTokenAccountsByOwner(owner, {
            programId: TOKEN_PROGRAM_ID,
          })
          .catch((err) => {
            console.warn("Standard token fetch error:", err);
            return { value: [] };
          }),
        connection
          .getParsedTokenAccountsByOwner(owner, {
            programId: TOKEN_2022_PROGRAM_ID,
          })
          .catch((err) => {
            console.warn("Token-2022 fetch error:", err);
            return { value: [] };
          }),
      ]);

      console.log(
        "📦 Standard tokens found:",
        tokenAccountsStandard.value.length
      );
      console.log("📦 Token-2022 found:", tokenAccounts2022.value.length);

      // ✅ Combine both token programs
      const allTokenAccounts = [
        ...tokenAccountsStandard.value,
        ...tokenAccounts2022.value,
      ];

      // ✅ Extract token info with non-zero balances
      const tokens = allTokenAccounts
        .map((acc) => {
          const info = acc.account.data.parsed.info;
          const balance = Number(info.tokenAmount.uiAmount || 0);

          return {
            mint: info.mint,
            balance,
            decimals: info.tokenAmount.decimals,
            rawAmount: info.tokenAmount.amount,
            isUSDC: info.mint === USDC_MINT,
          };
        })
        .filter((t) => t.balance > 0);

      // Debug: Log all token mints and USDC status
      console.log(
        "🔍 All tokens found:",
        tokens.map((t) => ({
          mint: t.mint,
          balance: t.balance,
          isUSDC: t.isUSDC,
        }))
      );
      console.log("🎯 Looking for USDC mint:", USDC_MINT);
      console.log("🌐 Network:", "Mainnet");

      // ✅ Separate USDC from other tokens
      const usdcTokenFromList = tokens.find((t) => t.isUSDC);
      const otherTokens = tokens.filter((t) => !t.isUSDC);

      // Sort other tokens by balance
      otherTokens.sort((a, b) => b.balance - a.balance);

      // ✅ Build top 5: USDC first (if exists from either method), then top 4 others
      const top5 = [];

      // Add USDC if we found it via ATA or in token list
      if (hasUSDC && !usdcTokenFromList) {
        // Add USDC from direct ATA lookup
        top5.push({
          mint: USDC_MINT,
          balance: usdcBalance,
          decimals: usdcDecimals,
          rawAmount: (usdcBalance * Math.pow(10, usdcDecimals)).toString(),
          isUSDC: true,
        });
        top5.push(...otherTokens.slice(0, 4));
      } else if (usdcTokenFromList) {
        // Add USDC from token accounts
        top5.push(usdcTokenFromList);
        top5.push(...otherTokens.slice(0, 4));
      } else {
        // No USDC, just add top 5
        top5.push(...otherTokens.slice(0, 5));
      }

      // ✅ Enrich top 5 with metadata
      const enriched = await Promise.all(
        top5.map(async ({ mint, balance, decimals, rawAmount }) => {
          const token = { mint, balance, decimals, rawAmount };
          let name: string | null = null;
          let symbol: string | null = null;
          let uri: string | null = null;
          let image: string | null = null;
          let description: string | null = null;

          try {
            const mintPubkey = new PublicKey(token.mint);
            const pda = getMetadataPDA(mintPubkey);
            const accountInfo = await connection.getAccountInfo(pda);

            if (accountInfo?.data) {
              // Parse metadata manually
              const parsed = parseMetadata(accountInfo.data);
              name = parsed.name;
              symbol = parsed.symbol;
              uri = parsed.uri;

              // ✅ Fetch off-chain JSON metadata
              if (uri) {
                try {
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 5000);

                  const res = await fetch(uri, {
                    signal: controller.signal,
                    headers: { Accept: "application/json" },
                  });

                  clearTimeout(timeoutId);

                  if (res.ok) {
                    const json = await res.json();
                    image = json?.image || null;
                    description = json?.description || null;
                  }
                } catch (fetchErr) {
                  console.warn(
                    `Failed to fetch metadata from ${uri}:`,
                    fetchErr
                  );
                }
              }
            }
          } catch (metadataErr) {
            console.warn(
              `Failed to decode metadata for ${token.mint}:`,
              metadataErr
            );
          }

          return {
            mint: token.mint,
            balance: token.balance,
            decimals: token.decimals,
            name: name || "Unknown Token",
            symbol: symbol || "???",
            uri,
            image,
            description,
          };
        })
      );

      return {
        success: true,
        walletAddress,
        balances: {
          SOL: {
            balance: solBalance.toFixed(4),
            uiBalance: solBalance,
          },
          tokens: enriched,
        },
        totalTokens: tokens.length,
      };
    } catch (err: any) {
      console.error("❌ Error fetching wallet balance:", err);

      return {
        success: false,
        walletAddress,
        error: err.message || "Failed to fetch balances",
        balances: {
          SOL: { balance: "0", uiBalance: 0 },
          tokens: [],
        },
        totalTokens: 0,
      };
    }
  },
});

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
// PERPS TRADE TOOL
export const open_perp_trade = tool({
  name: "open_perp_trade",
  description:
    "Execute a user-requested perpetual futures trade. The agent should call this only if the user explicitly specifies side, market, and size.",
  inputSchema: z.object({
    market: z.string().describe("e.g. 'SOL-PERP', 'BTC-PERP'"),
    side: z
      .enum(["long", "short"])
      .describe("Trade direction requested by user"),
    size: z.number().describe("Trade notional size in USDC"),
    leverage: z.number().min(1).max(20),
    walletAddress: z.string().describe("User's wallet public key"),
  }),

  execute: async ({ market, side, size, leverage, walletAddress }) => {
    try {
      console.log("📌 Starting perp trade:", {
        market,
        side,
        size,
        leverage,
        walletAddress,
      });

      // 1️⃣ Setup Solana connection
      const connection = new Connection("https://api.devnet.solana.com");

      // 2️⃣ Load Drift SDK + Wallet
      // @ts-ignore
      const WalletKeypair = Keypair.fromSecretKey(new Uint8Array(wallet));
      const DriftWallet = new Wallet(WalletKeypair);

      const drift = new DriftClient({
        connection,
        wallet: DriftWallet,
        env: "devnet",
      });

      await drift.subscribe();
      console.log("✅ DriftClient subscribed");

      // 3️⃣ Check if user account exists and initialize if needed
      const [userAccountPublicKey] = await PublicKey.findProgramAddress(
        [
          Buffer.from("user"),
          DriftWallet.publicKey.toBuffer(),
          new BN(0).toArrayLike(Buffer, "le", 2),
        ],
        drift.program.programId
      );

      console.log("User account public key:", userAccountPublicKey.toString());

      const accountInfo = await connection.getAccountInfo(userAccountPublicKey);
      let userAccount;

      if (!accountInfo) {
        console.log("🚀 No Drift user found — creating now...");
        const [txSig, userAddress] = await drift.initializeUserAccount(0);
        console.log("✔ Drift user created:", txSig);
        await connection.confirmTransaction(txSig, "confirmed");
        await drift.unsubscribe();
        await drift.subscribe();
        userAccount = drift.getUser();
        if (!userAccount) {
          throw new Error("User account still not found after creation");
        }
      } else {
        console.log("👌 Drift user account exists on-chain");
        await drift.addUser(0);
        userAccount = drift.getUser(0);
        if (!userAccount) {
          throw new Error("Failed to load existing user account");
        }
        console.log("✔ User account loaded successfully");
      }

      // 4️⃣ Convert symbol → market index
      const marketIndex = drift.getMarketIndexAndType(market);
      if (marketIndex === undefined) {
        return {
          success: false,
          message: `Invalid market symbol: ${market}`,
        };
      }

      // 5️⃣ Fetch market config and price
      const perpMarketConfig = drift.getPerpMarketAccount(
        marketIndex.marketIndex
      );
      if (perpMarketConfig === undefined) {
        return {
          success: false,
          message: `Market configuration not found for ${market}`,
        };
      }

      const oraclePublicKey = perpMarketConfig.amm.oracle;
      const oracleSource = perpMarketConfig.amm.oracleSource;
      const price = await drift.getOraclePriceDataAndSlot(
        oraclePublicKey,
        oracleSource
      );
      if (!price) {
        return {
          success: false,
          message: `Price unavailable for ${market}`,
        };
      }

      console.log("Oracle price:", price.data.price.toString());

      const usdSize = size;
      const markPrice = new BN(price.data.price);

      // Calculate base asset amount
      const baseAssetAmount = new BN(usdSize)
        .mul(BASE_PRECISION)
        .mul(PRICE_PRECISION)
        .div(markPrice);

      console.log(`BASE AMOUNT ---`, baseAssetAmount.toString());

      // ✅ PRE-FLIGHT CHECK 1: Minimum Order Size
      const minOrderSize = perpMarketConfig.amm.minOrderSize;
      if (baseAssetAmount.lt(minOrderSize)) {
        const minUsdSize = minOrderSize
          .mul(markPrice)
          .div(BASE_PRECISION)
          .div(PRICE_PRECISION)
          .toNumber();

        return {
          success: false,
          message: `Order size too small. Minimum: $${minUsdSize.toFixed(
            2
          )}, Your order: $${size}`,
          details: {
            minOrderSize: minOrderSize.toString(),
            yourOrderSize: baseAssetAmount.toString(),
            minUsdRequired: minUsdSize,
          },
        };
      }

      // ✅ PRE-FLIGHT CHECK 2: Collateral Check
      await userAccount.fetchAccounts();

      const freeCollateral = userAccount.getFreeCollateral();
      const totalCollateral = userAccount.getTotalCollateral();

      console.log("Free collateral:", freeCollateral.toString());
      console.log("Total collateral:", totalCollateral.toString());

      // Calculate required collateral (size / leverage)
      const requiredCollateral = new BN(usdSize)
        .mul(QUOTE_PRECISION)
        .div(new BN(leverage));

      console.log("Required collateral:", requiredCollateral.toString());

      if (freeCollateral.lt(requiredCollateral)) {
        const shortfall = requiredCollateral.sub(freeCollateral);
        const shortfallUsd = shortfall.div(QUOTE_PRECISION).toNumber();

        return {
          success: false,
          message: `Insufficient collateral. Need $${shortfallUsd.toFixed(
            2
          )} more to open this position.`,
          details: {
            requiredCollateral: requiredCollateral.toString(),
            freeCollateral: freeCollateral.toString(),
            totalCollateral: totalCollateral.toString(),
            shortfall: shortfallUsd,
          },
        };
      }

      // ✅ PRE-FLIGHT CHECK 3: Leverage Check
      const maxLeverage = perpMarketConfig.marginRatioInitial
        ? new BN(10000).div(perpMarketConfig.marginRatioInitial)
        : new BN(10);

      if (leverage > maxLeverage.toNumber()) {
        return {
          success: false,
          message: `Leverage too high. Maximum: ${maxLeverage.toString()}x, Requested: ${leverage}x`,
          details: {
            maxLeverage: maxLeverage.toString(),
            requestedLeverage: leverage,
          },
        };
      }

      // ✅ PRE-FLIGHT CHECK 4: Market Status
      if (perpMarketConfig.status !== 0) {
        return {
          success: false,
          message: `Market ${market} is currently paused or unavailable`,
        };
      }

      // 6️⃣ Prepare order direction
      const direction =
        side === "long" ? PositionDirection.LONG : PositionDirection.SHORT;

      console.log("⚡ All checks passed! Executing order", {
        price: markPrice.toString(),
        baseAssetAmount: baseAssetAmount.toString(),
        direction,
        freeCollateral: freeCollateral.toString(),
      });

      // 7️⃣ Create OrderParams
      const orderParams = {
        orderType: OrderType.MARKET,
        marketIndex: marketIndex.marketIndex,
        marketType: MarketType.PERP,
        direction,
        baseAssetAmount,
        reduceOnly: false,
      };

      // 8️⃣ Build unsigned transaction
      const ixs = await drift.getPlacePerpOrderIx(orderParams);
      const recentBlockhash = await connection.getLatestBlockhash();

      const transaction = new Transaction({
        feePayer: new PublicKey(walletAddress),
        ...recentBlockhash,
      }).add(ixs);

      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      const base64Transaction = serializedTransaction.toString("base64");

      console.log("✅ Unsigned transaction created");

      return {
        success: true,
        message: `Trade prepared successfully! ${side.toUpperCase()} ${market} with $${size} at ${leverage}x leverage`,
        transaction: base64Transaction,
        details: {
          market,
          side,
          size: `$${size}`,
          leverage: `${leverage}x`,
          baseAssetAmount: baseAssetAmount.toString(),
          estimatedPrice: markPrice.toString(),
          freeCollateralAfter: freeCollateral
            .sub(requiredCollateral)
            .toString(),
        },
      };
    } catch (error) {
      console.error("🔥 Perp trade failed:", error);

      // Parse common error messages
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        if (error.message.includes("InsufficientCollateral")) {
          errorMessage = "Insufficient collateral to open position";
        } else if (error.message.includes("InvalidOrderSize")) {
          errorMessage = "Order size does not meet minimum requirements";
        } else if (error.message.includes("MarketPaused")) {
          errorMessage = "Market is currently paused";
        } else if (error.message.includes("OracleInvalid")) {
          errorMessage = "Oracle price data is invalid or stale";
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        message: `Trade failed: ${errorMessage}`,
        error: error instanceof Error ? error.stack : String(error),
      };
    }
  },
});
export const manage_collateral = tool({
  name: "manage_collateral",
  description:
    "Deposit or withdraw collateral to/from Drift subaccount. Positive amount = Deposit, Negative amount = Withdraw.",
  inputSchema: z.object({
    crypto: z.enum(["SOL", "USDC"]).describe("Asset to modify collateral for"),
    amount: z
      .number()
      .describe(
        "Amount of token. Positive for deposit, negative for withdrawal."
      ),
    walletAddress: z.string().describe("User's wallet public key"),
  }),

  execute: async ({ crypto, amount, walletAddress }) => {
    try {
      const connection = new Connection("https://api.devnet.solana.com");

      // Load wallet & SDK (same pattern as your perp tool)
      // @ts-ignore
      const WalletKeypair = Keypair.fromSecretKey(new Uint8Array(wallet));
      const DriftWallet = new Wallet(WalletKeypair);

      const drift = new DriftClient({
        connection,
        wallet: DriftWallet,
        env: "devnet",
      });
      await drift.subscribe();

      const user = drift.getUser(0);
      if (!user) {
        await drift.initializeUserAccount(0);
      }

      // Choose token mint
      const mint =
        crypto === "SOL"
          ? drift.getTokenMint("SOL")
          : drift.getTokenMint("USDC");

      if (!mint) {
        return {
          success: false,
          message: `Unsupported asset: ${crypto}`,
        };
      }

      const tokenDecimals = crypto === "SOL" ? 9 : 6;
      const uiAmount = Math.abs(amount);
      const tokenAmount = new BN(uiAmount * 10 ** tokenDecimals);

      let ixs;
      let action;

      if (amount > 0) {
        action = "deposit";
        ixs = await drift.getDepositCollateralIx(
          tokenAmount,
          mint,
          0 // subaccount 0
        );
      } else {
        action = "withdraw";
        ixs = await drift.getWithdrawCollateralIx(
          tokenAmount,
          mint,
          0 // subaccount 0
        );
      }

      const recentBlockhash = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer: new PublicKey(walletAddress),
        ...recentBlockhash,
      }).add(ixs);

      const serialized = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      return {
        success: true,
        action,
        message: `${action} ${uiAmount} ${crypto}`,
        transaction: serialized.toString("base64"),
      };
    } catch (err: any) {
      console.error("❌ Collateral modification failed:", err);
      return {
        success: false,
        message: err.message,
      };
    }
  },
});

export const solanaTools = {
  get_wallet_balance,
  send_tokens,
  get_best_swap_price,
  get_recent_transactions,
  get_portfolio_summary,
  open_perp_trade,
};
