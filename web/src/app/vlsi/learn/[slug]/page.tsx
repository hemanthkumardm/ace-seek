"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { learnCourseHref, sessionBySlug } from "@/lib/vlsi-curriculum";

/** Old /vlsi/learn/:slug bookmarks → /vlsi/learn/c/:track/:slug */
export default function LegacyLearnSlugRedirect() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params.slug || "");
  const session = sessionBySlug(slug);

  useEffect(() => {
    if (session) router.replace(learnCourseHref(session.track, session.slug));
  }, [session, router]);

  if (!session) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 space-y-3">
        <p className="font-medium">Lesson not found.</p>
        <Link href="/vlsi/learn" className="ln-btn inline-flex">
          All courses
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 text-sm" style={{ color: "var(--ln-muted)" }}>
      Opening {session.title}…
    </div>
  );
}
