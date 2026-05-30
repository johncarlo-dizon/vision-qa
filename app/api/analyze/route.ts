import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const client = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const response = await client.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: image },
            },
            {
              type: "text",
              text: `You are a helpful AI assistant that answers questions detected from a camera feed.

Look at this image carefully.

STEP 1: Determine if there is a visible question in the image (text on screen, paper, whiteboard, etc.)

STEP 2: If YES, answer it. Follow these STRICT formatting rules for the "answer" field:
- Always write explanations as normal text
- For ANY code, ALWAYS wrap it in a markdown code block like this:
  \`\`\`python
  def hello():
      print("Hello")
  \`\`\`
- Use the correct language tag: python, javascript, java, cpp, etc.
- NEVER write code inline as plain text
- You may have multiple code blocks if needed
- Use **bold** for important terms

STEP 3: Return ONLY this JSON (no extra text before or after):
{"hasQuestion": true, "question": "<detected question text>", "answer": "<formatted answer with proper markdown code blocks>"}

If NO question detected:
{"hasQuestion": false, "question": "", "answer": ""}`,
            },
          ],
        },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";

    try {
      // Clean up common JSON issues
      const clean = text
        .replace(/^[^{]*/, "") // remove anything before first {
        .replace(/[^}]*$/, "") // remove anything after last }
        .trim();

      const parsed = JSON.parse(clean);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ hasQuestion: false, question: "", answer: "" });
    }
  } catch (error: unknown) {
    console.error("Groq API error:", error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Could not resolve") || message.includes("authentication")) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
    return NextResponse.json({ hasQuestion: false, question: "", answer: "" });
  }
}