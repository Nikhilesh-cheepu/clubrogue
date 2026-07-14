import type { MetadataRoute } from "next";
import { CLUB_ROGUE_OUTLETS, SITE_URL } from "@/lib/outlets";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...CLUB_ROGUE_OUTLETS.map((outlet) => ({
      url: `${SITE_URL}/${outlet.brandId}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
  ];
}
