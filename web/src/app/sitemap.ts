import type { MetadataRoute } from "next";
import { SITE_URL, toolsPageCanonical } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;
  const now = new Date();

  const toolSlugs = [
    "doc-compiler",
    "diff-comparator",
    "format-converter",
    "ai-sanitizer",
    "tex-formatter",
    "table-builder",
    "script-helper",
  ] as const;

  return [
    // Main Apex / SaaS Command Center
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/offers`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },

    // VLSI & ASIC (www paths + studio entry)
    {
      url: `${baseUrl}/vlsi`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/vlsi/sdc-studio`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/vlsi/mmmc-studio`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/vlsi/power-studio`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/vlsi/timing-studio`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/vlsi/learn`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/vlsi/interview-masterclass`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    // OpenROAD
    {
      url: `${baseUrl}/openroad`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },

    // Tools — www canonicals only (do NOT list /compiler or tools host duplicates)
    {
      url: `${baseUrl}/tools`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...toolSlugs.map((slug) => ({
      url: toolsPageCanonical(slug),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),

    // Legal
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
