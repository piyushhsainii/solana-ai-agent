// app/api/agent/route.ts

import { LLM } from "@/lib/llm/client";
import { ModelMessage } from "ai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // better performance on Vercel

export async function POST(req: NextRequest) {
  try {
    const { prompt, messages, body, walletAddress: wallet } = await req.json();
    const chats: ModelMessage[] = messages;

    const result = LLM(chats, wallet);
    console.log(result.textStream);
    return result.toUIMessageStreamResponse({});
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
