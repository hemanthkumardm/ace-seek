import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ace-seek.com";
  const now = new Date();

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

    // VLSI & ASIC Subdomain Hub & Studios
    {
      url: "https://vlsi.ace-seek.com",
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://vlsi.ace-seek.com/sdc-studio",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: "https://vlsi.ace-seek.com/mmmc-studio",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: "https://vlsi.ace-seek.com/power-studio",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: "https://vlsi.ace-seek.com/timing-studio",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: "https://vlsi.ace-seek.com/learn",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://vlsi.ace-seek.com/interview-masterclass",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    // Cloud OpenROAD PnR Automation Host
    {
      url: "https://openroad.ace-seek.com",
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },

    // Engineering Developer Tools Workstation Catalog
    {
      url: "https://tools.ace-seek.com",
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: "https://tools.ace-seek.com/doc-compiler",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: "https://tools.ace-seek.com/diff-comparator",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: "https://tools.ace-seek.com/format-converter",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: "https://tools.ace-seek.com/ai-sanitizer",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: "https://tools.ace-seek.com/tex-formatter",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: "https://tools.ace-seek.com/table-builder",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },

    // Legal Policies & Compliance
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
