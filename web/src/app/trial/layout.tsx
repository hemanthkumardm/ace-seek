import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Request 7-day Max trial",
  description:
    "Request a 7-day Ace-Seek Max trial. We verify your college or company details and email your API key.",
};

export default function TrialLayout({ children }: { children: ReactNode }) {
  return children;
}
