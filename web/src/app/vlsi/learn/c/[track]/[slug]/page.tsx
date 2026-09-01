"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { sessionBySlug, trackById } from "@/lib/vlsi-curriculum";
import { LearnLessonView } from "@/components/learn/LearnLessonView";

export default function CourseLessonPage() {
  const params = useParams();
  const trackId = String(params.track || "");
  const slug = String(params.slug || "");
  const session = sessionBySlug(slug);
  const track = trackById(trackId);

  if (!track || !session || session.track !== trackId) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 space-y-3">
        <p className="font-medium">Lesson not in this course.</p>
        <Link href="/vlsi/learn" className="ln-btn inline-flex">
          All courses
        </Link>
      </div>
    );
  }

  return <LearnLessonView session={session} />;
}
