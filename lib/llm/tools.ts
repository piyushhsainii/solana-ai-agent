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
  BulkAccountLoader,
  convertToNumber,
  DriftClient,
  getUserAccountPublicKey,
  initialize,
  MarketType,
  OrderType,
  PositionDirection,
  PRICE_PRECISION,
  QUOTE_PRECISION,
  User,
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
import bs58 from "bs58";
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

export const get_drift_balance = tool({
  name: "get_drift_balance",
  description:
    "Fetch user's Drift Protocol balance including deposits, borrows, PnL, and positions on devnet",
  inputSchema: z.object({
    walletAddress: z
      .string()
      .describe("Solana wallet address to query Drift balances"),
  }),

  execute: async ({ walletAddress }) => {
    // Validate wallet address
    if (!walletAddress) {
      return {
        success: false,
        walletAddress: "",
        error: "Wallet address is required",
        driftData: null,
      };
    }

    try {
      // Use Drift devnet RPC
      const rpcUrl = "https://api.devnet.solana.com";
      const connection = new Connection(rpcUrl, "confirmed");

      console.log("🔗 Connecting to Drift on devnet");
      console.log("📍 Wallet address:", walletAddress);

      const walletPubkey = new PublicKey(walletAddress);

      // Initialize Drift SDK
      const sdkConfig = initialize({ env: "devnet" });

      // Create BulkAccountLoader for polling
      const bulkAccountLoader = new BulkAccountLoader(
        connection,
        "confirmed",
        1000 // polling frequency in ms
      );

      // Create a read-only DriftClient
      const driftClient = new DriftClient({
        connection,
        wallet: {
          publicKey: walletPubkey,
          signTransaction: async () => {
            throw new Error("Read-only wallet");
          },
          signAllTransactions: async () => {
            throw new Error("Read-only wallet");
          },
        },
        programID: new PublicKey(sdkConfig.DRIFT_PROGRAM_ID),
        accountSubscription: {
          type: "polling",
          accountLoader: bulkAccountLoader,
        },
      });

      await driftClient.subscribe();
      console.log("✅ Drift client subscribed");

      // Check if user has a Drift account before trying to get it
      let userAccountPublicKey;
      try {
        userAccountPublicKey = await driftClient.getUserAccountPublicKey();
        console.log("🔍 User account PDA:", userAccountPublicKey.toBase58());
      } catch (err) {
        console.log("ℹ️ No Drift account found for this wallet");
        await driftClient.unsubscribe();

        return {
          success: true,
          walletAddress,
          error: null,
          driftData: {
            hasAccount: false,
            message:
              "No Drift account found for this wallet. Create an account on Drift Protocol to get started.",
          },
        };
      }

      // Check if the account actually exists on-chain
      const accountInfo = await connection.getAccountInfo(userAccountPublicKey);
      if (!accountInfo) {
        console.log("ℹ️ Drift account PDA exists but not initialized");
        await driftClient.unsubscribe();

        return {
          success: true,
          walletAddress,
          error: null,
          driftData: {
            hasAccount: false,
            message:
              "Drift account not initialized. Visit app.drift.trade to create your account.",
          },
        };
      }

      // Get user account
      const user = new User({
        driftClient: driftClient,
        userAccountPublicKey: userAccountPublicKey,
      });

      await user.subscribe();
      console.log("✅ User account subscribed");

      // Check if user account data exists
      const userAccount = user.getUserAccount();
      if (!userAccount) {
        await driftClient.unsubscribe();
        await user.unsubscribe();

        return {
          success: true,
          walletAddress,
          error: null,
          driftData: {
            hasAccount: false,
            message:
              "Drift account exists but has no data. Try refreshing or check on app.drift.trade.",
          },
        };
      }

      // Get total collateral and leverage
      const totalCollateral = user.getTotalCollateral();
      const freeCollateral = user.getFreeCollateral();
      const leverage = user.getLeverage();
      const accountValue = user.getNetSpotMarketValue();
      const unrealizedPnl = user.getUnrealizedPNL(true, undefined);
      const unrealizedFundingPnl = user.getUnrealizedFundingPNL();

      // Get spot positions (deposits/borrows)
      const spotPositions = user.getActiveSpotPositions();
      const spotPositionsData = spotPositions.map((position) => {
        const marketIndex = position.marketIndex;
        const market = driftClient.getSpotMarketAccount(marketIndex);
        const tokenAmount = user.getTokenAmount(marketIndex);
        const isDeposit = tokenAmount.gt(new BN(0));

        return {
          marketIndex,
          marketSymbol: market?.name || `Market ${marketIndex}`,
          amount: convertToNumber(tokenAmount, market?.decimals || 6),
          type: isDeposit ? "deposit" : "borrow",
          value: convertToNumber(
            user.getSpotMarketAssetValue(marketIndex),
            QUOTE_PRECISION
          ),
        };
      });

      // Get perp positions
      const perpPositions = user.getActivePerpPositions();
      const perpPositionsData = perpPositions.map((position) => {
        const marketIndex = position.marketIndex;
        const market = driftClient.getPerpMarketAccount(marketIndex);
        const baseAssetAmount = position.baseAssetAmount;
        const isLong = baseAssetAmount.gt(new BN(0));

        return {
          marketIndex,
          marketSymbol: market?.name || `Market ${marketIndex}`,
          side: isLong ? "long" : "short",
          baseAmount: convertToNumber(baseAssetAmount.abs(), BASE_PRECISION),
          entryPrice: convertToNumber(
            position.quoteAssetAmount
              .abs()
              .mul(BASE_PRECISION)
              .div(baseAssetAmount.abs()),
            QUOTE_PRECISION
          ),
          unrealizedPnl: convertToNumber(
            user.getUnrealizedPNL(true, marketIndex),
            QUOTE_PRECISION
          ),
        };
      });

      // Get open orders
      const openOrders = user.getOpenOrders();

      // Unsubscribe
      await user.unsubscribe();
      await driftClient.unsubscribe();

      return {
        success: true,
        walletAddress,
        error: null,
        driftData: {
          hasAccount: true,
          accountValue: convertToNumber(accountValue, QUOTE_PRECISION),
          totalCollateral: convertToNumber(totalCollateral, QUOTE_PRECISION),
          freeCollateral: convertToNumber(freeCollateral, QUOTE_PRECISION),
          leverage: leverage / 10000, // Leverage is in basis points
          unrealizedPnl: convertToNumber(unrealizedPnl, QUOTE_PRECISION),
          unrealizedFundingPnl: convertToNumber(
            unrealizedFundingPnl,
            QUOTE_PRECISION
          ),
          spotPositions: spotPositionsData,
          perpPositions: perpPositionsData,
          openOrdersCount: openOrders.length,
          authority: userAccount.authority.toBase58(),
          subAccountId: userAccount.subAccountId,
        },
      };
    } catch (err: any) {
      console.error("❌ Error fetching Drift balance:", err);

      // Categorize errors for better user experience
      let errorMessage = "Failed to fetch Drift balances";
      let errorType = "unknown";

      if (err.message?.includes("DriftClient has no user")) {
        errorMessage =
          "No Drift account found for this wallet. Create an account at app.drift.trade to get started.";
        errorType = "no_account";
      } else if (err.message?.includes("Invalid public key")) {
        errorMessage = "Invalid wallet address format";
        errorType = "invalid_address";
      } else if (
        err.message?.includes("429") ||
        err.message?.includes("rate limit")
      ) {
        errorMessage = "RPC rate limit reached. Please try again in a moment.";
        errorType = "rate_limit";
      } else if (err.message?.includes("timeout")) {
        errorMessage =
          "Request timed out. Please check your connection and try again.";
        errorType = "timeout";
      } else if (err.message?.includes("Network request failed")) {
        errorMessage = "Network error. Please check your internet connection.";
        errorType = "network";
      } else {
        errorMessage = err.message || "Failed to fetch Drift balances";
        errorType = "unknown";
      }

      return {
        success: false,
        walletAddress,
        error: errorMessage,
        errorType,
        driftData: null,
      };
    }
  },
});

