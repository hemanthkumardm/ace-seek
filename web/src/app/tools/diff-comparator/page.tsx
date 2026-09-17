import type { Metadata } from "next";
import { toolsPageMetadata } from "@/lib/site";
import ToolClient from "./ToolClient";

export const metadata: Metadata = toolsPageMetadata({
  slug: "diff-comparator",
  title: "Diff Comparator — Visual Code Diff · Ace-Seek Tools",
  description: "Side-by-side visual diff for code and text. Engineering Diff Comparator on Ace-Seek Tools.",
});

export default function Page() {
  return <ToolClient />;
}
