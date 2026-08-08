import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Ace-Seek | VLSI Helpers",
  description: "A professional suite of helper tools for VLSI engineers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Global Ace-Seek Navbar */}
        <nav className="brutal-border border-b-4 bg-white text-black px-4 py-2 flex items-center justify-between shrink-0 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <a href="/" className="text-xl md:text-2xl font-black tracking-tighter uppercase hover:bg-[var(--accent)] transition-colors px-2 py-1 brutal-border">
              ACE-SEEK
            </a>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1 hidden sm:inline-block">VLSI Helper Suite</span>
          </div>
          
          <div className="flex gap-2 text-xs font-bold uppercase flex-wrap">
            <a href="/" className="brutal-btn py-1 px-3 bg-[var(--background)] hover:bg-[var(--accent)]">
              Home
            </a>
            <a href="/compiler" className="brutal-btn py-1 px-3 bg-[var(--background)] hover:bg-[var(--accent)]">
              Doc Compiler
            </a>
            <a href="/sdc-calculator" className="brutal-btn py-1 px-3 bg-[var(--background)] hover:bg-[var(--accent)]">
              SDC Calc
            </a>
            <a href="/script-helper" className="brutal-btn py-1 px-3 bg-[var(--background)] hover:bg-[var(--accent)]">
              Script Helper
            </a>
          </div>
        </nav>

        <main className="flex-1 flex flex-col min-h-0">
          {children}
        </main>
      </body>
    </html>
  );
}