export const create_drift_account_tool = tool({
  name: "create_drift_account",
  description:
    "Create a new Drift Protocol account for the user. This prepares a transaction that the user needs to approve in their wallet. Optionally include an initial deposit.",
  inputSchema: z.object({
    walletAddress: z.string().describe("User's Solana wallet address"),
    depositAmount: z
      .number()
      .optional()
      .describe(
        "Optional initial USDC deposit amount (e.g., 100 for $100 USDC)"
      ),
    subAccountId: z
      .number()
      .default(0)
      .describe("Sub-account ID (default is 0 for main account)"),
  }),

  execute: async ({ walletAddress, depositAmount, subAccountId = 0 }) => {
    if (!walletAddress) {
      return {
        success: false,
        error: "Wallet address is required",
        requiresApproval: false,
      };
    }

    try {
      const rpcUrl =
        process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
      const connection = new Connection(rpcUrl, "confirmed");

      const WalletKeypair = Keypair.fromSecretKey(new Uint8Array(wallet));
      const DriftWallet = new Wallet(WalletKeypair);

      console.log("🔗 Preparing Drift account creation");
      console.log("📍 Wallet:", walletAddress);
      console.log("💰 Deposit amount:", depositAmount || "None");

      // Initialize Drift SDK
      const sdkConfig = initialize({ env: "devnet" });
      const bulkAccountLoader = new BulkAccountLoader(
        connection,
        "confirmed",
        1000
      );

      // Create read-only wallet for building transaction
      const dummyWallet = {
        publicKey: new PublicKey(walletAddress),
        signTransaction: async () => {
          throw new Error("Read-only");
        },
        signAllTransactions: async () => {
          throw new Error("Read-only");
        },
      };

      const driftClient = new DriftClient({
        connection,
        wallet: dummyWallet,
        programID: new PublicKey(sdkConfig.DRIFT_PROGRAM_ID),
        accountSubscription: {
          type: "polling",
          accountLoader: bulkAccountLoader,
        },
      });

      await driftClient.subscribe();

      // Check if account already exists
      try {
        const userAccountPublicKey = await driftClient.getUserAccountPublicKey(
          subAccountId
        );
        const accountInfo = await connection.getAccountInfo(
          userAccountPublicKey
        );

        if (accountInfo) {
          await driftClient.unsubscribe();
          return {
            success: false,
            error:
              "You already have a Drift account! Use 'check my drift balance' to view it.",
            requiresApproval: false,
            accountExists: true,
            accountAddress: userAccountPublicKey.toBase58(),
          };
        }
      } catch (err) {
        console.log("✅ No existing account, proceeding with creation");
      }

      // Check SOL balance for fees
      const solBalance = await connection.getBalance(
        new PublicKey(walletAddress)
      );
      const minSolRequired = 0.01 * LAMPORTS_PER_SOL; // 0.01 SOL for fees

      if (solBalance < minSolRequired) {
        await driftClient.unsubscribe();
        return {
          success: false,
          error: `Insufficient SOL for transaction fees. You need at least 0.01 SOL, but have ${(
            solBalance / LAMPORTS_PER_SOL
          ).toFixed(4)} SOL. Please add SOL to your wallet first.`,
          requiresApproval: false,
          errorType: "insufficient_sol",
        };
      }

      // Build transaction
      const transaction = new Transaction();

      // Add initialize user account instruction
      const [initUserAccountIx] = await driftClient.getInitializeUserAccountIxs(
        subAccountId
      );
      transaction.add(...initUserAccountIx);

      let depositDetails = null;

      // Add deposit instruction if specified
      if (depositAmount && depositAmount > 0) {
        const marketIndex = 0; // USDC
        const market = driftClient.getSpotMarketAccount(marketIndex);

        if (!market) {
          await driftClient.unsubscribe();
          return {
            success: false,
            error: "USDC market not found on Drift",
            requiresApproval: false,
          };
        }

        // Convert deposit amount to proper precision
        const depositAmountBN = new BN(
          Math.floor(depositAmount * Math.pow(10, market.decimals))
        );

        // Get user's USDC token account
        const userTokenAccount = await getAssociatedTokenAddress(
          market.mint,
          new PublicKey(walletAddress)
        );

        // Check if token account exists
        const tokenAccountInfo = await connection.getAccountInfo(
          userTokenAccount
        );
        if (!tokenAccountInfo) {
          await driftClient.unsubscribe();
          return {
            success: false,
            error: `No USDC token account found. Please ensure you have USDC in your wallet. You can get devnet USDC from a faucet.`,
            requiresApproval: false,
            errorType: "no_usdc_account",
            suggestion: "Get devnet USDC from: https://faucet.circle.com/",
          };
        }

        // Check token balance
        const tokenAccount = await connection.getTokenAccountBalance(
          userTokenAccount
        );
        const currentBalance =
          parseFloat(tokenAccount.value.amount) / Math.pow(10, market.decimals);

        if (currentBalance < depositAmount) {
          await driftClient.unsubscribe();
          return {
            success: false,
            error: `Insufficient USDC balance. You have ${currentBalance.toFixed(
              2
            )} USDC but tried to deposit ${depositAmount} USDC.`,
            requiresApproval: false,
            errorType: "insufficient_usdc",
            currentBalance: currentBalance,
            requestedAmount: depositAmount,
          };
        }

        // Create deposit instruction
        const depositIx = await driftClient.getDepositInstruction(
          depositAmountBN,
          marketIndex,
          userTokenAccount
        );
        transaction.add(depositIx);

        depositDetails = {
          amount: depositAmount,
          token: "USDC",
          marketIndex: marketIndex,
        };
      }

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      await driftClient.unsubscribe();

      // Serialize transaction for client
      const serializedTx = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      const txBase64 = Buffer.from(serializedTx).toString("base64");

      return {
        success: true,
        message: depositAmount
          ? `Transaction ready! This will create your Drift account and deposit ${depositAmount} USDC.`
          : "Transaction ready! This will create your Drift account.",
        requiresApproval: true,
        transaction: txBase64,
        depositDetails,
        estimatedFees: "~0.001 SOL",
        instructions: [
          "1. Review the transaction details above",
          "2. Approve the transaction in your wallet when prompted",
          "3. Wait for confirmation (usually 5-10 seconds)",
          depositAmount
            ? "4. Your account will be created and funded with USDC"
            : "4. Your account will be created and ready to use",
        ],
      };
    } catch (err: any) {
      console.error("❌ Error preparing account creation:", err);

      let errorMessage = "Failed to prepare account creation";
      let errorType = "unknown";

      if (err.message?.includes("Invalid public key")) {
        errorMessage = "Invalid wallet address format";
        errorType = "invalid_address";
      } else if (err.message?.includes("insufficient")) {
        errorMessage = "Insufficient funds for this operation";
        errorType = "insufficient_funds";
      } else {
        errorMessage = err.message || "Failed to prepare account creation";
      }

      return {
        success: false,
        error: errorMessage,
        errorType,
        requiresApproval: false,
      };
    }
  },
});

