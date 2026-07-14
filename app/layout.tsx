import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Club Rogue | Hyderabad",
  description: "Book your table at Club Rogue — Gachibowli, Kondapur & Jubilee Hills.",
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

