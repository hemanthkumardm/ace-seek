import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.ace-seek.com"),
  title: {
    default: "Ace-Seek — Interactive Physical Design & VLSI Engineering Platform",
    template: "%s · Ace-Seek",
  },
  description:
    "Master ASIC Physical Design, SDC/MMMC constraint generation, UPF power intent, STA timing analysis, and live cloud OpenROAD PnR execution. Powered by zero-token engineering developer tools.",
  keywords: [
    "Physical Design Online Course",
    "VLSI Training",
    "Live OpenROAD PnR Cloud",
    "SDC Constraint Generator",
    "MMMC File Authoring",
    "UPF Power Studio",
    "Static Timing Analysis STA",
    "ASIC Layout Practice",
    "VLSI Interview Preparation",
    "Doc Compiler Markdown PDF TeX",
    "Developer Tools Ace-Seek",
  ],
  authors: [{ name: "Ace-Seek Team", url: "https://www.ace-seek.com" }],
  creator: "Ace-Seek",
  publisher: "Ace-Seek",
  verification: {
    google: [
      "google9773c15e180cf625",
      "wZU20vwDQ4vWafYaQXmOqa30bxwua7-bMOYZKvWSXnE",
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.ace-seek.com",
    siteName: "Ace-Seek",
    title: "Ace-Seek — Interactive Physical Design & VLSI Engineering Platform",
    description:
      "Bridge the gap between layout theory and silicon practice with live OpenROAD PnR environments, SDC/MMMC studios, and developer workstations.",
    images: [
      {
        url: "/icon.svg",
        width: 800,
        height: 800,
        alt: "Ace-Seek Platform Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ace-Seek — Interactive Physical Design & VLSI Engineering Platform",
    description:
      "Interactive OpenROAD cloud environments, SDC/MMMC authoring, STA timing analysis, and zero-token developer tools.",
    images: ["/icon.svg"],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

const CLERK_PUB_KEY =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_c3VwZXItY2F0dGxlLTc5LmNsZXJrLmFjY291bnRzLmRldiQ";

const JSON_LD_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.ace-seek.com/#organization",
      name: "Ace-Seek",
      url: "https://www.ace-seek.com",
      logo: "https://www.ace-seek.com/icon.svg",
      description:
        "Interactive physical design platform, live OpenROAD cloud environments, and engineering developer tools for ASIC and VLSI teams.",
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.ace-seek.com/#website",
      url: "https://www.ace-seek.com",
      name: "Ace-Seek",
      publisher: {
        "@id": "https://www.ace-seek.com/#organization",
      },
      description:
        "Command center for Ace-Seek interactive VLSI studios, OpenROAD PnR automation, and engineering developer tools.",
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://www.ace-seek.com/#application",
      name: "Ace-Seek Interactive VLSI & Hardware Engineering Platform",
      operatingSystem: "Web",
      applicationCategory: "DeveloperApplication",
      url: "https://www.ace-seek.com",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Interactive browser workstation platform for ASIC physical design, SDC/MMMC authoring, STA timing analysis, OpenROAD cloud PnR, and technical document compilation.",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(JSON_LD_STRUCTURED_DATA),
          }}
        />
      </head>
      <body className="h-full min-h-0 flex flex-col bg-[var(--bg-main)] text-[var(--foreground)]">
        <ClerkProvider
          publishableKey={CLERK_PUB_KEY}
          signInUrl="/login"
          signUpUrl="/signup"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
          afterSignOutUrl="/"
        >
          {/* Minimal global auth chrome (pages also have SiteHeader) */}
          <div className="sr-only">
            <Show when="signed-out">
              <SignInButton />
              <SignUpButton />
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