const MARKET_MAP: Record<string, number> = {
  USDC: 0,
  SOL: 1,
  BTC: 2,
  ETH: 3,
  // Add more markets as needed
};

export const drift_deposit = tool({
  name: "drift_deposit",
  description:
    "Deposit crypto assets into a Drift Protocol account on Solana devnet. The agent should call this when the user wants to deposit funds into their Drift trading account. Supports USDC, SOL, BTC, ETH and other Drift-supported tokens.",

  inputSchema: z.object({
    token: z
      .string()
      .describe("Token symbol to deposit (e.g., 'USDC', 'SOL', 'BTC', 'ETH')"),
    amount: z
      .number()
      .positive()
      .describe("Amount of tokens to deposit (in token units, not lamports)"),
    walletAddress: z
      .string()
      .describe("User's Solana wallet public key (base58 string)"),
  }),

  execute: async ({ token, amount, walletAddress }) => {
    let driftClient: DriftClient | null = null;

    try {
      // Validate wallet address
      let userPubkey: PublicKey;
      try {
        userPubkey = new PublicKey(walletAddress);
      } catch (error) {
        return {
          success: false,
          error: "Invalid wallet address format",
          details: "Please provide a valid Solana public key",
        };
      }

      // Get market index
      const marketIndex = MARKET_MAP[token.toUpperCase()];
      if (marketIndex === undefined) {
        return {
          success: false,
          error: `Unsupported token: ${token}`,
          details: `Supported tokens: ${Object.keys(MARKET_MAP).join(", ")}`,
        };
      }

      // Setup connection to devnet
      const connection = new Connection(
        "https://api.devnet.solana.com",
        "confirmed"
      );
      // @ts-ignore
      const WalletKeypair = Keypair.fromSecretKey(new Uint8Array(wallet));
      const DriftWallet = new Wallet(WalletKeypair);

      if (!WalletKeypair) {
        return {
          success: false,
          error: "Unable to load wallet keypair",
          details: "Wallet authentication failed",
        };
      }

      const Wallet_ = new Wallet(WalletKeypair);

      // Initialize Drift client
      driftClient = new DriftClient({
        connection,
        wallet: Wallet_,
        env: "devnet",
      });
      await driftClient.subscribe();

      // Check if user account exists
      const userAccountPubkey = await getUserAccountPublicKey(
        driftClient.program.programId,
        userPubkey,
        0 // subAccountId
      );

      let userAccountExists = false;
      try {
        const userAccountInfo = await connection.getAccountInfo(
          userAccountPubkey
        );
        userAccountExists = userAccountInfo !== null;
      } catch (error) {
        userAccountExists = false;
      }

      // Get spot market info
      const spotMarket = driftClient.getSpotMarketAccount(marketIndex);
      if (!spotMarket) {
        return {
          success: false,
          requiresSignature: false,
          error: `Spot market for ${token} not found`,
          details: `Market index ${marketIndex} is not available`,
        };
      }

      // Get user's token account
      const userTokenAccount = await getAssociatedTokenAddress(
        spotMarket.mint,
        userPubkey,
        false,
        TOKEN_PROGRAM_ID
      );

      // Check if token account exists and has balance
      let tokenAccountExists = false;
      try {
        const tokenAccountInfo = await connection.getTokenAccountBalance(
          userTokenAccount
        );
        tokenAccountExists = true;

        const decimals = tokenAccountInfo.value.decimals;
        const balanceAmount =
          parseFloat(tokenAccountInfo.value.amount) / Math.pow(10, decimals);

        if (balanceAmount < amount) {
          return {
            success: false,
            requiresSignature: false,
            error: "Insufficient token balance",
            details: `You have ${balanceAmount} ${token} but trying to deposit ${amount} ${token}`,
            amount,
            token,
            marketIndex,
          };
        }
      } catch (error) {
        return {
          success: false,
          requiresSignature: false,
          error: "Token account not found",
          details: `You don't have a ${token} token account. Please ensure you have ${token} in your wallet first.`,
          amount,
          token,
          marketIndex,
        };
      }

      // Build the transaction
      const transaction = new Transaction();

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = userPubkey;

      // Add initialize user instruction if account doesn't exist
      if (!userAccountExists) {
        console.log(
          "User account does not exist. Adding initialization instruction..."
        );
        const [initIx] = await driftClient.getInitializeUserAccountIxs(
          0, // subAccountId
          "Main Account"
        );
        transaction.add(...initIx);
      }

      // Convert amount to BN with proper decimals
      const decimals = marketIndex === 0 ? 6 : 9;
      const amountBN = new BN(amount * Math.pow(10, decimals));

      // Add deposit instruction
      const depositIx = await driftClient.getDepositInstruction(
        amountBN,
        marketIndex,
        userTokenAccount
      );
      transaction.add(depositIx);

      // Serialize transaction to base58
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const transactionBase58 = bs58.encode(serializedTransaction);

      console.log(`✅ Transaction prepared for ${amount} ${token} deposit`);

      return {
        success: true,
        requiresSignature: true,
        transaction: transactionBase58,
        amount,
        token,
        marketIndex,
        userAccountExists,
        needsInitialization: !userAccountExists,
        details: userAccountExists
          ? `Transaction ready to deposit ${amount} ${token}. Please sign with your wallet.`
          : `Transaction ready to initialize your Drift account and deposit ${amount} ${token}. Please sign with your wallet.`,
        instructions: {
          message: "Please sign this transaction with your Solana wallet",
          steps: [
            !userAccountExists
              ? "Initialize Drift account (first time only)"
              : null,
            `Deposit ${amount} ${token} to Drift`,
          ].filter(Boolean),
        },
      };
    } catch (error: any) {
      console.error("Transaction preparation error:", error);

      let errorMessage = error.message || "Unknown error occurred";
      let errorDetails = "";

      if (error.logs) {
        errorDetails = `Error logs: ${error.logs.join(" | ")}`;
      }

      return {
        success: false,
        requiresSignature: false,
        error: errorMessage,
        details: errorDetails || errorMessage,
        amount,
        token,
        marketIndex: MARKET_MAP[token.toUpperCase()],
      };
    } finally {
      // Cleanup
      if (driftClient) {
        try {
          await driftClient.unsubscribe();
        } catch (e) {
          console.error("Error unsubscribing:", e);
        }
      }
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
  get_drift_balance,
  create_drift_account_tool,
  drift_deposit,
};
