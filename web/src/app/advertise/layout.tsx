import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advertise & Sponsorship",
  description:
    "Reach VLSI designers, STA engineers, and hardware teams on Ace-Seek product hosts.",
};

export default function AdvertiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
