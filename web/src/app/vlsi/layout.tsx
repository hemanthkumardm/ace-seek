import type { Metadata } from "next";
import { headers } from "next/headers";
import {
  mainSignupHref,
  platformHomeHref,
  platformLoginHref,
  SITE_URL,
} from "@/lib/site";
import { VlsiFrame } from "@/components/VlsiFrame";

export const metadata: Metadata = {
  title: "Interactive Physical Design & VLSI Design Studios · vlsi.ace-seek.com",
  description:
    "Interactive ASIC design platform: SDC Studio, MMMC multi-corner authoring, UPF Power Studio, STA timing analysis, and 34+ production VLSI engineering calculators.",
  keywords: [
    "Physical Design Online Course",
    "VLSI Training Platform",
    "SDC Constraint Generator",
    "MMMC File Generator",
    "UPF Power Intent Studio",
    "Static Timing Analysis STA",
    "ASIC Floorplanning Placement CTS",
    "VLSI Interview Prep",
  ],
  openGraph: {
    title: "Interactive Physical Design & VLSI Design Studios · Ace-Seek",
    description:
      "Author SDC & MMMC files, configure UPF power intent, debug setup/hold slack, and run live VLSI engineering calculators directly in your browser.",
    url: "https://vlsi.ace-seek.com",
    siteName: "Ace-Seek VLSI Platform",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Interactive Physical Design & VLSI Design Studios · Ace-Seek",
    description:
      "Master ASIC physical design with interactive SDC/MMMC studios, STA timing analysis, and live OpenROAD PnR tools.",
  },
};

export default async function VlsiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const host = (await headers()).get("host");
  const homeHref = platformHomeHref("vlsi", host);
  const loginHref = platformLoginHref("vlsi", host);
  const signupHref = mainSignupHref();

  return (
    <VlsiFrame
      homeHref={homeHref}
      loginHref={loginHref}
      signupHref={signupHref}
      mainSiteUrl={SITE_URL}
    >
      {children}
    </VlsiFrame>
  );
}
