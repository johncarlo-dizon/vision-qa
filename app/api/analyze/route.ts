import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Strip data URL prefix to get raw base64
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: base64Data,
              },
            },
            {
              type: "text",
              text: `You are a helpful AI assistant that answers questions detected from a camera feed.

Look at this image carefully.

1. First, determine if there is a visible question in the image (text on screen, written on paper, whiteboard, etc.)
2. If YES: answer the question clearly and concisely. Format your response as JSON: {"hasQuestion": true, "question": "<the detected question>", "answer": "<your answer>"}
3. If NO question is detected: respond with JSON: {"hasQuestion": false, "question": "", "answer": ""}

Respond ONLY with valid JSON, no extra text.`,
            },
          ],
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ hasQuestion: false, question: "", answer: "" });
    }
  } catch (error) {
    console.error("Anthropic API error:", error);
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}
