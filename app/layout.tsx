import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Logos Incarnate",
  description:
    "A reading-first, manuscript-centered Bible study POC built around Genesis 2.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
