"use client";

import React from "react";
import { LearnShell } from "@/components/learn/LearnShell";

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <LearnShell>{children}</LearnShell>;
}
