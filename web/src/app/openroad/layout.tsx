import type { Metadata } from "next";
import { headers } from "next/headers";
import {
  mainSignupHref,
  platformHomeHref,
  platformLoginHref,
  SITE_URL,
} from "@/lib/site";
import { WorkstationAuthGuard } from "@/components/WorkstationAuthGuard";
import { OpenroadHeaderNav } from "@/components/OpenroadHeaderNav";
import { OpenroadPlatformGate } from "@/components/OpenroadPlatformGate";

export const metadata: Metadata = {
  title: "Cloud OpenROAD Automation & ASIC Physical Design Platform | Ace-Seek",
  description:
    "End-to-end OpenROAD automation for ASIC physical design and tapeout signoff. Execute cloud-hosted Yosys synthesis, automated floorplanning, macro placement, TritonCTS, routing, and Magic DRC/LVS in your browser.",
  keywords: [
    "OpenROAD automation",
    "OpenROAD Cloud PnR",
    "RTL to GDS automation",
    "Cloud ASIC Physical Design",
    "OpenLane cloud runner",
    "SkyWater 130nm OpenROAD",
    "Automated Floorplanning Macro Placement",
    "TritonCTS Clock Tree Synthesis",
    "Magic DRC Netgen LVS cloud signoff",
    "OpenSource EDA Automation",
    "ASIC PnR Cloud Execution",
    "OpenROAD Tcl Automation",
    "Zero-install VLSI tapeout",
  ],
  alternates: {
    canonical: "https://openroad.ace-seek.com",
  },
  openGraph: {
    title: "Cloud OpenROAD Automation & ASIC Physical Design Platform · Ace-Seek",
    description:
      "Run complete OpenROAD physical design automation from RTL to GDSII. Automated macro placement, TritonCTS, FastRoute, and DRC/LVS signoff in cloud containers.",
    url: "https://openroad.ace-seek.com",
    siteName: "Ace-Seek OpenROAD Automation",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cloud OpenROAD Automation & ASIC Physical Design Platform · Ace-Seek",
    description:
      "Browser-based OpenROAD automation runner for ASIC synthesis, floorplanning, macro placement, CTS, routing, and GDS signoff.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://openroad.ace-seek.com/#website",
      "url": "https://openroad.ace-seek.com",
      "name": "Ace-Seek OpenROAD Automation Platform",
      "description": "Cloud-native OpenROAD automation and RTL-to-GDS physical design execution platform.",
      "publisher": {
        "@type": "Organization",
        "name": "Ace-Seek",
        "url": "https://www.ace-seek.com"
      }
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://openroad.ace-seek.com/#application",
      "name": "Ace-Seek Cloud OpenROAD Runner",
      "operatingSystem": "Cloud / Web Browser",
      "applicationCategory": "DesignApplication",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "86",
        "bestRating": "5",
        "worstRating": "1"
      },
      "description": "Browser-based OpenROAD and OpenLane physical design automation engine supporting SkyWater 130nm, GF180MCU, and automated floorplanning, placement, CTS, routing, and DRC/LVS verification."
    },
    {
      "@type": "FAQPage",
      "@id": "https://openroad.ace-seek.com/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is OpenROAD automation?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "OpenROAD automation is the autonomous, script-driven execution of digital ASIC physical design from Register-Transfer Level (RTL) Verilog to final tapeout-ready GDSII polygons without requiring human intervention. It integrates Yosys logic synthesis, automated floorplanning, macro placement, Power Distribution Network (PDN) generation, RePlAce global placement, TritonCTS clock tree synthesis, FastRoute global routing, TritonRoute detailed routing, and Magic/Netgen physical signoff."
          }
        },
        {
          "@type": "Question",
          "name": "Can I run OpenROAD automation directly in the browser?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Ace-Seek provides a cloud-native OpenROAD automation platform where designers can upload RTL and SDC constraints, trigger containerized OpenROAD/OpenLane runs on dedicated compute clusters, view real-time log streaming, preview die layouts and macro placement, and download full signoff packages (GDS, DEF, SPEF, SDF, and DRC/LVS reports) without installing Linux or Docker locally."
          }
        },
        {
          "@type": "Question",
          "name": "Which Process Design Kits (PDKs) are supported by Ace-Seek OpenROAD?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Ace-Seek natively supports open-source PDKs including SkyWater 130nm (sky130A and sky130B with ReRAM support), GlobalFoundries 180nm MCU (GF180MCU), and ASAP 7nm predictive FinFET technology."
          }
        }
      ]
    }
  ]
};


export default async function OpenroadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const host = (await headers()).get("host");
  const homeHref = platformHomeHref("openroad", host);
  const loginHref = platformLoginHref("openroad", host);
  const signupHref = mainSignupHref();

  return (
    <div
      data-openroad-shell
      className="h-dvh max-h-dvh flex flex-col overflow-hidden bg-[var(--neu-bg)] text-[var(--neu-text)] font-mono"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OpenroadHeaderNav
        homeHref={homeHref}
        loginHref={loginHref}
        signupHref={signupHref}
        mainSiteUrl={SITE_URL}
      />
      <main className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">
        <WorkstationAuthGuard>
          <OpenroadPlatformGate>{children}</OpenroadPlatformGate>
        </WorkstationAuthGuard>
      </main>
    </div>
  );
}
