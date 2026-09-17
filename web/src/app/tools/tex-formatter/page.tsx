import type { Metadata } from "next";
import { toolsPageMetadata } from "@/lib/site";
import ToolClient from "./ToolClient";

export const metadata: Metadata = toolsPageMetadata({
  slug: "tex-formatter",
  title: "TeX Formatter — LaTeX · KaTeX Math · Ace-Seek Tools",
  description: "Format and preview LaTeX / TeX math with KaTeX. TeX Formatter on Ace-Seek Tools.",
});

export default function Page() {
  return <ToolClient />;
}
