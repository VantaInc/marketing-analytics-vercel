import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Re-Engage Events Q2 — Campaign Dashboard",
  description:
    "FY27Q2 Events Re-Engage: holdout incrementality, funnel targets, and channel engagement.",
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
