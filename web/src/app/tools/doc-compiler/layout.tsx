import type { Metadata } from "next";
import { toolsPageMetadata } from "@/lib/site";

export const metadata: Metadata = toolsPageMetadata({
  slug: "doc-compiler",
  title: "Doc Compiler — MD · PDF · TeX · DOCX · Ace-Seek Tools",
  description:
    "Convert Markdown, TeX, PDF, and DOCX for engineering documentation. Zero-token Doc Compiler on Ace-Seek Tools.",
});

export default function DocCompilerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
