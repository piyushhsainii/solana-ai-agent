// lib/llm/client.ts

import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToModelMessages, ModelMessage, streamText } from "ai";
import { systemPrompt } from "./system_prompt";

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

export const LLM = (messages: any) => {
  if (!messages || messages.length === 0) {
    throw new Error("No messages provided to LLM()");
  }

  return streamText({
    model: model,
    system: systemPrompt,
    messages: convertToModelMessages(messages),

    onError: (error) => {
      console.error("Error during streaming:", error);
    },
  });
};
