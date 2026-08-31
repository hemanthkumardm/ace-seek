import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Request Max access",
  description:
    "Request Ace-Seek Max access. We verify your details and email your API key.",
};

export default function TrialLayout({ children }: { children: ReactNode }) {
  return children;
}
