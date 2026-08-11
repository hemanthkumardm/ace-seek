"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

/**
 * Wraps the app when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is present.
 * Without a key, children render unauthenticated (dev / offline engines).
 */
export function ClerkProviderShell({
  children,
  publishableKey,
}: {
  children: ReactNode;
  publishableKey: string | undefined;
}) {
  if (!publishableKey?.trim()) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/login"
      signUpUrl="/signup"
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}
