import type { Metadata } from "next";
import { toolsPageMetadata } from "@/lib/site";
import ToolClient from "./ToolClient";

export const metadata: Metadata = toolsPageMetadata({
  slug: "ai-sanitizer",
  title: "AI Sanitizer — Clean LLM Output · Ace-Seek Tools",
  description:
    "Strip AI fluff, normalize Markdown code fences, and prepare ChatGPT/Claude output for compilation. Ace-Seek AI Sanitizer.",
});

export default function Page() {
  return <ToolClient />;
}
