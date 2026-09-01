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
  title: "VLSI Platform · vlsi.ace-seek.com",
  description:
    "VLSI Learn: digital design, Verilog, SystemVerilog, synthesis, verification, UVM, SDC, STA. Studios live in VLSI Studio.",
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
