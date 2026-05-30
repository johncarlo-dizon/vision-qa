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
      max_tokens: 1024,
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

1. First, determine if there is a visible question in the image (text on screen, written on paper, whiteboard, etc.)
2. If YES: answer the question clearly and concisely.
   - If the answer involves CODE, wrap it in a markdown code block with the language: \`\`\`python\n...code...\n\`\`\`
   - If multiple code snippets, use separate code blocks
   - Use **bold** for key terms
   - Format your response as JSON: {"hasQuestion": true, "question": "<the detected question>", "answer": "<your formatted answer>"}
3. If NO question is detected: respond with JSON: {"hasQuestion": false, "question": "", "answer": ""}

Respond ONLY with valid JSON, no extra text.`,
            },
          ],
        },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";

    try {
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      return NextResponse.json(parsed);
    } catch {
      // If Groq didn't return valid JSON, treat it as no question found
      return NextResponse.json({ hasQuestion: false, question: "", answer: "" });
    }
  } catch (error: unknown) {
    console.error("Groq API error:", error);

    // Don't show error to user for normal "no question" cases
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Could not resolve") || message.includes("authentication")) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // For all other errors, silently return no question found
    return NextResponse.json({ hasQuestion: false, question: "", answer: "" });
  }
}