import type { Metadata } from "next";
import { toolsPageMetadata } from "@/lib/site";
import ToolClient from "./ToolClient";

export const metadata: Metadata = toolsPageMetadata({
  slug: "table-builder",
  title: "Table Builder — Wide Table Geometry · Ace-Seek Tools",
  description: "Build and format wide engineering tables for docs and reports. Table Builder on Ace-Seek Tools.",
});

export default function Page() {
  return <ToolClient />;
}
