import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/outlets";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} Hyderabad`,
    short_name: SITE_NAME,
    description: SITE_TAGLINE,
    start_url: "/",
    display: "standalone",
    background_color: "#0f0a09",
    theme_color: "#F97316",
    icons: [
      {
        src: "/logos/club-rogue.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
