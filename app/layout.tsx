import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Club Rogue - Choose Your Rogue",
  description: "Three locations. One wild night.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

