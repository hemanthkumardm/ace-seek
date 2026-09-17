import type { Metadata } from "next";
import { toolsPageMetadata } from "@/lib/site";

export const metadata: Metadata = toolsPageMetadata({
  slug: "format-converter",
  title: "Format Converter — JSON · YAML · TOML · CSV · Ace-Seek Tools",
  description:
    "Convert JSON, YAML, TOML, CSV and related formats. Multi-format converter on Ace-Seek Tools.",
});

export default function FormatConverterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
