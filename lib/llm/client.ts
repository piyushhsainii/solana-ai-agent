// lib/llm/client.ts

import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  convertToModelMessages,
  ModelMessage,
  smoothStream,
  streamText,
} from "ai";
import { systemPrompt } from "./system_prompt";
import { solanaTools } from "./tools";
const PROVIDER = process.env.LLM_PROVIDER || "openai"; // "openai" | "gemini"

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const gemini = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const model =
  PROVIDER === "openai"
    ? openai("gpt-4o-mini") // lightweight, fast model
    : gemini("gemini-2.5-pro");

export const LLM = (messages: any, walletAddress: string) => {
  if (!messages || messages.length === 0) {
    throw new Error("No messages provided to LLM()");
  }

  return streamText({
    model: model,
    system: systemPrompt(walletAddress),
    messages: convertToModelMessages(messages),
    tools: solanaTools,
    onFinish: async ({
      dynamicToolCalls,
      dynamicToolResults,
      reasoningText,
      totalUsage,
      finishReason,
      text,
    }) => {
      console.log("=== Streaming Finished ===");
      console.log("Dynamic tool calls:", dynamicToolCalls);
      console.log("Dynamic tool results:", dynamicToolResults);
      console.log("Reasoning text:", reasoningText);
      console.log("Total usage:", totalUsage);
      console.log("Finish reason:", finishReason);

      // You can save to database here
      // await saveConversation({ messages, toolCalls: dynamicToolCalls, usage: totalUsage });
    },
    experimental_transform: smoothStream({
      delayInMs: 20, // optional: defaults to 10ms
      chunking: "line", // optional: defaults to 'word'
    }),

    onError: (error) => {
      console.error("Error during streaming:", error);
    },
  });
};
