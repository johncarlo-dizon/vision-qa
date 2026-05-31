import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const client = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  try {
    const { image, defaultLang } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const forceLangNote = defaultLang && defaultLang !== "auto"
      ? `IMPORTANT: The user has set a DEFAULT LANGUAGE of "${defaultLang}". If the question does NOT explicitly mention a programming language, you MUST answer in "${defaultLang}". Only override this if the question very explicitly requires a different language (e.g., "Write this in Java").`
      : `If no language is specified and it's a coding problem, default to Python.`;

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
              text: `You are a helpful AI assistant that answers coding and general questions detected from a camera feed.

Look at this image carefully.

STEP 1: Determine if there is a visible question in the image (text on screen, paper, whiteboard, etc.)

STEP 2: If YES, answer it following these rules:

LANGUAGE DETECTION:
- Look for explicit language mentions: "in Python", "using JavaScript", "in Java", "in C++", etc.
- Look for language-specific syntax, imports, or keywords shown in the problem
- ${forceLangNote}
- NEVER switch languages from what the question asks for

FORMATTING RULES:
- Write a brief explanation (1-2 sentences max) before the code
- For ANY code, ALWAYS use a markdown code block with the correct language tag:
  \`\`\`python
  def example():
      pass
  \`\`\`
- Available tags: python, javascript, typescript, java, cpp, c, csharp, php, ruby, go, rust, swift, kotlin, sql, bash
- NEVER write code as plain inline text
- For multiple choice: state the answer letter + one sentence explanation, no code needed
- For math: show solution steps clearly
- Use **bold** only for the final answer or key terms

STEP 3: Return ONLY valid JSON, nothing else before or after:
{"hasQuestion": true, "question": "<detected question>", "language": "<detected or forced language, e.g. python, javascript, java, etc., or 'none' if not a coding question>", "answer": "<your formatted answer>"}

If NO question detected:
{"hasQuestion": false, "question": "", "language": "none", "answer": ""}`,
            },
          ],
        },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";

    try {
      const clean = text
        .replace(/^[^{]*/, "")
        .replace(/[^}]*$/, "")
        .trim();

      const parsed = JSON.parse(clean);
      if (!parsed.language) parsed.language = "none";
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ hasQuestion: false, question: "", language: "none", answer: "" });
    }
  } catch (error: unknown) {
    console.error("Groq API error:", error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Could not resolve") || message.includes("authentication")) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
    return NextResponse.json({ hasQuestion: false, question: "", language: "none", answer: "" });
  }
}