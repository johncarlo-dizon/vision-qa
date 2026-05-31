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
              text: `You are a helpful AI assistant that answers coding and general questions detected from a camera feed.

Look at this image carefully.

STEP 1: Determine if there is a visible question in the image (text on screen, paper, whiteboard, etc.)

STEP 2: If YES, answer it following these rules:

LANGUAGE DETECTION (critical):
- Look for explicit language mentions: "in Python", "using JavaScript", "in Java", "in C++", etc.
- Look for language-specific syntax already shown in the problem
- Look for file extensions, imports, or keywords that hint at the language
- If a specific language is mentioned or implied, YOU MUST answer in that exact language
- If no language is specified and it's a coding problem, default to Python
- NEVER switch languages from what the question asks for

FORMATTING RULES:
- Write explanations as normal text first (brief, 1-2 sentences max)
- For ANY code, ALWAYS use a markdown code block with the correct language tag:
  \`\`\`python
  def example():
      pass
  \`\`\`
- Available tags: python, javascript, typescript, java, cpp, c, csharp, php, ruby, go, rust, swift, kotlin, sql, bash
- NEVER write code as plain inline text
- For multiple choice questions: state the answer letter + brief explanation, no code needed
- For math questions: show the solution steps clearly
- Use **bold** only for the final answer or key terms

STEP 3: Return ONLY valid JSON, nothing else before or after:
{"hasQuestion": true, "question": "<detected question>", "language": "<detected language or 'none'>", "answer": "<your formatted answer>"}

If NO question detected:
{"hasQuestion": false, "question": "", "language": "none", "answer": ""}`,
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
      // Ensure language field exists
      if (!parsed.language) parsed.language = "none";
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
}import Groq from "groq-sdk";
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
              text: `You are a helpful AI assistant that answers coding and general questions detected from a camera feed.

Look at this image carefully.

STEP 1: Determine if there is a visible question in the image (text on screen, paper, whiteboard, etc.)

STEP 2: If YES, answer it following these rules:

LANGUAGE DETECTION (critical):
- Look for explicit language mentions: "in Python", "using JavaScript", "in Java", "in C++", etc.
- Look for language-specific syntax already shown in the problem
- Look for file extensions, imports, or keywords that hint at the language
- If a specific language is mentioned or implied, YOU MUST answer in that exact language
- If no language is specified and it's a coding problem, default to Python
- NEVER switch languages from what the question asks for

FORMATTING RULES:
- Write explanations as normal text first (brief, 1-2 sentences max)
- For ANY code, ALWAYS use a markdown code block with the correct language tag:
  \`\`\`python
  def example():
      pass
  \`\`\`
- Available tags: python, javascript, typescript, java, cpp, c, csharp, php, ruby, go, rust, swift, kotlin, sql, bash
- NEVER write code as plain inline text
- For multiple choice questions: state the answer letter + brief explanation, no code needed
- For math questions: show the solution steps clearly
- Use **bold** only for the final answer or key terms

STEP 3: Return ONLY valid JSON, nothing else before or after:
{"hasQuestion": true, "question": "<detected question>", "language": "<detected language or 'none'>", "answer": "<your formatted answer>"}

If NO question detected:
{"hasQuestion": false, "question": "", "language": "none", "answer": ""}`,
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
      // Ensure language field exists
      if (!parsed.language) parsed.language = "none";
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