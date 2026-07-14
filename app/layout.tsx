import type { Metadata } from "next";
import "./globals.css";
import { rootMetadata, organizationJsonLd, allNightClubsJsonLd } from "@/lib/seo";

export const metadata: Metadata = rootMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(allNightClubsJsonLd()),
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
