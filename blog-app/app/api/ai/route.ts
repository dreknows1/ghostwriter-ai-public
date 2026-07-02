import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getSessionFromRequest } from "@/lib/auth";

type Action = "title" | "description" | "outline" | "polish" | "tags";

const PROMPTS: Record<Action, (input: string) => string> = {
  title: (input) =>
    `Suggest 5 punchy, SEO-friendly blog post titles for this draft. Each title should be under 70 characters, specific, and avoid clickbait. Return as a numbered list, no preamble.\n\nDraft:\n${input}`,
  description: (input) =>
    `Write a single 150-160 character meta description for this blog post that would compel a click from search results. Return only the description, no quotes, no preamble.\n\nPost:\n${input}`,
  outline: (input) =>
    `Generate a clear blog post outline as Markdown using H2 (##) headings and brief bullet notes under each section. Aim for 4-6 sections. Topic:\n${input}`,
  polish: (input) =>
    `Polish this blog post for clarity and flow without changing the meaning or adding new claims. Keep all Markdown formatting. Return only the revised Markdown, no preamble.\n\nDraft:\n${input}`,
  tags: (input) =>
    `Suggest 3-6 lowercase, hyphenated tags for this blog post. Return only a comma-separated list, no preamble.\n\nPost:\n${input}`,
};

export async function POST(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = body.action as Action;
  const input = String(body.input || "").slice(0, 16000);
  if (!action || !(action in PROMPTS)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  if (!input.trim()) {
    return NextResponse.json({ error: "Empty input" }, { status: 400 });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });

  const client = new OpenAI({ apiKey: key });
  const prompt = PROMPTS[action](input);

  try {
    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert blog editor and SEO copywriter." },
        { role: "user", content: prompt },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });
    const text = r.choices[0]?.message?.content?.trim() || "";
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "AI request failed" }, { status: 502 });
  }
}
